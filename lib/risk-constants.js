/**
 * Risk Assessment Constants
 * Separated from server actions to avoid function serialization issues
 */

/**
 * Risk assessment questionnaire questions
 */
export const RISK_QUESTIONNAIRE = [
  {
    id: "age",
    question: "What is your age?",
    type: "number",
    weight: 15,
    // Scoring function replaced with bracket-based scoring
    scoringBrackets: [
      { max: 30, score: 100 },
      { max: 40, score: 80 },
      { max: 50, score: 60 },
      { max: 60, score: 40 },
      { max: Infinity, score: 20 },
    ],
  },
  {
    id: "investmentHorizon",
    question: "What is your investment time horizon?",
    type: "select",
    options: [
      { value: 1, label: "Less than 1 year", score: 20 },
      { value: 3, label: "1-3 years", score: 40 },
      { value: 5, label: "3-5 years", score: 60 },
      { value: 10, label: "5-10 years", score: 80 },
      { value: 15, label: "More than 10 years", score: 100 },
    ],
    weight: 20,
  },
  {
    id: "monthlyIncome",
    question: "What is your monthly income (in ₹)?",
    type: "select",
    options: [
      { value: 25000, label: "Less than ₹25,000", score: 30 },
      { value: 50000, label: "₹25,000 - ₹50,000", score: 50 },
      { value: 100000, label: "₹50,000 - ₹1,00,000", score: 70 },
      { value: 200000, label: "₹1,00,000 - ₹2,00,000", score: 85 },
      { value: 500000, label: "More than ₹2,00,000", score: 100 },
    ],
    weight: 15,
  },
  {
    id: "existingInvestments",
    question: "Do you have existing investments (savings, FDs, stocks, MFs)?",
    type: "select",
    options: [
      { value: 0, label: "No investments", score: 20 },
      { value: 100000, label: "Less than ₹1 Lakh", score: 40 },
      { value: 500000, label: "₹1 Lakh - ₹5 Lakh", score: 60 },
      { value: 1000000, label: "₹5 Lakh - ₹10 Lakh", score: 80 },
      { value: 5000000, label: "More than ₹10 Lakh", score: 100 },
    ],
    weight: 10,
  },
  {
    id: "emergencyFund",
    question: "Do you have an emergency fund (3-6 months expenses)?",
    type: "boolean",
    options: [
      { value: true, label: "Yes", score: 100 },
      { value: false, label: "No", score: 30 },
    ],
    weight: 10,
  },
  {
    id: "riskTolerance",
    question: "If your investment dropped 20% in value, what would you do?",
    type: "select",
    options: [
      { value: 1, label: "Sell everything immediately", score: 10 },
      { value: 2, label: "Sell some to reduce risk", score: 30 },
      { value: 3, label: "Hold and wait for recovery", score: 60 },
      { value: 4, label: "Buy more at lower prices", score: 90 },
      { value: 5, label: "Significantly increase investment", score: 100 },
    ],
    weight: 15,
  },
  {
    id: "investmentExperience",
    question: "What is your experience with investing?",
    type: "select",
    options: [
      { value: 1, label: "No experience", score: 20 },
      { value: 2, label: "Basic (FDs, savings)", score: 40 },
      { value: 3, label: "Intermediate (MFs, bonds)", score: 60 },
      { value: 4, label: "Advanced (stocks, options)", score: 80 },
      { value: 5, label: "Expert (derivatives, forex)", score: 100 },
    ],
    weight: 10,
  },
  {
    id: "financialGoal",
    question: "What is your primary financial goal?",
    type: "select",
    options: [
      { value: "capital_preservation", label: "Preserve capital, minimal risk", score: 20 },
      { value: "regular_income", label: "Generate regular income", score: 40 },
      { value: "balanced_growth", label: "Balanced growth and income", score: 60 },
      { value: "capital_growth", label: "Long-term capital growth", score: 80 },
      { value: "aggressive_growth", label: "Maximize returns, high risk ok", score: 100 },
    ],
    weight: 5,
  },
];

/**
 * Helper function to get score from bracket-based questions
 */
export function getScoreFromBrackets(value, brackets) {
  for (const bracket of brackets) {
    if (value < bracket.max) {
      return bracket.score;
    }
  }
  return brackets[brackets.length - 1].score;
}

/**
 * Investment recommendations data
 */
export const INVESTMENT_RECOMMENDATIONS = {
  CONSERVATIVE: {
    description: "Focus on capital preservation with stable returns",
    allocation: {
      FD: 30,
      PPF: 25,
      DEBT_MF: 25,
      GOLD: 10,
      LIQUID_FUND: 10,
    },
    expectedReturn: "6-8%",
    suitableProducts: [
      { name: "Fixed Deposits", risk: "Low", return: "6-7%" },
      { name: "PPF", risk: "Low", return: "7.1%" },
      { name: "Debt Mutual Funds", risk: "Low-Medium", return: "7-9%" },
      { name: "Sovereign Gold Bonds", risk: "Medium", return: "2.5% + Gold appreciation" },
    ],
  },
  MODERATE: {
    description: "Balanced approach with mix of growth and stability",
    allocation: {
      EQUITY_MF: 40,
      DEBT_MF: 25,
      PPF: 15,
      GOLD: 10,
      FD: 10,
    },
    expectedReturn: "10-12%",
    suitableProducts: [
      { name: "Index Funds (Nifty 50)", risk: "Medium", return: "10-12%" },
      { name: "Balanced Advantage Funds", risk: "Medium", return: "9-11%" },
      { name: "Corporate Bond Funds", risk: "Low-Medium", return: "8-10%" },
      { name: "PPF", risk: "Low", return: "7.1%" },
    ],
  },
  AGGRESSIVE: {
    description: "Growth-focused with higher equity exposure",
    allocation: {
      EQUITY_MF: 50,
      STOCKS: 20,
      ELSS: 15,
      GOLD: 10,
      DEBT_MF: 5,
    },
    expectedReturn: "12-15%",
    suitableProducts: [
      { name: "Flexi Cap Funds", risk: "High", return: "12-15%" },
      { name: "Mid Cap Funds", risk: "High", return: "13-16%" },
      { name: "ELSS (Tax Saving)", risk: "High", return: "12-14%" },
      { name: "Blue Chip Stocks", risk: "High", return: "10-15%" },
    ],
  },
  VERY_AGGRESSIVE: {
    description: "Maximum growth potential with significant risk",
    allocation: {
      STOCKS: 40,
      EQUITY_MF: 30,
      SMALL_CAP_MF: 15,
      CRYPTO: 10,
      GOLD: 5,
    },
    expectedReturn: "15-20%+",
    suitableProducts: [
      { name: "Small Cap Funds", risk: "Very High", return: "15-20%" },
      { name: "Sectoral Funds", risk: "Very High", return: "15-25%" },
      { name: "Direct Equity", risk: "Very High", return: "Variable" },
      { name: "Options/Futures", risk: "Very High", return: "Variable" },
    ],
  },
};
