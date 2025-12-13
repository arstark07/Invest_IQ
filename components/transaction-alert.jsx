"use client";

import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

export function TransactionAlert({
  type = "error", // error, warning, success
  title,
  message,
  details,
  onDismiss,
  action,
  actionLabel,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  const handleAction = () => {
    action?.();
  };

  if (!isOpen) return null;

  const bgColors = {
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    success: "bg-green-50 border-green-200",
  };

  const textColors = {
    error: "text-red-800",
    warning: "text-yellow-800",
    success: "text-green-800",
  };

  const iconColors = {
    error: "text-red-500",
    warning: "text-yellow-500",
    success: "text-green-500",
  };

  const buttonColors = {
    error: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    success: "bg-green-600 hover:bg-green-700",
  };

  return (
    <div className={`border rounded-lg p-4 ${bgColors[type]}`}>
      <div className="flex gap-3">
        <AlertCircle className={`h-5 w-5 ${iconColors[type]} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1">
          <h3 className={`font-semibold ${textColors[type]} mb-1`}>{title}</h3>
          <p className={`text-sm ${textColors[type]} mb-3`}>{message}</p>
          
          {details && (
            <div className={`text-sm ${textColors[type]} bg-white/40 rounded p-2 mb-3 space-y-1`}>
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            {action && (
              <button
                onClick={handleAction}
                className={`text-sm font-semibold text-white px-4 py-2 rounded ${buttonColors[type]} transition-colors`}
              >
                {actionLabel || "Take Action"}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className={`text-sm font-semibold ${textColors[type]} px-4 py-2 rounded bg-white/20 hover:bg-white/30 transition-colors`}
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${textColors[type]} hover:opacity-75 transition-opacity`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Overspend Block Alert Component
 */
export function OverspendBlockAlert({
  currentBalance,
  attemptedAmount,
  shortfall,
  accountName,
  onDismiss,
  onNavigateToDashboard,
}) {
  const details = {
    "Current Balance": `Rs. ${currentBalance.toLocaleString("en-IN")}`,
    "Attempted Amount": `Rs. ${attemptedAmount.toLocaleString("en-IN")}`,
    "Shortfall": `Rs. ${shortfall.toLocaleString("en-IN")}`,
    Account: accountName,
  };

  return (
    <TransactionAlert
      type="error"
      title="Transaction Blocked"
      message="You don't have sufficient balance for this transaction. An alert email has been sent to you with suggested actions."
      details={details}
      action={onNavigateToDashboard}
      actionLabel="View Account Details"
      onDismiss={onDismiss}
    />
  );
}

/**
 * Low Balance Alert Component
 */
export function LowBalanceAlertComponent({
  currentBalance,
  thresholdAmount,
  monthlyBudget,
  accountName,
  onDismiss,
  onNavigateToDashboard,
}) {
  const details = {
    "Current Balance": `Rs. ${currentBalance.toLocaleString("en-IN")}`,
    "Alert Threshold": `Rs. ${thresholdAmount.toLocaleString("en-IN")}`,
    "Monthly Budget": `Rs. ${monthlyBudget.toLocaleString("en-IN")}`,
    Account: accountName,
  };

  return (
    <TransactionAlert
      type="warning"
      title="Low Balance Alert"
      message="Your account balance has fallen below the 10% threshold of your monthly budget."
      details={details}
      action={onNavigateToDashboard}
      actionLabel="View Account"
      onDismiss={onDismiss}
    />
  );
}

/**
 * Transaction Success Alert Component
 */
export function TransactionSuccessAlert({
  type = "EXPENSE",
  amount,
  balanceBefore,
  balanceAfter,
  accountName,
  onDismiss,
}) {
  const details = {
    Type: type === "EXPENSE" ? "Payment" : "Deposit",
    Amount: `Rs. ${amount.toLocaleString("en-IN")}`,
    "Balance Before": `Rs. ${balanceBefore.toLocaleString("en-IN")}`,
    "Balance After": `Rs. ${balanceAfter.toLocaleString("en-IN")}`,
  };

  return (
    <TransactionAlert
      type="success"
      title="Transaction Completed"
      message={`Your ${type === "EXPENSE" ? "payment" : "deposit"} has been successfully processed. A receipt has been sent to your email.`}
      details={details}
      onDismiss={onDismiss}
    />
  );
}
