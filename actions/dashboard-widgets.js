"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeDecimal = (obj) => {
  if (!obj) return obj;
  const serialized = { ...obj };
  Object.keys(serialized).forEach((key) => {
    if (serialized[key]?.constructor?.name === "Decimal") {
      serialized[key] = parseFloat(serialized[key].toString());
    }
  });
  return serialized;
};

// ==================== FINANCIAL HEALTH SCORE ====================

/**
 * Calculate comprehensive financial health score for default account
 * Based on: savings rate, debt ratio, emergency fund, budget adherence
 */
export async function getFinancialHealthScore(accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true,
        budgets: true,
      },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccount = accountId 
      ? user.accounts.find(acc => acc.id === accountId)
      : user.accounts.find(acc => acc.isDefault);

    if (!targetAccount) {
      return { success: false, error: "No default account found" };
    }

    // Get transactions for the target account only
    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        accountId: targetAccount.id,
        date: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        },
      },
    });

    // Calculate metrics for default account only
    const accountBalance = parseFloat(targetAccount.balance || 0);

    const last3MonthsIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const last3MonthsExpenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const monthlyIncome = last3MonthsIncome / 3;
    const monthlyExpenses = last3MonthsExpenses / 3;

    // 1. Savings Rate Score (25 points max)
    const savingsRate = monthlyIncome > 0 
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
      : 0;
    const savingsRateScore = Math.min(25, Math.max(0, savingsRate * 0.5));

    // 2. Emergency Fund Score (25 points max) - 3-6 months expenses ideal
    const emergencyFundMonths = monthlyExpenses > 0 
      ? accountBalance / monthlyExpenses 
      : 0;
    const emergencyFundScore = Math.min(25, emergencyFundMonths * 4.17);

    // 3. Budget Adherence Score (25 points max)
    let budgetScore = 15; // Default if no budget
    const accountBudget = user.budgets.find(b => b.accountId === targetAccount.id);
    if (accountBudget) {
      const budgetAmount = parseFloat(accountBudget.amount || 0);
      if (budgetAmount > 0) {
        const adherence = monthlyExpenses <= budgetAmount 
          ? 25 
          : Math.max(0, 25 - ((monthlyExpenses - budgetAmount) / budgetAmount) * 25);
        budgetScore = adherence;
      }
    }

    // 4. Income Stability Score (25 points max) - based on income consistency
    const incomeTransactions = transactions.filter(t => t.type === "INCOME");
    let incomeStabilityScore = 10; // Default
    if (incomeTransactions.length >= 3) {
      // Calculate variance in income
      const incomeAmounts = incomeTransactions.map(t => parseFloat(t.amount || 0));
      const avgIncome = incomeAmounts.reduce((a, b) => a + b, 0) / incomeAmounts.length;
      const variance = incomeAmounts.reduce((sum, val) => sum + Math.pow(val - avgIncome, 2), 0) / incomeAmounts.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgIncome > 0 ? (stdDev / avgIncome) * 100 : 100;
      // Lower CV = more stable income = higher score
      incomeStabilityScore = Math.min(25, Math.max(0, 25 - coefficientOfVariation * 0.5));
    }

    const totalScore = Math.round(savingsRateScore + emergencyFundScore + budgetScore + incomeStabilityScore);

    // Determine grade
    let grade, status, color;
    if (totalScore >= 80) {
      grade = "A"; status = "Excellent"; color = "green";
    } else if (totalScore >= 60) {
      grade = "B"; status = "Good"; color = "blue";
    } else if (totalScore >= 40) {
      grade = "C"; status = "Fair"; color = "yellow";
    } else if (totalScore >= 20) {
      grade = "D"; status = "Needs Work"; color = "orange";
    } else {
      grade = "F"; status = "Critical"; color = "red";
    }

    return {
      success: true,
      data: {
        totalScore,
        grade,
        status,
        color,
        accountName: targetAccount.name,
        breakdown: {
          savingsRate: { score: Math.round(savingsRateScore), max: 25, value: savingsRate.toFixed(1) },
          emergencyFund: { score: Math.round(emergencyFundScore), max: 25, value: emergencyFundMonths.toFixed(1) },
          budgetAdherence: { score: Math.round(budgetScore), max: 25, value: monthlyExpenses <= (accountBudget?.amount || 0) ? "On Track" : "Over Budget" },
          incomeStability: { score: Math.round(incomeStabilityScore), max: 25, value: incomeStabilityScore >= 15 ? "Stable" : "Variable" },
        },
        insights: [
          savingsRate < 20 ? "Try to save at least 20% of your income" : null,
          emergencyFundMonths < 3 ? "Build your emergency fund to cover 3-6 months of expenses" : null,
          budgetScore < 15 ? "Review your spending to stay within budget" : null,
          incomeStabilityScore < 15 ? "Consider diversifying income sources for stability" : null,
        ].filter(Boolean),
      },
    };
  } catch (error) {
    console.error("Failed to calculate financial health:", error);
    return { success: false, error: error.message };
  }
}

