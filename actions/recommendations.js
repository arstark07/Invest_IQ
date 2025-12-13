"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function getAccountRecommendations(riskLevel = "moderate") {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("User not authenticated");
      return { success: false, recommendations: [], error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      console.error("User not found in database");
      return { success: false, recommendations: [], error: "User not found" };
    }

    // Get all accounts with their financial data
    const accounts = await db.account.findMany({
      where: { userId: user.id },
    });

    if (accounts.length === 0) {
      return { success: true, recommendations: [] };
    }

    // Get transactions from last 3 months for analysis
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: threeMonthsAgo },
      },
      include: { account: true },
    });

    // Generate recommendations for each account
    const recommendations = await Promise.all(
      accounts.map(async (account) => {
        try {
          const accountTransactions = transactions.filter(
            (t) => t.accountId === account.id
          );

          const accountIncome = accountTransactions
            .filter((t) => t.type === "INCOME")
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);

          const accountExpenses = accountTransactions
            .filter((t) => t.type === "EXPENSE")
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);

          // Get top spending categories
          const categorySpending = {};
          accountTransactions
            .filter((t) => t.type === "EXPENSE")
            .forEach((t) => {
              categorySpending[t.category] =
                (categorySpending[t.category] || 0) + t.amount.toNumber();
            });

          const topCategories = Object.entries(categorySpending)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([category]) => category);

          const monthlyIncome = (accountIncome / 3).toFixed(2);
          const monthlyExpenses = (accountExpenses / 3).toFixed(2);
          const balance = account.balance.toNumber();

          // Generate AI recommendation for this account based on risk level
          const recommendation = await generateAccountRecommendation({
            accountName: account.name,
            accountType: account.type,
            balance,
            monthlyIncome,
            monthlyExpenses,
            topCategories,
            transactionCount: accountTransactions.length,
            riskLevel,
          });

          return {
            accountId: account.id,
            accountName: account.name,
            accountType: account.type,
            balance: balance.toFixed(2),
            recommendation,
            riskLevel,
          };
        } catch (accountError) {
          console.error(`Error generating recommendation for account ${account.id}:`, accountError);
          return {
            accountId: account.id,
            accountName: account.name,
            accountType: account.type,
            balance: account.balance.toFixed(2),
            recommendation: "Unable to generate recommendation at this time. Please try again later.",
            riskLevel,
          };
        }
      })
    );

    return { success: true, recommendations };
  } catch (error) {
    console.error("Error getting account recommendations:", error);
    return { success: false, recommendations: [], error: error.message };
  }
}

async function generateAccountRecommendation(accountData) {
  try {
    const riskDescriptions = {
      conservative: "Low risk, capital preservation focused, stable returns",
      moderate: "Balanced approach, mix of growth and stability",
      aggressive: "High risk tolerance, growth focused, willing to accept volatility",
    };

    const prompt = `You are an expert financial advisor. Analyze this account and provide a structured investment recommendation based on the user's risk tolerance.

Account Details:
- Name: ${accountData.accountName}
- Type: ${accountData.accountType}
- Current Balance: $${accountData.balance}
- Monthly Income: $${accountData.monthlyIncome}
- Monthly Expenses: $${accountData.monthlyExpenses}
- Top Spending: ${accountData.topCategories.join(", ") || "None"}
- Activity: ${accountData.transactionCount} transactions (last 3 months)

User Risk Profile: ${accountData.riskLevel.toUpperCase()}
${riskDescriptions[accountData.riskLevel.toLowerCase()]}

Based on this ${accountData.riskLevel} risk profile, provide a STRUCTURED recommendation in this EXACT format:

💰 Recommended Investment: [Specific investment type matching the risk profile]

📊 Suggested Allocation: [Specific amount or percentage]

📈 Expected Return: [Return expectation based on risk level]

✅ Reasoning: [2 sentences explaining why this matches the account balance, spending pattern, AND risk tolerance]

⚠️ Risk Level: ${accountData.riskLevel.toUpperCase()}

Use this exact format with these exact emojis. Keep it concise and actionable.`;

    // Use OpenRouter API (OpenAI-compatible)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert financial advisor." },
          { role: "user", content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter API Error");
      return "Unable to generate recommendation at this time. Please try again later.";
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;

    return (
      aiResponse ||
      "Consider consulting a financial advisor for personalized investment advice."
    );
  } catch (error) {
    console.error("Error generating recommendation:", error);
    return "Recommendation unavailable. Please check your account activity and try again.";
  }
}
