"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Building2, AlertCircle, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { initiateWalletWithdrawal, verifyWalletPin } from "@/actions/wallet";
import { getUserAccounts } from "@/actions/dashboard";

export default function WalletWithdrawModal({ open, onClose, onSuccess, wallet }) {
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [step, setStep] = useState("amount"); // amount, pin, processing, success

  // Fetch user's dashboard accounts
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const userAccounts = await getUserAccounts();
        setAccounts(userAccounts || []);
        // Auto-select default account
        const defaultAcc = userAccounts?.find(acc => acc.isDefault);
        if (defaultAcc) {
          setSelectedAccountId(defaultAcc.id);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      } finally {
        setLoadingAccounts(false);
      }
    }
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }

    if (withdrawAmount > wallet?.availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select an account to withdraw to");
      return;
    }

    // Require PIN for all withdrawals
    if (!wallet?.pin) {
      toast.error("Please set a wallet PIN first to make withdrawals");
      return;
    }

    setStep("pin");
  };

  const handlePinVerification = async () => {
    if (pin.length < 4) {
      toast.error("Please enter your PIN");
      return;
    }

    setLoading(true);
    const result = await verifyWalletPin(pin);

    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    await processWithdrawal();
  };

  const processWithdrawal = async () => {
    setStep("processing");

    try {
      const result = await initiateWalletWithdrawal({
        amount: parseFloat(amount),
        accountId: selectedAccountId,
      });

      if (result.success) {
        setStep("success");
        toast.success("Withdrawal successful! Amount transferred to your account.");
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        toast.error(result.error);
        setStep("amount");
      }
    } catch (error) {
      toast.error("Withdrawal failed");
      setStep("amount");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setPin("");
    setSelectedAccountId(accounts?.find(acc => acc.isDefault)?.id || "");
    setStep("amount");
    setLoading(false);
    onClose();
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw to Account</DialogTitle>
          <DialogDescription>
            Transfer money from your wallet to your bank account instantly
          </DialogDescription>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-6">
            {/* Available Balance */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">
                ₹{wallet?.availableBalance?.toLocaleString("en-IN") || "0"}
              </p>
            </div>

            {/* Select Account */}
            <div className="space-y-2">
              <Label>Withdraw To</Label>
              {loadingAccounts ? (
                <div className="flex items-center justify-center h-12">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  No accounts found. Please create an account in the dashboard first.
                </div>
              ) : (
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{account.name}</span>
                          <span className="text-muted-foreground">
                            (₹{parseFloat(account.balance).toLocaleString("en-IN")})
                          </span>
                          {account.isDefault && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">Default</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Withdrawal Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg h-12"
                  min={100}
                  max={wallet?.availableBalance || 0}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Min: ₹100 | Max: ₹{wallet?.availableBalance?.toLocaleString("en-IN") || "0"}
              </p>
            </div>

            {/* Selected Account Info */}
            {selectedAccount && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-green-50 dark:bg-green-900/20">
                <Building2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{selectedAccount.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAccount.type} Account • Instant Transfer
                  </p>
                </div>
              </div>
            )}

            {/* PIN Required Note */}
            {!wallet?.pin && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>
                  You need to set a wallet PIN before making withdrawals.
                  Click the &quot;Set PIN&quot; button on the wallet page.
                </span>
              </div>
            )}

            <Button
              className="w-full h-12"
              onClick={handleWithdraw}
              disabled={!amount || parseFloat(amount) < 100 || !selectedAccountId || !wallet?.pin || loading}
            >
              Continue
            </Button>
          </div>
        )}

        {step === "pin" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Enter your wallet PIN to confirm withdrawal of
              </p>
              <p className="text-2xl font-bold mt-2">
                ₹{parseFloat(amount).toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                to {selectedAccount?.name}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Wallet PIN</Label>
              <Input
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPin("");
                  setStep("amount");
                }}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handlePinVerification}
                disabled={pin.length < 4 || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Withdrawal"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 font-medium">Processing Withdrawal...</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-4 font-medium text-lg">Withdrawal Successful!</p>
            <p className="text-sm text-muted-foreground mt-2">
              ₹{parseFloat(amount).toLocaleString("en-IN")} has been transferred to {selectedAccount?.name}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