// ==================== CASH FLOW ANALYSIS ====================

/**
 * Get cash flow analysis with trend data for default account only
 */
export async function getCashFlowAnalysis(period = "6M", accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const defaultAccount = user.accounts.find(acc => acc.isDefault);
      targetAccountId = defaultAccount?.id;
    }

    if (!targetAccountId) {
      return { success: false, error: "No default account found" };
    }

    const months = period === "3M" ? 3 : period === "1Y" ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        accountId: targetAccountId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    // Generate all months in the period (even if no transactions)
    const monthlyData = {};
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - i));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    // Fill in actual transaction data
    transactions.forEach((t) => {
      const monthKey = t.date.toISOString().substring(0, 7); // YYYY-MM
      if (monthlyData[monthKey]) {
        if (t.type === "INCOME") {
          monthlyData[monthKey].income += parseFloat(t.amount || 0);
        } else {
          monthlyData[monthKey].expenses += parseFloat(t.amount || 0);
        }
      }
    });

    const chartData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        income: Math.round(data.income),
        expenses: Math.round(data.expenses),
        netFlow: Math.round(data.income - data.expenses),
      }));

    // Calculate totals and trends
    const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
    const netFlow = totalIncome - totalExpenses;

    // Calculate trend (compare last 2 months)
    let incomeTrend = 0, expensesTrend = 0;
    if (chartData.length >= 2) {
      const lastMonth = chartData[chartData.length - 1];
      const prevMonth = chartData[chartData.length - 2];
      if (prevMonth.income > 0) {
        incomeTrend = ((lastMonth.income - prevMonth.income) / prevMonth.income) * 100;
      }
      if (prevMonth.expenses > 0) {
        expensesTrend = ((lastMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100;
      }
    }

    return {
      success: true,
      data: {
        chartData,
        summary: {
          totalIncome,
          totalExpenses,
          netFlow,
          avgMonthlyIncome: Math.round(totalIncome / months),
          avgMonthlyExpenses: Math.round(totalExpenses / months),
          incomeTrend: incomeTrend.toFixed(1),
          expensesTrend: expensesTrend.toFixed(1),
        },
      },
    };
  } catch (error) {
    console.error("Failed to get cash flow:", error);
    return { success: false, error: error.message };
  }
}

// ==================== SPENDING INSIGHTS (AI-Powered) ====================

/**
 * Get AI-powered spending insights for default account
 */
export async function getSpendingInsights(accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const defaultAccount = user.accounts.find(acc => acc.isDefault);
      targetAccountId = defaultAccount?.id;
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 2)),
        },
        ...(targetAccountId && { accountId: targetAccountId }),
      },
    });

    // Group by category
    const categorySpending = {};
    transactions.forEach((t) => {
      const cat = t.category || "Other";
      if (!categorySpending[cat]) {
        categorySpending[cat] = { total: 0, count: 0, transactions: [] };
      }
      categorySpending[cat].total += parseFloat(t.amount || 0);
      categorySpending[cat].count += 1;
      categorySpending[cat].transactions.push({
        amount: parseFloat(t.amount || 0),
        merchant: t.merchant,
        date: t.date,
      });
    });

    // Get AI insights
    let aiInsights = [];
    if (process.env.GEMINI_API_KEY && Object.keys(categorySpending).length > 0) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Analyze this spending data and provide 3-4 actionable insights in JSON format:
        ${JSON.stringify(categorySpending)}
        
        Return JSON array: [{"title": "short title", "description": "brief insight", "type": "warning|tip|success", "savings": estimated monthly savings if applicable}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiInsights = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("AI insights error:", e);
      }
    }

    // Fallback insights if AI fails
    if (aiInsights.length === 0) {
      const sortedCategories = Object.entries(categorySpending)
        .sort((a, b) => b[1].total - a[1].total);
      
      if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        aiInsights.push({
          title: `High ${topCategory[0]} Spending`,
          description: `You spent ₹${topCategory[1].total.toLocaleString()} on ${topCategory[0]} this month`,
          type: "warning",
        });
      }
    }

    return {
      success: true,
      data: {
        categoryBreakdown: Object.entries(categorySpending).map(([name, data]) => ({
          name,
          total: Math.round(data.total),
          count: data.count,
          average: Math.round(data.total / data.count),
        })),
        insights: aiInsights,
        totalSpent: Object.values(categorySpending).reduce((sum, c) => sum + c.total, 0),
      },
    };
  } catch (error) {
    console.error("Failed to get spending insights:", error);
    return { success: false, error: error.message };
  }
}

