"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Get current month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

// Get all budget history for user
export async function getUserBudgets(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get current budget
    const currentBudget = await db.budget.findFirst({
      where: { userId: user.id },
    });

    // Get last 6 months of expense data for budget history
    const budgetHistory = [];
    const currentDate = new Date();

    for (let i = 0; i < 6; i++) {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0
      );

      const expenses = await db.transaction.aggregate({
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: startOfMonth, lte: endOfMonth },
          ...(accountId && { accountId }),
        },
        _sum: { amount: true },
      });

      // Get category breakdown for this month
      const categoryExpenses = await db.transaction.groupBy({
        by: ['category'],
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: startOfMonth, lte: endOfMonth },
          ...(accountId && { accountId }),
        },
        _sum: { amount: true },
      });

      budgetHistory.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
        budgetAmount: currentBudget?.amount?.toNumber() || 0,
        totalExpenses: expenses._sum.amount?.toNumber() || 0,
        categories: categoryExpenses.map(c => ({
          name: c.category || 'Other',
          amount: c._sum.amount?.toNumber() || 0,
        })),
        isOverBudget: currentBudget ? (expenses._sum.amount?.toNumber() || 0) > currentBudget.amount.toNumber() : false,
      });
    }

    return {
      success: true,
      data: {
        currentBudget: currentBudget ? { ...currentBudget, amount: currentBudget.amount.toNumber() } : null,
        history: budgetHistory,
      },
    };
  } catch (error) {
    console.error("Error fetching budget history:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBudget(amount) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Update or create budget
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount,
      },
      create: {
        userId: user.id,
        amount,
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
