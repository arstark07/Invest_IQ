"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Risk level mapping based on score (score is 0-100)
function getRiskLevelFromScore(score) {
  if (score <= 25) return 'CONSERVATIVE';
  if (score <= 45) return 'MODERATELY_CONSERVATIVE';
  if (score <= 60) return 'MODERATE';
  if (score <= 80) return 'MODERATELY_AGGRESSIVE';
  return 'AGGRESSIVE';
}

// Get user's existing risk profile
export async function getRiskProfile() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const profile = await db.riskProfile.findUnique({
      where: { userId: user.id },
    });

    return {
      success: true,
      profile: profile ? {
        id: profile.id,
        riskLevel: profile.riskLevel,
        riskScore: profile.riskScore,
        assessmentType: profile.assessmentType,
        financialGoal: profile.financialGoal,
        riskTolerance: profile.riskTolerance,
        investmentExperience: profile.investmentExperience,
        updatedAt: profile.updatedAt,
      } : null
    };
  } catch (error) {
    console.error("Error fetching risk profile:", error);
    return { success: false, error: error.message };
  }
}

// Submit questionnaire answers and create/update risk profile
export async function submitRiskQuestionnaire(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const { answers, totalScore } = data;

    // Convert score (0-10) to percentage (0-100)
    const riskScore = Math.round(totalScore * 10);

    // Determine risk level from score
    const riskLevel = getRiskLevelFromScore(riskScore);

    // Extract answer values
    const getAnswerValue = (questionId) => {
      const answer = answers.find(a => a.questionId === questionId);
      return answer?.answer;
    };

    // Create or update risk profile
    const profile = await db.riskProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        riskLevel,
        riskScore,
        assessmentType: "QUESTIONNAIRE",
        financialGoal: getAnswerValue('financial_goal'),
        riskTolerance: answers.find(a => a.questionId === 'risk_tolerance')?.points,
        investmentExperience: answers.find(a => a.questionId === 'investment_experience')?.points,
      },
      update: {
        riskLevel,
        riskScore,
        financialGoal: getAnswerValue('financial_goal'),
        riskTolerance: answers.find(a => a.questionId === 'risk_tolerance')?.points,
        investmentExperience: answers.find(a => a.questionId === 'investment_experience')?.points,
        updatedAt: new Date()
      }
    });

    revalidatePath('/risk-assessment');
    revalidatePath('/portfolio');

    return {
      success: true,
      riskLevel,
      riskScore,
      profileId: profile.id,
      message: `Your risk profile has been set to ${riskLevel.replace(/_/g, ' ').toLowerCase()}`
    };
  } catch (error) {
    console.error("Error submitting questionnaire:", error);
    return { success: false, error: error.message };
  }
}

// Perform AI-driven risk assessment based on transaction history
export async function performAIRiskAssessment() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get user's transaction history
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: sixMonthsAgo }
      },
      include: { account: true }
    });

    // Get account balances
    const accounts = await db.account.findMany({
      where: { userId: user.id }
    });

    // Analyze transaction patterns
    const analysis = analyzeTransactionPatterns(transactions, accounts);

    // Calculate AI-based risk score
    const aiScore = calculateAIRiskScore(analysis);
    const riskLevel = getRiskLevelFromScore(aiScore);

    // Update or create risk profile
    const profile = await db.riskProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        riskLevel,
        riskScore: aiScore,
        investmentHorizon: 'moderate',
        monthlyInvestment: analysis.suggestedMonthlyInvestment
      },
      update: {
        riskLevel,
        riskScore: aiScore,
        monthlyInvestment: analysis.suggestedMonthlyInvestment,
        updatedAt: new Date()
      }
    });

    // Create assessment record
    await db.riskAssessment.create({
      data: {
        profileId: profile.id,
        assessmentType: 'AI_ANALYSIS',
        score: aiScore,
        responses: {
          analysis: analysis,
          method: 'transaction_pattern_analysis',
          dataPoints: transactions.length
        },
        assessedAt: new Date()
      }
    });

    revalidatePath('/risk-assessment');
    revalidatePath('/portfolio');

    return {
      success: true,
      riskLevel,
      riskScore: aiScore,
      analysis: analysis,
      message: `AI analysis complete. Risk level: ${riskLevel.replace(/_/g, ' ').toLowerCase()}`
    };
  } catch (error) {
    console.error("Error performing AI assessment:", error);
    return { success: false, error: error.message };
  }
}

