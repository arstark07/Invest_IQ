"use server";

import { db } from "@/lib/prisma";
import { subDays, subMonths } from "date-fns";
import { auth } from "@clerk/nextjs/server";

const ACCOUNT_ID = "account-id";
const USER_ID = "user-id";

// Categories with their typical amount ranges
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

// Helper to generate random amount within a range
function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to get random category with amount
function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    // Generate 90 days of transactions
    const transactions = [];
    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // Generate 1-3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        // 40% chance of income, 60% chance of expense
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        const transaction = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${
            type === "INCOME" ? "Received" : "Paid for"
          } ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance += type === "INCOME" ? amount : -amount;
        transactions.push(transaction);
      }
    }

    // Insert transactions in batches and update account balance
    await db.$transaction(async (tx) => {
      // Clear existing transactions
      await tx.transaction.deleteMany({
        where: { accountId: ACCOUNT_ID },
      });

      // Insert new transactions
      await tx.transaction.createMany({
        data: transactions,
      });

      // Update account balance
      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Seed investment transactions for the past 2 years
 * Creates realistic SIP-style monthly investments with varying amounts
 */
export async function seedInvestmentHistory() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { 
        investmentPlans: true,
        wallet: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user has an investment plan
    let plan = user.investmentPlans[0];
    
    if (!plan) {
      // Create a default investment plan
      plan = await db.investmentPlan.create({
        data: {
          userId: user.id,
          name: "Wealth Builder SIP",
          description: "Long-term wealth creation through diversified investments",
          targetAmount: 2500000, // 25 Lakhs target
          currentAmount: 0,
          monthlyContribution: 25000,
          riskLevel: "MODERATE",
          status: "ACTIVE",
          allocation: {
            SIP: 40,
            STOCKS: 25,
            ELSS: 15,
            GOLD: 10,
            LUMPSUM: 10,
          },
          expectedReturn: 12.5,
        },
      });
    }

    // Investment types with their allocation and typical monthly amounts
    // Some are more volatile and can have losses
    const investmentTypes = [
      { type: "SIP", baseAmount: 10000, variance: 2000, riskFactor: 0.15 },
      { type: "STOCKS", baseAmount: 6000, variance: 3000, riskFactor: 0.35 },  // High risk - can lose
      { type: "ELSS", baseAmount: 4000, variance: 1000, riskFactor: 0.20 },
      { type: "GOLD", baseAmount: 3000, variance: 1000, riskFactor: 0.10 },
      { type: "LUMPSUM", baseAmount: 2000, variance: 1500, riskFactor: 0.25 },
    ];

    const executions = [];
    const now = new Date();
    let totalInvested = 0;

    // Simulate market crash periods (months ago when market was down)
    const crashPeriods = [3, 4, 8, 9, 15, 16]; // Recent and mid-term crashes
    const bearMarketMonths = [2, 5, 10, 14, 18]; // Slight downturns

    // Generate 24 months of investment history
    for (let monthsAgo = 24; monthsAgo >= 0; monthsAgo--) {
      const investmentDate = subMonths(now, monthsAgo);
      
      // Add some randomness - not every type every month
      const typesToInvest = investmentTypes.filter(() => Math.random() > 0.2);
      
      for (const inv of typesToInvest) {
        // Vary the amount slightly each month
        const variance = (Math.random() - 0.5) * 2 * inv.variance;
        const amount = Math.round(inv.baseAmount + variance);
        
        // Skip if amount is too low
        if (amount < 500) continue;

        // Calculate simulated returns based on how long ago
        const monthsHeld = monthsAgo;
        const annualReturn = getAnnualReturnForType(inv.type);
        const monthlyReturn = annualReturn / 12 / 100;
        
        // Add market conditions - crashes, bear markets, and volatility
        let marketCondition = 1;
        
        // Check if investment was made during crash - these will show losses
        if (crashPeriods.includes(monthsAgo) && inv.riskFactor > 0.2) {
          // Crash period - negative returns for risky assets
          marketCondition = 0.85 + (Math.random() * 0.1); // -5% to -15% loss
        } else if (bearMarketMonths.includes(monthsAgo)) {
          // Bear market - slight negative or flat
          marketCondition = 0.95 + (Math.random() * 0.08); // -5% to +3%
        } else {
          // Normal volatility
          const volatility = (Math.sin(monthsAgo * 0.5) * 0.03) + (Math.random() - 0.5) * inv.riskFactor * 0.2;
          marketCondition = 1 + volatility;
        }
        
        // Recent investments (last 3 months) - more volatile, some losses
        if (monthsAgo <= 3) {
          // Recent market turbulence
          const recentVolatility = (Math.random() - 0.4) * inv.riskFactor;
          marketCondition = 1 + recentVolatility;
        }
        
        // Calculate growth with time held and market conditions
        const baseGrowth = Math.pow(1 + monthlyReturn, monthsHeld);
        const currentValue = amount * baseGrowth * marketCondition;
        const returnAmount = currentValue - amount;
        const returnPercent = (returnAmount / amount) * 100;

        executions.push({
          planId: plan.id,
          investmentType: inv.type,
          amount: amount,
          units: inv.type === "SIP" || inv.type === "ELSS" ? (amount / (50 + Math.random() * 100)).toFixed(3) : null,
          navPrice: inv.type === "SIP" || inv.type === "ELSS" ? (50 + Math.random() * 100).toFixed(2) : null,
          stockPrice: inv.type === "STOCKS" ? (500 + Math.random() * 2000).toFixed(2) : null,
          status: "COMPLETED",
          currentValue: parseFloat(currentValue.toFixed(2)),
          returnAmount: parseFloat(returnAmount.toFixed(2)),
          returnPercent: parseFloat(returnPercent.toFixed(2)),
          lastValueUpdate: now,
          executedAt: investmentDate,
          createdAt: investmentDate,
          updatedAt: now,
        });

        totalInvested += amount;
      }
    }

    // Delete existing executions for this plan and create new ones
    await db.$transaction(async (tx) => {
      // Delete existing executions
      await tx.investmentExecution.deleteMany({
        where: { planId: plan.id },
      });

      // Create new executions
      for (const exec of executions) {
        await tx.investmentExecution.create({
          data: exec,
        });
      }

      // Update plan's current amount
      await tx.investmentPlan.update({
        where: { id: plan.id },
        data: { 
          currentAmount: totalInvested,
          status: "ACTIVE",
        },
      });
    });

    // Calculate total current value
    const totalCurrentValue = executions.reduce((sum, e) => sum + e.currentValue, 0);
    const totalReturns = totalCurrentValue - totalInvested;

    return {
      success: true,
      message: `Created ${executions.length} investment transactions over 24 months`,
      data: {
        totalInvested,
        totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
        totalReturns: parseFloat(totalReturns.toFixed(2)),
        returnPercent: parseFloat(((totalReturns / totalInvested) * 100).toFixed(2)),
        transactionCount: executions.length,
      },
    };
  } catch (error) {
    console.error("Error seeding investment history:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to get expected annual return by investment type
function getAnnualReturnForType(type) {
  const returns = {
    SIP: 14,
    STOCKS: 18,
    ELSS: 15,
    GOLD: 10,
    LUMPSUM: 12,
    ETF: 12,
    FD: 7,
    PPF: 7.1,
    NPS: 10,
    BONDS: 8,
  };
  return returns[type] || 12;
}
