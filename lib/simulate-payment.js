/**
 * Payment Gateway Simulation Engine
 * Simulates Razorpay and Stripe payment flows without real API calls
 */

// Simulated success rate (90% success)
const SUCCESS_RATE = 0.9;

// Simulated processing delays (ms)
const MIN_DELAY = 500;
const MAX_DELAY = 2000;

// Generate random delay
const randomDelay = () => 
  Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY);

// Generate random order/payment ID
const generateId = (prefix) => 
  `${prefix}_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Simulate success based on success rate
const shouldSucceed = () => Math.random() < SUCCESS_RATE;

// Simulated failure reasons
const FAILURE_REASONS = [
  "Insufficient balance",
  "Card declined",
  "Bank server unavailable",
  "Transaction timeout",
  "Invalid UPI PIN",
  "Daily limit exceeded",
  "Account blocked",
];

const getRandomFailureReason = () => 
  FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];

/**
 * Simulate Razorpay payment order creation
 */
export async function simulateRazorpayOrder(amount, currency = "INR", receipt = null) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const orderId = generateId("order");
  
  return {
    success: true,
    simulated: true,
    order: {
      id: orderId,
      entity: "order",
      amount: amount * 100, // Razorpay uses paise
      amount_paid: 0,
      amount_due: amount * 100,
      currency: currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: "created",
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000),
    }
  };
}

/**
 * Simulate Razorpay payment verification
 */
export async function simulateRazorpayPayment(orderId, amount, method = "upi") {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const success = shouldSucceed();
  const paymentId = generateId("pay");
  
  if (success) {
    return {
      success: true,
      simulated: true,
      payment: {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: `sim_sig_${Date.now()}`,
        amount: amount * 100,
        currency: "INR",
        status: "captured",
        method: method,
        description: "Simulated wallet deposit",
        bank: method === "netbanking" ? "HDFC" : null,
        vpa: method === "upi" ? "user@paytm" : null,
        captured: true,
        created_at: Math.floor(Date.now() / 1000),
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "BAD_REQUEST_ERROR",
        description: getRandomFailureReason(),
        source: "gateway",
        step: "payment_authorization",
        reason: "payment_failed",
      }
    };
  }
}

/**
 * Simulate Razorpay payout (withdrawal)
 */
export async function simulateRazorpayPayout(amount, accountNumber, ifsc, name) {
  await new Promise(resolve => setTimeout(resolve, randomDelay() * 2)); // Payouts take longer
  
  const success = shouldSucceed();
  const payoutId = generateId("pout");
  
  if (success) {
    return {
      success: true,
      simulated: true,
      payout: {
        id: payoutId,
        entity: "payout",
        fund_account_id: `fa_sim_${Date.now()}`,
        amount: amount * 100,
        currency: "INR",
        status: "processed",
        mode: "IMPS",
        purpose: "payout",
        utr: `SIM${Date.now()}`,
        reference_id: `ref_${Date.now()}`,
        created_at: Math.floor(Date.now() / 1000),
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "BAD_REQUEST_ERROR",
        description: getRandomFailureReason(),
        source: "bank_account",
        reason: "payout_failed",
      }
    };
  }
}

/**
 * Simulate Stripe payment intent creation
 */
export async function simulateStripePaymentIntent(amount, currency = "inr") {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const intentId = generateId("pi");
  const clientSecret = `${intentId}_secret_sim_${Math.random().toString(36).substr(2, 16)}`;
  
  return {
    success: true,
    simulated: true,
    paymentIntent: {
      id: intentId,
      object: "payment_intent",
      amount: amount * 100,
      currency: currency,
      status: "requires_payment_method",
      client_secret: clientSecret,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    }
  };
}

/**
 * Simulate Stripe payment confirmation
 */
export async function simulateStripeConfirmPayment(intentId, paymentMethodId) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const success = shouldSucceed();
  
  if (success) {
    return {
      success: true,
      simulated: true,
      paymentIntent: {
        id: intentId,
        object: "payment_intent",
        status: "succeeded",
        payment_method: paymentMethodId || `pm_sim_${Date.now()}`,
        receipt_url: `https://simulated-receipt.stripe.com/${intentId}`,
        created: Math.floor(Date.now() / 1000),
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        type: "card_error",
        code: "card_declined",
        message: getRandomFailureReason(),
      }
    };
  }
}

/**
 * Simulate Stripe payout
 */
export async function simulateStripePayout(amount, destination) {
  await new Promise(resolve => setTimeout(resolve, randomDelay() * 2));
  
  const success = shouldSucceed();
  const payoutId = generateId("po");
  
  if (success) {
    return {
      success: true,
      simulated: true,
      payout: {
        id: payoutId,
        object: "payout",
        amount: amount * 100,
        currency: "inr",
        status: "paid",
        arrival_date: Math.floor(Date.now() / 1000) + 86400,
        destination: destination,
        created: Math.floor(Date.now() / 1000),
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        type: "invalid_request_error",
        message: getRandomFailureReason(),
      }
    };
  }
}

