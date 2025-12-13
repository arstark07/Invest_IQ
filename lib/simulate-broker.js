/**
 * Broker Integration Simulation Engine
 * Simulates Zerodha, Angel One, Groww, Upstox APIs for stock/MF trading
 */

// Simulated success rates
const SUCCESS_RATE = 0.95;

// Simulated processing delays (ms)
const MIN_DELAY = 300;
const MAX_DELAY = 1500;

// Generate random delay
const randomDelay = () =>
  Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY);

// Generate random ID
const generateId = (prefix) =>
  `${prefix}_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Simulate success based on success rate
const shouldSucceed = () => Math.random() < SUCCESS_RATE;

// Sample stock data for simulation
const SAMPLE_STOCKS = {
  "RELIANCE": { name: "Reliance Industries Ltd", price: 2456.75, change: 1.25 },
  "TCS": { name: "Tata Consultancy Services", price: 3890.50, change: -0.75 },
  "HDFCBANK": { name: "HDFC Bank Ltd", price: 1678.25, change: 0.45 },
  "INFY": { name: "Infosys Ltd", price: 1456.80, change: 2.10 },
  "ICICIBANK": { name: "ICICI Bank Ltd", price: 1023.45, change: -0.30 },
  "SBIN": { name: "State Bank of India", price: 612.35, change: 1.85 },
  "BHARTIARTL": { name: "Bharti Airtel Ltd", price: 1234.60, change: 0.95 },
  "ITC": { name: "ITC Ltd", price: 456.20, change: -0.15 },
  "KOTAKBANK": { name: "Kotak Mahindra Bank", price: 1789.30, change: 0.60 },
  "LT": { name: "Larsen & Toubro Ltd", price: 2890.75, change: 1.40 },
  "HINDUNILVR": { name: "Hindustan Unilever", price: 2567.45, change: -0.55 },
  "AXISBANK": { name: "Axis Bank Ltd", price: 1089.60, change: 0.80 },
  "WIPRO": { name: "Wipro Ltd", price: 456.75, change: 1.95 },
  "TATAMOTORS": { name: "Tata Motors Ltd", price: 789.30, change: 2.50 },
  "ADANIENT": { name: "Adani Enterprises", price: 2345.80, change: -1.20 },
};

// Sample mutual funds for simulation
const SAMPLE_MUTUAL_FUNDS = {
  "HDFC_TOP100": { name: "HDFC Top 100 Fund", nav: 856.45, change: 0.35, category: "Large Cap" },
  "SBI_BLUECHIP": { name: "SBI Bluechip Fund", nav: 68.92, change: 0.42, category: "Large Cap" },
  "AXIS_MIDCAP": { name: "Axis Midcap Fund", nav: 78.34, change: 0.85, category: "Mid Cap" },
  "PARAG_FLEXI": { name: "Parag Parikh Flexi Cap", nav: 62.18, change: 0.28, category: "Flexi Cap" },
  "MIRAE_EMERGING": { name: "Mirae Asset Emerging", nav: 98.45, change: 1.12, category: "Large & Mid Cap" },
  "KOTAK_SMALL": { name: "Kotak Small Cap Fund", nav: 178.92, change: 1.45, category: "Small Cap" },
  "ICICI_VALUE": { name: "ICICI Pru Value Discovery", nav: 345.67, change: 0.58, category: "Value" },
  "HDFC_BALANCED": { name: "HDFC Balanced Advantage", nav: 345.23, change: 0.22, category: "Hybrid" },
  "SBI_CONTRA": { name: "SBI Contra Fund", nav: 289.45, change: 0.68, category: "Contra" },
  "AXIS_ELSS": { name: "Axis Long Term Equity", nav: 78.56, change: 0.45, category: "ELSS" },
  "MIRAE_TAX": { name: "Mirae Asset Tax Saver", nav: 35.78, change: 0.52, category: "ELSS" },
  "HDFC_LIQUID": { name: "HDFC Liquid Fund", nav: 4523.45, change: 0.02, category: "Liquid" },
  "ICICI_GILT": { name: "ICICI Pru Gilt Fund", nav: 89.34, change: 0.08, category: "Gilt" },
  "SBI_MAGNUM": { name: "SBI Magnum Medium Duration", nav: 45.67, change: 0.05, category: "Debt" },
};

// Sample ETFs
const SAMPLE_ETFS = {
  "NIFTYBEES": { name: "Nippon India Nifty BeES", price: 234.56, change: 0.45, underlying: "Nifty 50" },
  "BANKBEES": { name: "Nippon India Bank BeES", price: 456.78, change: 0.85, underlying: "Nifty Bank" },
  "GOLDBEES": { name: "Nippon India Gold BeES", price: 52.34, change: 0.12, underlying: "Gold" },
  "JUNIORBEES": { name: "Nippon India Junior BeES", price: 567.89, change: 0.95, underlying: "Nifty Next 50" },
  "ITBEES": { name: "Nippon India IT BeES", price: 345.67, change: 1.25, underlying: "Nifty IT" },
  "SETFNIF50": { name: "SBI ETF Nifty 50", price: 232.45, change: 0.42, underlying: "Nifty 50" },
};

// Government scheme interest rates (as of Dec 2024)
const GOVT_SCHEME_RATES = {
  PPF: 7.1,
  NPS: 9.5, // Average equity + debt
  SCSS: 8.2,
  SSY: 8.0,
  NSC: 7.7,
  KVP: 7.5,
  POST_OFFICE_FD: 7.0,
  POST_OFFICE_RD: 6.7,
  POST_OFFICE_MIS: 7.4,
  SGB: 2.5, // Plus gold appreciation
  RBI_BONDS: 8.05,
  ATAL_PENSION: 8.0, // Estimated
};

// FD rates by bank (simulated)
const FD_RATES = {
  SBI: { "1_year": 6.8, "2_year": 7.0, "3_year": 6.75, "5_year": 6.5 },
  HDFC: { "1_year": 7.0, "2_year": 7.25, "3_year": 7.0, "5_year": 7.0 },
  ICICI: { "1_year": 6.9, "2_year": 7.1, "3_year": 6.9, "5_year": 6.9 },
  BAJAJ_FINANCE: { "1_year": 8.25, "2_year": 8.25, "3_year": 8.1, "5_year": 7.95 },
};

/**
 * Get simulated stock price with random variation
 */
function getSimulatedPrice(basePrice) {
  const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
  return parseFloat((basePrice * (1 + variation)).toFixed(2));
}

/**
 * Simulate broker connection/login
 */
export async function simulateBrokerConnect(broker, credentials) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const success = shouldSucceed();
  
  if (success) {
    return {
      success: true,
      simulated: true,
      broker,
      connection: {
        accessToken: `sim_token_${broker}_${Date.now()}`,
        refreshToken: `sim_refresh_${broker}_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: credentials.userId || `user_${Date.now()}`,
        userName: credentials.userName || "Simulation User",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "AUTH_FAILED",
        message: "Invalid credentials or broker server unavailable",
      }
    };
  }
}

