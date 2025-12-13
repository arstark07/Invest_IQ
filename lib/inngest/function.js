import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeScheduledPlanInvestments } from "@/actions/investment";
import { syncBrokerHoldings } from "@/lib/broker-integration";
import { performAiRiskAnalysis, canPerformAiAnalysis } from "@/lib/risk-assessment";

// 1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => {
        // Create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// 2. Monthly Report Generation
async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" }, // First day of each month
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// 3. Budget Alerts with Event Batching
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        // Calculate total expenses for the default account only
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        // Check if we should send an alert
        if (
          percentageUsed >= 80 && // Default threshold of 80%
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          // Update last alert sent
          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Utility functions
function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
  return nextDue <= today;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}

// ==================== INVESTMENT AUTOMATION FUNCTIONS ====================

/**
 * Execute scheduled investments daily
 * Checks for investments due today and executes them
 */
export const executeScheduledInvestments = inngest.createFunction(
  {
    id: "execute-scheduled-investments",
    name: "Execute Scheduled Investments",
    retries: 3,
  },
  { cron: "0 9 * * *" }, // Daily at 9 AM (market hours)
  async ({ step }) => {
    // Find all due scheduled investments
    const dueInvestments = await step.run("fetch-due-investments", async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      return await db.scheduledInvestment.findMany({
        where: {
          isActive: true,
          nextExecutionDate: { lte: today },
          failureCount: { lt: 3 }, // Skip if failed too many times
        },
        include: {
          plan: {
            include: {
              user: {
                include: { wallet: true },
              },
            },
          },
        },
      });
    });

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
    };

    // Group by plan to execute once per plan
    const planIds = [...new Set(dueInvestments.map((i) => i.planId))];

    for (const planId of planIds) {
      await step.run(`execute-plan-${planId}`, async () => {
        const plan = await db.investmentPlan.findUnique({
          where: { id: planId },
          include: { user: true },
        });

        if (plan.status !== "ACTIVE") {
          results.skipped++;
          return;
        }

        results.processed++;

        try {
          const result = await executeScheduledPlanInvestments(planId);
          
          if (result.success) {
            results.successful++;
            
            // Send success notification
            await sendEmail({
              to: plan.user.email,
              subject: `Investment Executed - ${plan.name}`,
              react: EmailTemplate({
                userName: plan.user.name,
                type: "investment-executed",
                data: {
                  planName: plan.name,
                  amount: result.data.totalInvested,
                  executions: result.data.executions,
                },
              }),
            });
          } else {
            results.failed++;
            
            // Update failure count
            await db.scheduledInvestment.updateMany({
              where: { planId },
              data: { failureCount: { increment: 1 } },
            });

            // Send failure notification
            await sendEmail({
              to: plan.user.email,
              subject: `Investment Failed - ${plan.name}`,
              react: EmailTemplate({
                userName: plan.user.name,
                type: "investment-failed",
                data: {
                  planName: plan.name,
                  reason: result.error,
                  requiredAmount: result.required,
                  availableBalance: result.available,
                },
              }),
            });
          }
        } catch (error) {
          results.failed++;
          console.error(`Failed to execute plan ${planId}:`, error);
        }
      });
    }

    return results;
  }
);

/**
 * Sync broker holdings and update portfolio values
 */
export const syncBrokerPortfolios = inngest.createFunction(
  {
    id: "sync-broker-portfolios",
    name: "Sync Broker Portfolios",
  },
  { cron: "0 */4 * * 1-5" }, // Every 4 hours on weekdays (market days)
  async ({ step }) => {
    const brokerAccounts = await step.run("fetch-broker-accounts", async () => {
      return await db.brokerAccount.findMany({
        where: { isActive: true },
      });
    });

    let synced = 0;
    let errors = 0;

    for (const account of brokerAccounts) {
      await step.run(`sync-${account.id}`, async () => {
        try {
          const result = await syncBrokerHoldings(account.id);
          if (result.success) {
            synced++;
          } else {
            errors++;
          }
        } catch (error) {
          errors++;
          console.error(`Failed to sync broker ${account.id}:`, error);
        }
      });
    }

    return { synced, errors, total: brokerAccounts.length };
  }
);

/**
 * Monthly portfolio rebalancing check
 * Analyzes portfolio drift and suggests rebalancing
 */
