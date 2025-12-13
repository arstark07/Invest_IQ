"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getInvestmentRecommendations, getUserRiskProfile } from "@/lib/risk-assessment";
import { lockWalletAmount, executeLockedAmount, releaseLockedAmount } from "@/actions/wallet";
import { executeInvestmentOrder, syncBrokerHoldings } from "@/lib/broker-integration";
import { calculateReturns } from "@/lib/investment-calculator";

/**
 * Investment Plan Management Actions
 * 
 * This module handles:
 * - Creating investment plans based on user's risk profile
 * - Auto-executing investments with user approval
 * - Tracking portfolio performance
 * - Generating wealth reports
 */

// Helper to convert Decimal to number
function toNumber(val) {
  if (val === null || val === undefined) return null;
  return Number(val);
}

// Helper to serialize investment plan
function serializePlan(plan) {
  if (!plan) return null;
  return {
    ...plan,
    targetAmount: toNumber(plan.targetAmount),
    currentAmount: toNumber(plan.currentAmount),
    monthlyContribution: toNumber(plan.monthlyContribution),
    expectedReturn: toNumber(plan.expectedReturn),
    scheduledInvestments: plan.scheduledInvestments?.map(s => ({
      ...s,
      amount: toNumber(s.amount),
    })),
    executions: plan.executions?.map(e => ({
      ...e,
      amount: toNumber(e.amount),
      units: toNumber(e.units),
      navPrice: toNumber(e.navPrice),
      stockPrice: toNumber(e.stockPrice),
      currentValue: toNumber(e.currentValue),
      returnAmount: toNumber(e.returnAmount),
    })),
  };
}

// ==================== INVESTMENT PLAN CREATION ====================

/**
 * Generate a personalized investment plan
 */
