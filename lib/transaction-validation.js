"use server";

import { db } from "@/lib/prisma";
import {
  sendTransactionReceipt,
  sendOverspendAlert,
  sendLowBalanceAlert,
} from "@/lib/email-service";

const LOW_BALANCE_THRESHOLD = 10; // 10% of monthly budget
const ALERT_COOLDOWN_HOURS = 24;

/**
 * Validate transaction before processing
 */
export async function validateTransaction(data) {
  try {
    const account = await db.account.findUnique({
      where: { id: data.accountId },
      include: { user: true },
    });

    if (!account) {
      return { valid: false, error: "Account not found" };
    }

    const currentBalance = account.balance.toNumber();
    
    // Check balance for expense transactions
    if (data.type === "EXPENSE") {
      const newBalance = currentBalance - data.amount;

      if (newBalance < 0) {
        const shortfall = Math.abs(newBalance);

        // Send overspend alert (non-blocking)
        sendOverspendAlert({
          userName: account.user.name || account.user.email,
          userEmail: account.user.email,
          attemptedAmount: data.amount,
          currentBalance,
          accountName: account.name,
          shortfall,
        }).catch(console.error);

        return {
          valid: false,
          blockReason: "INSUFFICIENT_BALANCE",
          error: `Insufficient balance. Available: Rs. ${currentBalance.toLocaleString("en-IN")}, Required: Rs. ${data.amount.toLocaleString("en-IN")}`,
          details: { currentBalance, attemptedAmount: data.amount, shortfall },
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error("Validation error:", error);
    return { valid: false, error: error.message };
  }
}

/**
 * Process transaction and send notifications
 */
export async function processTransaction(data, result) {
  try {
    const account = await db.account.findUnique({
      where: { id: data.accountId },
      include: { user: true },
    });

    if (!account) return;

    const balanceBefore = account.balance.toNumber();
    const balanceAfter = result.data.balanceAfter || balanceBefore;

    // Send receipt (non-blocking)
    sendTransactionReceipt({
      userName: account.user.name || account.user.email,
      userEmail: account.user.email,
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      merchant: data.merchant || "N/A",
      transactionId: result.data.id,
      timestamp: new Date(),
      balanceBefore,
      balanceAfter,
      accountName: account.name,
    }).catch(console.error);

    // Check low balance (non-blocking)
    checkAndSendLowBalanceAlert(account, balanceAfter).catch(console.error);
  } catch (error) {
    console.error("Process transaction error:", error);
  }
}

/**
 * Check and send low balance alert if needed
 */
export async function checkAndSendLowBalanceAlert(account, currentBalance) {
  try {
    const budget = await db.budget.findUnique({
      where: { userId: account.userId },
    });

    if (!budget) return;

    const monthlyBudget = budget.amount.toNumber();
    const threshold = (monthlyBudget * LOW_BALANCE_THRESHOLD) / 100;

    if (currentBalance >= threshold) return;

    // Check cooldown
    const lastAlert = budget.lastAlertSent ? new Date(budget.lastAlertSent).getTime() : 0;
    const hoursSince = (Date.now() - lastAlert) / (1000 * 60 * 60);

    if (hoursSince < ALERT_COOLDOWN_HOURS) return;

    await sendLowBalanceAlert({
      userName: account.user.name || account.user.email,
      userEmail: account.user.email,
      currentBalance,
      monthlyBudget,
      thresholdPercentage: LOW_BALANCE_THRESHOLD,
      accountName: account.name,
    });

    await db.budget.update({
      where: { id: budget.id },
      data: { lastAlertSent: new Date() },
    });
  } catch (error) {
    console.error("Low balance alert error:", error);
  }
}
