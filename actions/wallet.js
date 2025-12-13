"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createPaymentOrder,
  getStripePaymentIntent,
  verifyRazorpayPayment,
  getRazorpayPayment,
} from "@/lib/payment-gateway";

/**
 * Wallet Management Actions
 */

// ==================== WALLET OPERATIONS ====================

/**
 * Get or create user's wallet
 */
export async function getOrCreateWallet() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Return existing wallet or create new one
    if (user.wallet) {
      return {
        success: true,
        data: {
          id: user.wallet.id,
          balance: parseFloat(user.wallet.balance),
          lockedBalance: parseFloat(user.wallet.lockedBalance),
          availableBalance: parseFloat(user.wallet.balance) - parseFloat(user.wallet.lockedBalance),
          currency: user.wallet.currency,
          dailyLimit: parseFloat(user.wallet.dailyLimit),
          monthlyLimit: parseFloat(user.wallet.monthlyLimit),
          isLocked: user.wallet.isLocked,
          pin: !!user.wallet.pin, // Return boolean indicating if PIN is set
        },
      };
    }

    // Create new wallet
    const wallet = await db.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        lockedBalance: 0,
        currency: "INR",
        dailyLimit: 100000,
        monthlyLimit: 500000,
      },
    });

    return {
      success: true,
      data: {
        id: wallet.id,
        balance: 0,
        lockedBalance: 0,
        availableBalance: 0,
        currency: wallet.currency,
        dailyLimit: parseFloat(wallet.dailyLimit),
        monthlyLimit: parseFloat(wallet.monthlyLimit),
        isLocked: wallet.isLocked,
        pin: false, // New wallet has no PIN
      },
    };
  } catch (error) {
    console.error("Failed to get/create wallet:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Initiate wallet top-up (deposit)
 */
export async function initiateWalletDeposit({
  amount,
  gateway = "RAZORPAY", // Default to Razorpay for Indian payments
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    if (user.wallet.isLocked) {
      return { success: false, error: "Wallet is locked" };
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDeposits = await db.walletTransaction.aggregate({
      where: {
        walletId: user.wallet.id,
        type: "DEPOSIT",
        status: "COMPLETED",
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });

    const todayTotal = parseFloat(todayDeposits._sum.amount || 0);
    if (todayTotal + amount > parseFloat(user.wallet.dailyLimit)) {
      return {
        success: false,
        error: `Daily deposit limit (₹${user.wallet.dailyLimit}) exceeded`,
      };
    }

    // Create payment order
    const orderResult = await createPaymentOrder({
      gateway,
      amount,
      currency: "INR",
      userId: user.id,
      walletId: user.wallet.id,
      customerEmail: user.email,
    });

    if (!orderResult.success) {
      return orderResult;
    }

    // Create pending wallet transaction
    const referenceId = orderResult.data.paymentIntentId;
    console.log("Creating pending transaction with referenceId:", referenceId);

    const createdTransaction = await db.walletTransaction.create({
      data: {
        walletId: user.wallet.id,
        userId: user.id,
        type: "DEPOSIT",
        amount,
        balanceAfter: parseFloat(user.wallet.balance), // Will be updated after confirmation
        description: `Wallet top-up via ${gateway}`,
        referenceId,
        paymentGateway: gateway,
        status: "PENDING",
      },
    });
    console.log("Created transaction:", { id: createdTransaction.id, referenceId: createdTransaction.referenceId });

    return {
      success: true,
      data: {
        ...orderResult.data,
        gateway,
      },
    };
  } catch (error) {
    console.error("Failed to initiate deposit:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Confirm wallet deposit (called after payment success)
 */
export async function confirmWalletDeposit({
  referenceId,
  paymentId,
  gateway = "RAZORPAY",
  signature,
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    console.log("Confirming deposit:", { referenceId, paymentId, gateway });
    
    let isSuccessful = false;
    let isSimulated = false;
    
    // Verify payment based on gateway
    if (gateway === "STRIPE") {
      const paymentIntent = await getStripePaymentIntent(referenceId);
      console.log("Stripe payment result:", JSON.stringify(paymentIntent, null, 2));
      isSimulated = paymentIntent.simulated === true;
      isSuccessful = paymentIntent.success && (paymentIntent.data?.status === "succeeded" || isSimulated);
    } else {
      // Razorpay verification
      if (referenceId?.includes("_sim_") || paymentId?.includes("_sim_")) {
        // Simulated payment - always succeed
        console.log("Simulated Razorpay payment detected");
        isSimulated = true;
        isSuccessful = true;
      } else if (signature) {
        // Real Razorpay payment - verify signature
        const verification = await verifyRazorpayPayment({
          orderId: referenceId,
          paymentId,
          signature,
        });
        console.log("Razorpay verification result:", JSON.stringify(verification, null, 2));
        isSimulated = verification.simulated === true;
        isSuccessful = verification.success && (verification.verified || isSimulated);
      } else {
        // No signature but has payment ID - check payment status
        const paymentDetails = await getRazorpayPayment(paymentId);
        console.log("Razorpay payment details:", JSON.stringify(paymentDetails, null, 2));
        isSimulated = paymentDetails.simulated === true;
        isSuccessful = paymentDetails.success && (paymentDetails.data?.status === "captured" || isSimulated);
      }
    }
    
    if (!isSuccessful) {
      console.log("Payment not successful, marking as failed");
      await db.walletTransaction.updateMany({
        where: { referenceId },
        data: { status: "FAILED" },
      });
      return { success: false, error: "Payment not successful" };
    }

    // Get pending transaction
    console.log("Looking for pending transaction with referenceId:", referenceId);
    
    const transaction = await db.walletTransaction.findFirst({
      where: { referenceId, status: "PENDING" },
      include: { wallet: true },
    });

    console.log("Found transaction:", transaction ? `ID: ${transaction.id}, Status: ${transaction.status}, Amount: ${transaction.amount}` : "NOT FOUND");
    
    if (!transaction) {
      // Log all pending transactions for debugging
      const allPending = await db.walletTransaction.findMany({
        where: { status: "PENDING" },
        select: { id: true, referenceId: true, amount: true, status: true }
      });
      console.log("All pending transactions:", JSON.stringify(allPending, null, 2));
      return { success: false, error: "Transaction not found" };
    }

    // Update wallet balance and transaction atomically
    const newBalance = parseFloat(transaction.wallet.balance) + parseFloat(transaction.amount);

    await db.$transaction([
      db.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: newBalance },
      }),
      db.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          balanceAfter: newBalance,
          paymentMethod: paymentId,
        },
      }),
    ]);

    revalidatePath("/wallet");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        transactionId: transaction.id,
        amount: parseFloat(transaction.amount),
        newBalance,
      },
    };
  } catch (error) {
    console.error("Failed to confirm deposit:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Withdraw from wallet to user's dashboard account (instant transfer)
 */
export async function initiateWalletWithdrawal({
  amount,
  accountId, // User's dashboard account ID
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { 
        wallet: true,
        accounts: true,
      },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    // Verify the account belongs to user
    const targetAccount = user.accounts.find(acc => acc.id === accountId);
    if (!targetAccount) {
      return { success: false, error: "Account not found" };
    }

    const availableBalance = parseFloat(user.wallet.balance) - parseFloat(user.wallet.lockedBalance);
    
    if (amount > availableBalance) {
      return { success: false, error: "Insufficient balance" };
    }

    // Process instant transfer - deduct from wallet, add to account
    const newWalletBalance = parseFloat(user.wallet.balance) - amount;
    const newAccountBalance = parseFloat(targetAccount.balance) + amount;

    // Atomic transaction for instant transfer
    const result = await db.$transaction([
      // Update wallet balance
      db.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: newWalletBalance },
      }),
      // Create wallet transaction (COMPLETED - instant)
      db.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          balanceAfter: newWalletBalance,
          description: `Withdrawal to ${targetAccount.name}`,
          status: "COMPLETED", // Instant transfer
        },
      }),
      // Update account balance
      db.account.update({
        where: { id: accountId },
        data: { balance: newAccountBalance },
      }),
      // Create transaction in the dashboard account
      db.transaction.create({
        data: {
          type: "INCOME",
          amount,
          description: "Transfer from Digital Wallet",
          date: new Date(),
          category: "transfer",
          status: "COMPLETED",
          isRecurring: false,
          userId: user.id,
          accountId: accountId,
        },
      }),
    ]);

    revalidatePath("/wallet");
    revalidatePath("/dashboard");
    revalidatePath(`/account/${accountId}`);

    return {
      success: true,
      data: {
        transactionId: result[1].id,
        amount,
        newBalance: newWalletBalance,
        accountName: targetAccount.name,
        status: "COMPLETED",
      },
    };
  } catch (error) {
    console.error("Failed to initiate withdrawal:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions({
  page = 1,
  limit = 20,
  type, // Filter by type
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    const where = {
      walletId: user.wallet.id,
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          investmentPlan: {
            select: { name: true },
          },
        },
      }),
      db.walletTransaction.count({ where }),
    ]);

    return {
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          balanceAfter: parseFloat(t.balanceAfter),
          description: t.description,
          paymentGateway: t.paymentGateway,
          paymentMethod: t.paymentMethod,
          status: t.status,
          investmentPlan: t.investmentPlan?.name,
          createdAt: t.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Set wallet PIN
 */
export async function setWalletPin(pin) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!/^\d{4,6}$/.test(pin)) {
    return { success: false, error: "PIN must be 4-6 digits" };
  }

  try {
    const bcrypt = await import("bcryptjs");
    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    await db.wallet.update({
      where: { id: user.wallet.id },
      data: { pin: hashedPin, pinAttempts: 0 },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to set PIN:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify wallet PIN
 */
export async function verifyWalletPin(pin) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    if (!user.wallet.pin) {
      return { success: false, error: "PIN not set" };
    }

    if (user.wallet.isLocked) {
      return { success: false, error: "Wallet is locked due to too many failed attempts" };
    }

    const bcrypt = await import("bcryptjs");
    
    console.log("verifyWalletPin - pin length:", pin?.length);
    console.log("verifyWalletPin - stored pin exists:", !!user.wallet.pin);
    
    const isValid = await bcrypt.compare(pin, user.wallet.pin);
    console.log("verifyWalletPin - PIN valid:", isValid);

    if (!isValid) {
      const newAttempts = user.wallet.pinAttempts + 1;
      const shouldLock = newAttempts >= 5;

      await db.wallet.update({
        where: { id: user.wallet.id },
        data: {
          pinAttempts: newAttempts,
          isLocked: shouldLock,
        },
      });

      return {
        success: false,
        error: shouldLock
          ? "Wallet locked due to too many failed attempts"
          : `Invalid PIN. ${5 - newAttempts} attempts remaining`,
      };
    }

    // Reset attempts on success
    await db.wallet.update({
      where: { id: user.wallet.id },
      data: { pinAttempts: 0 },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to verify PIN:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Simple wallet deposit - directly adds money to wallet (simulated payment)
 * This bypasses payment gateway and immediately credits the wallet
 */
export async function simpleWalletDeposit({ amount }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Validate amount
    if (!amount || amount < 100) {
      return { success: false, error: "Minimum deposit is ₹100" };
    }

    if (amount > 100000) {
      return { success: false, error: "Maximum deposit is ₹1,00,000" };
    }

    // Get user and wallet
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    // Simulate processing delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Calculate new balance
    const currentBalance = parseFloat(user.wallet.balance);
    const newBalance = currentBalance + amount;

    // Create transaction and update balance atomically
    const result = await db.$transaction([
      db.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          userId: user.id,
          type: "DEPOSIT",
          amount: amount,
          balanceAfter: newBalance,
          description: "Wallet top-up (Simulated)",
          referenceId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentGateway: "STRIPE", // Using STRIPE for simulated deposits
          status: "COMPLETED",
        },
      }),
      db.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: newBalance },
      }),
    ]);

    console.log("Simple deposit successful:", { amount, newBalance });

    revalidatePath("/wallet");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        transactionId: result[0].id,
        amount: amount,
        newBalance: newBalance,
      },
    };
  } catch (error) {
    console.error("Simple deposit failed:", error);
    return { success: false, error: error.message || "Deposit failed" };
  }
}