// ==================== UPCOMING BILLS ====================

/**
 * Get upcoming recurring transactions/bills for default account
 */
export async function getUpcomingBills(accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const defaultAccount = user.accounts.find(acc => acc.isDefault);
      targetAccountId = defaultAccount?.id;
    }

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Get recurring transactions
    const recurringTransactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        isRecurring: true,
        nextRecurringDate: {
          gte: now,
          lte: nextMonth,
        },
        ...(targetAccountId && { accountId: targetAccountId }),
      },
      orderBy: { nextRecurringDate: "asc" },
      take: 10,
    });

    // Calculate total upcoming
    const totalUpcoming = recurringTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0
    );

    return {
      success: true,
      data: {
        bills: recurringTransactions.map((t) => ({
          id: t.id,
          name: t.description || t.merchant || "Bill",
          amount: parseFloat(t.amount || 0),
          dueDate: t.nextRecurringDate,
          category: t.category,
          type: t.type,
          interval: t.recurringInterval,
          daysUntilDue: Math.ceil(
            (new Date(t.nextRecurringDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
        totalUpcoming,
        count: recurringTransactions.length,
      },
    };
  } catch (error) {
    console.error("Failed to get upcoming bills:", error);
    return { success: false, error: error.message };
  }
}

// ==================== NET WORTH TRACKER ====================

/**
 * Calculate net worth for default account
 */
export async function getNetWorth(accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true,
        wallet: true,
        investmentPlans: {
          where: { status: { in: ["ACTIVE", "COMPLETED"] } },
        },
      },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccount = accountId 
      ? user.accounts.find(acc => acc.id === accountId)
      : user.accounts.find(acc => acc.isDefault);

    // Calculate assets (for default account, show only that account balance)
    const accountBalance = targetAccount ? parseFloat(targetAccount.balance || 0) : 0;
    const walletBalance = parseFloat(user.wallet?.balance || 0);
    const investments = user.investmentPlans.reduce(
      (sum, plan) => sum + parseFloat(plan.currentAmount || 0),
      0
    );

    const totalNetWorth = accountBalance + walletBalance + investments;

    // Get historical data for chart (simplified - last 6 months)
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      // Simplified trend calculation
      const factor = 1 - (i * 0.03); // Assuming 3% growth per month
      history.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        value: Math.round(totalNetWorth * factor),
      });
    }

    return {
      success: true,
      data: {
        totalNetWorth,
        accountName: targetAccount?.name || "All Accounts",
        breakdown: {
          bankAccount: { value: accountBalance, label: targetAccount?.name || "Bank Account" },
          wallet: { value: walletBalance, label: "Digital Wallet" },
          investments: { value: investments, label: "Investments" },
        },
        history,
        monthlyChange: totalNetWorth * 0.03, // Estimated
        monthlyChangePercent: 3.0,
      },
    };
  } catch (error) {
    console.error("Failed to calculate net worth:", error);
    return { success: false, error: error.message };
  }
}

// ==================== SAVINGS GOALS ====================

/**
 * Get savings goals with progress
 */
