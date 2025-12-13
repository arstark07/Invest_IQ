"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  RISK_QUESTIONNAIRE, 
  INVESTMENT_RECOMMENDATIONS, 
  getScoreFromBrackets 
} from "./risk-constants";

/**
 * Risk Assessment System
 * - Questionnaire-based for new users
 * - AI-driven analysis for experienced users (based on transaction history)
 * 
 * Note: Import RISK_QUESTIONNAIRE directly from "./risk-constants" for client components
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Calculate risk score from questionnaire answers
 */
export async function calculateRiskScore(answers) {
  let totalScore = 0;
  let totalWeight = 0;

  RISK_QUESTIONNAIRE.forEach((q) => {
    const answer = answers[q.id];
    if (answer === undefined || answer === null) return;

    let score;
    if (q.scoringBrackets) {
      // Use bracket-based scoring for numeric inputs like age
      score = getScoreFromBrackets(answer, q.scoringBrackets);
    } else {
      const option = q.options?.find((o) => o.value === answer || o.value.toString() === answer.toString());
      score = option?.score || 50;
    }

    totalScore += score * q.weight;
    totalWeight += q.weight;
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
}

/**
 * Get risk level from score
 */
export async function getRiskLevelFromScore(score) {
  if (score <= 25) return "CONSERVATIVE";
  if (score <= 40) return "MODERATELY_CONSERVATIVE";
  if (score <= 60) return "MODERATE";
  if (score <= 80) return "MODERATELY_AGGRESSIVE";
  return "AGGRESSIVE";
}

/**
 * Submit questionnaire and create/update risk profile
 */
export async function submitRiskQuestionnaire(passedUserId, answers) {
  try {
    // Get userId from auth if not passed
    let userId = passedUserId;
    if (!userId) {
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) throw new Error("Unauthorized");
      
      const user = await db.user.findUnique({
        where: { clerkUserId },
      });
      if (!user) throw new Error("User not found");
      userId = user.id;
    }

    const riskScore = await calculateRiskScore(answers);
    const riskLevel = await getRiskLevelFromScore(riskScore);

    const profile = await db.riskProfile.upsert({
      where: { userId },
      create: {
        userId,
        riskLevel,
        riskScore,
        assessmentType: "QUESTIONNAIRE",
        age: answers.age,
        monthlyIncome: answers.monthlyIncome,
        monthlyExpenses: answers.monthlyExpenses,
        existingInvestments: answers.existingInvestments,
        investmentHorizon: answers.investmentHorizon,
        financialGoal: answers.financialGoal,
        riskTolerance: answers.riskTolerance,
        investmentExperience: answers.investmentExperience,
        emergencyFund: answers.emergencyFund,
        dependents: answers.dependents,
      },
      update: {
        riskLevel,
        riskScore,
        age: answers.age,
        monthlyIncome: answers.monthlyIncome,
        monthlyExpenses: answers.monthlyExpenses,
        existingInvestments: answers.existingInvestments,
        investmentHorizon: answers.investmentHorizon,
        financialGoal: answers.financialGoal,
        riskTolerance: answers.riskTolerance,
        investmentExperience: answers.investmentExperience,
        emergencyFund: answers.emergencyFund,
        dependents: answers.dependents,
        updatedAt: new Date(),
      },
    });

    // Convert Decimal fields to numbers for client compatibility
    const serializedProfile = {
      id: profile.id,
      userId: profile.userId,
      riskLevel: profile.riskLevel,
      riskScore: profile.riskScore,
      assessmentType: profile.assessmentType,
      age: profile.age,
      monthlyIncome: profile.monthlyIncome ? Number(profile.monthlyIncome) : null,
      monthlyExpenses: profile.monthlyExpenses ? Number(profile.monthlyExpenses) : null,
      existingInvestments: profile.existingInvestments ? Number(profile.existingInvestments) : null,
      investmentHorizon: profile.investmentHorizon,
      financialGoal: profile.financialGoal,
      riskTolerance: profile.riskTolerance,
      investmentExperience: profile.investmentExperience,
      emergencyFund: profile.emergencyFund,
      dependents: profile.dependents,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    return {
      success: true,
      data: {
        riskScore,
        riskLevel,
        profile: serializedProfile,
        recommendations: await getInvestmentRecommendations(riskLevel),
      },
    };
  } catch (error) {
    console.error("Failed to submit questionnaire:", error);
    return { success: false, error: error.message };
  }
}

// ==================== AI-DRIVEN ANALYSIS ====================

/**
 * Check if user has enough data for AI analysis
 */
export async function canPerformAiAnalysis(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactionCount = await db.transaction.count({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Require at least 20 transactions in last 30 days for AI analysis
  return transactionCount >= 20;
}

/**
 * Perform AI-driven risk analysis based on spending patterns
 */
export async function performAiRiskAnalysis(userId) {
  try {
    // Check if eligible for AI analysis
    const canAnalyze = await canPerformAiAnalysis(userId);
    if (!canAnalyze) {
      return {
        success: false,
        error: "Insufficient transaction history for AI analysis. Need at least 20 transactions in the last 30 days.",
      };
    }

    // Get user's transaction data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const transactions = await db.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: ninetyDaysAgo },
      },
      orderBy: { date: "desc" },
    });

    const accounts = await db.account.findMany({
      where: { userId },
    });

    const existingProfile = await db.riskProfile.findUnique({
      where: { userId },
    });

    // Analyze spending patterns
    const analysis = analyzeSpendingPatterns(transactions, accounts);

    // Generate AI recommendations
    const aiRecommendations = await generateAiRecommendations(
      analysis,
      existingProfile
    );

    // Calculate AI-driven scores
    const spendingPatternScore = calculateSpendingPatternScore(analysis);
    const savingsConsistencyScore = calculateSavingsConsistencyScore(analysis);
    const incomeStabilityScore = calculateIncomeStabilityScore(analysis);

    // Calculate combined AI risk score
    const aiRiskScore = Math.round(
      (spendingPatternScore * 0.3) +
      (savingsConsistencyScore * 0.4) +
      (incomeStabilityScore * 0.3)
    );

    // Determine assessment type
    const assessmentType = existingProfile?.riskScore
      ? "HYBRID"
      : "AI_DRIVEN";

    // Calculate final risk score (blend questionnaire and AI if both available)
    let finalRiskScore = aiRiskScore;
    if (existingProfile?.riskScore && assessmentType === "HYBRID") {
      // 60% AI, 40% questionnaire for hybrid
      finalRiskScore = Math.round(
        (aiRiskScore * 0.6) + (existingProfile.riskScore * 0.4)
      );
    }

    const riskLevel = getRiskLevelFromScore(finalRiskScore);

    // Update profile with AI analysis
    const updatedProfile = await db.riskProfile.upsert({
      where: { userId },
      create: {
        userId,
        riskLevel,
        riskScore: finalRiskScore,
        assessmentType,
        spendingPatternScore,
        savingsConsistencyScore,
        incomeStabilityScore,
        lastAiAnalysis: new Date(),
        aiRecommendations,
      },
      update: {
        riskLevel,
        riskScore: finalRiskScore,
        assessmentType,
        spendingPatternScore,
        savingsConsistencyScore,
        incomeStabilityScore,
        lastAiAnalysis: new Date(),
        aiRecommendations,
      },
    });

    return {
      success: true,
      data: {
        riskScore: finalRiskScore,
        riskLevel,
        spendingPatternScore,
        savingsConsistencyScore,
        incomeStabilityScore,
        analysis,
        recommendations: aiRecommendations,
        assessmentType,
      },
    };
  } catch (error) {
    console.error("AI risk analysis failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze spending patterns from transactions
 */
function analyzeSpendingPatterns(transactions, accounts) {
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0
  );

  // Categorize transactions
  const income = transactions.filter((t) => t.type === "INCOME");
  const expenses = transactions.filter((t) => t.type === "EXPENSE");

  // Calculate monthly averages
  const monthlyIncome = income.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  ) / 3; // 90 days = ~3 months

  const monthlyExpenses = expenses.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  ) / 3;

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  // Category breakdown
  const categorySpending = {};
  expenses.forEach((t) => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount);
  });

  // Find essential vs discretionary spending
  const essentialCategories = ["housing", "utilities", "groceries", "healthcare", "insurance", "education"];
  const discretionaryCategories = ["entertainment", "dining", "shopping", "travel", "subscriptions"];

  const essentialSpending = Object.entries(categorySpending)
    .filter(([cat]) => essentialCategories.some((e) => cat.toLowerCase().includes(e)))
    .reduce((sum, [, amount]) => sum + amount, 0);

  const discretionarySpending = Object.entries(categorySpending)
    .filter(([cat]) => discretionaryCategories.some((d) => cat.toLowerCase().includes(d)))
    .reduce((sum, [, amount]) => sum + amount, 0);

  // Income consistency (standard deviation of monthly income)
  const incomeByMonth = {};
  income.forEach((t) => {
    const month = t.date.toISOString().slice(0, 7);
    incomeByMonth[month] = (incomeByMonth[month] || 0) + parseFloat(t.amount);
  });
  const monthlyIncomes = Object.values(incomeByMonth);
  const avgMonthlyIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length || 0;
  const incomeVariance = monthlyIncomes.length > 1
    ? monthlyIncomes.reduce((sum, inc) => sum + Math.pow(inc - avgMonthlyIncome, 2), 0) / monthlyIncomes.length
    : 0;
  const incomeStdDev = Math.sqrt(incomeVariance);
  const incomeConsistency = avgMonthlyIncome > 0
    ? Math.max(0, 100 - (incomeStdDev / avgMonthlyIncome) * 100)
    : 50;

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    categorySpending,
    essentialSpending,
    discretionarySpending,
    essentialRatio: monthlyExpenses > 0 ? (essentialSpending / (3 * monthlyExpenses)) * 100 : 0,
    incomeConsistency,
    transactionCount: transactions.length,
    hasRecurringIncome: income.some((t) => t.isRecurring),
    emergencyFundMonths: monthlyExpenses > 0 ? totalBalance / monthlyExpenses : 0,
  };
}