export const checkPortfolioRebalancing = inngest.createFunction(
  {
    id: "check-portfolio-rebalancing",
    name: "Check Portfolio Rebalancing",
  },
  { cron: "0 10 1 * *" }, // First of each month at 10 AM
  async ({ step }) => {
    const activePlans = await step.run("fetch-active-plans", async () => {
      return await db.investmentPlan.findMany({
        where: { status: "ACTIVE" },
        include: {
          user: true,
          executions: {
            where: { status: "COMPLETED" },
          },
        },
      });
    });

    for (const plan of activePlans) {
      await step.run(`check-rebalance-${plan.id}`, async () => {
        const targetAllocation = plan.allocation;
        const currentAllocation = calculateCurrentAllocation(plan.executions);
        
        // Check if drift is more than 5%
        const needsRebalancing = Object.entries(targetAllocation).some(
          ([type, target]) => {
            const current = currentAllocation[type] || 0;
            return Math.abs(target - current) > 5;
          }
        );

        if (needsRebalancing) {
          await sendEmail({
            to: plan.user.email,
            subject: `Portfolio Rebalancing Suggested - ${plan.name}`,
            react: EmailTemplate({
              userName: plan.user.name,
              type: "rebalancing-suggested",
              data: {
                planName: plan.name,
                targetAllocation,
                currentAllocation,
              },
            }),
          });
        }
      });
    }

    return { checked: activePlans.length };
  }
);

/**
 * Weekly wealth report for active investors
 */
export const generateWeeklyWealthReport = inngest.createFunction(
  {
    id: "generate-weekly-wealth-report",
    name: "Generate Weekly Wealth Report",
  },
  { cron: "0 8 * * 0" }, // Every Sunday at 8 AM
  async ({ step }) => {
    const usersWithPlans = await step.run("fetch-users-with-investments", async () => {
      return await db.user.findMany({
        where: {
          investmentPlans: {
            some: { status: "ACTIVE" },
          },
        },
        include: {
          wallet: true,
          investmentPlans: {
            where: { status: "ACTIVE" },
            include: {
              executions: {
                where: { status: "COMPLETED" },
                orderBy: { executedAt: "desc" },
                take: 10,
              },
            },
          },
          brokerAccounts: {
            where: { isActive: true },
            include: { holdings: true },
          },
        },
      });
    });

    for (const user of usersWithPlans) {
      await step.run(`generate-report-${user.id}`, async () => {
        // Calculate portfolio summary
        const portfolioSummary = calculatePortfolioSummary(user);
        
        // Generate AI insights
        const insights = await generateInvestmentInsights(portfolioSummary);

        await sendEmail({
          to: user.email,
          subject: "Your Weekly Wealth Report",
          react: EmailTemplate({
            userName: user.name,
            type: "weekly-wealth-report",
            data: {
              ...portfolioSummary,
              insights,
              weekEnding: new Date().toLocaleDateString(),
            },
          }),
        });
      });
    }

    return { processed: usersWithPlans.length };
  }
);

/**
 * Update AI risk profiles for eligible users
 */
export const updateAiRiskProfiles = inngest.createFunction(
  {
    id: "update-ai-risk-profiles",
    name: "Update AI Risk Profiles",
  },
  { cron: "0 2 * * 1" }, // Every Monday at 2 AM
  async ({ step }) => {
    const users = await step.run("fetch-eligible-users", async () => {
      return await db.user.findMany({
        where: {
          riskProfile: {
            OR: [
              { lastAiAnalysis: null },
              {
                lastAiAnalysis: {
                  lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Older than 7 days
                },
              },
            ],
          },
        },
        include: { riskProfile: true },
      });
    });

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      await step.run(`update-risk-${user.id}`, async () => {
        const canAnalyze = await canPerformAiAnalysis(user.id);
        
        if (canAnalyze) {
          const result = await performAiRiskAnalysis(user.id);
          if (result.success) {
            updated++;
          }
        } else {
          skipped++;
        }
      });
    }

    return { updated, skipped, total: users.length };
  }
);

/**
 * Savings goal progress check and automation
 */