export async function getSavingsGoals() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    const goals = await db.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: {
        goals: goals.map((g) => ({
          id: g.id,
          name: g.name,
          targetAmount: parseFloat(g.targetAmount || 0),
          currentAmount: parseFloat(g.currentAmount || 0),
          progress: (parseFloat(g.currentAmount || 0) / parseFloat(g.targetAmount || 1)) * 100,
          deadline: g.deadline,
          category: g.category,
          status: g.status,
          autoSaveEnabled: g.autoSaveEnabled,
          autoSaveAmount: parseFloat(g.autoSaveAmount || 0),
        })),
        totalSaved: goals.reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0),
        totalTarget: goals.reduce((sum, g) => sum + parseFloat(g.targetAmount || 0), 0),
      },
    };
  } catch (error) {
    console.error("Failed to get savings goals:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal({ name, targetAmount, deadline, category }) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    const goal = await db.savingsGoal.create({
      data: {
        userId: user.id,
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        category,
      },
    });

    return { success: true, data: serializeDecimal(goal) };
  } catch (error) {
    console.error("Failed to create savings goal:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update savings goal progress
 */
export async function updateSavingsGoal(goalId, { amount, action = "add" }) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    const goal = await db.savingsGoal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) return { success: false, error: "Goal not found" };

    const currentAmount = parseFloat(goal.currentAmount || 0);
    const newAmount = action === "add" 
      ? currentAmount + amount 
      : currentAmount - amount;

    const updated = await db.savingsGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: Math.max(0, newAmount),
        status: newAmount >= parseFloat(goal.targetAmount) ? "COMPLETED" : "ACTIVE",
        completedAt: newAmount >= parseFloat(goal.targetAmount) ? new Date() : null,
      },
    });

    return { success: true, data: serializeDecimal(updated) };
  } catch (error) {
    console.error("Failed to update savings goal:", error);
    return { success: false, error: error.message };
  }
}

// ==================== RECENT ACTIVITY ====================

/**
 * Get recent activity feed for default account
 */
export async function getRecentActivity(limit = 20, accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const defaultAccount = user.accounts.find(acc => acc.isDefault);
      targetAccountId = defaultAccount?.id;
    }

    // Get various activities
    const [transactions, walletTxns, investments] = await Promise.all([
      db.transaction.findMany({
        where: { 
          userId: user.id,
          ...(targetAccountId && { accountId: targetAccountId }),
        },
        orderBy: { date: "desc" },
        take: limit,
        include: { account: true },
      }),
      db.walletTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.investmentExecution.findMany({
        where: { plan: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { plan: true },
      }),
    ]);

    // Combine and sort activities
    const activities = [
      ...transactions.map((t) => ({
        id: t.id,
        type: "transaction",
        subType: t.type,
        title: t.description || t.merchant || t.category,
        amount: parseFloat(t.amount || 0),
        date: t.date,
        category: t.category,
        accountName: t.account?.name,
      })),
      ...walletTxns.map((t) => ({
        id: t.id,
        type: "wallet",
        subType: t.type,
        title: t.description || t.type,
        amount: parseFloat(t.amount || 0),
        date: t.createdAt,
        status: t.status,
      })),
      ...investments.map((e) => ({
        id: e.id,
        type: "investment",
        subType: e.investmentType,
        title: `Investment in ${e.plan?.name || e.investmentType}`,
        amount: parseFloat(e.amount || 0),
        date: e.executedAt || e.createdAt,
        status: e.status,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

    // Group by date
    const grouped = {};
    activities.forEach((a) => {
      const dateKey = new Date(a.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(a);
    });

    return {
      success: true,
      data: {
        activities,
        grouped,
        total: activities.length,
      },
    };
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return { success: false, error: error.message };
  }
}

// ==================== BUDGET CATEGORIES BREAKDOWN ====================

/**
 * Get detailed budget breakdown by category (default account only)
 */
export async function getBudgetBreakdown(accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { budgets: true, accounts: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const defaultAccount = user.accounts.find(acc => acc.isDefault);
      targetAccountId = defaultAccount?.id;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: startOfMonth },
        ...(targetAccountId && { accountId: targetAccountId }),
      },
    });

    // Group by category
    const categoryData = {};
    transactions.forEach((t) => {
      const cat = t.category || "Other";
      if (!categoryData[cat]) {
        categoryData[cat] = { spent: 0, count: 0 };
      }
      categoryData[cat].spent += parseFloat(t.amount || 0);
      categoryData[cat].count += 1;
    });

    const totalSpent = Object.values(categoryData).reduce((sum, c) => sum + c.spent, 0);
    const budget = user.budgets[0] ? parseFloat(user.budgets[0].amount || 0) : 0;

    // Create pie chart data
    const pieData = Object.entries(categoryData)
      .map(([name, data]) => ({
        name,
        value: Math.round(data.spent),
        percentage: totalSpent > 0 ? ((data.spent / totalSpent) * 100).toFixed(1) : 0,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      success: true,
      data: {
        categories: pieData,
        totalSpent,
        budget,
        remaining: Math.max(0, budget - totalSpent),
        percentUsed: budget > 0 ? ((totalSpent / budget) * 100).toFixed(1) : 0,
        isOverBudget: totalSpent > budget && budget > 0,
      },
    };
  } catch (error) {
    console.error("Failed to get budget breakdown:", error);
    return { success: false, error: error.message };
  }
}

// ==================== FINANCIAL CALENDAR ====================

/**
 * Get calendar data for a specific month (default account only)
 */
export async function getFinancialCalendar(year, month, accountId = null) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use provided accountId or find default account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const defaultAccount = user.accounts.find(acc => acc.isDefault);
      targetAccountId = defaultAccount?.id;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(targetAccountId && { accountId: targetAccountId }),
      },
      orderBy: { date: "asc" },
    });

    // Get upcoming recurring for this month
    const recurringBills = await db.transaction.findMany({
      where: {
        userId: user.id,
        isRecurring: true,
        nextRecurringDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(targetAccountId && { accountId: targetAccountId }),
      },
    });

    // Group by date
    const calendarData = {};
    transactions.forEach((t) => {
      const day = t.date.getDate();
      if (!calendarData[day]) {
        calendarData[day] = { income: 0, expenses: 0, transactions: [] };
      }
      if (t.type === "INCOME") {
        calendarData[day].income += parseFloat(t.amount || 0);
      } else {
        calendarData[day].expenses += parseFloat(t.amount || 0);
      }
      calendarData[day].transactions.push({
        id: t.id,
        description: t.description || t.merchant,
        amount: parseFloat(t.amount || 0),
        type: t.type,
        category: t.category,
      });
    });

    // Add recurring bills
    recurringBills.forEach((t) => {
      const day = new Date(t.nextRecurringDate).getDate();
      if (!calendarData[day]) {
        calendarData[day] = { income: 0, expenses: 0, transactions: [], upcoming: [] };
      }
      if (!calendarData[day].upcoming) calendarData[day].upcoming = [];
      calendarData[day].upcoming.push({
        id: t.id,
        description: t.description || t.merchant || "Recurring Bill",
        amount: parseFloat(t.amount || 0),
        type: t.type,
      });
    });

    return {
      success: true,
      data: {
        year,
        month,
        calendarData,
        summary: {
          totalIncome: transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount || 0), 0),
          totalExpenses: transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount || 0), 0),
          transactionCount: transactions.length,
          upcomingBillsCount: recurringBills.length,
        },
      },
    };
  } catch (error) {
    console.error("Failed to get financial calendar:", error);
    return { success: false, error: error.message };
  }
}