/**
 * Calculate spending pattern score (higher = more disciplined = can take more risk)
 */
function calculateSpendingPatternScore(analysis) {
  let score = 50; // Base score

  // Savings rate impact (0-30 points)
  if (analysis.savingsRate >= 30) score += 30;
  else if (analysis.savingsRate >= 20) score += 20;
  else if (analysis.savingsRate >= 10) score += 10;
  else if (analysis.savingsRate < 0) score -= 20;

  // Essential vs discretionary ratio impact (0-20 points)
  if (analysis.essentialRatio >= 70) score += 10;
  else if (analysis.essentialRatio >= 50) score += 20;
  else score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate savings consistency score
 */
function calculateSavingsConsistencyScore(analysis) {
  let score = 50;

  // Emergency fund impact (0-30 points)
  if (analysis.emergencyFundMonths >= 6) score += 30;
  else if (analysis.emergencyFundMonths >= 3) score += 20;
  else if (analysis.emergencyFundMonths >= 1) score += 10;
  else score -= 10;

  // Savings rate consistency (0-20 points)
  if (analysis.savingsRate >= 20) score += 20;
  else if (analysis.savingsRate >= 10) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate income stability score
 */
function calculateIncomeStabilityScore(analysis) {
  let score = analysis.incomeConsistency;

  // Bonus for recurring income
  if (analysis.hasRecurringIncome) score += 10;

  // Penalty for very low income relative to expenses
  if (analysis.monthlyIncome < analysis.monthlyExpenses) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate AI recommendations using Gemini
 */
async function generateAiRecommendations(analysis, existingProfile) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As a financial advisor AI, analyze this user's financial data and provide personalized recommendations:

Financial Analysis:
- Monthly Income: ₹${analysis.monthlyIncome.toFixed(0)}
- Monthly Expenses: ₹${analysis.monthlyExpenses.toFixed(0)}
- Savings Rate: ${analysis.savingsRate.toFixed(1)}%
- Total Balance: ₹${analysis.totalBalance.toFixed(0)}
- Emergency Fund: ${analysis.emergencyFundMonths.toFixed(1)} months of expenses
- Income Consistency: ${analysis.incomeConsistency.toFixed(0)}%
- Essential Spending Ratio: ${analysis.essentialRatio.toFixed(1)}%

User's Profile (if available):
- Age: ${existingProfile?.age || "Not specified"}
- Investment Horizon: ${existingProfile?.investmentHorizon || "Not specified"} years
- Financial Goal: ${existingProfile?.financialGoal || "Not specified"}

Provide a JSON response with:
1. "riskAssessment": Brief assessment of their risk capacity
2. "immediateActions": Array of 3 immediate steps they should take
3. "investmentSuggestions": Array of investment options suitable for them (include type, allocation %, and reason)
4. "warnings": Array of any financial concerns
5. "optimisticScenario": Expected returns if they follow recommendations (1, 3, 5 years)

Respond ONLY with valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      riskAssessment: "Unable to generate detailed assessment",
      immediateActions: ["Build emergency fund", "Track expenses", "Start SIP"],
      investmentSuggestions: [],
      warnings: [],
      optimisticScenario: {},
    };
  } catch (error) {
    console.error("AI recommendations generation failed:", error);
    return {
      riskAssessment: "Assessment pending",
      immediateActions: ["Complete risk questionnaire", "Connect bank accounts"],
      investmentSuggestions: [],
      warnings: [],
      optimisticScenario: {},
    };
  }
}