/**
 * Get simulated market data for stocks
 */
export async function simulateGetStockQuote(symbols) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const quotes = {};
  const symbolList = Array.isArray(symbols) ? symbols : [symbols];
  
  for (const symbol of symbolList) {
    const stockData = SAMPLE_STOCKS[symbol.toUpperCase()];
    if (stockData) {
      quotes[symbol] = {
        symbol,
        name: stockData.name,
        lastPrice: getSimulatedPrice(stockData.price),
        change: stockData.change + (Math.random() - 0.5) * 0.5,
        changePercent: ((stockData.change + (Math.random() - 0.5) * 0.5) / stockData.price * 100).toFixed(2),
        open: getSimulatedPrice(stockData.price * 0.998),
        high: getSimulatedPrice(stockData.price * 1.015),
        low: getSimulatedPrice(stockData.price * 0.985),
        close: stockData.price,
        volume: Math.floor(Math.random() * 10000000) + 100000,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Generate random data for unknown symbols
      const basePrice = Math.random() * 5000 + 100;
      quotes[symbol] = {
        symbol,
        name: `${symbol} Ltd`,
        lastPrice: getSimulatedPrice(basePrice),
        change: (Math.random() - 0.5) * 2,
        changePercent: ((Math.random() - 0.5) * 4).toFixed(2),
        open: getSimulatedPrice(basePrice * 0.998),
        high: getSimulatedPrice(basePrice * 1.015),
        low: getSimulatedPrice(basePrice * 0.985),
        close: basePrice,
        volume: Math.floor(Math.random() * 10000000) + 100000,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  return {
    success: true,
    simulated: true,
    quotes,
  };
}

/**
 * Get simulated mutual fund NAV
 */
export async function simulateGetMutualFundNAV(schemeCode) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const fundData = SAMPLE_MUTUAL_FUNDS[schemeCode];
  
  if (fundData) {
    return {
      success: true,
      simulated: true,
      fund: {
        schemeCode,
        schemeName: fundData.name,
        nav: getSimulatedPrice(fundData.nav),
        navDate: new Date().toISOString().split('T')[0],
        change: fundData.change,
        changePercent: (fundData.change / fundData.nav * 100).toFixed(2),
        category: fundData.category,
        aum: (Math.random() * 50000 + 5000).toFixed(2) + " Cr",
        expenseRatio: (Math.random() * 1.5 + 0.5).toFixed(2) + "%",
      }
    };
  }
  
  return {
    success: false,
    simulated: true,
    error: { message: "Scheme not found" }
  };
}

/**
 * Simulate placing a stock order
 */
export async function simulatePlaceStockOrder(orderDetails) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const {
    symbol,
    quantity,
    orderType = "MARKET",
    transactionType = "BUY",
    price = null,
  } = orderDetails;
  
  const success = shouldSucceed();
  const orderId = generateId("ORD");
  
  // Get simulated price
  const stockData = SAMPLE_STOCKS[symbol.toUpperCase()] || { price: 1000 };
  const executionPrice = price || getSimulatedPrice(stockData.price);
  
  if (success) {
    return {
      success: true,
      simulated: true,
      order: {
        orderId,
        symbol,
        quantity,
        orderType,
        transactionType,
        price: executionPrice,
        totalValue: executionPrice * quantity,
        status: "COMPLETE",
        filledQuantity: quantity,
        averagePrice: executionPrice,
        exchange: "NSE",
        timestamp: new Date().toISOString(),
        brokerFees: (executionPrice * quantity * 0.0003).toFixed(2), // 0.03% brokerage
        taxes: (executionPrice * quantity * 0.001).toFixed(2), // ~0.1% taxes
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "ORDER_FAILED",
        message: "Insufficient margin" || "Market closed" || "Order rejected",
        orderId,
      }
    };
  }
}

/**
 * Simulate placing a mutual fund order (SIP or Lumpsum)
 */
export async function simulatePlaceMFOrder(orderDetails) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const {
    schemeCode,
    amount,
    orderType = "LUMPSUM", // LUMPSUM or SIP
    sipDay = 1,
  } = orderDetails;
  
  const success = shouldSucceed();
  const orderId = generateId("MF");
  
  const fundData = SAMPLE_MUTUAL_FUNDS[schemeCode] || { nav: 50, name: "Unknown Fund" };
  const nav = getSimulatedPrice(fundData.nav);
  const units = (amount / nav).toFixed(4);
  
  if (success) {
    return {
      success: true,
      simulated: true,
      order: {
        orderId,
        schemeCode,
        schemeName: fundData.name,
        amount,
        nav,
        units: parseFloat(units),
        orderType,
        sipDay: orderType === "SIP" ? sipDay : null,
        status: "ALLOTTED",
        allotmentDate: new Date().toISOString().split('T')[0],
        folioNumber: `SIM${Date.now().toString().slice(-10)}`,
        timestamp: new Date().toISOString(),
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "MF_ORDER_FAILED",
        message: "NAV not available" || "Cut-off time exceeded",
        orderId,
      }
    };
  }
}

