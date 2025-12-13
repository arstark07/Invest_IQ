import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      case "payout.paid":
        await handlePayoutPaid(event.data.object);
        break;

      case "payout.failed":
        await handlePayoutFailed(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent) {
  const { id: paymentIntentId, amount, metadata } = paymentIntent;

  try {
    // Find the wallet transaction by payment intent ID
    const walletTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["paymentIntentId"],
          equals: paymentIntentId,
        },
      },
      include: {
        wallet: true,
      },
    });

    if (!walletTransaction) {
      // Check if this is a new deposit from metadata
      if (metadata?.walletId && metadata?.userId) {
        // Create new wallet transaction
        await db.walletTransaction.create({
          data: {
            walletId: metadata.walletId,
            type: "DEPOSIT",
            amount: amount / 100,
            status: "COMPLETED",
            gateway: "STRIPE",
            description: "Wallet deposit via Stripe",
            metadata: {
              paymentIntentId,
              completedAt: new Date().toISOString(),
            },
          },
        });

        // Credit wallet balance
        await db.wallet.update({
          where: { id: metadata.walletId },
          data: {
            balance: {
              increment: amount / 100,
            },
          },
        });
      }
      return;
    }

    // Update existing transaction status
    await db.walletTransaction.update({
      where: { id: walletTransaction.id },
      data: {
        status: "COMPLETED",
        metadata: {
          ...walletTransaction.metadata,
          completedAt: new Date().toISOString(),
        },
      },
    });

    // Credit wallet balance
    await db.wallet.update({
      where: { id: walletTransaction.walletId },
      data: {
        balance: {
          increment: walletTransaction.amount,
        },
      },
    });

    console.log(`Stripe payment succeeded: ${paymentIntentId}, Amount: ${amount / 100}`);
  } catch (error) {
    console.error("Error handling Stripe payment success:", error);
    throw error;
  }
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent) {
  const { id: paymentIntentId, last_payment_error } = paymentIntent;

  try {
    const walletTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["paymentIntentId"],
          equals: paymentIntentId,
        },
      },
    });

    if (!walletTransaction) {
      console.error(`No wallet transaction found for payment intent: ${paymentIntentId}`);
      return;
    }

    // Update transaction status
    await db.walletTransaction.update({
      where: { id: walletTransaction.id },
      data: {
        status: "FAILED",
        metadata: {
          ...walletTransaction.metadata,
          failureReason: last_payment_error?.message || "Payment failed",
          failedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Stripe payment failed: ${paymentIntentId}`);
  } catch (error) {
    console.error("Error handling Stripe payment failure:", error);
    throw error;
  }
}

// Handle charge refund
async function handleChargeRefunded(charge) {
  const { id: chargeId, payment_intent: paymentIntentId, amount_refunded } = charge;

  try {
    // Find original transaction
    const originalTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["paymentIntentId"],
          equals: paymentIntentId,
        },
      },
      include: {
        wallet: true,
      },
    });

    if (!originalTransaction) {
      console.error(`No transaction found for payment intent: ${paymentIntentId}`);
      return;
    }

    const refundAmount = amount_refunded / 100;

    // Check if refund transaction already exists
    const existingRefund = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["refundChargeId"],
          equals: chargeId,
        },
      },
    });

    if (existingRefund) {
      console.log(`Refund already processed for charge: ${chargeId}`);
      return;
    }

    // Create refund transaction
    await db.walletTransaction.create({
      data: {
        walletId: originalTransaction.walletId,
        type: "REFUND",
        amount: refundAmount,
        status: "COMPLETED",
        gateway: "STRIPE",
        description: `Refund for transaction ${originalTransaction.id}`,
        metadata: {
          refundChargeId: chargeId,
          originalPaymentIntentId: paymentIntentId,
          originalTransactionId: originalTransaction.id,
        },
      },
    });

    // Debit wallet balance
    await db.wallet.update({
      where: { id: originalTransaction.walletId },
      data: {
        balance: {
          decrement: refundAmount,
        },
      },
    });

    console.log(`Stripe refund processed: ${chargeId}, Amount: ${refundAmount}`);
  } catch (error) {
    console.error("Error handling Stripe refund:", error);
    throw error;
  }
}

// Handle successful payout
async function handlePayoutPaid(payout) {
  const { id: payoutId, amount, metadata } = payout;

  try {
    if (!metadata?.transactionId) {
      console.log(`Payout ${payoutId} has no transaction reference`);
      return;
    }

    // Update withdrawal transaction
    await db.walletTransaction.update({
      where: { id: metadata.transactionId },
      data: {
        status: "COMPLETED",
        metadata: {
          payoutId,
          processedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Stripe payout successful: ${payoutId}, Amount: ${amount / 100}`);
  } catch (error) {
    console.error("Error handling Stripe payout:", error);
    throw error;
  }
}

// Handle failed payout
async function handlePayoutFailed(payout) {
  const { id: payoutId, failure_message, metadata } = payout;

  try {
    if (!metadata?.transactionId) {
      console.log(`Failed payout ${payoutId} has no transaction reference`);
      return;
    }

    const walletTransaction = await db.walletTransaction.findUnique({
      where: { id: metadata.transactionId },
      include: { wallet: true },
    });

    if (!walletTransaction) {
      return;
    }

    // Update transaction status
    await db.walletTransaction.update({
      where: { id: metadata.transactionId },
      data: {
        status: "FAILED",
        metadata: {
          payoutId,
          failureReason: failure_message,
          failedAt: new Date().toISOString(),
        },
      },
    });

    // Refund the amount back to wallet
    await db.wallet.update({
      where: { id: walletTransaction.walletId },
      data: {
        balance: {
          increment: walletTransaction.amount,
        },
      },
    });

    console.log(`Stripe payout failed: ${payoutId}, Reason: ${failure_message}`);
  } catch (error) {
    console.error("Error handling Stripe payout failure:", error);
    throw error;
  }
}

// Handle subscription created (for premium features)
async function handleSubscriptionCreated(subscription) {
  const { id: subscriptionId, customer, status, metadata } = subscription;

  try {
    if (metadata?.userId) {
      // Update user's subscription status
      await db.user.update({
        where: { id: metadata.userId },
        data: {
          // Add subscription fields to user model if needed
          // subscriptionId,
          // subscriptionStatus: status,
        },
      });
    }

    console.log(`Subscription created: ${subscriptionId}, Status: ${status}`);
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  const { id: subscriptionId, metadata } = subscription;

  try {
    if (metadata?.userId) {
      // Update user's subscription status
      await db.user.update({
        where: { id: metadata.userId },
        data: {
          // subscriptionStatus: 'cancelled',
        },
      });
    }

    console.log(`Subscription deleted: ${subscriptionId}`);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}