// In-memory OTP storage (in production, use Redis or database)
const pinChangeOTPs = new Map();

/**
 * Generate OTP for PIN change verification
 */
export async function generatePinChangeOTP() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiry (5 minutes)
    pinChangeOTPs.set(userId, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    // In production, send OTP via email/SMS
    // For simulation, return the OTP in the response for display
    return {
      success: true,
      data: {
        message: "OTP generated for PIN change verification",
        otp, // For simulation - display in dialog
        expiresIn: 300, // seconds
      },
    };
  } catch (error) {
    console.error("Failed to generate PIN change OTP:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify OTP and change wallet PIN
 */
export async function changePinWithOTP({ currentPin, newPin, otp }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!/^\d{4,6}$/.test(newPin)) {
    return { success: false, error: "New PIN must be 4-6 digits" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    if (!user.wallet.pin) {
      return { success: false, error: "No existing PIN to change. Please set a PIN first." };
    }

    // Verify current PIN
    const bcrypt = await import("bcryptjs");
    
    console.log("changePinWithOTP - currentPin length:", currentPin?.length);
    console.log("changePinWithOTP - stored pin exists:", !!user.wallet.pin);
    
    const isCurrentPinValid = await bcrypt.compare(currentPin, user.wallet.pin);
    console.log("changePinWithOTP - PIN valid:", isCurrentPinValid);
    
    if (!isCurrentPinValid) {
      return { success: false, error: "Current PIN is incorrect" };
    }

    // Verify OTP
    const storedOTP = pinChangeOTPs.get(userId);
    
    if (!storedOTP) {
      return { success: false, error: "OTP not found. Please generate a new OTP." };
    }

    if (Date.now() > storedOTP.expiresAt) {
      pinChangeOTPs.delete(userId);
      return { success: false, error: "OTP has expired. Please generate a new one." };
    }

    if (storedOTP.attempts >= 3) {
      pinChangeOTPs.delete(userId);
      return { success: false, error: "Too many attempts. Please generate a new OTP." };
    }

    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      return { success: false, error: `Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.` };
    }

    // OTP verified - change PIN
    const hashedNewPin = await bcrypt.hash(newPin, 10);

    await db.wallet.update({
      where: { id: user.wallet.id },
      data: { 
        pin: hashedNewPin, 
        pinAttempts: 0 
      },
    });

    // Clear OTP
    pinChangeOTPs.delete(userId);

    return { 
      success: true, 
      message: "PIN changed successfully" 
    };
  } catch (error) {
    console.error("Failed to change PIN:", error);
    return { success: false, error: error.message };
  }
}

// ==================== LOCK BALANCE FOR INVESTMENTS ====================

/**
 * Lock amount in wallet for investment
 */
export async function lockWalletAmount(walletId, amount, investmentPlanId) {
  try {
    const wallet = await db.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    const availableBalance = parseFloat(wallet.balance) - parseFloat(wallet.lockedBalance);
    
    if (amount > availableBalance) {
      return { success: false, error: "Insufficient available balance" };
    }

    const newLockedBalance = parseFloat(wallet.lockedBalance) + amount;

    await db.$transaction([
      db.wallet.update({
        where: { id: walletId },
        data: { lockedBalance: newLockedBalance },
      }),
      db.walletTransaction.create({
        data: {
          walletId,
          userId: wallet.userId,
          type: "INVESTMENT",
          amount,
          balanceAfter: parseFloat(wallet.balance),
          description: "Amount locked for investment",
          investmentPlanId,
          status: "PENDING",
        },
      }),
    ]);

    return { success: true, data: { lockedAmount: amount } };
  } catch (error) {
    console.error("Failed to lock amount:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute locked amount (deduct from wallet after successful investment)
 */
export async function executeLockedAmount(walletId, amount, investmentPlanId) {
  try {
    const wallet = await db.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    const newBalance = parseFloat(wallet.balance) - amount;
    const newLockedBalance = parseFloat(wallet.lockedBalance) - amount;

    await db.$transaction([
      db.wallet.update({
        where: { id: walletId },
        data: {
          balance: newBalance,
          lockedBalance: Math.max(0, newLockedBalance),
        },
      }),
      db.walletTransaction.updateMany({
        where: {
          walletId,
          investmentPlanId,
          type: "INVESTMENT",
          status: "PENDING",
        },
        data: {
          status: "COMPLETED",
          balanceAfter: newBalance,
        },
      }),
    ]);

    return { success: true, data: { newBalance } };
  } catch (error) {
    console.error("Failed to execute locked amount:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Release locked amount (unlock without deducting, e.g., on cancellation)
 */
export async function releaseLockedAmount(walletId, amount, investmentPlanId) {
  try {
    const wallet = await db.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    const newLockedBalance = Math.max(0, parseFloat(wallet.lockedBalance) - amount);

    await db.$transaction([
      db.wallet.update({
        where: { id: walletId },
        data: { lockedBalance: newLockedBalance },
      }),
      db.walletTransaction.updateMany({
        where: {
          walletId,
          investmentPlanId,
          type: "INVESTMENT",
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
          description: "Investment cancelled - amount released",
        },
      }),
    ]);

    return { success: true, data: { releasedAmount: amount } };
  } catch (error) {
    console.error("Failed to release locked amount:", error);
    return { success: false, error: error.message };
  }
}