// Analyze transaction patterns for AI risk assessment
function analyzeTransactionPatterns(transactions, accounts) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance.toNumber(), 0);
  
  // Calculate income and expenses
  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount.toNumber(), 0);
  
  const expenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount.toNumber(), 0);

  const monthlyIncome = income / 6;
  const monthlyExpenses = expenses / 6;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Analyze spending patterns
  const categorySpending = {};
  transactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount.toNumber();
    });

  // Calculate spending stability (variance)
  const monthlyExpensesByMonth = {};
  transactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      monthlyExpensesByMonth[month] = (monthlyExpensesByMonth[month] || 0) + t.amount.toNumber();
    });

  const expenseValues = Object.values(monthlyExpensesByMonth);
  const avgExpense = expenseValues.reduce((a, b) => a + b, 0) / (expenseValues.length || 1);
  const variance = expenseValues.reduce((sum, val) => sum + Math.pow(val - avgExpense, 2), 0) / (expenseValues.length || 1);
  const spendingStability = Math.max(0, 100 - Math.sqrt(variance) / avgExpense * 100);

  // Check for discretionary vs essential spending
  const discretionaryCategories = ['entertainment', 'shopping', 'dining', 'travel', 'hobbies'];
  const essentialCategories = ['housing', 'utilities', 'groceries', 'healthcare', 'transportation'];
  
  const discretionarySpending = Object.entries(categorySpending)
    .filter(([cat]) => discretionaryCategories.includes(cat.toLowerCase()))
    .reduce((sum, [, amount]) => sum + amount, 0);
  
  const essentialSpending = Object.entries(categorySpending)
    .filter(([cat]) => essentialCategories.includes(cat.toLowerCase()))
    .reduce((sum, [, amount]) => sum + amount, 0);

  const discretionaryRatio = expenses > 0 ? (discretionarySpending / expenses) * 100 : 0;

  // Emergency fund ratio (balance / monthly expenses)
  const emergencyFundMonths = monthlyExpenses > 0 ? totalBalance / monthlyExpenses : 0;

  // Suggested monthly investment
  const suggestedMonthlyInvestment = Math.max(0, (monthlyIncome - monthlyExpenses) * 0.5);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    spendingStability,
    discretionaryRatio,
    emergencyFundMonths,
    transactionCount: transactions.length,
    suggestedMonthlyInvestment: Math.round(suggestedMonthlyInvestment),
    topCategories: Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount }))
  };
}

// Calculate AI-based risk score from analysis
function calculateAIRiskScore(analysis) {
  let score = 5; // Start at moderate

  // Adjust based on savings rate
  if (analysis.savingsRate > 40) score += 1.5;
  else if (analysis.savingsRate > 25) score += 0.75;
  else if (analysis.savingsRate > 10) score += 0;
  else if (analysis.savingsRate > 0) score -= 0.75;
  else score -= 1.5;

  // Adjust based on emergency fund
  if (analysis.emergencyFundMonths > 12) score += 1;
  else if (analysis.emergencyFundMonths > 6) score += 0.5;
  else if (analysis.emergencyFundMonths > 3) score += 0;
  else if (analysis.emergencyFundMonths > 1) score -= 0.5;
  else score -= 1;

  // Adjust based on spending stability
  if (analysis.spendingStability > 80) score += 0.5;
  else if (analysis.spendingStability < 50) score -= 0.5;

  // Adjust based on discretionary spending
  if (analysis.discretionaryRatio > 40) score += 0.5; // Higher discretionary = can afford risk
  else if (analysis.discretionaryRatio < 10) score -= 0.25;

  // Ensure score is within bounds
  return Math.max(1, Math.min(10, score));
}

// Get investment recommendations based on risk profile
export async function getInvestmentRecommendations() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const profile = await db.riskProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      return {
        success: false,
        error: "Please complete risk assessment first",
        needsAssessment: true
      };
    }

    const recommendations = getRecommendationsForRiskLevel(profile.riskLevel);

    return {
      success: true,
      riskLevel: profile.riskLevel,
      riskScore: profile.riskScore,
      recommendations
    };
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return { success: false, error: error.message };
  }
}