/**
 * Create a simulated payment session
 */
export async function createSimulatedPaymentSession(gateway, amount, purpose = "deposit") {
  const sessionId = generateId("session");
  
  let orderData;
  if (gateway === "RAZORPAY") {
    orderData = await simulateRazorpayOrder(amount);
  } else {
    orderData = await simulateStripePaymentIntent(amount);
  }
  
  return {
    sessionId,
    gateway,
    amount,
    purpose,
    status: "created",
    orderData,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
  };
}

/**
 * Process a simulated payment (for UI to call after "payment")
 */
export async function processSimulatedPayment(sessionId, gateway, orderId, method = "upi") {
  if (gateway === "RAZORPAY") {
    return await simulateRazorpayPayment(orderId, 0, method);
  } else {
    return await simulateStripeConfirmPayment(orderId);
  }
}

/**
 * Simulate payment verification (unified interface for payment-gateway.js)
 */
export async function simulatePaymentVerification({ orderId, paymentId, signature, gateway }) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  // 95% success rate for verifications (most payments that reach this point succeed)
  const success = Math.random() < 0.95;
  
  return {
    success,
    verified: success,
    simulated: true,
    error: success ? null : "Simulated verification failure",
    data: success ? {
      orderId,
      paymentId,
      signature,
      gateway,
      verifiedAt: new Date().toISOString(),
    } : null,
  };
}

/**
 * Simulate get payment details (unified interface for payment-gateway.js)
 */
export async function simulateGetPaymentDetails(paymentId, gateway) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const amount = 1000 + Math.floor(Math.random() * 9000); // Random amount 1000-10000
  
  if (gateway === "razorpay") {
    return {
      success: true,
      simulated: true,
      data: {
        id: paymentId,
        amount,
        currency: "INR",
        status: "captured",
        method: "upi",
        email: "user@example.com",
        contact: "+919876543210",
        vpa: "user@paytm",
        bank: null,
        wallet: null,
        createdAt: new Date(),
      },
    };
  } else {
    return {
      success: true,
      simulated: true,
      data: {
        id: paymentId,
        amount,
        currency: "inr",
        status: "succeeded",
        paymentMethod: `pm_sim_${Date.now()}`,
        metadata: {},
        createdAt: new Date(),
      },
    };
  }
}

/**
 * Simulate refund (unified interface for payment-gateway.js)
 */
export async function simulateRefund({ paymentId, amount, reason, gateway }) {
  await new Promise(resolve => setTimeout(resolve, randomDelay() * 1.5));
  
  const success = shouldSucceed();
  const refundId = generateId(gateway === "razorpay" ? "rfnd" : "re");
  
  if (success) {
    return {
      success: true,
      simulated: true,
      data: {
        refundId,
        amount: amount || 1000,
        status: gateway === "razorpay" ? "processed" : "succeeded",
        reason,
        createdAt: new Date().toISOString(),
      },
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: getRandomFailureReason(),
    };
  }
}

export const PaymentSimulator = {
  // Legacy functions
  razorpay: {
    createOrder: simulateRazorpayOrder,
    verifyPayment: simulateRazorpayPayment,
    createPayout: simulateRazorpayPayout,
  },
  stripe: {
    createPaymentIntent: simulateStripePaymentIntent,
    confirmPayment: simulateStripeConfirmPayment,
    createPayout: simulateStripePayout,
  },
  createSession: createSimulatedPaymentSession,
  processPayment: processSimulatedPayment,
  
  // Functions used by payment-gateway.js
  simulateRazorpayOrder: async ({ amount, currency, userId, walletId, notes }) => {
    const result = await simulateRazorpayOrder(amount, currency, `wallet_${walletId}_${Date.now()}`);
    return {
      success: true,
      simulated: true,
      data: {
        orderId: result.order.id,
        amount: result.order.amount / 100,
        currency: result.order.currency,
        key: "rzp_test_simulated",
      },
    };
  },
  
  simulateStripePaymentIntent: async ({ amount, currency, userId, walletId, customerEmail, metadata }) => {
    const result = await simulateStripePaymentIntent(amount, currency);
    return {
      success: true,
      simulated: true,
      data: {
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id,
        amount: result.paymentIntent.amount / 100,
        currency: result.paymentIntent.currency,
        publishableKey: "pk_test_simulated",
      },
    };
  },
  
  simulatePaymentVerification,
  simulateGetPaymentDetails,
  simulateRefund,
};

export default PaymentSimulator;
