"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, CheckCircle2, KeyRound, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { setWalletPin, verifyWalletPin, generatePinChangeOTP, changePinWithOTP } from "@/actions/wallet";

export default function WalletPinModal({ open, onClose, hasExistingPin }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(hasExistingPin ? "verify" : "create"); // verify, otp, create, success

  const handleVerifyAndRequestOTP = async () => {
    if (currentPin.length < 4) {
      toast.error("Please enter your current PIN");
      return;
    }

    setLoading(true);
    
    // First verify current PIN
    const verifyResult = await verifyWalletPin(currentPin);
    
    if (!verifyResult.success) {
      toast.error(verifyResult.error);
      setLoading(false);
      return;
    }

    // Generate OTP for PIN change
    const otpResult = await generatePinChangeOTP();
    
    if (!otpResult.success) {
      toast.error(otpResult.error);
      setLoading(false);
      return;
    }

    // Store OTP for display (simulation mode)
    setGeneratedOtp(otpResult.data.otp);
    setStep("otp");
    setLoading(false);
  };

  const handleOTPVerification = () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    
    if (otp !== generatedOtp) {
      toast.error("Invalid OTP. Please check and try again.");
      return;
    }
    
    // OTP verified, proceed to create new PIN
    setStep("create");
  };

  const handleSetPin = async () => {
    if (newPin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    setLoading(true);

    try {
      if (hasExistingPin) {
        // Use OTP-verified PIN change
        const result = await changePinWithOTP({
          currentPin,
          newPin,
          otp,
        });

        if (result.success) {
          setStep("success");
          toast.success("PIN changed successfully!");
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else {
          toast.error(result.error);
        }
      } else {
        // First time setting PIN (no OTP needed)
        const result = await setWalletPin(newPin);

        if (result.success) {
          setStep("success");
          toast.success("PIN set successfully!");
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error("Failed to set PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setOtp("");
    setGeneratedOtp("");
    setStep(hasExistingPin ? "verify" : "create");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {hasExistingPin ? "Change Wallet PIN" : "Set Wallet PIN"}
          </DialogTitle>
          <DialogDescription>
            Secure your wallet with a 4-6 digit PIN for transactions
          </DialogDescription>
        </DialogHeader>

        {step === "verify" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Current PIN</Label>
              <Input
                type="password"
                placeholder="Enter current PIN"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />
            </div>

            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <KeyRound className="h-4 w-4 mt-0.5" />
              <span>
                An OTP will be required to verify your identity before changing the PIN.
              </span>
            </div>

            <Button
              className="w-full"
              onClick={handleVerifyAndRequestOTP}
              disabled={currentPin.length < 4 || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Continue & Get OTP"
              )}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the OTP to verify your identity
              </p>
            </div>

            {/* OTP Display Box (Simulation) */}
            <div className="p-4 rounded-lg border-2 border-dashed border-green-300 bg-green-50 dark:bg-green-900/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your OTP (Simulation)</p>
              <p className="text-3xl font-mono font-bold text-green-700 tracking-wider">{generatedOtp}</p>
              <p className="text-xs text-muted-foreground mt-2">Expires in 5 minutes</p>
            </div>

            <div className="space-y-2">
              <Label>Enter OTP</Label>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setOtp("");
                  setGeneratedOtp("");
                  setStep("verify");
                }}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleOTPVerification}
                disabled={otp.length !== 6 || loading}
              >
                Verify OTP
              </Button>
            </div>
          </div>
        )}

        {step === "create" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>New PIN</Label>
              <Input
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                placeholder="Re-enter PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />
              {confirmPin && newPin !== confirmPin && (
                <p className="text-xs text-red-500">PINs do not match</p>
              )}
            </div>

            <div className="flex gap-3">
              {hasExistingPin && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("otp")}
                >
                  Back
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleSetPin}
                disabled={newPin.length < 4 || newPin !== confirmPin || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  hasExistingPin ? "Change PIN" : "Set PIN"
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This PIN will be required for all wallet transactions
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-4 font-medium text-lg">
              {hasExistingPin ? "PIN Changed Successfully!" : "PIN Set Successfully!"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your wallet is now secured with a PIN
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