// ==================== INVESTMENT RECOMMENDATIONS ====================

/**
 * Get investment allocation recommendations based on risk level
 */
export async function getInvestmentRecommendations(riskLevel) {
  return INVESTMENT_RECOMMENDATIONS[riskLevel] || INVESTMENT_RECOMMENDATIONS.MODERATE;
}

/**
 * Serialize profile to convert Decimal to numbers
 */
function serializeProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.userId,
    riskLevel: profile.riskLevel,
    riskScore: profile.riskScore,
    assessmentType: profile.assessmentType,
    age: profile.age,
    monthlyIncome: profile.monthlyIncome ? Number(profile.monthlyIncome) : null,
    monthlyExpenses: profile.monthlyExpenses ? Number(profile.monthlyExpenses) : null,
    existingInvestments: profile.existingInvestments ? Number(profile.existingInvestments) : null,
    investmentHorizon: profile.investmentHorizon,
    financialGoal: profile.financialGoal,
    riskTolerance: profile.riskTolerance,
    investmentExperience: profile.investmentExperience,
    emergencyFund: profile.emergencyFund,
    dependents: profile.dependents,
    spendingPatternScore: profile.spendingPatternScore,
    savingsConsistencyScore: profile.savingsConsistencyScore,
    incomeStabilityScore: profile.incomeStabilityScore,
    lastAiAnalysis: profile.lastAiAnalysis,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Get user's risk profile
 */
