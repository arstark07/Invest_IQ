// Investment Calculator - Optimized Utility Library
// Provides calculation functions for various Indian investment schemes

export const INVESTMENT_SCHEMES = {
  SIP: {
    id: "sip",
    name: "SIP Calculator",
    description: "Systematic Investment Plan - Regular monthly investments",
    category: "market",
    minAmount: 500,
    maxAmount: 100000,
    defaultRate: 12,
  },
  FD: {
    id: "fd",
    name: "Fixed Deposit",
    description: "Fixed Deposits with compound interest",
    category: "fixed",
    minAmount: 1000,
    maxAmount: 10000000,
    defaultRate: 7,
  },
  RD: {
    id: "rd",
    name: "Recurring Deposit",
    description: "Monthly deposits with guaranteed returns",
    category: "fixed",
    minAmount: 100,
    maxAmount: 100000,
    defaultRate: 6.5,
  },
  MF: {
    id: "mf",
    name: "Mutual Fund (Lumpsum)",
    description: "Lump sum mutual fund investment",
    category: "market",
    minAmount: 5000,
    maxAmount: 10000000,
    defaultRate: 12,
  },
  STOCK: {
    id: "stock",
    name: "Stock Investment",
    description: "Stock investment with custom growth rate",
    category: "market",
    minAmount: 1000,
    maxAmount: 10000000,
    defaultRate: 15,
  },
  PPF: {
    id: "ppf",
    name: "PPF",
    description: "Public Provident Fund - Tax-saving (7.1% p.a.)",
    category: "government",
    minAmount: 500,
    maxAmount: 150000,
    fixedRate: 7.1,
    minTenure: 15,
  },
  SCSS: {
    id: "scss",
    name: "SCSS",
    description: "Senior Citizen Savings Scheme (8.2% p.a.)",
    category: "government",
    minAmount: 1000,
    maxAmount: 3000000,
    fixedRate: 8.2,
    fixedTenure: 5,
  },
  KVP: {
    id: "kvp",
    name: "KVP",
    description: "Kisan Vikas Patra - Doubles in 115 months (7.5% p.a.)",
    category: "government",
    minAmount: 1000,
    fixedRate: 7.5,
    fixedTenure: 9.58,
  },
  NSC: {
    id: "nsc",
    name: "NSC",
    description: "National Savings Certificate - 5 years (7.7% p.a.)",
    category: "government",
    minAmount: 1000,
    fixedRate: 7.7,
    fixedTenure: 5,
  },
  SSY: {
    id: "ssy",
    name: "Sukanya Samriddhi",
    description: "Girl child savings - 21 years (8.2% p.a.)",
    category: "government",
    minAmount: 250,
    maxAmount: 150000,
    fixedRate: 8.2,
    depositYears: 15,
    maturityYears: 21,
  },
  SB: {
    id: "sb",
    name: "Savings Account",
    description: "Regular savings with quarterly interest (3.5% p.a.)",
    category: "fixed",
    minAmount: 1000,
    fixedRate: 3.5,
  },
};

// Government scheme interest rates (FY 2024-25)
export const GOVERNMENT_RATES = {
  PPF: 7.1,
  SCSS: 8.2,
  KVP: 7.5,
  NSC: 7.7,
  SSY: 8.2,
  SB: 3.5,
};