// ==================== AI INSIGHTS PANEL ====================

/**
 * Get personalized AI-powered financial advice
 */
export async function getAIInsights() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true,
        transactions: {
          where: {
            date: { gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) },
          },
          orderBy: { date: "desc" },
        },
        budgets: true,
        savingsGoals: true,
        riskProfile: true,
      },
    });

    if (!user) return { success: false, error: "User not found" };

    // Prepare financial summary
    const totalBalance = user.accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    const income = user.transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const expenses = user.transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    
    const categorySpending = {};
    user.transactions.filter((t) => t.type === "EXPENSE").forEach((t) => {
      const cat = t.category || "Other";
      categorySpending[cat] = (categorySpending[cat] || 0) + parseFloat(t.amount || 0);
    });

    let insights = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a personal financial advisor. Based on this user's financial data, provide 4-5 personalized insights and recommendations.

Financial Data:
- Total Balance: ₹${totalBalance.toLocaleString()}
- 3-Month Income: ₹${income.toLocaleString()}
- 3-Month Expenses: ₹${expenses.toLocaleString()}
- Savings Rate: ${income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0}%
- Budget: ₹${user.budgets[0]?.amount || "Not set"}
- Risk Profile: ${user.riskProfile?.riskLevel || "Not assessed"}
- Savings Goals: ${user.savingsGoals.length} goals
- Category Spending: ${JSON.stringify(categorySpending)}

Return JSON array: [{"title": "short title", "insight": "detailed personalized advice", "priority": "high|medium|low", "actionable": true/false, "action": "specific action to take if actionable"}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("AI insights error:", e);
      }
    }

    // Fallback insights
    if (insights.length === 0) {
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      
      insights = [
        {
          title: "Savings Analysis",
          insight: savingsRate >= 20 
            ? `Great job! Your savings rate of ${savingsRate.toFixed(1)}% is above the recommended 20%.`
            : `Your savings rate is ${savingsRate.toFixed(1)}%. Try to aim for at least 20% to build wealth faster.`,
          priority: savingsRate >= 20 ? "low" : "high",
          actionable: savingsRate < 20,
          action: "Review your expenses and identify areas to cut back",
        },
        {
          title: "Emergency Fund",
          insight: totalBalance >= expenses ? "You have a healthy emergency fund." : "Consider building an emergency fund of 3-6 months expenses.",
          priority: totalBalance >= expenses ? "low" : "high",
          actionable: totalBalance < expenses,
          action: "Set up automatic transfers to build your emergency fund",
        },
      ];
    }

    return {
      success: true,
      data: {
        insights,
        lastUpdated: new Date().toISOString(),
        financialSnapshot: {
          totalBalance,
          savingsRate: income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0,
          riskProfile: user.riskProfile?.riskLevel || "Not assessed",
        },
      },
    };
  } catch (error) {
    console.error("Failed to get AI insights:", error);
    return { success: false, error: error.message };
  }
}