export async function getUserRiskProfile(passedUserId) {
  try {
    // Get userId from auth if not passed
    let odlUserId = passedUserId;
    if (!odlUserId) {
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) throw new Error("Unauthorized");
      
      const user = await db.user.findUnique({
        where: { clerkUserId },
      });
      if (!user) throw new Error("User not found");
      odlUserId = user.id;
    }

    const profile = await db.riskProfile.findUnique({
      where: { userId: odlUserId },
    });

    if (!profile) {
      return {
        success: true,
        data: {
          hasProfile: false,
          needsQuestionnaire: true,
        },
      };
    }

    // Check if AI analysis is available/needed
    const canDoAiAnalysis = await canPerformAiAnalysis(odlUserId);
    const needsAiUpdate = profile.lastAiAnalysis
      ? new Date() - profile.lastAiAnalysis > 7 * 24 * 60 * 60 * 1000 // 7 days
      : canDoAiAnalysis;

    return {
      success: true,
      data: {
        hasProfile: true,
        profile: serializeProfile(profile),
        recommendations: await getInvestmentRecommendations(profile.riskLevel),
        canDoAiAnalysis,
        needsAiUpdate,
      },
    };
  } catch (error) {
    console.error("Failed to get risk profile:", error);
    return { success: false, error: error.message };
  }
}
