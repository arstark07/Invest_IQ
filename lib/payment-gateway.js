"use server";

import { PaymentSimulator } from "./simulate-payment";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const USE_RAZORPAY_SIMULATION = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || process.env.FORCE_SIMULATION === "true";
const USE_STRIPE_SIMULATION = !STRIPE_SECRET_KEY || process.env.FORCE_SIMULATION === "true";

export async function createRazorpayOrder({ amount, currency = "INR", userId, walletId, notes = {} }) {
  if (USE_RAZORPAY_SIMULATION) {
    console.log("SIMULATION MODE: Creating simulated Razorpay order");
    return PaymentSimulator.simulateRazorpayOrder({ amount, currency, userId, walletId, notes });
  }
  try {
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), currency,
      receipt: `wallet_${walletId}_${Date.now()}`,
      notes: { userId, walletId, purpose: "wallet_topup", ...notes },
    });
    return { success: true, data: { orderId: order.id, amount: order.amount / 100, currency: order.currency, key: RAZORPAY_KEY_ID } };
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return { success: false, error: error.message || "Failed to create payment order" };
  }
}

export async function verifyRazorpayPayment({ orderId, paymentId, signature }) {
  if (USE_RAZORPAY_SIMULATION) {
    console.log("SIMULATION MODE: Verifying simulated Razorpay payment");
    return PaymentSimulator.simulatePaymentVerification({ orderId, paymentId, signature, gateway: "razorpay" });
  }
  try {
    const crypto = await import("crypto");
    const expectedSignature = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    const isValid = expectedSignature === signature;
    return { success: isValid, verified: isValid, error: isValid ? null : "Invalid payment signature" };
  } catch (error) {
    return { success: false, verified: false, error: error.message };
  }
}

export async function getRazorpayPayment(paymentId) {
  if (USE_RAZORPAY_SIMULATION) {
    console.log("SIMULATION MODE: Fetching simulated Razorpay payment");
    return PaymentSimulator.simulateGetPaymentDetails(paymentId, "razorpay");
  }
  try {
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, data: { id: payment.id, amount: payment.amount / 100, currency: payment.currency, status: payment.status, method: payment.method, createdAt: new Date(payment.created_at * 1000) } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createStripePaymentIntent({ amount, currency = "inr", userId, walletId, customerEmail, metadata = {} }) {
  if (USE_STRIPE_SIMULATION) {
    console.log("SIMULATION MODE: Creating simulated Stripe payment intent");
    return PaymentSimulator.simulateStripePaymentIntent({ amount, currency, userId, walletId, customerEmail, metadata });
  }
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    let customer;
    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    if (existingCustomers.data.length > 0) { customer = existingCustomers.data[0]; }
    else { customer = await stripe.customers.create({ email: customerEmail, metadata: { userId, walletId } }); }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), currency: currency.toLowerCase(), customer: customer.id,
      metadata: { userId, walletId, purpose: "wallet_topup", ...metadata },
      automatic_payment_methods: { enabled: true },
    });
    return { success: true, data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: paymentIntent.amount / 100, currency: paymentIntent.currency, publishableKey: STRIPE_PUBLISHABLE_KEY } };
  } catch (error) {
    return { success: false, error: error.message || "Failed to create payment intent" };
  }
}

export async function getStripePaymentIntent(paymentIntentId) {
  if (USE_STRIPE_SIMULATION) {
    console.log("SIMULATION MODE: Fetching simulated Stripe payment");
    return PaymentSimulator.simulateGetPaymentDetails(paymentIntentId, "stripe");
  }
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { success: true, data: { id: paymentIntent.id, amount: paymentIntent.amount / 100, currency: paymentIntent.currency, status: paymentIntent.status, paymentMethod: paymentIntent.payment_method, metadata: paymentIntent.metadata, createdAt: new Date(paymentIntent.created * 1000) } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createPaymentOrder({ gateway = "RAZORPAY", amount, currency = "INR", userId, walletId, customerEmail, metadata = {} }) {
  if (gateway === "STRIPE") {
    return createStripePaymentIntent({ amount, currency, userId, walletId, customerEmail, metadata });
  } else {
    const result = await createRazorpayOrder({ amount, currency, userId, walletId, notes: metadata });
    if (result.success) { return { success: true, data: { ...result.data, paymentIntentId: result.data.orderId } }; }
    return result;
  }
}

export async function isSimulationMode(gateway = "RAZORPAY") {
  return gateway === "STRIPE" ? USE_STRIPE_SIMULATION : USE_RAZORPAY_SIMULATION;
}