/**
 * Simulate government scheme investment
 */
export async function simulateGovtSchemeInvestment(schemeDetails) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const {
    schemeType, // PPF, NPS, SCSS, etc.
    amount,
    tenure = null,
  } = schemeDetails;
  
  const success = shouldSucceed();
  const transactionId = generateId("GOV");
  const interestRate = GOVT_SCHEME_RATES[schemeType] || 7.0;
  
  if (success) {
    // Calculate maturity based on scheme type
    let maturityDate;
    let maturityAmount;
    
    switch (schemeType) {
      case "PPF":
        maturityDate = new Date(Date.now() + 15 * 365 * 24 * 60 * 60 * 1000);
        maturityAmount = amount * Math.pow(1 + interestRate / 100, 15);
        break;
      case "NSC":
        maturityDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
        maturityAmount = amount * Math.pow(1 + interestRate / 100, 5);
        break;
      case "SCSS":
        maturityDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
        maturityAmount = amount + (amount * interestRate / 100 * 5);
        break;
      case "SSY":
        maturityDate = new Date(Date.now() + 21 * 365 * 24 * 60 * 60 * 1000);
        maturityAmount = amount * Math.pow(1 + interestRate / 100, 21);
        break;
      default:
        maturityDate = new Date(Date.now() + (tenure || 5) * 365 * 24 * 60 * 60 * 1000);
        maturityAmount = amount * Math.pow(1 + interestRate / 100, tenure || 5);
    }
    
    return {
      success: true,
      simulated: true,
      investment: {
        transactionId,
        schemeType,
        amount,
        interestRate,
        investmentDate: new Date().toISOString().split('T')[0],
        maturityDate: maturityDate.toISOString().split('T')[0],
        expectedMaturityAmount: maturityAmount.toFixed(2),
        accountNumber: `GOV${Date.now().toString().slice(-12)}`,
        status: "ACTIVE",
        taxBenefit: ["PPF", "NPS", "ELSS", "NSC", "SSY", "SCSS"].includes(schemeType) 
          ? "Section 80C - Up to ₹1.5 Lakh" 
          : "None",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "SCHEME_FAILED",
        message: "KYC pending" || "Amount exceeds limit" || "Scheme not available",
      }
    };
  }
}

