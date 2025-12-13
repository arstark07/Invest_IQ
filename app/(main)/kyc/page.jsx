"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  Fingerprint,
  Building2,
  ArrowRight,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getKYCStatus,
  verifyPAN,
  initiateAadhaarVerification,
  verifyAadhaar,
  verifyBankAccount,
  completeKYC,
} from "@/actions/kyc";

export default function KYCPage() {
  const { user, isLoaded } = useUser();
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("overview"); // overview, pan, aadhaar, bank, complete
  const [processing, setProcessing] = useState(false);

  // PAN State
  const [panNumber, setPanNumber] = useState("");
  const [panName, setPanName] = useState("");
  const [panDob, setPanDob] = useState("");

  // Aadhaar State
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarTransactionId, setAadhaarTransactionId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Bank State
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  useEffect(() => {
    loadKYCStatus();
  }, []);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  useEffect(() => {
    if (user?.firstName && user?.lastName) {
      setPanName(`${user.firstName} ${user.lastName}`);
      setAccountHolderName(`${user.firstName} ${user.lastName}`);
    }
  }, [user]);

  const loadKYCStatus = async () => {
    try {
      const result = await getKYCStatus();
      if (result.success) {
        setKycData(result.data);
      }
    } catch (error) {
      toast.error("Failed to load KYC status");
    } finally {
      setLoading(false);
    }
  };

  const isPANVerified = kycData?.records?.some(
    (r) => r.type === "PAN" && r.status === "VERIFIED"
  );
  const isAadhaarVerified = kycData?.records?.some(
    (r) => r.type === "AADHAAR" && r.status === "VERIFIED"
  );
  const isBankVerified = kycData?.records?.some(
    (r) => r.type === "BANK_ACCOUNT" && r.status === "VERIFIED"
  );

  // Progress is based on PAN and Aadhaar only (bank is optional)
  const progress = ((isPANVerified ? 1 : 0) + (isAadhaarVerified ? 1 : 0)) * 50;

  // Format PAN input
  const formatPAN = (value) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  };

  // Format Aadhaar input
  const formatAadhaar = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Format IFSC input
  const formatIFSC = (value) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
  };

  // Handle PAN Verification
  const handlePANVerify = async () => {
    if (panNumber.length !== 10) {
      toast.error("Please enter a valid 10-character PAN number");
      return;
    }
    if (!panName.trim()) {
      toast.error("Please enter your name as on PAN card");
      return;
    }
    if (!panDob) {
      toast.error("Please enter your date of birth");
      return;
    }

    setProcessing(true);
    try {
      const result = await verifyPAN({
        panNumber,
        name: panName,
        dateOfBirth: panDob,
      });

      if (result.success) {
        toast.success("PAN verified successfully!");
        await loadKYCStatus();
        setStep("overview");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("PAN verification failed");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Aadhaar OTP Send
  const handleSendAadhaarOTP = async () => {
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");
    if (cleanAadhaar.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number");
      return;
    }

    setProcessing(true);
    try {
      const result = await initiateAadhaarVerification({
        aadhaarNumber: cleanAadhaar,
      });

      if (result.success) {
        toast.success(`OTP sent to ${result.data.maskedMobile}`);
        setAadhaarTransactionId(result.data.transactionId);
        setOtpSent(true);
        setOtpCountdown(30);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Aadhaar Verification
  const handleAadhaarVerify = async () => {
    if (aadhaarOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setProcessing(true);
    try {
      const result = await verifyAadhaar({
        aadhaarNumber: aadhaarNumber.replace(/\s/g, ""),
        otp: aadhaarOtp,
        transactionId: aadhaarTransactionId,
      });

      if (result.success) {
        toast.success("Aadhaar verified successfully!");
        await loadKYCStatus();
        setStep("overview");
        setOtpSent(false);
        setAadhaarOtp("");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Aadhaar verification failed");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Bank Verification
  const handleBankVerify = async () => {
    if (accountNumber.length < 9) {
      toast.error("Please enter a valid account number");
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      toast.error("Account numbers do not match");
      return;
    }
    if (ifscCode.length !== 11) {
      toast.error("Please enter a valid 11-character IFSC code");
      return;
    }
    if (!accountHolderName.trim()) {
      toast.error("Please enter account holder name");
      return;
    }

    setProcessing(true);
    try {
      const result = await verifyBankAccount({
        accountNumber,
        ifscCode,
        accountHolderName,
      });

      if (result.success) {
        toast.success("Bank account verified successfully!");
        await loadKYCStatus();
        setStep("overview");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Bank verification failed");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Complete KYC
  const handleCompleteKYC = async () => {
    setProcessing(true);
    try {
      const result = await completeKYC();
      if (result.success) {
        toast.success("KYC completed successfully!");
        await loadKYCStatus();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to complete KYC");
    } finally {
      setProcessing(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          KYC Verification
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete your verification to unlock all features
        </p>
      </div>

      {/* KYC Status Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                kycData?.kycVerified 
                  ? "bg-green-100 dark:bg-green-900/30" 
                  : "bg-amber-100 dark:bg-amber-900/30"
              }`}>
                {kycData?.kycVerified ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {kycData?.kycVerified ? "KYC Verified" : "KYC Pending"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {kycData?.kycVerified 
                    ? "Your identity has been verified" 
                    : "Complete verification to start investing"}
                </p>
              </div>
            </div>
            <Badge variant={kycData?.kycVerified ? "default" : "secondary"}>
              {kycData?.kycStatus || "PENDING"}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      {step === "overview" && (
        <div className="space-y-4">
          {/* PAN Card */}
          <Card 
            className={`cursor-pointer transition hover:border-primary/50 ${
              isPANVerified ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : ""
            }`}
            onClick={() => !isPANVerified && setStep("pan")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    isPANVerified ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
                  }`}>
                    <CreditCard className={`h-6 w-6 ${
                      isPANVerified ? "text-green-600" : "text-primary"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">PAN Verification</p>
                    <p className="text-sm text-muted-foreground">
                      {isPANVerified 
                        ? `Verified: ${kycData?.panNumber}` 
                        : "Verify your Permanent Account Number"}
                    </p>
                  </div>
                </div>
                {isPANVerified ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aadhaar Card */}
          <Card 
            className={`cursor-pointer transition hover:border-primary/50 ${
              isAadhaarVerified ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : ""
            } ${!isPANVerified ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => !isAadhaarVerified && isPANVerified && setStep("aadhaar")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    isAadhaarVerified ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
                  }`}>
                    <Fingerprint className={`h-6 w-6 ${
                      isAadhaarVerified ? "text-green-600" : "text-primary"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">Aadhaar Verification</p>
                    <p className="text-sm text-muted-foreground">
                      {isAadhaarVerified 
                        ? `Verified: XXXXXXXX${kycData?.aadhaarNumber}` 
                        : "Verify your Aadhaar with OTP"}
                    </p>
                  </div>
                </div>
                {isAadhaarVerified ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : !isPANVerified ? (
                  <Badge variant="secondary">Complete PAN first</Badge>
                ) : (
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Card - Completely Optional */}
          <Card 
            className={`cursor-pointer transition hover:border-primary/50 ${
              isBankVerified ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : "border-dashed"
            }`}
            onClick={() => !isBankVerified && setStep("bank")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    isBankVerified ? "bg-green-100 dark:bg-green-900/30" : "bg-muted/50"
                  }`}>
                    <Building2 className={`h-6 w-6 ${
                      isBankVerified ? "text-green-600" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Bank Account</p>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isBankVerified 
                        ? "Bank account verified" 
                        : "Not required for KYC completion"}
                    </p>
                  </div>
                </div>
                {isBankVerified ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complete KYC Button */}
          {isPANVerified && isAadhaarVerified && !kycData?.kycVerified && (
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Ready to Complete KYC</p>
                    <p className="text-sm text-muted-foreground">
                      All mandatory verifications are done
                    </p>
                  </div>
                  <Button onClick={handleCompleteKYC} disabled={processing}>
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Complete KYC
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Demo Notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Demo Mode:</strong> This is a simulation. Use any valid format PAN (e.g., ABCDE1234F), 
              any 12-digit Aadhaar, and any 6-digit OTP to test the verification flow.
            </p>
          </div>
        </div>
      )}

      {/* PAN Verification Form */}
      {step === "pan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              PAN Verification
            </CardTitle>
            <CardDescription>
              Enter your PAN details for identity verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>PAN Number</Label>
              <Input
                placeholder="ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(formatPAN(e.target.value))}
                className="uppercase text-lg tracking-wider"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                10-character alphanumeric PAN
              </p>
            </div>

            <div className="space-y-2">
              <Label>Name (as on PAN)</Label>
              <Input
                placeholder="Full Name"
                value={panName}
                onChange={(e) => setPanName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={panDob}
                onChange={(e) => setPanDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("overview")}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handlePANVerify}
                disabled={processing || panNumber.length !== 10}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify PAN"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aadhaar Verification Form */}
      {step === "aadhaar" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Aadhaar Verification
            </CardTitle>
            <CardDescription>
              We&apos;ll send an OTP to your Aadhaar-linked mobile number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Aadhaar Number</Label>
              <Input
                placeholder="0000 0000 0000"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(formatAadhaar(e.target.value))}
                className="text-lg tracking-wider"
                disabled={otpSent}
              />
              <p className="text-xs text-muted-foreground">
                12-digit Aadhaar number
              </p>
            </div>

            {!otpSent ? (
              <Button
                className="w-full"
                onClick={handleSendAadhaarOTP}
                disabled={processing || aadhaarNumber.replace(/\s/g, "").length !== 12}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            ) : (
              <>
                {/* OTP Display Box (Simulation) */}
                <div className="p-4 rounded-lg border-2 border-dashed border-green-300 bg-green-50 dark:bg-green-900/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your OTP (Simulation Mode)</p>
                  <p className="text-3xl font-mono font-bold text-green-700 tracking-wider">123456</p>
                  <p className="text-xs text-muted-foreground mt-2">Use this OTP for verification</p>
                </div>

                <div className="space-y-2">
                  <Label>Enter OTP</Label>
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Enter the 6-digit OTP</span>
                    {otpCountdown > 0 ? (
                      <span>Resend in {otpCountdown}s</span>
                    ) : (
                      <button
                        onClick={handleSendAadhaarOTP}
                        className="text-primary hover:underline"
                        disabled={processing}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleAadhaarVerify}
                  disabled={processing || aadhaarOtp.length !== 6}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Aadhaar"
                  )}
                </Button>
              </>
            )}

            <Button variant="outline" className="w-full" onClick={() => {
              setStep("overview");
              setOtpSent(false);
              setAadhaarOtp("");
            }}>
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bank Verification Form */}
      {step === "bank" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Account Verification
            </CardTitle>
            <CardDescription>
              Link your bank account for withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm Account Number</Label>
              <Input
                placeholder="Re-enter account number"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ""))}
              />
              {confirmAccountNumber && accountNumber !== confirmAccountNumber && (
                <p className="text-xs text-red-500">Account numbers don&apos;t match</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>IFSC Code</Label>
              <Input
                placeholder="SBIN0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(formatIFSC(e.target.value))}
                className="uppercase"
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label>Account Holder Name</Label>
              <Input
                placeholder="Name as per bank records"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("overview")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleBankVerify}
                disabled={processing || accountNumber !== confirmAccountNumber}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify Bank Account"
                )}
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => setStep("overview")}
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
