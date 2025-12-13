"use server";

import { db } from "@/lib/prisma";
import { BrokerSimulator } from "./simulate-broker";

/**
 * Broker API Integration Layer
 * Supports Zerodha Kite, Groww, Angel One, Upstox
 * Includes SIMULATION MODE when API keys are not available
 * 
 * Note: Zerodha Kite Connect API is free for personal use.
 * Groww and Angel One also offer free APIs for individual traders.
 */

// ==================== CONFIGURATION ====================

const ZERODHA_API_KEY = process.env.ZERODHA_API_KEY;
const ZERODHA_API_SECRET = process.env.ZERODHA_API_SECRET;
const ANGEL_API_KEY = process.env.ANGEL_API_KEY;
const ANGEL_CLIENT_ID = process.env.ANGEL_CLIENT_ID;
const GROWW_API_KEY = process.env.GROWW_API_KEY;
const UPSTOX_API_KEY = process.env.UPSTOX_API_KEY;

// Check if simulation mode should be used
const USE_SIMULATION = process.env.FORCE_SIMULATION === "true" || 
  (!ZERODHA_API_KEY && !ANGEL_API_KEY && !GROWW_API_KEY && !UPSTOX_API_KEY);

/**
 * Check if running in simulation mode
 */
export async function isBrokerSimulationMode() {
  return USE_SIMULATION;
}

// ==================== ZERODHA KITE INTEGRATION ====================

/**
 * Generate Zerodha login URL for OAuth
 */