export const processSavingsGoals = inngest.createFunction(
  {
    id: "process-savings-goals",
    name: "Process Savings Goals",
  },
  { cron: "0 6 * * *" }, // Daily at 6 AM
  async ({ step }) => {
    // Find savings goals with auto-save enabled
    const dueGoals = await step.run("fetch-due-goals", async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      return await db.savingsGoal.findMany({
        where: {
          status: "ACTIVE",
          autoSaveEnabled: true,
          nextAutoSaveDate: { lte: today },
        },
        include: {
          user: {
            include: { wallet: true },
          },
        },
      });
    });

    let processed = 0;
    let completed = 0;

    for (const goal of dueGoals) {
      await step.run(`process-goal-${goal.id}`, async () => {
        const wallet = goal.user.wallet;
        if (!wallet) return;

        const availableBalance = 
          parseFloat(wallet.balance) - parseFloat(wallet.lockedBalance);
        const saveAmount = parseFloat(goal.autoSaveAmount);

        if (availableBalance >= saveAmount) {
          // Deduct from wallet and add to goal
          await db.$transaction([
            db.wallet.update({
              where: { id: wallet.id },
              data: { balance: { decrement: saveAmount } },
            }),
            db.savingsGoal.update({
              where: { id: goal.id },
              data: {
                currentAmount: { increment: saveAmount },
                nextAutoSaveDate: calculateNextSaveDate(goal.autoSaveFrequency),
              },
            }),
            db.walletTransaction.create({
              data: {
                walletId: wallet.id,
                userId: goal.userId,
                type: "TRANSFER_OUT",
                amount: saveAmount,
                balanceAfter: parseFloat(wallet.balance) - saveAmount,
                description: `Auto-save for: ${goal.name}`,
                status: "COMPLETED",
              },
            }),
          ]);

          processed++;

          // Check if goal is completed
          const newAmount = parseFloat(goal.currentAmount) + saveAmount;
          if (newAmount >= parseFloat(goal.targetAmount)) {
            await db.savingsGoal.update({
              where: { id: goal.id },
              data: { status: "COMPLETED", completedAt: new Date() },
            });
            completed++;

            // Send completion notification
            await sendEmail({
              to: goal.user.email,
              subject: `🎉 Savings Goal Achieved - ${goal.name}`,
              react: EmailTemplate({
                userName: goal.user.name,
                type: "goal-completed",
                data: {
                  goalName: goal.name,
                  targetAmount: parseFloat(goal.targetAmount),
                  completedDate: new Date().toLocaleDateString(),
                },
              }),
            });
          }
        }
      });
    }

    return { processed, completed, total: dueGoals.length };
  }
);

// ==================== HELPER FUNCTIONS ====================

function calculateCurrentAllocation(executions) {
  const total = executions.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const byType = {};
  
  executions.forEach((e) => {
    byType[e.investmentType] = (byType[e.investmentType] || 0) + parseFloat(e.amount);
  });

  const allocation = {};
  Object.entries(byType).forEach(([type, amount]) => {
    allocation[type] = total > 0 ? (amount / total) * 100 : 0;
  });

  return allocation;
}

function calculatePortfolioSummary(user) {
  let totalInvested = 0;
  let totalCurrentValue = 0;

  // From investment plans
  user.investmentPlans.forEach((plan) => {
    totalInvested += parseFloat(plan.currentAmount);
    
    plan.executions.forEach((exec) => {
      if (exec.currentValue) {
        totalCurrentValue += parseFloat(exec.currentValue);
      } else {
        // Estimate with average return
        totalCurrentValue += parseFloat(exec.amount) * 1.01; // ~1% weekly estimate
      }
    });
  });

  // From broker holdings
  user.brokerAccounts.forEach((account) => {
    account.holdings.forEach((holding) => {
      totalCurrentValue += parseFloat(holding.currentValue || 0);
    });
  });

  return {
    totalInvested,
    totalCurrentValue,
    totalReturn: totalCurrentValue - totalInvested,
    returnPercent: totalInvested > 0 
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 
      : 0,
    walletBalance: user.wallet ? parseFloat(user.wallet.balance) : 0,
    activePlans: user.investmentPlans.length,
    brokerHoldings: user.brokerAccounts.flatMap((a) => a.holdings).length,
  };
}

async function generateInvestmentInsights(summary) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    As a financial advisor, provide 3 brief, actionable insights for this investor's portfolio:
    
    - Total Invested: ₹${summary.totalInvested.toFixed(0)}
    - Current Value: ₹${summary.totalCurrentValue.toFixed(0)}
    - Return: ${summary.returnPercent.toFixed(1)}%
    - Wallet Balance: ₹${summary.walletBalance.toFixed(0)}
    - Active Plans: ${summary.activePlans}

    Format as JSON array: ["insight 1", "insight 2", "insight 3"]
    Keep insights practical and encouraging.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    return [
      "Your portfolio is growing steadily. Keep investing consistently.",
      "Consider reviewing your allocation quarterly for optimal returns.",
      "Maintain an emergency fund alongside your investments.",
    ];
  }
}

function calculateNextSaveDate(frequency) {
  const next = new Date();
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