export async function generateInvestmentPlan({
  monthlyContribution,
  targetAmount,
  investmentHorizon, // in years
  specificGoal, // retirement, home, education, etc.
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { riskProfile: true, wallet: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.riskProfile) {
      return {
        success: false,
        error: "Please complete risk assessment first",
        requiresRiskAssessment: true,
      };
    }

    const riskLevel = user.riskProfile.riskLevel;
    const recommendations = await getInvestmentRecommendations(riskLevel);

    // Calculate expected returns based on allocation
    const expectedReturnPercent = calculateExpectedReturn(recommendations.allocation, riskLevel);
    
    // Calculate how much can be achieved with current contributions
    const projectedValue = calculateProjectedValue(
      monthlyContribution,
      expectedReturnPercent,
      investmentHorizon * 12
    );

    // Create the investment plan
    const plan = await db.investmentPlan.create({
      data: {
        userId: user.id,
        name: specificGoal
          ? `${specificGoal} Investment Plan`
          : `${riskLevel} Growth Plan`,
        description: generatePlanDescription(riskLevel, specificGoal, investmentHorizon),
        targetAmount,
        monthlyContribution,
        startDate: new Date(),
        endDate: new Date(Date.now() + investmentHorizon * 365 * 24 * 60 * 60 * 1000),
        riskLevel,
        status: "PENDING_APPROVAL",
        expectedReturn: projectedValue,
        expectedReturnPercent,
        allocation: recommendations.allocation,
      },
    });

    // Create scheduled investments for each allocation
    const scheduledInvestments = [];
    for (const [type, percentage] of Object.entries(recommendations.allocation)) {
      const amount = (monthlyContribution * percentage) / 100;
      if (amount > 0) {
        const scheduled = await db.scheduledInvestment.create({
          data: {
            planId: plan.id,
            investmentType: mapAllocationToInvestmentType(type),
            amount,
            frequency: "MONTHLY",
            nextExecutionDate: getNextExecutionDate(),
            isActive: false, // Will be activated after approval
          },
        });
        // Serialize to convert Decimal to number
        scheduledInvestments.push({
          ...scheduled,
          amount: Number(scheduled.amount),
        });
      }
    }

    return {
      success: true,
      data: {
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          monthlyContribution: Number(monthlyContribution),
          targetAmount: Number(targetAmount),
          riskLevel,
          allocation: recommendations.allocation,
          expectedReturn: Number(projectedValue),
          expectedReturnPercent,
          projectedTimeline: investmentHorizon,
          suitableProducts: recommendations.suitableProducts,
        },
        scheduledInvestments,
        requiresApproval: true,
      },
    };
  } catch (error) {
    console.error("Failed to generate investment plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Approve and activate investment plan
 */
export async function approveInvestmentPlan(planId, pin) {
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

    // Skip PIN verification in simulation mode or if PIN is "skip"
    const isSimulation = process.env.FORCE_SIMULATION === "true" || user.isSimulationUser;
    
    if (user.wallet?.pin && !isSimulation && pin !== "skip") {
      if (!pin) {
        return { success: false, error: "PIN required", requiresPin: true };
      }
      const bcrypt = await import("bcryptjs");
      const isValidPin = await bcrypt.compare(pin, user.wallet.pin);
      if (!isValidPin) {
        return { success: false, error: "Invalid PIN" };
      }
    }

    const plan = await db.investmentPlan.findFirst({
      where: { id: planId, userId: user.id },
      include: { scheduledInvestments: true },
    });

    if (!plan) {
      return { success: false, error: "Investment plan not found" };
    }

    if (plan.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Plan is not pending approval" };
    }

    // Check wallet balance for first month's investment
    if (!user.wallet || parseFloat(user.wallet.balance) < parseFloat(plan.monthlyContribution)) {
      return {
        success: false,
        error: "Insufficient wallet balance for first investment",
        requiredAmount: parseFloat(plan.monthlyContribution),
        currentBalance: user.wallet ? parseFloat(user.wallet.balance) : 0,
      };
    }

    // Activate plan and scheduled investments
    await db.$transaction([
      db.investmentPlan.update({
        where: { id: planId },
        data: {
          status: "ACTIVE",
          userApproved: true,
          approvedAt: new Date(),
        },
      }),
      db.scheduledInvestment.updateMany({
        where: { planId },
        data: { isActive: true },
      }),
    ]);

    // Execute first investment immediately
    const firstExecutionResult = await executeScheduledPlanInvestments(planId);

    revalidatePath("/portfolio");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        planId,
        status: "ACTIVE",
        firstExecutionResult,
        message: "Investment plan activated! Your first investment has been initiated.",
      },
    };
  } catch (error) {
    console.error("Failed to approve plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Pause investment plan
 */
export async function pauseInvestmentPlan(planId) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    const plan = await db.investmentPlan.findFirst({
      where: { id: planId, userId: user.id, status: "ACTIVE" },
    });

    if (!plan) {
      return { success: false, error: "Active plan not found" };
    }

    await db.$transaction([
      db.investmentPlan.update({
        where: { id: planId },
        data: { status: "PAUSED" },
      }),
      db.scheduledInvestment.updateMany({
        where: { planId },
        data: { isActive: false },
      }),
    ]);

    revalidatePath("/portfolio");

    return { success: true, message: "Investment plan paused" };
  } catch (error) {
    console.error("Failed to pause plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Resume paused investment plan
 */
export async function resumeInvestmentPlan(planId) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    const plan = await db.investmentPlan.findFirst({
      where: { id: planId, userId: user.id, status: "PAUSED" },
    });

    if (!plan) {
      return { success: false, error: "Paused plan not found" };
    }

    await db.$transaction([
      db.investmentPlan.update({
        where: { id: planId },
        data: { status: "ACTIVE" },
      }),
      db.scheduledInvestment.updateMany({
        where: { planId },
        data: {
          isActive: true,
          nextExecutionDate: getNextExecutionDate(),
        },
      }),
    ]);

    revalidatePath("/portfolio");

    return { success: true, message: "Investment plan resumed" };
  } catch (error) {
    console.error("Failed to resume plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel investment plan
 */
export async function cancelInvestmentPlan(planId) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    const plan = await db.investmentPlan.findFirst({
      where: {
        id: planId,
        userId: user.id,
        status: { in: ["PENDING_APPROVAL", "ACTIVE", "PAUSED"] },
      },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    // Release any locked amount
    if (user.wallet) {
      await releaseLockedAmount(user.wallet.id, 0, planId);
    }

    await db.$transaction([
      db.investmentPlan.update({
        where: { id: planId },
        data: { status: "CANCELLED" },
      }),
      db.scheduledInvestment.updateMany({
        where: { planId },
        data: { isActive: false },
      }),
    ]);

    revalidatePath("/portfolio");

    return { success: true, message: "Investment plan cancelled" };
  } catch (error) {
    console.error("Failed to cancel plan:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an investment plan permanently
 */
export async function deleteInvestmentPlan(planId) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { wallet: true },
    });

    const plan = await db.investmentPlan.findFirst({
      where: {
        id: planId,
        userId: user.id,
      },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    // Release any locked amount if plan is active
    if (user.wallet && ["PENDING_APPROVAL", "ACTIVE", "PAUSED"].includes(plan.status)) {
      await releaseLockedAmount(user.wallet.id, 0, planId);
    }

    // Delete all related records and the plan
    await db.$transaction([
      // Delete investment executions
      db.investmentExecution.deleteMany({
        where: { planId },
      }),
      // Delete scheduled investments
      db.scheduledInvestment.deleteMany({
        where: { planId },
      }),
      // Delete the plan itself
      db.investmentPlan.delete({
        where: { id: planId },
      }),
    ]);

    revalidatePath("/portfolio");

    return { success: true, message: "Investment plan deleted" };
  } catch (error) {
    console.error("Failed to delete plan:", error);
    return { success: false, error: error.message };
  }
}

// ==================== INVESTMENT EXECUTION ====================

/**
 * Execute scheduled investments for a plan
 */
export async function executeScheduledPlanInvestments(planId) {
  try {
    const plan = await db.investmentPlan.findUnique({
      where: { id: planId },
      include: {
        user: {
          include: {
            wallet: true,
            brokerAccounts: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
        scheduledInvestments: {
          where: { isActive: true },
        },
      },
    });

    if (!plan || plan.status !== "ACTIVE") {
      return { success: false, error: "Plan not active" };
    }

    const wallet = plan.user.wallet;
    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    const totalAmount = parseFloat(plan.monthlyContribution);
    const availableBalance = parseFloat(wallet.balance) - parseFloat(wallet.lockedBalance);

    if (availableBalance < totalAmount) {
      // Record failed execution due to insufficient balance
      await db.investmentExecution.create({
        data: {
          planId,
          investmentType: "LUMPSUM",
          amount: totalAmount,
          status: "FAILED",
          failureReason: "Insufficient wallet balance",
        },
      });

      return {
        success: false,
        error: "Insufficient wallet balance",
        required: totalAmount,
        available: availableBalance,
      };
    }

    // Lock the amount
    await lockWalletAmount(wallet.id, totalAmount, planId);

    const executions = [];
    const brokerAccount = plan.user.brokerAccounts[0];

    for (const scheduled of plan.scheduledInvestments) {
      const execution = await db.investmentExecution.create({
        data: {
          planId,
          investmentType: scheduled.investmentType,
          amount: scheduled.amount,
          status: "PROCESSING",
          brokerAccountId: brokerAccount?.id,
        },
      });

      // Execute through broker if connected
      if (brokerAccount) {
        const orderResult = await executeInvestmentOrder({
          brokerAccountId: brokerAccount.id,
          investmentType: scheduled.investmentType,
          symbol: getSymbolForInvestmentType(scheduled.investmentType),
          amount: parseFloat(scheduled.amount),
        });

        if (orderResult.success) {
          await db.investmentExecution.update({
            where: { id: execution.id },
            data: {
              status: "COMPLETED",
              brokerOrderId: orderResult.data?.orderId,
              brokerResponse: orderResult.data,
              executedAt: new Date(),
            },
          });
          executions.push({ ...execution, status: "COMPLETED" });
        } else {
          await db.investmentExecution.update({
            where: { id: execution.id },
            data: {
              status: "FAILED",
              failureReason: orderResult.error,
            },
          });
          executions.push({ ...execution, status: "FAILED", error: orderResult.error });
        }
      } else {
        // Simulated execution (no broker connected)
        await db.investmentExecution.update({
          where: { id: execution.id },
          data: {
            status: "COMPLETED",
            executedAt: new Date(),
            brokerResponse: { simulated: true },
          },
        });
        executions.push({ ...execution, status: "COMPLETED", simulated: true });
      }

      // Update scheduled investment
      await db.scheduledInvestment.update({
        where: { id: scheduled.id },
        data: {
          lastExecutedAt: new Date(),
          nextExecutionDate: getNextExecutionDate(scheduled.frequency),
        },
      });
    }

    // Execute locked amount (deduct from wallet)
    await executeLockedAmount(wallet.id, totalAmount, planId);

    // Update plan's current amount
    await db.investmentPlan.update({
      where: { id: planId },
      data: {
        currentAmount: { increment: totalAmount },
      },
    });

    return {
      success: true,
      data: {
        totalInvested: totalAmount,
        executions: executions.map(e => ({
          ...e,
          amount: toNumber(e.amount),
        })),
      },
    };
  } catch (error) {
    console.error("Failed to execute investments:", error);
    return { success: false, error: error.message };
  }
}

// ==================== PORTFOLIO & PERFORMANCE ====================

/**
 * Get user's investment portfolio
 */
export async function getInvestmentPortfolio() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        investmentPlans: {
          where: { status: { in: ["ACTIVE", "PAUSED", "COMPLETED"] } },
          include: {
            executions: {
              where: { status: "COMPLETED" },
              orderBy: { executedAt: "desc" },
            },
            scheduledInvestments: true,
          },
        },
        brokerAccounts: {
          where: { isActive: true },
          include: {
            holdings: true,
          },
        },
        wallet: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Calculate portfolio metrics
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const allocationBreakdown = {};
    
    // ROI tracking
    let monthlyInvestments = {};
    let yearlyInvestments = {};
    let totalGains = 0;
    let totalLosses = 0;
    let bestPerformer = null;
    let worstPerformer = null;
    const investmentsByType = {};

    for (const plan of user.investmentPlans) {
      totalInvested += parseFloat(plan.currentAmount);
      
      for (const execution of plan.executions) {
        const type = execution.investmentType;
        const amount = parseFloat(execution.amount);
        allocationBreakdown[type] = (allocationBreakdown[type] || 0) + amount;
        
        // Track by type for ROI calculation
        if (!investmentsByType[type]) {
          investmentsByType[type] = { invested: 0, currentValue: 0, count: 0 };
        }
        investmentsByType[type].invested += amount;
        investmentsByType[type].count += 1;
        
        // Track monthly/yearly investments
        const execDate = new Date(execution.executedAt);
        const monthKey = `${execDate.getFullYear()}-${String(execDate.getMonth() + 1).padStart(2, '0')}`;
        const yearKey = `${execDate.getFullYear()}`;
        monthlyInvestments[monthKey] = (monthlyInvestments[monthKey] || 0) + amount;
        yearlyInvestments[yearKey] = (yearlyInvestments[yearKey] || 0) + amount;
        
        let execCurrentValue;
        // In simulation mode, always calculate simulated returns for realistic demo
        const isSimulation = process.env.FORCE_SIMULATION === "true";
        if (execution.currentValue && !isSimulation) {
          execCurrentValue = parseFloat(execution.currentValue);
        } else {
          // Estimate current value with expected returns
          const monthsHeld = Math.floor(
            (Date.now() - execution.executedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
          );
          execCurrentValue = calculateEstimatedReturn(
            execution.investmentType,
            amount,
            monthsHeld
          );
        }
        
        totalCurrentValue += execCurrentValue;
        investmentsByType[type].currentValue += execCurrentValue;
        
        // Track gains/losses
        const returnAmount = execCurrentValue - amount;
        if (returnAmount >= 0) {
          totalGains += returnAmount;
        } else {
          totalLosses += Math.abs(returnAmount);
        }
        
        // Track best/worst performers
        const returnPercent = amount > 0 ? ((execCurrentValue - amount) / amount) * 100 : 0;
        if (!bestPerformer || returnPercent > bestPerformer.returnPercent) {
          bestPerformer = {
            type,
            symbol: execution.symbol || type,
            invested: amount,
            currentValue: execCurrentValue,
            returnPercent,
          };
        }
        if (!worstPerformer || returnPercent < worstPerformer.returnPercent) {
          worstPerformer = {
            type,
            symbol: execution.symbol || type,
            invested: amount,
            currentValue: execCurrentValue,
            returnPercent,
          };
        }
      }
    }

    // Add broker holdings
    for (const account of user.brokerAccounts) {
      for (const holding of account.holdings) {
        totalCurrentValue += parseFloat(holding.currentValue || 0);
      }
    }

    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    // Calculate ROI by type
    const roiByType = Object.entries(investmentsByType).map(([type, data]) => ({
      type,
      invested: data.invested,
      currentValue: data.currentValue,
      return: data.currentValue - data.invested,
      returnPercent: data.invested > 0 ? ((data.currentValue - data.invested) / data.invested) * 100 : 0,
      count: data.count,
    })).sort((a, b) => b.returnPercent - a.returnPercent);
    
    // Calculate CAGR (Compound Annual Growth Rate)
    const firstInvestmentDate = user.investmentPlans
      .flatMap(p => p.executions)
      .map(e => new Date(e.executedAt))
      .sort((a, b) => a - b)[0];
    
    let cagr = 0;
    const isSimulation = process.env.FORCE_SIMULATION === "true";
    
    if (firstInvestmentDate && totalInvested > 0) {
      const yearsInvested = (Date.now() - firstInvestmentDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
      
      // In simulation mode or if investment is very recent, use annualized return estimate
      if (isSimulation || yearsInvested < 0.1) {
        // Use a reasonable simulated CAGR based on portfolio composition (12-15% typical)
        const returnPercent = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;
        // Annualize the return - if we made 3% in a short time, estimate yearly
        cagr = Math.min(returnPercent * 4, 25); // Cap at 25% for realism
      } else if (yearsInvested >= 0.1) {
        cagr = (Math.pow(totalCurrentValue / totalInvested, 1 / yearsInvested) - 1) * 100;
        // Cap CAGR to reasonable bounds
        cagr = Math.max(-50, Math.min(cagr, 100));
      }
    }
    
    // Calculate average monthly investment
    const monthlyValues = Object.values(monthlyInvestments);
    const avgMonthlyInvestment = monthlyValues.length > 0 
      ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length 
      : 0;

    return {
      success: true,
      data: {
        summary: {
          totalInvested,
          totalCurrentValue,
          totalReturn,
          returnPercent,
          walletBalance: user.wallet ? parseFloat(user.wallet.balance) : 0,
          // Enhanced ROI data
          cagr,
          totalGains,
          totalLosses,
          avgMonthlyInvestment,
          investmentStartDate: firstInvestmentDate?.toISOString() || null,
        },
        // ROI breakdown by investment type
        roiByType,
        // Best and worst performers
        performers: {
          best: bestPerformer,
          worst: worstPerformer,
        },
        // Investment history
        monthlyInvestments,
        yearlyInvestments,
        // ROI Transaction data - all executions with their returns
        roiTransactions: user.investmentPlans.flatMap((plan) =>
          plan.executions.map((execution) => {
            const amount = parseFloat(execution.amount);
            const isSimulation = process.env.FORCE_SIMULATION === "true";
            const monthsHeld = Math.floor((Date.now() - new Date(execution.executedAt).getTime()) / (30 * 24 * 60 * 60 * 1000));
            
            // Always use simulated returns in simulation mode for realistic demo
            const currentValue = (execution.currentValue && !isSimulation)
              ? parseFloat(execution.currentValue)
              : calculateEstimatedReturn(execution.investmentType, amount, monthsHeld);
            
            const returnAmount = currentValue - amount;
            const returnPercent = amount > 0 ? (returnAmount / amount) * 100 : 0;
            
            return {
              id: execution.id,
              planName: plan.name,
              planId: plan.id,
              type: execution.investmentType,
              symbol: execution.symbol || execution.investmentType,
              amount,
              units: execution.units ? parseFloat(execution.units) : null,
              buyPrice: execution.navPrice ? parseFloat(execution.navPrice) : execution.stockPrice ? parseFloat(execution.stockPrice) : null,
              currentValue,
              returnAmount,
              returnPercent,
              status: execution.status,
              executedAt: execution.executedAt,
              daysHeld: execution.executedAt 
                ? Math.floor((Date.now() - new Date(execution.executedAt).getTime()) / (24 * 60 * 60 * 1000))
                : 0,
            };
          })
        ).sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt)),
        plans: user.investmentPlans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          status: plan.status,
          riskLevel: plan.riskLevel,
          monthlyContribution: parseFloat(plan.monthlyContribution),
          targetAmount: parseFloat(plan.targetAmount),
          currentAmount: parseFloat(plan.currentAmount),
          progress: (parseFloat(plan.currentAmount) / parseFloat(plan.targetAmount)) * 100,
          allocation: plan.allocation,
          expectedReturn: parseFloat(plan.expectedReturn || 0),
          executionCount: plan.executions.length,
          nextExecution: plan.scheduledInvestments.find((s) => s.isActive)?.nextExecutionDate,
        })),
        allocationBreakdown,
        brokerHoldings: user.brokerAccounts.flatMap((account) =>
          account.holdings.map((h) => ({
            broker: account.broker,
            symbol: h.symbol,
            name: h.name,
            quantity: parseFloat(h.quantity),
            currentValue: parseFloat(h.currentValue || 0),
            pnl: parseFloat(h.pnl || 0),
            pnlPercent: h.pnlPercent,
          }))
        ),
      },
    };
  } catch (error) {
    console.error("Failed to get portfolio:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get investment performance over time
 */
export async function getInvestmentPerformance(planId, period = "1Y") {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    const whereClause = {
      plan: { userId: user.id },
      status: "COMPLETED",
    };

    if (planId) {
      whereClause.planId = planId;
    }

    // Calculate date range based on period
    const periodMonths = {
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "ALL": 24,
    };

    const months = periodMonths[period] || 12;
    const isSimulation = process.env.FORCE_SIMULATION === "true";

    const executions = await db.investmentExecution.findMany({
      where: whereClause,
      orderBy: { executedAt: "asc" },
      include: {
        plan: {
          select: { name: true, riskLevel: true },
        },
      },
    });

    // Calculate total current invested amount
    const totalInvested = executions.reduce((sum, exec) => sum + parseFloat(exec.amount), 0);
    
    // Generate simulated historical chart data for better visualization
    if (isSimulation && totalInvested > 0) {
      const chartData = [];
      const now = new Date();
      
      // Simulate investment journey over the period
      for (let i = months; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthKey = monthDate.toISOString().slice(0, 7);
        const monthName = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        
        // Simulate gradual investment buildup
        const progressRatio = (months - i) / months;
        const investedAtMonth = totalInvested * Math.min(1, progressRatio * 1.2);
        
        // Simulate market growth with some volatility
        const baseGrowthRate = 0.12 / 12; // 12% annual return
        const monthsFromStart = months - i;
        const volatility = Math.sin(monthsFromStart * 0.5) * 0.02 + Math.cos(monthsFromStart * 0.3) * 0.015;
        const growthMultiplier = Math.pow(1 + baseGrowthRate + volatility, monthsFromStart);
        
        // Value grows with compound returns
        const valueAtMonth = investedAtMonth * growthMultiplier;
        
        chartData.push({
          month: monthName,
          monthKey,
          invested: Math.round(investedAtMonth),
          value: Math.round(valueAtMonth),
          cumulativeInvested: Math.round(investedAtMonth),
          cumulativeValue: Math.round(valueAtMonth),
        });
      }

      const latestValue = chartData[chartData.length - 1]?.cumulativeValue || 0;
      
      return {
        success: true,
        data: {
          chartData,
          summary: {
            totalInvested,
            currentValue: latestValue,
            absoluteReturn: latestValue - totalInvested,
            percentReturn: totalInvested > 0
              ? ((latestValue - totalInvested) / totalInvested) * 100
              : 0,
            period,
          },
        },
      };
    }

    // Non-simulation mode: use actual execution data
    const monthlyData = {};
    let cumulativeInvested = 0;
    let cumulativeValue = 0;

    executions.forEach((exec) => {
      const month = exec.executedAt.toISOString().slice(0, 7);
      const amount = parseFloat(exec.amount);
      cumulativeInvested += amount;

      // Estimate current value
      const monthsHeld = Math.floor(
        (Date.now() - exec.executedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      const estimatedValue = calculateEstimatedReturn(exec.investmentType, amount, monthsHeld);
      cumulativeValue += estimatedValue;

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          invested: 0,
          value: 0,
          cumulativeInvested: 0,
          cumulativeValue: 0,
        };
      }

      monthlyData[month].invested += amount;
      monthlyData[month].value += estimatedValue;
      monthlyData[month].cumulativeInvested = cumulativeInvested;
      monthlyData[month].cumulativeValue = cumulativeValue;
    });

    return {
      success: true,
      data: {
        chartData: Object.values(monthlyData),
        summary: {
          totalInvested: cumulativeInvested,
          currentValue: cumulativeValue,
          absoluteReturn: cumulativeValue - cumulativeInvested,
          percentReturn: cumulativeInvested > 0
            ? ((cumulativeValue - cumulativeInvested) / cumulativeInvested) * 100
            : 0,
          period,
        },
      },
    };
  } catch (error) {
    console.error("Failed to get performance:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all investment plans for user
 */
export async function getInvestmentPlans() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    const plans = await db.investmentPlan.findMany({
      where: { userId: user.id },
      include: {
        scheduledInvestments: true,
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        status: plan.status,
        riskLevel: plan.riskLevel,
        monthlyContribution: parseFloat(plan.monthlyContribution),
        targetAmount: parseFloat(plan.targetAmount),
        currentAmount: parseFloat(plan.currentAmount),
        progress: (parseFloat(plan.currentAmount) / parseFloat(plan.targetAmount)) * 100,
        expectedReturn: parseFloat(plan.expectedReturn || 0),
        expectedReturnPercent: plan.expectedReturnPercent,
        allocation: plan.allocation,
        startDate: plan.startDate,
        endDate: plan.endDate,
        approvedAt: plan.approvedAt,
        executionCount: plan._count.executions,
        nextExecution: plan.scheduledInvestments.find((s) => s.isActive)?.nextExecutionDate,
        createdAt: plan.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to get plans:", error);
    return { success: false, error: error.message };
  }
}

// ==================== HELPER FUNCTIONS ====================

function calculateExpectedReturn(allocation, riskLevel) {
  const returnRates = {
    CONSERVATIVE: { base: 7, range: 1 },
    MODERATE: { base: 11, range: 2 },
    AGGRESSIVE: { base: 14, range: 3 },
    VERY_AGGRESSIVE: { base: 18, range: 4 },
  };

  const rate = returnRates[riskLevel] || returnRates.MODERATE;
  return rate.base + Math.random() * rate.range;
}

function calculateProjectedValue(monthlyContribution, annualReturn, months) {
  const monthlyRate = annualReturn / 100 / 12;
  // Future value of annuity formula
  return monthlyContribution * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
}

function generatePlanDescription(riskLevel, goal, horizon) {
  const descriptions = {
    CONSERVATIVE: `A conservative investment strategy focused on capital preservation and steady returns over ${horizon} years.`,
    MODERATE: `A balanced investment approach combining growth and stability for ${goal || "wealth creation"} over ${horizon} years.`,
    AGGRESSIVE: `A growth-oriented strategy with higher equity exposure for maximum returns over ${horizon} years.`,
    VERY_AGGRESSIVE: `An aggressive high-growth strategy suitable for long-term investors with ${horizon}+ year horizon.`,
  };
  return descriptions[riskLevel] || descriptions.MODERATE;
}

function mapAllocationToInvestmentType(allocationType) {
  const mapping = {
    FD: "FD",
    PPF: "PPF",
    DEBT_MF: "LUMPSUM",
    EQUITY_MF: "SIP",
    STOCKS: "STOCKS",
    GOLD: "GOLD",
    LIQUID_FUND: "LUMPSUM",
    SMALL_CAP_MF: "SIP",
    MID_CAP_MF: "SIP",
    ELSS: "ELSS",
    NPS: "NPS",
  };
  return mapping[allocationType] || "LUMPSUM";
}

function getNextExecutionDate(frequency = "MONTHLY") {
  const now = new Date();
  switch (frequency) {
    case "DAILY":
      now.setDate(now.getDate() + 1);
      break;
    case "WEEKLY":
      now.setDate(now.getDate() + 7);
      break;
    case "MONTHLY":
      now.setMonth(now.getMonth() + 1);
      now.setDate(1); // First of next month
      break;
    case "YEARLY":
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  return now;
}

function getSymbolForInvestmentType(type) {
  // Default symbols for different investment types
  const symbols = {
    SIP: "INF109K01Z48", // HDFC Flexi Cap Fund
    LUMPSUM: "INF090I01C05", // ICICI Prudential BAF
    ELSS: "INF090I01569", // ICICI ELSS
    STOCKS: "NIFTYBEES", // Nifty ETF as default
    ETF: "NIFTYBEES",
    GOLD: "GOLDBEES",
  };
  return symbols[type] || symbols.LUMPSUM;
}

function calculateEstimatedReturn(investmentType, amount, monthsHeld) {
  // Annualized return rates for different investment types (realistic Indian market returns)
  const returnRates = {
    SIP: 0.14,       // 14% - Equity MF SIP average
    LUMPSUM: 0.12,   // 12% - Lumpsum MF
    FD: 0.07,        // 7% - Fixed Deposit
    PPF: 0.071,      // 7.1% - PPF current rate
    NPS: 0.10,       // 10% - NPS average
    ELSS: 0.15,      // 15% - ELSS tax saver funds
    STOCKS: 0.18,    // 18% - Direct equity (higher risk/reward)
    ETF: 0.12,       // 12% - Index ETFs
    GOLD: 0.10,      // 10% - Gold returns
    BONDS: 0.08,     // 8% - Bonds
  };

  const annualRate = returnRates[investmentType] || 0.12;
  const monthlyRate = annualRate / 12;
  
  // For simulation: Add some volatility and ensure returns even for recent investments
  // Minimum 1 month of returns for demo purposes
  const effectiveMonths = Math.max(monthsHeld, 1);
  
  // Add some randomness for realistic simulation (±2% variation)
  const volatilityFactor = 1 + (Math.sin(amount * 0.001) * 0.02);
  
  // Base return calculation with compound interest
  const baseReturn = amount * Math.pow(1 + monthlyRate, effectiveMonths);
  
  // Apply volatility and add small positive bias for demo
  const simulatedReturn = baseReturn * volatilityFactor * (1 + (annualRate * 0.1));
  
  return simulatedReturn;
}

// ==================== WITHDRAW RETURNS TO WALLET ====================

/**
 * Withdraw investment returns to wallet
 * This redeems the profit (returns - principal) and adds to wallet balance
 */
export async function withdrawReturnsToWallet(planId) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { 
        wallet: true,
        investmentPlans: {
          where: { id: planId },
          include: { executions: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.wallet) {
      return { success: false, error: "Wallet not found. Please set up your wallet first." };
    }

    const plan = user.investmentPlans[0];
    if (!plan) {
      return { success: false, error: "Investment plan not found" };
    }

    // Calculate total invested (principal)
    const totalInvested = parseFloat(plan.currentAmount);
    
    // Calculate current value with returns
    const monthsHeld = Math.max(
      Math.floor((new Date() - new Date(plan.startDate)) / (1000 * 60 * 60 * 24 * 30)),
      1
    );
    
    const currentValue = calculateEstimatedReturn(
      plan.investmentType,
      totalInvested,
      monthsHeld
    );
    
    // Calculate profit (returns only)
    const profit = currentValue - totalInvested;
    
    if (profit <= 0) {
      return { success: false, error: "No returns available to withdraw. Your investment needs more time to generate profits." };
    }

    // Update wallet balance with profit
    const newWalletBalance = parseFloat(user.wallet.balance) + profit;

    await db.$transaction([
      // Update wallet balance
      db.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: newWalletBalance },
      }),
      // Create wallet transaction for the return deposit
      db.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          userId: user.id,
          type: "INVESTMENT_RETURN",
          amount: profit,
          balanceAfter: newWalletBalance,
          description: `Investment returns from ${plan.name}`,
          status: "COMPLETED",
          investmentPlanId: planId,
        },
      }),
      // Update plan to mark returns as withdrawn
      db.investmentPlan.update({
        where: { id: planId },
        data: { 
          lastReturnWithdrawal: new Date(),
        },
      }),
    ]);

    revalidatePath("/portfolio");
    revalidatePath("/wallet");

    return {
      success: true,
      data: {
        withdrawnAmount: profit,
        newWalletBalance,
        planName: plan.name,
      },
    };
  } catch (error) {
    console.error("Failed to withdraw returns:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get withdrawable returns for a plan
 */
export async function getWithdrawableReturns(planId) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { 
        investmentPlans: {
          where: { id: planId },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const plan = user.investmentPlans[0];
    if (!plan) {
      return { success: false, error: "Investment plan not found" };
    }

    const totalInvested = parseFloat(plan.currentAmount);
    const monthsHeld = Math.max(
      Math.floor((new Date() - new Date(plan.startDate)) / (1000 * 60 * 60 * 24 * 30)),
      1
    );
    
    const currentValue = calculateEstimatedReturn(
      plan.investmentType,
      totalInvested,
      monthsHeld
    );
    
    const profit = currentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? ((profit / totalInvested) * 100) : 0;

    return {
      success: true,
      data: {
        principal: totalInvested,
        currentValue,
        profit: Math.max(profit, 0),
        returnPercentage: returnPercentage.toFixed(2),
        canWithdraw: profit > 0,
        lastWithdrawal: plan.lastReturnWithdrawal,
      },
    };
  } catch (error) {
    console.error("Failed to get withdrawable returns:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Redeem (sell) entire investment - principal + returns to wallet
 */
export async function redeemInvestmentToWallet(planId) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { 
        wallet: true,
        investmentPlans: {
          where: { id: planId },
          include: { executions: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.wallet) {
      return { success: false, error: "Wallet not found. Please set up your wallet first." };
    }

    const plan = user.investmentPlans[0];
    if (!plan) {
      return { success: false, error: "Investment plan not found" };
    }

    // Calculate total value (principal + returns)
    const totalInvested = parseFloat(plan.currentAmount);
    const monthsHeld = Math.max(
      Math.floor((new Date() - new Date(plan.startDate)) / (1000 * 60 * 60 * 24 * 30)),
      1
    );
    
    const currentValue = calculateEstimatedReturn(
      plan.investmentType,
      totalInvested,
      monthsHeld
    );
    
    const profit = currentValue - totalInvested;

    // Update wallet balance with full redemption value
    const newWalletBalance = parseFloat(user.wallet.balance) + currentValue;

    await db.$transaction([
      // Update wallet balance
      db.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: newWalletBalance },
      }),
      // Create wallet transaction for redemption
      db.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          userId: user.id,
          type: "INVESTMENT_REDEMPTION",
          amount: currentValue,
          balanceAfter: newWalletBalance,
          description: `Full redemption of ${plan.name} (Principal: ₹${totalInvested.toLocaleString("en-IN")}, Returns: ₹${profit.toFixed(2)})`,
          status: "COMPLETED",
          investmentPlanId: planId,
        },
      }),
      // Mark plan as redeemed
      db.investmentPlan.update({
        where: { id: planId },
        data: { 
          status: "REDEEMED",
          currentAmount: 0,
          redeemedAt: new Date(),
        },
      }),
    ]);

    revalidatePath("/portfolio");
    revalidatePath("/wallet");

    return {
      success: true,
      data: {
        principal: totalInvested,
        returns: profit,
        totalRedeemed: currentValue,
        newWalletBalance,
        planName: plan.name,
      },
    };
  } catch (error) {
    console.error("Failed to redeem investment:", error);
    return { success: false, error: error.message };
  }
}
