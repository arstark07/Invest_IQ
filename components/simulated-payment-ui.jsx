"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Smartphone,
  Building2,
  Loader2,
  CheckCircle2,
  Shield,
  AlertCircle,
  X,
} from "lucide-react";

/**
 * Simulated Payment UI - Looks and feels like real Razorpay/Stripe checkout
 * This creates a realistic payment experience without actual payment processing
 */
export default function SimulatedPaymentUI({
  amount,
  gateway,
  onSuccess,
  onCancel,
  merchantName = "Finance Platform",
  customerEmail,
  paymentDetails, // Contains orderId/paymentIntentId from initiation
}) {
  console.log("SimulatedPaymentUI mounted with paymentDetails:", paymentDetails);
  
  const [step, setStep] = useState("method"); // method, otp, processing, success, failed
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [otp, setOtp] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [successPaymentData, setSuccessPaymentData] = useState(null);

  // Simulate OTP resend countdown
  useEffect(() => {
    if (step === "otp" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handlePay = async () => {
    setError("");

    // Validate based on payment method
    if (paymentMethod === "upi") {
      if (!upiId || !upiId.includes("@")) {
        setError("Please enter a valid UPI ID (e.g., name@upi)");
        return;
      }
    } else if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) {
        setError("Please enter a valid card number");
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setError("Please enter a valid expiry date");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError("Please enter a valid CVV");
        return;
      }
    }

    // Simulate payment processing
    setStep("otp");
    setCountdown(30);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setProcessing(true);
    setStep("processing");

    // Simulate payment processing delay (2-4 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));

    // 95% success rate in simulation
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      // Prepare payment data first
      const originalOrderId = paymentDetails?.orderId || paymentDetails?.paymentIntentId;
      console.log("SimulatedPaymentUI: originalOrderId =", originalOrderId);
      const paymentData = {
        paymentId: `pay_sim_${Date.now()}`,
        orderId: originalOrderId || `order_sim_${Date.now()}`,
        signature: `sig_sim_${Date.now()}`,
      };
      
      // Store payment data for the Continue button
      setSuccessPaymentData(paymentData);
      setStep("success");
      console.log("SimulatedPaymentUI: Payment successful, stored paymentData:", paymentData);
    } else {
      setStep("failed");
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep("method");
    setOtp("");
    setError("");
    setProcessing(false);
  };

  // Payment Method Selection Screen
  if (step === "method") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">{merchantName}</p>
                <p className="text-2xl font-bold">₹{amount.toLocaleString("en-IN")}</p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-4 space-y-4">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {/* UPI */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  paymentMethod === "upi" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : ""
                }`}
                onClick={() => setPaymentMethod("upi")}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="upi" id="upi" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">UPI</span>
                      <Badge variant="secondary" className="text-xs">Popular</Badge>
                    </div>
                    {paymentMethod === "upi" && (
                      <div className="mt-3">
                        <Input
                          placeholder="Enter UPI ID (e.g., name@upi)"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="mt-2"
                        />
                        <div className="flex gap-2 mt-2">
                          {["@upi", "@paytm", "@gpay", "@phonepe"].map((suffix) => (
                            <button
                              key={suffix}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (upiId && !upiId.includes("@")) {
                                  setUpiId(upiId + suffix);
                                }
                              }}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                            >
                              {suffix}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  paymentMethod === "card" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : ""
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="card" id="card" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Credit / Debit Card</span>
                    </div>
                    {paymentMethod === "card" && (
                      <div className="mt-3 space-y-3">
                        <Input
                          placeholder="Card Number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            maxLength={5}
                            className="w-24"
                          />
                          <Input
                            placeholder="CVV"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            maxLength={4}
                            type="password"
                            className="w-20"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Net Banking */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  paymentMethod === "netbanking" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : ""
                }`}
                onClick={() => setPaymentMethod("netbanking")}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="netbanking" id="netbanking" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Net Banking</span>
                    </div>
                    {paymentMethod === "netbanking" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["HDFC", "ICICI", "SBI", "Axis", "Kotak"].map((bank) => (
                          <button
                            key={bank}
                            className="px-3 py-1 border rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600"
              onClick={handlePay}
            >
              Pay ₹{amount.toLocaleString("en-IN")}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Secured with 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification Screen
  if (step === "otp") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Verify Payment</p>
                <p className="text-xl font-bold">₹{amount.toLocaleString("en-IN")}</p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="font-medium">Enter OTP</p>
              <p className="text-sm text-gray-500 mt-1">
                We&apos;ve sent a 6-digit code to your registered mobile
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="w-10 h-12 text-center text-lg font-bold"
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const newOtp = otp.split("");
                    newOtp[i] = val;
                    setOtp(newOtp.join(""));
                    // Auto-focus next input
                    if (val && i < 5) {
                      const nextInput = e.target.parentElement.children[i + 1];
                      nextInput?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) {
                      const prevInput = e.target.parentElement.children[i - 1];
                      prevInput?.focus();
                    }
                  }}
                />
              ))}
            </div>

            {/* Demo hint for simulation */}
            <p className="text-xs text-center text-gray-400">
              For demo: Enter any 6 digits (e.g., 123456)
            </p>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600"
              onClick={handleVerifyOtp}
              disabled={otp.length < 6}
            >
              Verify & Pay
            </Button>

            <p className="text-center text-sm text-gray-500">
              Didn&apos;t receive?{" "}
              {countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={() => setCountdown(30)}
                  className="text-indigo-600 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Processing Screen
  if (step === "processing") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 p-8">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-indigo-600" />
            <p className="mt-4 text-lg font-medium">Processing Payment</p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait, do not close this window...
            </p>
            <p className="text-2xl font-bold mt-4">₹{amount.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <p className="mt-4 text-xl font-bold text-green-600">Payment Successful!</p>
            <p className="text-3xl font-bold mt-2">₹{amount.toLocaleString("en-IN")}</p>
            <p className="text-sm text-gray-500 mt-2">
              Money has been added to your wallet
            </p>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500">
              Transaction ID: TXN{Date.now().toString().slice(-8)}
            </div>
            <Button
              className="mt-4 w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                console.log("Continue button clicked, successPaymentData:", successPaymentData);
                if (successPaymentData) {
                  onSuccess(successPaymentData);
                } else {
                  // Fallback: create payment data now
                  const originalOrderId = paymentDetails?.orderId || paymentDetails?.paymentIntentId;
                  const paymentData = {
                    paymentId: `pay_sim_${Date.now()}`,
                    orderId: originalOrderId || `order_sim_${Date.now()}`,
                    signature: `sig_sim_${Date.now()}`,
                  };
                  onSuccess(paymentData);
                }
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Failed Screen
  if (step === "failed") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <p className="mt-4 text-xl font-bold text-red-600">Payment Failed</p>
            <p className="text-sm text-gray-500 mt-2">
              Your payment could not be processed. No amount has been deducted.
            </p>
            <div className="mt-6 space-y-2">
              <Button className="w-full" onClick={handleRetry}>
                Try Again
              </Button>
              <Button variant="outline" className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
