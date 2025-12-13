/**
 * Market Data Simulation Engine
 * Generates realistic market data with price movements, trends, and volatility
 */

// Base prices for major indices
const INDICES = {
  NIFTY50: { base: 24500, volatility: 0.008 },
  SENSEX: { base: 80500, volatility: 0.008 },
  BANKNIFTY: { base: 52000, volatility: 0.012 },
  NIFTYIT: { base: 42000, volatility: 0.015 },
  NIFTYMIDCAP: { base: 55000, volatility: 0.012 },
};

// Market hours (IST)
const MARKET_OPEN = 9.25; // 9:15 AM
const MARKET_CLOSE = 15.5; // 3:30 PM

// Check if market is open (simulated - always returns true for testing)
function isMarketOpen() {
  // For simulation, market is always "open"
  return true;
}

// Generate realistic price movement using random walk
function generatePriceMovement(basePrice, volatility = 0.02) {
  // Random walk with drift
  const drift = (Math.random() - 0.48) * volatility; // Slight positive bias
  const randomShock = (Math.random() - 0.5) * volatility * 2;
  const movement = drift + randomShock;
  return basePrice * (1 + movement);
}

// Generate OHLC data for a time period
function generateOHLC(basePrice, volatility = 0.02) {
  const open = generatePriceMovement(basePrice, volatility * 0.3);
  const close = generatePriceMovement(basePrice, volatility);
  const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
  const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
  const volume = Math.floor(Math.random() * 10000000) + 1000000;
  
  return {
    open: parseFloat(open.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
    volume,
  };
}

// Store for maintaining price continuity across calls
const priceStore = new Map();

/**
 * Get simulated real-time price for a symbol
 */
export function getRealtimePrice(symbol, basePrice = null) {
  const storedPrice = priceStore.get(symbol);
  const currentBase = storedPrice || basePrice || 1000 + Math.random() * 5000;
  
  // Generate new price with small movement from last price
  const volatility = 0.002; // 0.2% max movement per tick
  const newPrice = generatePriceMovement(currentBase, volatility);
  
  // Store for continuity
  priceStore.set(symbol, newPrice);
  
  const change = newPrice - (storedPrice || currentBase);
  const changePercent = (change / (storedPrice || currentBase)) * 100;
  
  return {
    symbol,
    price: parseFloat(newPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    timestamp: new Date().toISOString(),
    volume: Math.floor(Math.random() * 100000),
  };
}

/**
 * Get simulated index data
 */
export function getIndexData(indexName) {
  const indexInfo = INDICES[indexName.toUpperCase()] || { base: 20000, volatility: 0.01 };
  const storedValue = priceStore.get(`INDEX_${indexName}`) || indexInfo.base;
  
  const newValue = generatePriceMovement(storedValue, indexInfo.volatility);
  priceStore.set(`INDEX_${indexName}`, newValue);
  
  const change = newValue - indexInfo.base;
  const changePercent = (change / indexInfo.base) * 100;
  const ohlc = generateOHLC(newValue, indexInfo.volatility);
  
  return {
    name: indexName.toUpperCase(),
    value: parseFloat(newValue.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    ...ohlc,
    timestamp: new Date().toISOString(),
    marketStatus: isMarketOpen() ? "OPEN" : "CLOSED",
  };
}

/**
 * Get NAV for mutual fund (changes once daily)
 */
export function getMutualFundNAV(schemeCode, baseNAV = null) {
  const today = new Date().toISOString().split('T')[0];
  const storeKey = `MF_${schemeCode}_${today}`;
  
  let nav = priceStore.get(storeKey);
  
  if (!nav) {
    // Generate NAV once per day
    const base = baseNAV || 50 + Math.random() * 500;
    nav = generatePriceMovement(base, 0.015); // ~1.5% daily change max
    priceStore.set(storeKey, nav);
  }
  
  const previousNAV = priceStore.get(`MF_${schemeCode}_prev`) || nav * 0.995;
  priceStore.set(`MF_${schemeCode}_prev`, nav);
  
  const change = nav - previousNAV;
  const changePercent = (change / previousNAV) * 100;
  
  return {
    schemeCode,
    nav: parseFloat(nav.toFixed(4)),
    previousNAV: parseFloat(previousNAV.toFixed(4)),
    change: parseFloat(change.toFixed(4)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    navDate: today,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get gold/silver prices
 */
export function getMetalPrices() {
  const goldBase = priceStore.get('GOLD') || 6250;
  const silverBase = priceStore.get('SILVER') || 75;
  
  const goldPrice = generatePriceMovement(goldBase, 0.005);
  const silverPrice = generatePriceMovement(silverBase, 0.008);
  
  priceStore.set('GOLD', goldPrice);
  priceStore.set('SILVER', silverPrice);
  
  return {
    gold: {
      pricePerGram: parseFloat(goldPrice.toFixed(2)),
      pricePerOunce: parseFloat((goldPrice * 31.1035).toFixed(2)),
      change: parseFloat((goldPrice - goldBase).toFixed(2)),
      changePercent: parseFloat(((goldPrice - goldBase) / goldBase * 100).toFixed(2)),
    },
    silver: {
      pricePerGram: parseFloat(silverPrice.toFixed(2)),
      pricePerKg: parseFloat((silverPrice * 1000).toFixed(2)),
      change: parseFloat((silverPrice - silverBase).toFixed(2)),
      changePercent: parseFloat(((silverPrice - silverBase) / silverBase * 100).toFixed(2)),
    },
    currency: "INR",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get crypto prices (simulated with high volatility)
 */
export function getCryptoPrices() {
  const cryptos = {
    BTC: { base: 8500000, volatility: 0.03 },
    ETH: { base: 280000, volatility: 0.035 },
    BNB: { base: 52000, volatility: 0.04 },
    SOL: { base: 18000, volatility: 0.045 },
    XRP: { base: 85, volatility: 0.04 },
    DOGE: { base: 32, volatility: 0.05 },
  };
  
  const prices = {};
  
  for (const [symbol, info] of Object.entries(cryptos)) {
    const stored = priceStore.get(`CRYPTO_${symbol}`) || info.base;
    const newPrice = generatePriceMovement(stored, info.volatility);
    priceStore.set(`CRYPTO_${symbol}`, newPrice);
    
    prices[symbol] = {
      symbol,
      priceINR: parseFloat(newPrice.toFixed(2)),
      priceUSD: parseFloat((newPrice / 84).toFixed(2)), // Assuming 1 USD = 84 INR
      change24h: parseFloat((Math.random() * 10 - 5).toFixed(2)),
      volume24h: Math.floor(Math.random() * 1000000000),
    };
  }
  
  return {
    prices,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get FD interest rates (banks update occasionally)
 */
export function getFDRates() {
  return {
    banks: {
      SBI: {
        "7_days_to_45_days": 3.0,
        "46_days_to_179_days": 5.5,
        "180_days_to_1_year": 6.5,
        "1_year_to_2_year": 6.8,
        "2_year_to_3_year": 7.0,
        "3_year_to_5_year": 6.75,
        "5_year_to_10_year": 6.5,
      },
      HDFC: {
        "7_days_to_45_days": 3.0,
        "46_days_to_179_days": 5.75,
        "180_days_to_1_year": 6.6,
        "1_year_to_2_year": 7.0,
        "2_year_to_3_year": 7.25,
        "3_year_to_5_year": 7.0,
        "5_year_to_10_year": 7.0,
      },
      ICICI: {
        "7_days_to_45_days": 3.0,
        "46_days_to_179_days": 5.5,
        "180_days_to_1_year": 6.6,
        "1_year_to_2_year": 6.9,
        "2_year_to_3_year": 7.1,
        "3_year_to_5_year": 6.9,
        "5_year_to_10_year": 6.9,
      },
      BAJAJ_FINANCE: {
        "12_months": 8.25,
        "18_months": 8.3,
        "24_months": 8.25,
        "33_months": 8.35,
        "44_months": 8.25,
        "60_months": 7.95,
      },
    },
    seniorCitizenBonus: 0.5, // Additional 0.5% for senior citizens
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get government scheme rates
 */
export function getGovtSchemeRates() {
  return {
    schemes: {
      PPF: {
        rate: 7.1,
        compounding: "Yearly",
        tenure: "15 years (extendable)",
        minDeposit: 500,
        maxDeposit: 150000,
        taxBenefit: "EEE (Exempt-Exempt-Exempt)",
      },
      NPS: {
        equityReturn: 12.5, // Historical average
        debtReturn: 8.5,
        govtSecReturn: 9.0,
        tenure: "Till 60 years",
        minDeposit: 500,
        taxBenefit: "Section 80CCD - Up to ₹2 Lakh",
      },
      SCSS: {
        rate: 8.2,
        tenure: "5 years (extendable by 3 years)",
        minDeposit: 1000,
        maxDeposit: 3000000,
        eligibility: "60+ years or 55+ (VRS)",
        taxBenefit: "Section 80C - Up to ₹1.5 Lakh",
      },
      SSY: {
        rate: 8.0,
        tenure: "21 years from opening",
        minDeposit: 250,
        maxDeposit: 150000,
        eligibility: "Girl child below 10 years",
        taxBenefit: "EEE",
      },
      NSC: {
        rate: 7.7,
        compounding: "Yearly",
        tenure: "5 years",
        minDeposit: 1000,
        maxDeposit: "No limit",
        taxBenefit: "Section 80C",
      },
      KVP: {
        rate: 7.5,
        doublingPeriod: "115 months",
        minDeposit: 1000,
        maxDeposit: "No limit",
        taxBenefit: "None",
      },
      SGB: {
        rate: 2.5,
        additional: "Gold price appreciation",
        tenure: "8 years (exit after 5th year)",
        minInvestment: "1 gram",
        maxInvestment: "4 kg",
        taxBenefit: "Capital gains exempt if held till maturity",
      },
      RBI_FLOATING_RATE: {
        rate: 8.05,
        rateType: "Floating (NSC + 0.35%)",
        tenure: "7 years",
        minDeposit: 1000,
        maxDeposit: "No limit",
      },
      POST_OFFICE_MIS: {
        rate: 7.4,
        payout: "Monthly",
        tenure: "5 years",
        minDeposit: 1000,
        maxDeposit: 900000,
      },
    },
    lastUpdated: new Date().toISOString(),
    effectiveQuarter: "Oct-Dec 2024",
  };
}

/**
 * Generate historical data for charts
 */
export function generateHistoricalData(symbol, days = 30, basePrice = 1000) {
  const data = [];
  let currentPrice = basePrice;
  const volatility = 0.02;
  
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const ohlc = generateOHLC(currentPrice, volatility);
    currentPrice = ohlc.close;
    
    data.push({
      date: date.toISOString().split('T')[0],
      ...ohlc,
    });
  }
  
  return {
    symbol,
    period: `${days} days`,
    data,
    startPrice: data[0].open,
    endPrice: data[data.length - 1].close,
    change: parseFloat((data[data.length - 1].close - data[0].open).toFixed(2)),
    changePercent: parseFloat(((data[data.length - 1].close - data[0].open) / data[0].open * 100).toFixed(2)),
  };
}

/**
 * Get market summary
 */
export function getMarketSummary() {
  return {
    indices: {
      nifty50: getIndexData('NIFTY50'),
      sensex: getIndexData('SENSEX'),
      bankNifty: getIndexData('BANKNIFTY'),
    },
    topGainers: [
      { symbol: "ADANIPORTS", name: "Adani Ports", change: 3.45 },
      { symbol: "TATASTEEL", name: "Tata Steel", change: 2.89 },
      { symbol: "HINDALCO", name: "Hindalco", change: 2.34 },
    ],
    topLosers: [
      { symbol: "TECHM", name: "Tech Mahindra", change: -2.12 },
      { symbol: "WIPRO", name: "Wipro", change: -1.78 },
      { symbol: "HCLTECH", name: "HCL Tech", change: -1.45 },
    ],
    marketBreadth: {
      advances: Math.floor(Math.random() * 1500) + 500,
      declines: Math.floor(Math.random() * 1500) + 500,
      unchanged: Math.floor(Math.random() * 200),
    },
    fiiDii: {
      fiiBuy: (Math.random() * 5000 + 1000).toFixed(2),
      fiiSell: (Math.random() * 5000 + 1000).toFixed(2),
      diiBuy: (Math.random() * 3000 + 500).toFixed(2),
      diiSell: (Math.random() * 3000 + 500).toFixed(2),
    },
    marketStatus: isMarketOpen() ? "OPEN" : "CLOSED",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate investment returns
 */
export function calculateReturns(investmentType, amount, tenure, additionalParams = {}) {
  let returns = { amount, tenure, type: investmentType };
  
  switch (investmentType) {
    case 'FD':
      const fdRate = additionalParams.rate || 7.0;
      const compoundFreq = additionalParams.compounding === 'quarterly' ? 4 : 1;
      returns.maturityAmount = amount * Math.pow(1 + fdRate / (100 * compoundFreq), tenure * compoundFreq);
      returns.interestEarned = returns.maturityAmount - amount;
      returns.effectiveRate = fdRate;
      break;
      
    case 'PPF':
      const ppfRate = 7.1;
      returns.maturityAmount = amount * Math.pow(1 + ppfRate / 100, tenure);
      returns.interestEarned = returns.maturityAmount - amount;
      returns.taxSaved = Math.min(amount, 150000) * 0.3; // Assuming 30% tax bracket
      break;
      
    case 'SIP':
      const sipReturn = additionalParams.expectedReturn || 12;
      const monthlyRate = sipReturn / 12 / 100;
      const months = tenure * 12;
      const sipAmount = amount; // Monthly SIP
      returns.totalInvested = sipAmount * months;
      returns.maturityAmount = sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      returns.wealthGained = returns.maturityAmount - returns.totalInvested;
      break;
      
    case 'LUMPSUM':
      const lumpsumReturn = additionalParams.expectedReturn || 12;
      returns.maturityAmount = amount * Math.pow(1 + lumpsumReturn / 100, tenure);
      returns.wealthGained = returns.maturityAmount - amount;
      returns.cagr = lumpsumReturn;
      break;
      
    default:
      returns.maturityAmount = amount * Math.pow(1.08, tenure);
      returns.interestEarned = returns.maturityAmount - amount;
  }
  
  // Round values
  returns.maturityAmount = parseFloat(returns.maturityAmount?.toFixed(2));
  returns.interestEarned = parseFloat(returns.interestEarned?.toFixed(2));
  returns.wealthGained = parseFloat(returns.wealthGained?.toFixed(2));
  
  return returns;
}

export const MarketSimulator = {
  getRealtimePrice,
  getIndexData,
  getMutualFundNAV,
  getMetalPrices,
  getCryptoPrices,
  getFDRates,
  getGovtSchemeRates,
  generateHistoricalData,
  getMarketSummary,
  calculateReturns,
  isMarketOpen,
};

export default MarketSimulator;
