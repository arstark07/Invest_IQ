"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { subDays, addMonths, subMonths } from "date-fns";

// Categories with their typical amount ranges and merchants (INR)
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [50000, 150000], merchants: ["Company Payroll", "ABC Corp", "TechSoft Inc", "Infosys Ltd"] },
    { name: "freelance", range: [10000, 50000], merchants: ["Upwork", "Fiverr", "Direct Client", "Freelancer.com"] },
    { name: "investments", range: [5000, 25000], merchants: ["Zerodha", "Groww", "ICICI Direct", "Dividend Income"] },
    { name: "other-income", range: [1000, 10000], merchants: ["Rental Income", "Interest", "Cashback", "Gift"] },
  ],
  EXPENSE: [
    { name: "housing", range: [15000, 35000], merchants: ["Rent Payment", "Society Maintenance", "Home Loan EMI"] },
    { name: "transportation", range: [2000, 8000], merchants: ["Uber", "Ola", "Petrol Pump", "Metro Card", "Rapido"] },
    { name: "groceries", range: [3000, 12000], merchants: ["BigBasket", "Zepto", "D-Mart", "Blinkit", "JioMart"] },
    { name: "utilities", range: [1500, 5000], merchants: ["Electricity Bill", "Gas Bill", "Water Bill", "Jio Fiber", "Airtel"] },
    { name: "entertainment", range: [500, 3000], merchants: ["Netflix", "Spotify", "PVR Cinemas", "BookMyShow", "Hotstar"] },
    { name: "food", range: [2000, 8000], merchants: ["Swiggy", "Zomato", "Starbucks", "Dominos", "McDonald's"] },
    { name: "shopping", range: [2000, 15000], merchants: ["Amazon", "Flipkart", "Myntra", "Croma", "Reliance Digital"] },
    { name: "healthcare", range: [500, 10000], merchants: ["Apollo Pharmacy", "1mg", "Hospital Visit", "PharmEasy"] },
    { name: "education", range: [2000, 20000], merchants: ["Coursera", "Udemy", "Book Store", "Unacademy"] },
    { name: "travel", range: [5000, 30000], merchants: ["MakeMyTrip", "IRCTC", "IndiGo", "OYO Rooms"] },
  ],
};

// Helper functions
function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = getRandomItem(categories);
  const amount = getRandomAmount(category.range[0], category.range[1]);
  const merchant = getRandomItem(category.merchants);
  return { category: category.name, amount, merchant };
}

// Main seed function for current user
export async function seedUserTransactions() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized - Please sign in");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) throw new Error("User not found in database");

    let account = user.accounts.find((a) => a.isDefault) || user.accounts[0];
    
    if (!account) {
      // Create default account if none exists
      account = await db.account.create({
        data: {
          name: "Main Account",
          type: "CURRENT",
          balance: 100000,
          isDefault: true,
          userId: user.id,
        },
      });
    }

    // Generate 6 months of transactions
    const transactions = [];
    let runningBalance = 50000;

    for (let i = 180; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayOfWeek = date.getDay();
      
      // More transactions on weekdays
      const baseTransactions = dayOfWeek === 0 || dayOfWeek === 6 ? 2 : 3;
      const transactionsPerDay = Math.floor(Math.random() * 3) + baseTransactions;

      for (let j = 0; j < transactionsPerDay; j++) {
        // Income more likely at start of month (salary)
        const dayOfMonth = date.getDate();
        const isIncomeDay = dayOfMonth <= 5 || dayOfMonth === 15;
        const incomeChance = isIncomeDay ? 0.5 : 0.2;
        
        const type = Math.random() < incomeChance ? "INCOME" : "EXPENSE";
        const { category, amount, merchant } = getRandomCategory(type);

        transactions.push({
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${type === "INCOME" ? "Received from" : "Payment to"} ${merchant}`,
          merchant,
          date,
          category,
          status: "COMPLETED",
          userId: user.id,
          accountId: account.id,
          isRecurring: category === "salary" || category === "housing" || Math.random() < 0.05,
          createdAt: date,
          updatedAt: date,
        });

        runningBalance += type === "INCOME" ? amount : -amount;
      }
    }

    // Execute database operations
    await db.$transaction(async (tx) => {
      // Clear existing transactions
      await tx.transaction.deleteMany({
        where: { accountId: account.id },
      });

      // Insert new transactions
      await tx.transaction.createMany({
        data: transactions,
      });

      // Update account balance to a healthy amount
      await tx.account.update({
        where: { id: account.id },
        data: { balance: Math.max(runningBalance, 125000) },
      });
    });

    return {
      success: true,
      message: `✅ Created ${transactions.length} transactions over 6 months!`,
    };
  } catch (error) {
    console.error("Seed error:", error);
    return { success: false, error: error.message };
  }
}

// Seed savings goals
export async function seedSavingsGoals() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const goals = [
      {
        userId: user.id,
        name: "Emergency Fund",
        targetAmount: 300000,
        currentAmount: 175000,
        deadline: addMonths(new Date(), 6),
        category: "Emergency",
        autoSaveEnabled: true,
        autoSaveAmount: 15000,
        autoSaveFrequency: "MONTHLY",
        status: "ACTIVE",
      },
      {
        userId: user.id,
        name: "Vacation to Europe",
        targetAmount: 500000,
        currentAmount: 125000,
        deadline: addMonths(new Date(), 12),
        category: "Vacation",
        autoSaveEnabled: true,
        autoSaveAmount: 25000,
        autoSaveFrequency: "MONTHLY",
        status: "ACTIVE",
      },
      {
        userId: user.id,
        name: "New Laptop",
        targetAmount: 150000,
        currentAmount: 98000,
        deadline: addMonths(new Date(), 3),
        category: "Shopping",
        status: "ACTIVE",
      },
      {
        userId: user.id,
        name: "Home Renovation",
        targetAmount: 200000,
        currentAmount: 200000,
        deadline: subMonths(new Date(), 1),
        category: "Home",
        status: "COMPLETED",
        completedAt: subMonths(new Date(), 1),
      },
    ];

    await db.$transaction(async (tx) => {
      await tx.savingsGoal.deleteMany({ where: { userId: user.id } });
      await tx.savingsGoal.createMany({ data: goals });
    });

    return { success: true, message: "✅ Created 4 savings goals!" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Seed budget
export async function seedBudget() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    await db.budget.upsert({
      where: {
        userId_createdAt: {
          userId: user.id,
          createdAt: currentMonth,
        },
      },
      update: { amount: 75000 },
      create: {
        userId: user.id,
        amount: 75000,
        createdAt: currentMonth,
      },
    });

    return { success: true, message: "✅ Budget set to ₹75,000!" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Seed everything at once
export async function seedAllData() {
  try {
    const results = await Promise.all([
      seedUserTransactions(),
      seedSavingsGoals(),
      seedBudget(),
    ]);

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return { success: false, error: failed.map((f) => f.error).join(", ") };
    }

    return {
      success: true,
      message: `✅ All data seeded successfully!
        - 6 months of transactions
        - 4 savings goals
        - Monthly budget set`,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
