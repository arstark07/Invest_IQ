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
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { simpleWalletDeposit, verifyWalletPin } from "@/actions/wallet";

export default function WalletDepositModal({ open, onClose, onSuccess, wallet }) {
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("amount"); // amount, pin, processing, success

  const handleContinue = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount < 100) {
      toast.error("Minimum deposit amount is ₹100");
      return;
    }

    if (depositAmount > 100000) {
      toast.error("Maximum deposit amount is ₹1,00,000");
      return;
    }

    // PIN required for all transactions
    if (!wallet?.pin) {
      toast.error("Please set a wallet PIN first to make deposits");
      return;
    }

    setStep("pin");
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4 || pin.length > 6) {
      toast.error("Please enter your PIN (4-6 digits)");
      return;
    }

    setLoading(true);

    // Verify PIN first
    const pinResult = await verifyWalletPin(pin);
    if (!pinResult.success) {
      toast.error(pinResult.error || "Invalid PIN");
      setLoading(false);
      return;
    }

    // Show processing state
    setStep("processing");

    // Process the deposit
    try {
      const result = await simpleWalletDeposit({
        amount: parseFloat(amount),
      });

      if (result.success) {
        setStep("success");
        toast.success(`₹${parseFloat(amount).toLocaleString("en-IN")} added to wallet!`);
        
        // Close after 2 seconds
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      } else {
        toast.error(result.error || "Deposit failed");
        setStep("amount");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Deposit failed. Please try again.");
      setStep("amount");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setPin("");
    setStep("amount");
    setLoading(false);
    onClose();
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Money to Wallet</DialogTitle>
          <DialogDescription>
            Add money instantly using simulated payment
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Amount Entry */}
        {step === "amount" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Enter Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-medium">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-2xl h-14 font-semibold"
                  min="100"
                  max="100000"
                />
              </div>
              <p className="text-xs text-muted-foreground">Min ₹100 • Max ₹1,00,000</p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={amount === quickAmount.toString() ? "border-primary bg-primary/10" : ""}
                >
                  ₹{quickAmount.toLocaleString("en-IN")}
                </Button>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleContinue}
              disabled={!amount || parseFloat(amount) < 100}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: PIN Entry */}
        {step === "pin" && (
          <div className="space-y-4 py-4">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold">₹{parseFloat(amount).toLocaleString("en-IN")}</p>
              <p className="text-sm text-muted-foreground">Amount to add</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Enter Wallet PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("amount");
                  setPin("");
                }}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handlePinSubmit}
                disabled={pin.length < 4 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Add Money"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 font-medium">Processing your deposit...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Adding ₹{parseFloat(amount).toLocaleString("en-IN")} to your wallet
            </p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-4 font-medium text-lg">Money Added Successfully!</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ₹{parseFloat(amount).toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              has been added to your wallet
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
