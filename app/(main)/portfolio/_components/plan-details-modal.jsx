"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PlayCircle,
  PauseCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  Loader2,
  Wallet,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  pauseInvestmentPlan,
  resumeInvestmentPlan,
  cancelInvestmentPlan,
  withdrawReturnsToWallet,
  redeemInvestmentToWallet,
  getWithdrawableReturns,
} from "@/actions/investment";

export default function PlanDetailsModal({ plan, open, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);
  const [withdrawableReturns, setWithdrawableReturns] = useState(null);
  const [loadingReturns, setLoadingReturns] = useState(false);

  // Load withdrawable returns when modal opens
  useEffect(() => {
    if (open && plan?.id) {
      loadWithdrawableReturns();
    }
  }, [open, plan?.id]);

  const loadWithdrawableReturns = async () => {
    setLoadingReturns(true);
    try {
      const result = await getWithdrawableReturns(plan.id);
      if (result.success) {
        setWithdrawableReturns(result.data);
      }
    } catch (error) {
      console.error("Failed to load returns:", error);
    } finally {
      setLoadingReturns(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    setAction("pause");
    try {
      const result = await pauseInvestmentPlan(plan.id);
      if (result.success) {
        toast.success("Plan paused");
        onUpdate();
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to pause plan");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    setAction("resume");
    try {
      const result = await resumeInvestmentPlan(plan.id);
      if (result.success) {
        toast.success("Plan resumed");
        onUpdate();
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to resume plan");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this plan? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setAction("cancel");
    try {
      const result = await cancelInvestmentPlan(plan.id);
      if (result.success) {
        toast.success("Plan cancelled");
        onUpdate();
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to cancel plan");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleWithdrawReturns = async () => {
    setLoading(true);
    setAction("withdraw");
    try {
      const result = await withdrawReturnsToWallet(plan.id);
      if (result.success) {
        toast.success(`₹${result.data.withdrawnAmount.toFixed(2)} transferred to your wallet!`);
        onUpdate();
        loadWithdrawableReturns(); // Refresh returns data
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to withdraw returns");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleRedeemInvestment = async () => {
    if (!confirm("Are you sure you want to redeem this entire investment? The principal and returns will be transferred to your wallet.")) {
      return;
    }

    setLoading(true);
    setAction("redeem");
    try {
      const result = await redeemInvestmentToWallet(plan.id);
      if (result.success) {
        toast.success(
          `Investment redeemed! ₹${result.data.totalRedeemed.toFixed(2)} transferred to wallet (Principal: ₹${result.data.principal.toLocaleString("en-IN")}, Returns: ₹${result.data.returns.toFixed(2)})`
        );
        onUpdate();
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to redeem investment");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const allocationEntries = plan.allocation ? Object.entries(plan.allocation) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-background/95 backdrop-blur-xl border-2">
        {/* Blur overlay background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-green-500/5" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-green-500/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              {plan.name}
              <Badge
                variant={
                  plan.status === "ACTIVE" ? "default" :
                  plan.status === "PAUSED" ? "secondary" :
                  "outline"
                }
                className="animate-pulse"
              >
                {plan.status.replace(/_/g, " ")}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-base">{plan.description}</DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 pb-6 pt-6">
          {/* Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Progress Card */}
              <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Progress to Target</h3>
                  <span className="text-2xl font-bold text-primary">{plan.progress.toFixed(1)}%</span>
                </div>
                <Progress value={plan.progress} className="h-4 mb-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{plan.currentAmount.toLocaleString("en-IN")} invested</span>
                  <span>Target: ₹{plan.targetAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-md transition-all duration-300 hover:scale-[1.05] cursor-pointer group">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                    <Calendar className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-medium">Monthly Investment</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ₹{plan.monthlyContribution.toLocaleString("en-IN")}
                  </p>
                </div>
                
                <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-md transition-all duration-300 hover:scale-[1.05] cursor-pointer group">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                    <TrendingUp className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-medium">Expected Return</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {plan.expectedReturnPercent?.toFixed(1) || "~12"}% p.a.
                  </p>
                </div>

                <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:shadow-md transition-all duration-300 hover:scale-[1.05] cursor-pointer group">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                    <Target className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-medium">Risk Level</span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-sm px-3 py-1">
                    {plan.riskLevel}
                  </Badge>
                </div>

                <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:shadow-md transition-all duration-300 hover:scale-[1.05] cursor-pointer group">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-2">
                    <Clock className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-medium">Next Execution</span>
                  </div>
                  <p className="text-sm font-bold mt-1">
                    {plan.nextExecution
                      ? new Date(plan.nextExecution).toLocaleDateString()
                      : "Not scheduled"}
                  </p>
                </div>
              </div>

              {/* Allocation */}
              {allocationEntries.length > 0 && (
                <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:shadow-lg transition-all duration-300">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Allocation
                  </h4>
                  <div className="space-y-3">
                    {allocationEntries.map(([type, percentage], index) => (
                      <div key={`${type}-${index}`} className="group hover:bg-white/50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">{type.replace(/_/g, " ")}</div>
                          <div className="text-sm font-bold">{percentage}%</div>
                        </div>
                        <Progress value={percentage} className="h-2.5 group-hover:h-3 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Returns Section */}
              {plan.status === "ACTIVE" && (
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  <h4 className="font-semibold text-xl mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                    <DollarSign className="h-6 w-6" />
                    Investment Returns
                  </h4>
                  
                  {loadingReturns ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : withdrawableReturns ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur hover:shadow-md transition-all duration-200">
                          <p className="text-xs text-muted-foreground mb-1">Principal</p>
                          <p className="text-xl font-bold">₹{withdrawableReturns.principal?.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur hover:shadow-md transition-all duration-200">
                          <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                          <p className="text-xl font-bold">₹{withdrawableReturns.currentValue?.toFixed(2)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/40 backdrop-blur hover:shadow-md transition-all duration-200">
                          <p className="text-xs text-muted-foreground mb-1">Returns</p>
                          <p className="text-xl font-bold text-green-600">
                            +₹{withdrawableReturns.profit?.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/40 backdrop-blur hover:shadow-md transition-all duration-200">
                          <p className="text-xs text-muted-foreground mb-1">Return %</p>
                          <p className="text-xl font-bold text-green-600">
                            +{withdrawableReturns.returnPercentage}%
                          </p>
                        </div>
                      </div>
                      
                      {withdrawableReturns.lastWithdrawal && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Last withdrawal: {new Date(withdrawableReturns.lastWithdrawal).toLocaleDateString()}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <Button
                          variant="outline"
                          className="h-12 bg-white dark:bg-gray-800 hover:scale-105 transition-transform duration-200 active:scale-95"
                          onClick={handleWithdrawReturns}
                          disabled={!withdrawableReturns.canWithdraw || loading}
                        >
                          {loading && action === "withdraw" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <ArrowUpRight className="h-5 w-5 mr-2" />
                              Withdraw Returns
                            </>
                          )}
                        </Button>
                        <Button
                          className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 transition-all duration-200 active:scale-95"
                          onClick={handleRedeemInvestment}
                          disabled={loading}
                        >
                          {loading && action === "redeem" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Wallet className="h-5 w-5 mr-2" />
                              Redeem All
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-center text-muted-foreground bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                        Returns will be deposited to your digital wallet
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Unable to load returns data</p>
                  )}
                </div>
              )}

              {/* Timeline Card */}
              <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 hover:shadow-lg transition-all duration-300">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-semibold">{new Date(plan.startDate).toLocaleDateString()}</span>
                  </div>
                  {plan.endDate && (
                    <div className="flex justify-between p-2 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                      <span className="text-muted-foreground">Target Date:</span>
                      <span className="font-semibold">{new Date(plan.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                    <span className="text-muted-foreground">Executions:</span>
                    <Badge variant="outline">{plan.executionCount} completed</Badge>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {(plan.status === "ACTIVE" || plan.status === "PAUSED") && (
                <div className="px-6 py-4 border-t bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 -mx-6 -mb-6 mt-6 rounded-b-xl">
                  <div className="flex gap-4">
                    {plan.status === "ACTIVE" ? (
                      <Button
                        variant="outline"
                        className="flex-1 h-12 hover:scale-105 transition-transform duration-200 active:scale-95 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        onClick={handlePause}
                        disabled={loading}
                      >
                        {loading && action === "pause" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <PauseCircle className="h-5 w-5 mr-2" />
                            Pause Plan
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1 h-12 hover:scale-105 transition-transform duration-200 active:scale-95 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={handleResume}
                        disabled={loading}
                      >
                        {loading && action === "resume" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <PlayCircle className="h-5 w-5 mr-2" />
                            Resume Plan
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      className="h-12 hover:scale-105 transition-transform duration-200 active:scale-95"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      {loading && action === "cancel" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 mr-2" />
                          Cancel Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
