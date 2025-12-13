"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Simulation Actions
 * 
 * These actions provide simulated wallet operations
 * for testing the platform without real money.
 */

/**
 * Get or create simulation wallet for current user
 */
export async function getSimulationWallet() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        wallet: true,
        walletTransactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Create wallet if doesn't exist
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          lockedBalance: 0,
          currency: "INR",
        },
      });
    }

    // Calculate invested amount from completed executions
    const investedAmount = await db.investmentExecution.aggregate({
      where: {
        plan: { userId: user.id },
        status: "COMPLETED",
      },
      _sum: { amount: true },
    });

    return {
      success: true,
      data: {
        wallet: {
          id: wallet.id,
          balance: parseFloat(wallet.balance),
          lockedBalance: parseFloat(wallet.lockedBalance),
          investedAmount: investedAmount._sum.amount ? parseFloat(investedAmount._sum.amount) : 0,
          currency: wallet.currency,
        },
        recentTransactions: user.walletTransactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: parseFloat(tx.amount),
          status: tx.status,
          createdAt: tx.createdAt,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to get simulation wallet:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Simulate a deposit into the wallet
 */
export async function simulateDeposit(amount) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!amount || amount <= 0) {
    return { success: false, error: "Invalid amount" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Create wallet if doesn't exist
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          lockedBalance: 0,
          currency: "INR",
        },
      });
    }

    // Create simulated deposit transaction
    const transaction = await db.$transaction(async (tx) => {
      // Update wallet balance first
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      // Create wallet transaction record with correct fields
      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: "DEPOSIT",
          amount,
          balanceAfter: updatedWallet.balance,
          description: "Simulated deposit",
          referenceId: `sim_dep_${Date.now()}`,
          paymentGateway: "RAZORPAY", // Use existing enum value
          paymentMethod: "SIMULATION",
          status: "COMPLETED",
          metadata: {
            simulated: true,
            completedAt: new Date().toISOString(),
          },
        },
      });

      return walletTx;
    });

    revalidatePath("/simulation");
    revalidatePath("/wallet");
    revalidatePath("/dashboard");

    return {
      success: true,
      simulated: true,
      data: {
        transactionId: transaction.id,
        amount,
        newBalance: parseFloat(wallet.balance) + amount,
      },
    };
  } catch (error) {
    console.error("Failed to simulate deposit:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Simulate a withdrawal from the wallet
 */
export async function simulateWithdrawal(amount) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!amount || amount <= 0) {
    return { success: false, error: "Invalid amount" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return { success: false, error: "Wallet not found" };
    }

    const availableBalance = parseFloat(user.wallet.balance) - parseFloat(user.wallet.lockedBalance);
    if (amount > availableBalance) {
      return {
        success: false,
        error: "Insufficient balance",
        available: availableBalance,
        requested: amount,
      };
    }

    // Create simulated withdrawal transaction
    const transaction = await db.$transaction(async (tx) => {
      // Update wallet balance first
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet.id },
        data: {
          balance: { decrement: amount },
        },
      });

      // Create wallet transaction record with correct fields
      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          balanceAfter: updatedWallet.balance,
          description: "Simulated withdrawal",
          referenceId: `sim_wd_${Date.now()}`,
          paymentGateway: "RAZORPAY", // Use existing enum value
          paymentMethod: "SIMULATION",
          status: "COMPLETED",
          metadata: {
            simulated: true,
            completedAt: new Date().toISOString(),
            bankAccount: "XXXX-XXXX-1234",
          },
        },
      });

      return walletTx;
    });

    revalidatePath("/simulation");
    revalidatePath("/wallet");
    revalidatePath("/dashboard");

    return {
      success: true,
      simulated: true,
      data: {
        transactionId: transaction.id,
        amount,
        newBalance: parseFloat(user.wallet.balance) - amount,
      },
    };
  } catch (error) {
    console.error("Failed to simulate withdrawal:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset simulation wallet to initial state
 */
export async function resetSimulationWallet() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.$transaction(async (tx) => {
      if (user.wallet) {
        // Delete all wallet transactions
        await tx.walletTransaction.deleteMany({
          where: { walletId: user.wallet.id },
        });

        // Reset wallet balance
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: {
            balance: 0,
            lockedBalance: 0,
          },
        });
      }

      // Delete all investment executions
      await tx.investmentExecution.deleteMany({
        where: { plan: { userId: user.id } },
      });

      // Delete all scheduled investments
      await tx.scheduledInvestment.deleteMany({
        where: { plan: { userId: user.id } },
      });

      // Delete all investment plans
      await tx.investmentPlan.deleteMany({
        where: { userId: user.id },
      });

      // Reset risk profile to allow re-assessment
      if (user.riskProfile) {
        await tx.riskProfile.delete({
          where: { userId: user.id },
        });
      }
    });

    revalidatePath("/simulation");
    revalidatePath("/wallet");
    revalidatePath("/portfolio");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Simulation wallet reset successfully",
    };
  } catch (error) {
    console.error("Failed to reset simulation wallet:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get simulation mode status for all services
 */
export async function getSimulationStatus() {
  const hasRazorpay = !!process.env.RAZORPAY_KEY_ID;
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  const hasZerodha = !!process.env.ZERODHA_API_KEY;
  const hasAngelOne = !!process.env.ANGEL_API_KEY;
  const hasSurepass = !!process.env.SUREPASS_API_KEY;
  const forceSimulation = process.env.FORCE_SIMULATION === "true";

  return {
    success: true,
    data: {
      forceSimulation,
      services: {
        payment: {
          simulated: forceSimulation || (!hasRazorpay && !hasStripe),
          razorpay: hasRazorpay,
          stripe: hasStripe,
        },
        broker: {
          simulated: forceSimulation || (!hasZerodha && !hasAngelOne),
          zerodha: hasZerodha,
          angelOne: hasAngelOne,
        },
        kyc: {
          simulated: forceSimulation || !hasSurepass,
          surepass: hasSurepass,
        },
        market: {
          simulated: true, // Always use simulation for market data in demo
        },
      },
    },
  };
}

/**
 * Add simulated investment to portfolio
 */
export async function addSimulatedInvestment({
  investmentType,
  symbol,
  name,
  amount,
  quantity,
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

    const availableBalance = parseFloat(user.wallet.balance) - parseFloat(user.wallet.lockedBalance);
    if (amount > availableBalance) {
      return {
        success: false,
        error: "Insufficient balance",
        available: availableBalance,
        requested: amount,
      };
    }

    // Create a one-time investment plan
    const plan = await db.investmentPlan.create({
      data: {
        userId: user.id,
        name: `Quick Investment - ${symbol}`,
        description: `One-time investment in ${name}`,
        targetAmount: amount,
        monthlyContribution: 0,
        startDate: new Date(),
        riskLevel: "MODERATE",
        status: "ACTIVE",
        userApproved: true,
        approvedAt: new Date(),
        allocation: { [investmentType]: 100 },
      },
    });

    // Create execution record
    const execution = await db.investmentExecution.create({
      data: {
        planId: plan.id,
        investmentType,
        amount,
        status: "COMPLETED",
        executedAt: new Date(),
        brokerResponse: {
          simulated: true,
          symbol,
          name,
          quantity,
          price: amount / quantity,
        },
      },
    });

    // Deduct from wallet and create transaction
    const updatedWallet = await db.wallet.update({
      where: { id: user.wallet.id },
      data: {
        balance: { decrement: amount },
      },
    });

    // Create wallet transaction with correct fields
    await db.walletTransaction.create({
      data: {
        walletId: user.wallet.id,
        userId: user.id,
        type: "INVESTMENT",
        amount,
        balanceAfter: updatedWallet.balance,
        description: `Investment in ${symbol}`,
        referenceId: `sim_inv_${Date.now()}`,
        paymentGateway: "RAZORPAY",
        paymentMethod: "SIMULATION",
        status: "COMPLETED",
        investmentPlanId: plan.id,
        metadata: {
          simulated: true,
          investmentType,
          symbol,
        },
      },
    });

    revalidatePath("/simulation");
    revalidatePath("/portfolio");
    revalidatePath("/wallet");

    return {
      success: true,
      simulated: true,
      data: {
        planId: plan.id,
        executionId: execution.id,
        investmentType,
        symbol,
        amount,
        quantity,
      },
    };
  } catch (error) {
    console.error("Failed to add simulated investment:", error);
    return { success: false, error: error.message };
  }
}