// Precision utilities
const round = (value, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const roundInt = (value) => Math.round(value);

// Format currency in Indian format
export const formatCurrency = (amount, showSymbol = true) => {
  return new Intl.NumberFormat("en-IN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format large numbers compactly
export const formatCompact = (amount) => {
  if (amount >= 10000000) return `${round(amount / 10000000)} Cr`;
  if (amount >= 100000) return `${round(amount / 100000)} L`;
  if (amount >= 1000) return `${round(amount / 1000)} K`;
  return formatCurrency(amount);
};

// Calculate absolute return percentage
export const calculateAbsoluteReturn = (invested, maturity) => {
  if (invested <= 0) return 0;
  return round(((maturity - invested) / invested) * 100);
};

// Calculate CAGR
export const calculateCAGR = (initial, final, years) => {
  if (initial <= 0 || years <= 0) return 0;
  return round((Math.pow(final / initial, 1 / years) - 1) * 100);
};

// SIP Calculator
export const calculateSIP = (monthlyInvestment, rateOfReturn, years) => {
  const months = years * 12;
  const monthlyRate = rateOfReturn / 12 / 100;
  
  const futureValue = monthlyInvestment *
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  
  const totalInvested = monthlyInvestment * months;
  const returns = futureValue - totalInvested;
  
  return {
    totalInvested: roundInt(totalInvested),
    returns: roundInt(returns),
    maturityAmount: roundInt(futureValue),
    absoluteReturn: calculateAbsoluteReturn(totalInvested, futureValue),
  };
};

// Fixed Deposit Calculator
export const calculateFD = (principal, rateOfReturn, years, compoundFrequency = 4) => {
  const rate = rateOfReturn / 100;
  const maturityAmount = principal * Math.pow(1 + rate / compoundFrequency, compoundFrequency * years);
  const returns = maturityAmount - principal;
  
  return {
    totalInvested: roundInt(principal),
    returns: roundInt(returns),
    maturityAmount: roundInt(maturityAmount),
  };
};

// Recurring Deposit Calculator
export const calculateRD = (monthlyDeposit, rateOfReturn, years) => {
  const months = years * 12;
  const quarterlyRate = rateOfReturn / 4 / 100;
  
  let maturityAmount = 0;
  for (let i = 1; i <= months; i++) {
    const quartersRemaining = Math.ceil((months - i + 1) / 3);
    maturityAmount += monthlyDeposit * Math.pow(1 + quarterlyRate, quartersRemaining);
  }
  
  const totalInvested = monthlyDeposit * months;
  
  return {
    totalInvested: roundInt(totalInvested),
    returns: roundInt(maturityAmount - totalInvested),
    maturityAmount: roundInt(maturityAmount),
  };
};

// PPF Calculator
export const calculatePPF = (yearlyDeposit, years) => {
  const rate = GOVERNMENT_RATES.PPF / 100;
  let balance = 0;
  
  for (let i = 0; i < years; i++) {
    balance = (balance + yearlyDeposit) * (1 + rate);
  }
  
  const totalInvested = yearlyDeposit * years;
  
  return {
    totalInvested: roundInt(totalInvested),
    returns: roundInt(balance - totalInvested),
    maturityAmount: roundInt(balance),
  };
};

// SCSS Calculator
export const calculateSCSS = (principal) => {
  const years = 5;
  const rate = GOVERNMENT_RATES.SCSS / 100;
  const quarterlyInterest = (principal * rate) / 4;
  const totalInterest = quarterlyInterest * 4 * years;
  
  return {
    totalInvested: roundInt(principal),
    returns: roundInt(totalInterest),
    maturityAmount: roundInt(principal + totalInterest),
    quarterlyInterest: roundInt(quarterlyInterest),
  };
};

// KVP Calculator
export const calculateKVP = (principal) => {
  const maturityAmount = principal * 2;
  
  return {
    totalInvested: roundInt(principal),
    returns: roundInt(principal),
    maturityAmount: roundInt(maturityAmount),
    tenure: "115 months (9.6 years)",
  };
};

// NSC Calculator
export const calculateNSC = (principal) => {
  const years = 5;
  const rate = GOVERNMENT_RATES.NSC / 100;
  const maturityAmount = principal * Math.pow(1 + rate, years);
  
  return {
    totalInvested: roundInt(principal),
    returns: roundInt(maturityAmount - principal),
    maturityAmount: roundInt(maturityAmount),
  };
};

// SSY Calculator
export const calculateSSY = (yearlyDeposit, years) => {
  const rate = GOVERNMENT_RATES.SSY / 100;
  const depositYears = Math.min(years, 15);
  let balance = 0;
  
  for (let i = 0; i < depositYears; i++) {
    balance = (balance + yearlyDeposit) * (1 + rate);
  }
  
  for (let i = depositYears; i < years; i++) {
    balance = balance * (1 + rate);
  }
  
  const totalInvested = yearlyDeposit * depositYears;
  
  return {
    totalInvested: roundInt(totalInvested),
    returns: roundInt(balance - totalInvested),
    maturityAmount: roundInt(balance),
  };
};

// Savings Account Calculator
export const calculateSavingsAccount = (principal, years) => {
  const rate = GOVERNMENT_RATES.SB / 100;
  const maturityAmount = principal * Math.pow(1 + rate / 4, 4 * years);
  
  return {
    totalInvested: roundInt(principal),
    returns: roundInt(maturityAmount - principal),
    maturityAmount: roundInt(maturityAmount),
  };
};

// Lumpsum Mutual Fund Calculator
export const calculateLumpsum = (principal, rateOfReturn, years) => {
  const rate = rateOfReturn / 100;
  const maturityAmount = principal * Math.pow(1 + rate, years);
  
  return {
    totalInvested: roundInt(principal),
    returns: roundInt(maturityAmount - principal),
    maturityAmount: roundInt(maturityAmount),
    cagr: rateOfReturn,
  };
};

// Universal calculator
export const calculate = (schemeId, inputs) => {
  const id = schemeId.toLowerCase();
  
  switch (id) {
    case "sip":
      return calculateSIP(inputs.monthlyInvestment, inputs.rate, inputs.years);
    case "fd":
      return calculateFD(inputs.principal, inputs.rate, inputs.years);
    case "rd":
      return calculateRD(inputs.monthlyDeposit, inputs.rate, inputs.years);
    case "mf":
    case "stock":
      return calculateLumpsum(inputs.principal, inputs.rate, inputs.years);
    case "ppf":
      return calculatePPF(inputs.yearlyDeposit, inputs.years);
    case "scss":
      return calculateSCSS(inputs.principal);
    case "kvp":
      return calculateKVP(inputs.principal);
    case "nsc":
      return calculateNSC(inputs.principal);
    case "ssy":
      return calculateSSY(inputs.yearlyDeposit, inputs.years);
    case "sb":
      return calculateSavingsAccount(inputs.principal, inputs.years);
    default:
      return calculateFD(inputs.principal, inputs.rate || 7, inputs.years);
  }
};
