import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Razorpay webhook signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    console.log(`Razorpay webhook received: ${eventType}`);

    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity);
        break;

      case "refund.created":
        await handleRefundCreated(payload.refund.entity);
        break;

      case "payout.processed":
        await handlePayoutProcessed(payload.payout.entity);
        break;

      case "payout.failed":
        await handlePayoutFailed(payload.payout.entity);
        break;

      default:
        console.log(`Unhandled Razorpay event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle successful payment capture
async function handlePaymentCaptured(payment) {
  const { id: paymentId, order_id: orderId, amount, notes } = payment;

  try {
    // Find the wallet transaction by order ID (stored in metadata)
    const walletTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["orderId"],
          equals: orderId,
        },
      },
      include: {
        wallet: true,
      },
    });

    if (!walletTransaction) {
      console.error(`No wallet transaction found for order: ${orderId}`);
      return;
    }

    // Update transaction status
    await db.walletTransaction.update({
      where: { id: walletTransaction.id },
      data: {
        status: "COMPLETED",
        metadata: {
          ...walletTransaction.metadata,
          paymentId,
          capturedAt: new Date().toISOString(),
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

    console.log(`Payment captured: ${paymentId}, Amount: ${amount / 100}`);
  } catch (error) {
    console.error("Error handling payment captured:", error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailed(payment) {
  const { id: paymentId, order_id: orderId, error_description } = payment;

  try {
    const walletTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["orderId"],
          equals: orderId,
        },
      },
    });

    if (!walletTransaction) {
      console.error(`No wallet transaction found for order: ${orderId}`);
      return;
    }

    // Update transaction status
    await db.walletTransaction.update({
      where: { id: walletTransaction.id },
      data: {
        status: "FAILED",
        metadata: {
          ...walletTransaction.metadata,
          paymentId,
          failureReason: error_description,
          failedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Payment failed: ${paymentId}, Reason: ${error_description}`);
  } catch (error) {
    console.error("Error handling payment failed:", error);
    throw error;
  }
}

// Handle refund creation
async function handleRefundCreated(refund) {
  const { id: refundId, payment_id: paymentId, amount } = refund;

  try {
    // Find original transaction
    const originalTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["paymentId"],
          equals: paymentId,
        },
      },
      include: {
        wallet: true,
      },
    });

    if (!originalTransaction) {
      console.error(`No transaction found for payment: ${paymentId}`);
      return;
    }

    const refundAmount = amount / 100;

    // Create refund transaction
    await db.walletTransaction.create({
      data: {
        walletId: originalTransaction.walletId,
        type: "REFUND",
        amount: refundAmount,
        status: "COMPLETED",
        gateway: "RAZORPAY",
        description: `Refund for transaction ${originalTransaction.id}`,
        metadata: {
          refundId,
          originalPaymentId: paymentId,
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

    console.log(`Refund created: ${refundId}, Amount: ${refundAmount}`);
  } catch (error) {
    console.error("Error handling refund:", error);
    throw error;
  }
}

// Handle successful payout (withdrawal)
async function handlePayoutProcessed(payout) {
  const { id: payoutId, reference_id, amount } = payout;

  try {
    // Find the withdrawal transaction
    const walletTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["payoutReferenceId"],
          equals: reference_id,
        },
      },
    });

    if (!walletTransaction) {
      console.error(`No withdrawal transaction found for payout: ${reference_id}`);
      return;
    }

    // Update transaction status
    await db.walletTransaction.update({
      where: { id: walletTransaction.id },
      data: {
        status: "COMPLETED",
        metadata: {
          ...walletTransaction.metadata,
          payoutId,
          processedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Payout processed: ${payoutId}, Amount: ${amount / 100}`);
  } catch (error) {
    console.error("Error handling payout processed:", error);
    throw error;
  }
}

// Handle failed payout
async function handlePayoutFailed(payout) {
  const { id: payoutId, reference_id, failure_reason, amount } = payout;

  try {
    const walletTransaction = await db.walletTransaction.findFirst({
      where: {
        metadata: {
          path: ["payoutReferenceId"],
          equals: reference_id,
        },
      },
      include: {
        wallet: true,
      },
    });

    if (!walletTransaction) {
      console.error(`No withdrawal transaction found for payout: ${reference_id}`);
      return;
    }

    // Update transaction status
    await db.walletTransaction.update({
      where: { id: walletTransaction.id },
      data: {
        status: "FAILED",
        metadata: {
          ...walletTransaction.metadata,
          payoutId,
          failureReason: failure_reason,
          failedAt: new Date().toISOString(),
        },
      },
    });

    // Refund the amount back to wallet (it was deducted when withdrawal was initiated)
    await db.wallet.update({
      where: { id: walletTransaction.walletId },
      data: {
        balance: {
          increment: walletTransaction.amount,
        },
      },
    });

    console.log(`Payout failed: ${payoutId}, Reason: ${failure_reason}`);
  } catch (error) {
    console.error("Error handling payout failed:", error);
    throw error;
  }
}