export async function getZerodhaLoginUrl(redirectUri) {
  const baseUrl = "https://kite.zerodha.com/connect/login";
  const params = new URLSearchParams({
    v: "3",
    api_key: ZERODHA_API_KEY,
    redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/broker/zerodha/callback`,
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange Zerodha request token for access token
 */
export async function getZerodhaAccessToken(requestToken) {
  try {
    const crypto = await import("crypto");
    
    const checksum = crypto
      .createHash("sha256")
      .update(ZERODHA_API_KEY + requestToken + ZERODHA_API_SECRET)
      .digest("hex");

    const response = await fetch("https://api.kite.trade/session/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Kite-Version": "3",
      },
      body: new URLSearchParams({
        api_key: ZERODHA_API_KEY,
        request_token: requestToken,
        checksum,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      return {
        success: true,
        data: {
          accessToken: data.data.access_token,
          refreshToken: data.data.refresh_token,
          userId: data.data.user_id,
          userName: data.data.user_name,
          email: data.data.email,
          broker: data.data.broker,
        },
      };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error("Zerodha token exchange failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Make authenticated request to Zerodha API
 */
async function zerodhaRequest(endpoint, accessToken, options = {}) {
  const response = await fetch(`https://api.kite.trade${endpoint}`, {
    ...options,
    headers: {
      "X-Kite-Version": "3",
      Authorization: `token ${ZERODHA_API_KEY}:${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (data.status === "success") {
    return { success: true, data: data.data };
  } else {
    return { success: false, error: data.message };
  }
}

/**
 * Get Zerodha portfolio holdings
 */
export async function getZerodhaHoldings(accessToken) {
  return zerodhaRequest("/portfolio/holdings", accessToken);
}

/**
 * Get Zerodha positions
 */
export async function getZerodhaPositions(accessToken) {
  return zerodhaRequest("/portfolio/positions", accessToken);
}

/**
 * Get Zerodha mutual fund holdings
 */
export async function getZerodhaMFHoldings(accessToken) {
  return zerodhaRequest("/mf/holdings", accessToken);
}

/**
 * Place Zerodha order (stocks/ETFs)
 */
export async function placeZerodhaOrder({
  accessToken,
  tradingsymbol,
  exchange = "NSE",
  transactionType = "BUY",
  quantity,
  orderType = "MARKET",
  product = "CNC", // CNC for delivery, MIS for intraday
  price,
  triggerPrice,
  validity = "DAY",
}) {
  const body = new URLSearchParams({
    tradingsymbol,
    exchange,
    transaction_type: transactionType,
    quantity: quantity.toString(),
    order_type: orderType,
    product,
    validity,
  });

  if (price && orderType !== "MARKET") {
    body.append("price", price.toString());
  }
  if (triggerPrice) {
    body.append("trigger_price", triggerPrice.toString());
  }

  return zerodhaRequest("/orders/regular", accessToken, {
    method: "POST",
    body,
  });
}

/**
 * Place Zerodha mutual fund SIP order
 */
export async function placeZerodhaMFSIP({
  accessToken,
  tradingsymbol,
  amount,
  instalments = -1, // -1 for perpetual
  frequency = "monthly",
  instalmentDay = 1,
}) {
  const body = new URLSearchParams({
    tradingsymbol,
    amount: amount.toString(),
    instalments: instalments.toString(),
    frequency,
    instalment_day: instalmentDay.toString(),
  });

  return zerodhaRequest("/mf/sips", accessToken, {
    method: "POST",
    body,
  });
}

/**
 * Place Zerodha mutual fund lumpsum order
 */
export async function placeZerodhaMFOrder({
  accessToken,
  tradingsymbol,
  amount,
  transactionType = "BUY",
}) {
  const body = new URLSearchParams({
    tradingsymbol,
    transaction_type: transactionType,
    amount: amount.toString(),
  });

  return zerodhaRequest("/mf/orders", accessToken, {
    method: "POST",
    body,
  });
}

/**
 * Get Zerodha order status
 */
export async function getZerodhaOrderStatus(accessToken, orderId) {
  return zerodhaRequest(`/orders/${orderId}`, accessToken);
}

/**
 * Get Zerodha instruments list
 */
export async function getZerodhaInstruments(exchange = "NSE") {
  try {
    const response = await fetch(
      `https://api.kite.trade/instruments/${exchange}`,
      {
        headers: {
          "X-Kite-Version": "3",
        },
      }
    );
    const text = await response.text();
    // Parse CSV response
    const lines = text.split("\n");
    const headers = lines[0].split(",");
    const instruments = lines.slice(1).map((line) => {
      const values = line.split(",");
      const instrument = {};
      headers.forEach((header, i) => {
        instrument[header] = values[i];
      });
      return instrument;
    });
    return { success: true, data: instruments };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== ANGEL ONE INTEGRATION ====================

// ANGEL_API_KEY and ANGEL_CLIENT_ID are defined at the top of the file

/**
 * Angel One login (TOTP based)
 */
export async function angelOneLogin(clientCode, password, totp) {
  try {
    const response = await fetch(
      "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": "127.0.0.1",
          "X-ClientPublicIP": "127.0.0.1",
          "X-MACAddress": "00:00:00:00:00:00",
          "X-PrivateKey": ANGEL_API_KEY,
        },
        body: JSON.stringify({
          clientcode: clientCode,
          password,
          totp,
        }),
      }
    );

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        data: {
          accessToken: data.data.jwtToken,
          refreshToken: data.data.refreshToken,
          feedToken: data.data.feedToken,
        },
      };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Make authenticated request to Angel One API
 */
async function angelOneRequest(endpoint, accessToken, options = {}) {
  const response = await fetch(
    `https://apiconnect.angelone.in/rest/secure/angelbroking${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-PrivateKey": ANGEL_API_KEY,
        ...options.headers,
      },
    }
  );

  const data = await response.json();
  
  if (data.status) {
    return { success: true, data: data.data };
  } else {
    return { success: false, error: data.message };
  }
}

/**
 * Get Angel One portfolio holdings
 */
export async function getAngelOneHoldings(accessToken) {
  return angelOneRequest("/portfolio/v1/getHolding", accessToken, {
    method: "GET",
  });
}

/**
 * Place Angel One order
 */
export async function placeAngelOneOrder({
  accessToken,
  variety = "NORMAL",
  tradingsymbol,
  symboltoken,
  transactiontype = "BUY",
  exchange = "NSE",
  ordertype = "MARKET",
  producttype = "DELIVERY",
  duration = "DAY",
  quantity,
  price = "0",
}) {
  return angelOneRequest("/order/v1/placeOrder", accessToken, {
    method: "POST",
    body: JSON.stringify({
      variety,
      tradingsymbol,
      symboltoken,
      transactiontype,
      exchange,
      ordertype,
      producttype,
      duration,
      quantity: quantity.toString(),
      price,
    }),
  });
}

// ==================== GROWW INTEGRATION ====================
// Note: Groww API is available through their partner program
// GROWW_API_KEY is defined at the top of the file

/**
 * Get Groww OAuth URL
 */
export async function getGrowwLoginUrl(redirectUri) {
  const baseUrl = "https://groww.in/oauth/authorize";
  const params = new URLSearchParams({
    client_id: GROWW_API_KEY,
    redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/broker/groww/callback`,
    response_type: "code",
    scope: "trade portfolio",
  });
  return `${baseUrl}?${params.toString()}`;
}

// ==================== UNIFIED BROKER INTERFACE ====================

/**
 * Connect broker account
 */
export async function connectBrokerAccount({
  userId,
  broker,
  accessToken,
  refreshToken,
  accountId,
  tokenExpiry,
}) {
  try {
    // Encrypt tokens before storing
    const crypto = await import("crypto");
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    const encryptToken = (token) => {
      if (!token) return null;
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(encryptionKey, "hex"),
        iv
      );
      let encrypted = cipher.update(token, "utf8", "hex");
      encrypted += cipher.final("hex");
      return iv.toString("hex") + ":" + encrypted;
    };

    const brokerAccount = await db.brokerAccount.upsert({
      where: {
        userId_broker: {
          userId,
          broker,
        },
      },
      create: {
        userId,
        broker,
        accountId,
        accessToken: encryptToken(accessToken),
        refreshToken: encryptToken(refreshToken),
        tokenExpiry,
        isActive: true,
      },
      update: {
        accountId,
        accessToken: encryptToken(accessToken),
        refreshToken: encryptToken(refreshToken),
        tokenExpiry,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    return { success: true, data: brokerAccount };
  } catch (error) {
    console.error("Failed to connect broker account:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Decrypt stored token
 */
export async function decryptToken(encryptedToken) {
  if (!encryptedToken) return null;
  
  try {
    const crypto = await import("crypto");
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    const [ivHex, encrypted] = encryptedToken.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey, "hex"),
      iv
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Token decryption failed:", error);
    return null;
  }
}

/**
 * Get user's broker accounts
 */
export async function getUserBrokerAccounts(userId) {
  try {
    const accounts = await db.brokerAccount.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        broker: true,
        accountId: true,
        isActive: true,
        lastSyncAt: true,
        holdings: {
          select: {
            symbol: true,
            name: true,
            quantity: true,
            currentValue: true,
            pnl: true,
            pnlPercent: true,
          },
        },
      },
    });

    return { success: true, data: accounts };
  } catch (error) {
    console.error("Failed to get broker accounts:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync holdings from broker
 * Uses simulation mode when no broker APIs are configured
 */
export async function syncBrokerHoldings(brokerAccountId) {
  // Use simulation if enabled
  if (USE_SIMULATION) {
    console.log("🎮 SIMULATION MODE: Getting simulated holdings");
    const simulatedHoldings = await BrokerSimulator.getHoldings();
    return {
      success: true,
      simulated: true,
      data: simulatedHoldings.holdings,
    };
  }

  try {
    const account = await db.brokerAccount.findUnique({
      where: { id: brokerAccountId },
    });

    if (!account) {
      // Fall back to simulation if no account found
      console.log("🎮 No broker account found, using simulated holdings");
      const simulatedHoldings = await BrokerSimulator.getHoldings();
      return {
        success: true,
        simulated: true,
        data: simulatedHoldings.holdings,
      };
    }

    const accessToken = await decryptToken(account.accessToken);
    let holdings;

    switch (account.broker) {
      case "ZERODHA":
        const zerodhaResult = await getZerodhaHoldings(accessToken);
        if (!zerodhaResult.success) return zerodhaResult;
        holdings = zerodhaResult.data.map((h) => ({
          symbol: h.tradingsymbol,
          name: h.instrument_token,
          quantity: parseFloat(h.quantity),
          averagePrice: parseFloat(h.average_price),
          currentPrice: parseFloat(h.last_price),
          currentValue: parseFloat(h.quantity) * parseFloat(h.last_price),
          pnl: parseFloat(h.pnl),
          pnlPercent: (parseFloat(h.pnl) / (parseFloat(h.average_price) * parseFloat(h.quantity))) * 100,
          instrumentType: "EQUITY",
        }));
        break;

      case "ANGEL_ONE":
        const angelResult = await getAngelOneHoldings(accessToken);
        if (!angelResult.success) return angelResult;
        holdings = angelResult.data.map((h) => ({
          symbol: h.tradingsymbol,
          name: h.symbolname,
          quantity: parseFloat(h.quantity),
          averagePrice: parseFloat(h.averageprice),
          currentPrice: parseFloat(h.ltp),
          currentValue: parseFloat(h.quantity) * parseFloat(h.ltp),
          pnl: parseFloat(h.profitandloss),
          pnlPercent: parseFloat(h.pnlpercentage),
          instrumentType: h.exchange === "NSE" ? "EQUITY" : h.exchange,
        }));
        break;

      default:
        return { success: false, error: "Unsupported broker" };
    }

    // Update holdings in database
    await db.brokerHolding.deleteMany({
      where: { brokerAccountId },
    });

    if (holdings.length > 0) {
      await db.brokerHolding.createMany({
        data: holdings.map((h) => ({
          brokerAccountId,
          ...h,
        })),
      });
    }

    // Update last sync time
    await db.brokerAccount.update({
      where: { id: brokerAccountId },
      data: { lastSyncAt: new Date() },
    });

    return { success: true, data: holdings };
  } catch (error) {
    console.error("Failed to sync holdings:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute investment through broker
 * Uses simulation mode when no broker APIs are configured
 */
export async function executeInvestmentOrder({
  brokerAccountId,
  investmentType,
  symbol,
  amount,
  quantity,
  orderType = "MARKET",
}) {
  // Use simulation if enabled
  if (USE_SIMULATION) {
    console.log("🎮 SIMULATION MODE: Executing simulated investment order");
    return BrokerSimulator.placeOrder({
      symbol,
      exchange: "NSE",
      orderType: "MARKET",
      transactionType: "BUY",
      quantity: quantity || Math.floor(amount / 1000), // Estimate quantity from amount
      price: 0,
      product: investmentType === "SIP" ? "SIP" : "CNC",
      investmentType,
    });
  }

  try {
    const account = await db.brokerAccount.findUnique({
      where: { id: brokerAccountId },
    });

    if (!account) {
      // Fall back to simulation if no account found
      console.log("🎮 No broker account found, using simulation");
      return BrokerSimulator.placeOrder({
        symbol,
        exchange: "NSE",
        orderType: "MARKET",
        transactionType: "BUY",
        quantity: quantity || Math.floor(amount / 1000),
        price: 0,
        product: investmentType === "SIP" ? "SIP" : "CNC",
        investmentType,
      });
    }

    const accessToken = await decryptToken(account.accessToken);
    let result;

    switch (account.broker) {
      case "ZERODHA":
        if (investmentType === "SIP" || investmentType === "LUMPSUM") {
          // Mutual fund order
          result = await placeZerodhaMFOrder({
            accessToken,
            tradingsymbol: symbol,
            amount,
            transactionType: "BUY",
          });
        } else {
          // Stock/ETF order
          result = await placeZerodhaOrder({
            accessToken,
            tradingsymbol: symbol,
            quantity,
            orderType,
          });
        }
        break;

      case "ANGEL_ONE":
        result = await placeAngelOneOrder({
          accessToken,
          tradingsymbol: symbol,
          quantity,
          ordertype: orderType,
        });
        break;

      default:
        return { success: false, error: "Unsupported broker" };
    }

    return result;
  } catch (error) {
    console.error("Failed to execute order:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get available mutual funds for SIP
 */
export async function getAvailableMutualFunds(broker, accessToken, category) {
  // This would typically call the broker's API to get available MF schemes
  // For demo, returning popular funds
  const popularFunds = {
    EQUITY: [
      { symbol: "NIFTYBEES", name: "Nippon India Nifty BeES ETF" },
      { symbol: "INF090I01239", name: "ICICI Prudential Bluechip Fund" },
      { symbol: "INF109K01Z48", name: "HDFC Flexi Cap Fund" },
    ],
    DEBT: [
      { symbol: "INF090I01AB3", name: "ICICI Prudential Liquid Fund" },
      { symbol: "INF109K01953", name: "HDFC Short Term Debt Fund" },
    ],
    HYBRID: [
      { symbol: "INF090I01C05", name: "ICICI Prudential Balanced Advantage" },
      { symbol: "INF109K01688", name: "HDFC Balanced Advantage Fund" },
    ],
    ELSS: [
      { symbol: "INF090I01569", name: "ICICI Prudential Long Term Equity (ELSS)" },
      { symbol: "INF109K01BY6", name: "HDFC ELSS Tax Saver" },
    ],
  };

  return {
    success: true,
    data: category ? popularFunds[category] || [] : popularFunds,
  };
}

/**
 * Get broker connection status
 */
export async function getBrokerStatus(userId) {
  try {
    const accounts = await db.brokerAccount.findMany({
      where: { userId },
      select: {
        broker: true,
        isActive: true,
        lastSyncAt: true,
        tokenExpiry: true,
      },
    });

    const status = {};
    const brokers = ["ZERODHA", "GROWW", "UPSTOX", "ANGEL_ONE", "PAYTM_MONEY"];
    
    brokers.forEach((broker) => {
      const account = accounts.find((a) => a.broker === broker);
      status[broker] = {
        connected: !!account,
        isActive: account?.isActive || false,
        lastSyncAt: account?.lastSyncAt || null,
        tokenExpired: account?.tokenExpiry ? new Date() > account.tokenExpiry : true,
      };
    });

    return { success: true, data: status };
  } catch (error) {
    console.error("Failed to get broker status:", error);
    return { success: false, error: error.message };
  }
}