/**
 * Simulate FD booking
 */
export async function simulateFDBooking(fdDetails) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const {
    amount,
    tenure, // in years
    bank = "HDFC",
  } = fdDetails;
  
  const success = shouldSucceed();
  const fdId = generateId("FD");
  const tenureKey = `${tenure}_year`;
  const interestRate = FD_RATES[bank]?.[tenureKey] || 7.0;
  
  if (success) {
    const maturityDate = new Date(Date.now() + tenure * 365 * 24 * 60 * 60 * 1000);
    const maturityAmount = amount * Math.pow(1 + interestRate / 100, tenure);
    
    return {
      success: true,
      simulated: true,
      fd: {
        fdId,
        bank,
        amount,
        tenure,
        interestRate,
        startDate: new Date().toISOString().split('T')[0],
        maturityDate: maturityDate.toISOString().split('T')[0],
        maturityAmount: maturityAmount.toFixed(2),
        interestEarned: (maturityAmount - amount).toFixed(2),
        fdNumber: `FD${Date.now().toString().slice(-12)}`,
        status: "ACTIVE",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "FD_FAILED",
        message: "Bank server unavailable",
      }
    };
  }
}

/**
 * Simulate digital gold purchase
 */
export async function simulateGoldPurchase(goldDetails) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const {
    amountInINR,
    type = "DIGITAL_GOLD", // DIGITAL_GOLD, SILVER, SGB
  } = goldDetails;
  
  const success = shouldSucceed();
  const transactionId = generateId("GOLD");
  
  // Simulated gold/silver prices (per gram)
  const prices = {
    DIGITAL_GOLD: 6250 + (Math.random() - 0.5) * 100,
    SILVER: 75 + (Math.random() - 0.5) * 5,
    SGB: 5800 + (Math.random() - 0.5) * 100,
  };
  
  const pricePerGram = prices[type];
  const quantity = (amountInINR / pricePerGram).toFixed(4);
  
  if (success) {
    return {
      success: true,
      simulated: true,
      purchase: {
        transactionId,
        type,
        amountInINR,
        pricePerGram: pricePerGram.toFixed(2),
        quantity: parseFloat(quantity),
        unit: "grams",
        purchaseDate: new Date().toISOString(),
        provider: type === "SGB" ? "RBI" : "Augmont",
        invoiceNumber: `INV${Date.now().toString().slice(-10)}`,
        status: "COMPLETED",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "GOLD_FAILED",
        message: "Price refresh required" || "Provider unavailable",
      }
    };
  }
}

