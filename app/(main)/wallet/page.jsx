"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Building2,
  Smartphone,
  Shield,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOrCreateWallet,
  initiateWalletDeposit,
  confirmWalletDeposit,
  getWalletTransactions,
  setWalletPin,
  verifyWalletPin,
} from "@/actions/wallet";
import { getKYCStatus } from "@/actions/kyc";
import WalletDepositModal from "./_components/wallet-deposit-modal";
import WalletWithdrawModal from "./_components/wallet-withdraw-modal";
import WalletPinModal from "./_components/wallet-pin-modal";
import WalletTransactionList from "./_components/wallet-transaction-list";
import KYCPrompt from "@/components/kyc-prompt";

export default function WalletPage() {
  const { user } = useUser();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);

  useEffect(() => {
    loadKYCStatusFirst();
  }, []);

  const loadKYCStatusFirst = async () => {
    try {
      const result = await getKYCStatus();
      if (result.success) {
        setKycVerified(result.data.kycVerified);
        if (result.data.kycVerified) {
          // Only load wallet data if KYC is verified
          loadWalletData();
        }
      }
    } catch (error) {
      console.error("Failed to load KYC status:", error);
    } finally {
      setKycLoading(false);
      setLoading(false);
    }
  };

  const loadWalletData = async () => {
    try {
      const [walletResult, transactionsResult] = await Promise.all([
        getOrCreateWallet(),
        getWalletTransactions({ page: 1, limit: 10 }),
      ]);

      if (walletResult.success) {
        setWallet(walletResult.data);
      }

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data.transactions);
      }
    } catch (error) {
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
    toast.success("Wallet refreshed");
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show KYC prompt if not verified
  if (!kycVerified) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold gradient-title flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete KYC to access your digital wallet
          </p>
        </div>
        <KYCPrompt isGate={true} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-title flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your funds and investments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPinModalOpen(true)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {wallet?.pin ? "Change PIN" : "Set PIN"}
          </Button>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Balance */}
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <h2 className="text-4xl font-bold">
                ₹{wallet?.availableBalance?.toLocaleString("en-IN") || "0"}
              </h2>
              {wallet?.lockedBalance > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  ₹{wallet.lockedBalance.toLocaleString("en-IN")} locked for investments
                </p>
              )}
              
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setDepositModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Money
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWithdrawModalOpen(true)}
                  disabled={!wallet?.availableBalance}
                  className="gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Withdraw
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground">Daily Limit</p>
                <p className="text-lg font-semibold">
                  ₹{wallet?.dailyLimit?.toLocaleString("en-IN") || "1,00,000"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground">Monthly Limit</p>
                <p className="text-lg font-semibold">
                  ₹{wallet?.monthlyLimit?.toLocaleString("en-IN") || "5,00,000"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Money */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Money</CardTitle>
          <CardDescription>Select an amount to add to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="h-12 px-6"
                onClick={() => {
                  setDepositModalOpen(true);
                  // Pre-fill amount in modal
                }}
              >
                ₹{amount.toLocaleString("en-IN")}
              </Button>
            ))}
            <Button
              variant="secondary"
              className="h-12 px-6"
              onClick={() => setDepositModalOpen(true)}
            >
              Custom Amount
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all">
          <WalletTransactionList transactions={transactions} />
        </TabsContent>
        <TabsContent value="deposits">
          <WalletTransactionList
            transactions={transactions.filter((t) => t.type === "DEPOSIT")}
          />
        </TabsContent>
        <TabsContent value="withdrawals">
          <WalletTransactionList
            transactions={transactions.filter((t) => t.type === "WITHDRAWAL")}
          />
        </TabsContent>
        <TabsContent value="investments">
          <WalletTransactionList
            transactions={transactions.filter((t) => t.type === "INVESTMENT")}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <WalletDepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={loadWalletData}
        wallet={wallet}
      />
      
      <WalletWithdrawModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onSuccess={loadWalletData}
        wallet={wallet}
      />

      <WalletPinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        hasExistingPin={!!wallet?.pin}
      />
    </div>
  );
}