// ==================== CURRENCY CONVERTER ====================

// Static exchange rates (simulated - in production use an API)
const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  SGD: 0.016,
  AUD: 0.018,
  CAD: 0.016,
  JPY: 1.79,
  CNY: 0.087,
  CHF: 0.011,
  HKD: 0.094,
  NZD: 0.020,
  SEK: 0.125,
  KRW: 15.87,
  MXN: 0.21,
  BRL: 0.059,
  ZAR: 0.22,
  RUB: 1.08,
  THB: 0.42,
  MYR: 0.056,
  IDR: 188.5,
  PHP: 0.67,
  VND: 295,
  SAR: 0.045,
  QAR: 0.044,
  KWD: 0.0037,
  BHD: 0.0045,
  OMR: 0.0046,
  EGP: 0.37,
};

/**
 * Convert currency
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];

    if (!fromRate || !toRate) {
      return { success: false, error: "Invalid currency" };
    }

    // Convert to INR first, then to target currency
    const inrAmount = amount / fromRate;
    const convertedAmount = inrAmount * toRate;

    return {
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount: convertedAmount.toFixed(2),
        fromCurrency,
        toCurrency,
        rate: (toRate / fromRate).toFixed(6),
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all available currencies with rates
 */
export async function getCurrencyRates() {
  const currencies = Object.entries(EXCHANGE_RATES).map(([code, rate]) => ({
    code,
    rate,
    name: getCurrencyName(code),
  }));

  return {
    success: true,
    data: {
      baseCurrency: "INR",
      currencies,
      lastUpdated: new Date().toISOString(),
    },
  };
}

function getCurrencyName(code) {
  const names = {
    INR: "Indian Rupee",
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    AED: "UAE Dirham",
    SGD: "Singapore Dollar",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    CHF: "Swiss Franc",
    HKD: "Hong Kong Dollar",
    NZD: "New Zealand Dollar",
    SEK: "Swedish Krona",
    KRW: "South Korean Won",
    MXN: "Mexican Peso",
    BRL: "Brazilian Real",
    ZAR: "South African Rand",
    RUB: "Russian Ruble",
    THB: "Thai Baht",
    MYR: "Malaysian Ringgit",
    IDR: "Indonesian Rupiah",
    PHP: "Philippine Peso",
    VND: "Vietnamese Dong",
    SAR: "Saudi Riyal",
    QAR: "Qatari Riyal",
    KWD: "Kuwaiti Dinar",
    BHD: "Bahraini Dinar",
    OMR: "Omani Rial",
    EGP: "Egyptian Pound",
  };
  return names[code] || code;
}

// ==================== ACCOUNT SUMMARY ====================

/**
 * Get summary information for a specific account
 * Used for account card click details
 */
export async function getAccountSummary(accountId) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    const account = await db.account.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) return { success: false, error: "Account not found" };

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch this month's transactions
    const transactions = await db.transaction.findMany({
      where: {
        accountId: accountId,
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Calculate income and expenses
    const income = transactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Group expenses by category
    const categoryExpenses = transactions
      .filter(t => t.type === "EXPENSE")
      .reduce((acc, t) => {
        const cat = t.category || "uncategorized";
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += parseFloat(t.amount || 0);
        return acc;
      }, {});

    // Calculate top categories with percentages
    const totalExpenses = expenses || 1;
    const topCategories = Object.entries(categoryExpenses)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      success: true,
      data: {
        accountName: account.name,
        accountType: account.type,
        balance: parseFloat(account.balance || 0),
        thisMonth: {
          income,
          expenses,
          net: income - expenses,
        },
        transactionCount: transactions.length,
        topCategories,
      },
    };
  } catch (error) {
    console.error("Error fetching account summary:", error);
    return { success: false, error: error.message };
  }
}