// Get specific recommendations based on risk level
function getRecommendationsForRiskLevel(riskLevel) {
  const recommendations = {
    CONSERVATIVE: {
      allocation: {
        equity: 20,
        debt: 60,
        gold: 10,
        cash: 10
      },
      products: [
        { name: "Bank Fixed Deposits", percentage: 30, reason: "Guaranteed returns with capital safety" },
        { name: "Debt Mutual Funds", percentage: 30, reason: "Better tax efficiency than FDs" },
        { name: "Government Securities/PPF", percentage: 20, reason: "Sovereign guarantee with tax benefits" },
        { name: "Large Cap Index Funds", percentage: 10, reason: "Stable equity exposure" },
        { name: "Gold ETFs/Sovereign Gold Bonds", percentage: 10, reason: "Hedge against inflation" }
      ],
      sipRecommendation: "Start with 70% in debt funds, 20% in large cap index, 10% in gold",
      expectedReturns: "6-8% annually",
      volatility: "Low"
    },
    MODERATELY_CONSERVATIVE: {
      allocation: {
        equity: 35,
        debt: 50,
        gold: 10,
        cash: 5
      },
      products: [
        { name: "Hybrid/Balanced Mutual Funds", percentage: 35, reason: "Automatic asset allocation" },
        { name: "Short-term Debt Funds", percentage: 25, reason: "Better liquidity with decent returns" },
        { name: "Large Cap Equity Funds", percentage: 20, reason: "Blue-chip company exposure" },
        { name: "PPF/NPS", percentage: 10, reason: "Long-term tax-saving instruments" },
        { name: "Gold ETFs", percentage: 10, reason: "Portfolio diversification" }
      ],
      sipRecommendation: "50% hybrid funds, 30% debt funds, 20% large cap equity",
      expectedReturns: "8-10% annually",
      volatility: "Low to Moderate"
    },
    MODERATE: {
      allocation: {
        equity: 50,
        debt: 35,
        gold: 10,
        cash: 5
      },
      products: [
        { name: "Flexi-cap Mutual Funds", percentage: 30, reason: "Flexibility across market caps" },
        { name: "Large & Mid Cap Funds", percentage: 20, reason: "Growth with stability" },
        { name: "Corporate Bond Funds", percentage: 25, reason: "Better yields than government securities" },
        { name: "ELSS Tax Saver Funds", percentage: 15, reason: "Tax saving with equity growth" },
        { name: "Gold/Multi-Asset Funds", percentage: 10, reason: "Diversification" }
      ],
      sipRecommendation: "40% flexi-cap, 20% mid cap, 30% debt, 10% gold",
      expectedReturns: "10-12% annually",
      volatility: "Moderate"
    },
    MODERATELY_AGGRESSIVE: {
      allocation: {
        equity: 65,
        debt: 25,
        gold: 7,
        cash: 3
      },
      products: [
        { name: "Mid Cap Mutual Funds", percentage: 30, reason: "Higher growth potential" },
        { name: "Small Cap Funds", percentage: 15, reason: "Maximum growth opportunity" },
        { name: "Flexi-cap Funds", percentage: 20, reason: "Active management across caps" },
        { name: "Dynamic Bond Funds", percentage: 20, reason: "Interest rate opportunity" },
        { name: "International Equity Funds", percentage: 15, reason: "Global diversification" }
      ],
      sipRecommendation: "50% mid/small cap, 25% flexi-cap, 15% debt, 10% international",
      expectedReturns: "12-15% annually",
      volatility: "Moderate to High"
    },
    AGGRESSIVE: {
      allocation: {
        equity: 80,
        debt: 12,
        gold: 5,
        cash: 3
      },
      products: [
        { name: "Small Cap Funds", percentage: 30, reason: "Maximum growth potential" },
        { name: "Mid Cap Funds", percentage: 25, reason: "Strong growth companies" },
        { name: "Sectoral/Thematic Funds", percentage: 15, reason: "High conviction bets" },
        { name: "International/US Equity", percentage: 15, reason: "Global tech & growth" },
        { name: "Liquid Funds", percentage: 15, reason: "Tactical deployment" }
      ],
      sipRecommendation: "60% small/mid cap, 20% sectoral, 20% international equity",
      expectedReturns: "15-18% annually",
      volatility: "High"
    }
  };

  return recommendations[riskLevel] || recommendations.MODERATE;
}