/**
 * Get simulated portfolio holdings
 */
export async function simulateGetPortfolio(userId) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  // Generate random portfolio
  const stocks = Object.keys(SAMPLE_STOCKS).slice(0, 5).map(symbol => {
    const data = SAMPLE_STOCKS[symbol];
    const quantity = Math.floor(Math.random() * 100) + 10;
    const avgPrice = data.price * (0.9 + Math.random() * 0.2);
    const currentPrice = getSimulatedPrice(data.price);
    
    return {
      symbol,
      name: data.name,
      quantity,
      averagePrice: avgPrice.toFixed(2),
      currentPrice: currentPrice.toFixed(2),
      currentValue: (quantity * currentPrice).toFixed(2),
      investedValue: (quantity * avgPrice).toFixed(2),
      pnl: ((currentPrice - avgPrice) * quantity).toFixed(2),
      pnlPercent: (((currentPrice - avgPrice) / avgPrice) * 100).toFixed(2),
      type: "EQUITY",
    };
  });
  
  const mutualFunds = Object.keys(SAMPLE_MUTUAL_FUNDS).slice(0, 3).map(code => {
    const data = SAMPLE_MUTUAL_FUNDS[code];
    const units = Math.floor(Math.random() * 1000) + 100;
    const avgNav = data.nav * (0.9 + Math.random() * 0.2);
    const currentNav = getSimulatedPrice(data.nav);
    
    return {
      schemeCode: code,
      schemeName: data.name,
      category: data.category,
      units,
      averageNav: avgNav.toFixed(2),
      currentNav: currentNav.toFixed(2),
      currentValue: (units * currentNav).toFixed(2),
      investedValue: (units * avgNav).toFixed(2),
      pnl: ((currentNav - avgNav) * units).toFixed(2),
      pnlPercent: (((currentNav - avgNav) / avgNav) * 100).toFixed(2),
      type: "MUTUAL_FUND",
    };
  });
  
  return {
    success: true,
    simulated: true,
    portfolio: {
      stocks,
      mutualFunds,
      totalInvestedValue: [...stocks, ...mutualFunds]
        .reduce((sum, h) => sum + parseFloat(h.investedValue), 0).toFixed(2),
      totalCurrentValue: [...stocks, ...mutualFunds]
        .reduce((sum, h) => sum + parseFloat(h.currentValue), 0).toFixed(2),
      totalPnl: [...stocks, ...mutualFunds]
        .reduce((sum, h) => sum + parseFloat(h.pnl), 0).toFixed(2),
      lastUpdated: new Date().toISOString(),
    }
  };
}

/**
 * Get all available investment options
 */
export function getAvailableInvestmentOptions() {
  return {
    stocks: Object.entries(SAMPLE_STOCKS).map(([symbol, data]) => ({
      symbol,
      ...data,
      type: "STOCK",
    })),
    mutualFunds: Object.entries(SAMPLE_MUTUAL_FUNDS).map(([code, data]) => ({
      schemeCode: code,
      ...data,
      type: "MUTUAL_FUND",
    })),
    etfs: Object.entries(SAMPLE_ETFS).map(([symbol, data]) => ({
      symbol,
      ...data,
      type: "ETF",
    })),
    governmentSchemes: Object.entries(GOVT_SCHEME_RATES).map(([scheme, rate]) => ({
      schemeType: scheme,
      interestRate: rate,
      type: "GOVT_SCHEME",
    })),
    fdRates: FD_RATES,
  };
}

export const BrokerSimulator = {
  connect: simulateBrokerConnect,
  getStockQuote: simulateGetStockQuote,
  getMutualFundNAV: simulateGetMutualFundNAV,
  placeStockOrder: simulatePlaceStockOrder,
  placeMFOrder: simulatePlaceMFOrder,
  investGovtScheme: simulateGovtSchemeInvestment,
  bookFD: simulateFDBooking,
  buyGold: simulateGoldPurchase,
  getPortfolio: simulateGetPortfolio,
  getInvestmentOptions: getAvailableInvestmentOptions,
};

export default BrokerSimulator;
