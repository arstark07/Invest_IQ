"use server";

import { render } from "@react-email/components";
import TransactionReceipt from "@/emails/transaction-receipt";
import OverspendAlert from "@/emails/overspend-alert";
import LowBalanceAlert from "@/emails/low-balance-alert";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "InvestIQ Finance", email: "noreply@investiq.com" };

/**
 * Send email via Brevo API
 */
async function sendViaBrevo({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY not configured");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }

  return response.json();
}

/**
 * Send transaction receipt email
 */
export async function sendTransactionReceipt(data) {
  try {
    const html = await render(<TransactionReceipt {...data} />);
    const type = data.type === "EXPENSE" ? "Payment" : "Deposit";
    
    return await sendViaBrevo({
      to: data.userEmail,
      subject: `${type} Confirmation - Rs. ${data.amount.toLocaleString("en-IN")}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send transaction receipt:", error.message);
    return { error: error.message };
  }
}

/**
 * Send overspend alert email
 */
export async function sendOverspendAlert(data) {
  try {
    const html = await render(<OverspendAlert {...data} />);
    
    return await sendViaBrevo({
      to: data.userEmail,
      subject: "Transaction Blocked - Insufficient Balance",
      html,
    });
  } catch (error) {
    console.error("Failed to send overspend alert:", error.message);
    return { error: error.message };
  }
}

/**
 * Send low balance alert email
 */
export async function sendLowBalanceAlert(data) {
  try {
    const html = await render(<LowBalanceAlert {...data} />);
    
    return await sendViaBrevo({
      to: data.userEmail,
      subject: "Low Balance Alert - Action Required",
      html,
    });
  } catch (error) {
    console.error("Failed to send low balance alert:", error.message);
    return { error: error.message };
  }
}
