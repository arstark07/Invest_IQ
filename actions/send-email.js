"use server";

import { render } from "@react-email/components";

/**
 * Send email via Brevo API
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {JSX.Element} params.react - React email component
 * @returns {Promise<Object>} Response with success status
 */
export async function sendEmail({ to, subject, react }) {
  if (!process.env.BREVO_API_KEY) {
    return { success: false, error: "BREVO_API_KEY is not configured" };
  }

  try {
    // Render React component to HTML
    const html = await render(react);

    // Send via Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "InvestIQ Finance",
          email: "noreply@investiq.com",
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send email via Brevo");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}
