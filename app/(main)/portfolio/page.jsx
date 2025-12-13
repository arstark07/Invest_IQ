"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  Plus,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Wallet,
  Building2,
  Sparkles,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Activity,
  Trash2,
  Percent,
  Award,
  AlertTriangle,
  DollarSign,
  TrendingUpIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import Link from "next/link";
import {
  getInvestmentPortfolio,
  getInvestmentPerformance,
  getInvestmentPlans,
  approveInvestmentPlan,
  deleteInvestmentPlan,
} from "@/actions/investment";
import { getKYCStatus } from "@/actions/kyc";
import CreatePlanModal from "./_components/create-plan-modal";
import PlanDetailsModal from "./_components/plan-details-modal";
import StockDetailsModal from "./_components/stock-details-modal";
import KYCPrompt from "@/components/kyc-prompt";
import AssetDetailModal from "@/components/asset-detail-modal";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

// Risk-based allocation colors
const ALLOCATION_COLORS = {
  STOCKS: "#ef4444", // Red - High risk
  MUTUAL_FUNDS: "#f59e0b", // Amber - Medium-high risk
  GOLD: "#eab308", // Yellow - Medium risk
  REAL_ESTATE: "#22c55e", // Green - Medium-low risk
  FIXED_DEPOSIT: "#3b82f6", // Blue - Low risk
  BONDS: "#06b6d4", // Cyan - Low risk
  CRYPTOCURRENCY: "#a855f7", // Purple - Very high risk
  PPF: "#10b981", // Emerald - Very low risk
  NPS: "#14b8a6", // Teal - Low-medium risk
};

const getRiskLevel = (type) => {
  const riskMap = {
    STOCKS: { level: "High", color: "#ef4444" },
    CRYPTOCURRENCY: { level: "Very High", color: "#a855f7" },
    MUTUAL_FUNDS: { level: "Medium-High", color: "#f59e0b" },
    GOLD: { level: "Medium", color: "#eab308" },
    REAL_ESTATE: { level: "Medium-Low", color: "#22c55e" },
    NPS: { level: "Low-Medium", color: "#14b8a6" },
    BONDS: { level: "Low", color: "#06b6d4" },
    FIXED_DEPOSIT: { level: "Low", color: "#3b82f6" },
    PPF: { level: "Very Low", color: "#10b981" },
  };
  return riskMap[type] || { level: "Medium", color: "#6366f1" };
};

// Simulated live prices - for demo purposes
const SIMULATED_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries", basePrice: 2890, quantity: 10, buyPrice: 2745.5 },
  { symbol: "TCS", name: "Tata Consultancy Services", basePrice: 4250, quantity: 5, buyPrice: 4037.5 },
  { symbol: "INFY", name: "Infosys", basePrice: 1520, quantity: 15, buyPrice: 1444 },
  { symbol: "HDFC", name: "HDFC Bank", basePrice: 1680, quantity: 8, buyPrice: 1596 },
  { symbol: "ICICIBANK", name: "ICICI Bank", basePrice: 1150, quantity: 12, buyPrice: 1092.5 },
];

const SIMULATED_MF = [
  { symbol: "NIPPON_INDIA_SMALL", name: "Nippon India Small Cap", nav: 142.35, units: 500, buyNav: 130.96 },
  { symbol: "AXIS_BLUECHIP", name: "Axis Bluechip Fund", nav: 52.80, units: 800, buyNav: 48.58 },
  { symbol: "PARAG_FLEXI", name: "Parag Parikh Flexi Cap", nav: 68.25, units: 600, buyNav: 62.79 },
];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1Y");
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [liveStocks, setLiveStocks] = useState([]);
  const [liveMutualFunds, setLiveMutualFunds] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [approvingPlanId, setApprovingPlanId] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedStockMF, setSelectedStockMF] = useState(null);
  const [stockMFModalOpen, setStockMFModalOpen] = useState(false);
  const [stockMFType, setStockMFType] = useState("stock"); // "stock" or "mf"

  // Simulate live price updates
  const updateLivePrices = useCallback(() => {
    // Update stock prices with small random fluctuations
    const updatedStocks = SIMULATED_STOCKS.map((stock) => {
      const change = (Math.random() - 0.48) * 2; // Slightly bullish bias
      const changePercent = change;
      const currentPrice = stock.basePrice * (1 + (Math.random() * 0.1 - 0.05)); // ±5% from base
      const priceChange = currentPrice * (changePercent / 100);
      const newPrice = currentPrice + priceChange;
      const buyPrice = stock.buyPrice ?? stock.basePrice * 0.95; // Persist a buy price for charts/UI
      const pnl = (newPrice - buyPrice) * stock.quantity;
      const pnlPercent = ((newPrice - buyPrice) / buyPrice) * 100;
      
      return {
        ...stock,
        buyPrice,
        currentPrice: newPrice,
        change: priceChange,
        changePercent,
        currentValue: newPrice * stock.quantity,
        investedValue: buyPrice * stock.quantity,
        pnl,
        pnlPercent,
      };
    });
    setLiveStocks(updatedStocks);

    // Update mutual fund NAVs
    const updatedMF = SIMULATED_MF.map((mf) => {
      const change = (Math.random() - 0.45) * 0.5; // Small change for MF
      const currentNav = mf.nav * (1 + (Math.random() * 0.02 - 0.01));
      const buyNav = mf.buyNav ?? mf.nav * 0.92; // Persist buy NAV for charts/UI
      const pnl = (currentNav - buyNav) * mf.units;
      const pnlPercent = ((currentNav - buyNav) / buyNav) * 100;
      
      return {
        ...mf,
        buyNav,
        currentNav,
        change,
        currentValue: currentNav * mf.units,
        investedValue: buyNav * mf.units,
        pnl,
        pnlPercent,
      };
    });
    setLiveMutualFunds(updatedMF);
    setLastUpdated(new Date());
  }, []);

  // Initialize and start live updates
  useEffect(() => {
    updateLivePrices();
    // Update every 5 seconds for simulation
    const interval = setInterval(updateLivePrices, 5000);
    return () => clearInterval(interval);
  }, [updateLivePrices]);

  useEffect(() => {
    loadKYCStatusFirst();
  }, []);

  useEffect(() => {
    if (kycVerified) {
      loadPerformance();
    }
  }, [period, kycVerified]);

  const loadKYCStatusFirst = async () => {
    try {
      const result = await getKYCStatus();
      if (result.success) {
        setKycVerified(result.data.kycVerified);
        if (result.data.kycVerified) {
          // Only load portfolio data if KYC is verified
          loadPortfolioData();
        }
      }
    } catch (error) {
      console.error("Failed to load KYC status:", error);
    } finally {
      setKycLoading(false);
      setLoading(false);
    }
  };

  const loadPortfolioData = async () => {
    try {
      const [portfolioResult, plansResult] = await Promise.all([
        getInvestmentPortfolio(),
        getInvestmentPlans(),
      ]);

      if (portfolioResult.success) {
        setPortfolio(portfolioResult.data);
      }

      if (plansResult.success) {
        setPlans(plansResult.data);
      }
    } catch (error) {
      toast.error("Failed to load portfolio data");
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async () => {
    try {
      const result = await getInvestmentPerformance(null, period);
      if (result.success) {
        setPerformance(result.data);
      }
    } catch (error) {
      console.error("Failed to load performance:", error);
    }
  };

  const handleApprovePlan = async (e, planId) => {
    e.stopPropagation(); // Prevent plan detail modal from opening
    try {
      setApprovingPlanId(planId);
      const result = await approveInvestmentPlan(planId);
      if (result.success) {
        toast.success("Investment plan approved and activated!");
        // Refresh plans list
        const plansResult = await getInvestmentPlans();
        if (plansResult.success) {
          setPlans(plansResult.data);
        }
      } else {
        toast.error(result.error || "Failed to approve plan");
      }
    } catch (error) {
      toast.error("Error approving plan");
      console.error("Error approving plan:", error);
    } finally {
      setApprovingPlanId(null);
    }
  };

  const handleDeletePlan = async (e, planId) => {
    e.stopPropagation(); // Prevent plan detail modal from opening
    if (!confirm("Are you sure you want to delete this investment plan? This action cannot be undone.")) {
      return;
    }
    try {
      setDeletingPlanId(planId);
      const result = await deleteInvestmentPlan(planId);
      if (result.success) {
        toast.success("Investment plan deleted!");
        // Refresh plans list
        const plansResult = await getInvestmentPlans();
        if (plansResult.success) {
          setPlans(plansResult.data);
        }
      } else {
        toast.error(result.error || "Failed to delete plan");
      }
    } catch (error) {
      toast.error("Error deleting plan");
      console.error("Error deleting plan:", error);
    } finally {
      setDeletingPlanId(null);
    }
  };

  const allocationData = portfolio?.allocationBreakdown
    ? Object.entries(portfolio.allocationBreakdown).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value: parseFloat(value.toFixed(2)),
      }))
    : [];

  const totalAllocationValue = allocationData.reduce((sum, item) => sum + item.value, 0);

  // Enhanced allocation data for modal
  const detailedAllocationData = allocationData.map((item) => {
    const percent = totalAllocationValue > 0 ? (item.value / totalAllocationValue) * 100 : 0;
    const risk = getRiskLevel(item.name.toUpperCase().replace(/ /g, "_"));
    return {
      ...item,
      percent: parseFloat(percent.toFixed(1)),
      risk: risk.level,
      color: risk.color,
    };
  });

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
          <h1 className="text-3xl font-bold gradient-title">
            Investment Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete KYC to access your investment portfolio
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
          <h1 className="text-3xl font-bold gradient-title">
            Investment Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Your complete wealth management dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/wallet">
            <Button variant="outline" size="sm">
              <Wallet className="h-4 w-4 mr-2" />
              Wallet
            </Button>
          </Link>
          <Button onClick={() => setCreatePlanOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-background">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <h3 className="text-2xl font-bold mt-1">
                  ₹{portfolio?.summary?.totalInvested?.toLocaleString("en-IN") || "0"}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-background">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <h3 className="text-2xl font-bold mt-1">
                  ₹{portfolio?.summary?.totalCurrentValue?.toLocaleString("en-IN") || "0"}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${(portfolio?.summary?.totalReturn || 0) >= 0 ? "from-green-500/10" : "from-red-500/10"} to-background`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <h3 className={`text-2xl font-bold mt-1 ${(portfolio?.summary?.totalReturn || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(portfolio?.summary?.totalReturn || 0) >= 0 ? "+" : ""}
                  ₹{Math.abs(portfolio?.summary?.totalReturn || 0).toLocaleString("en-IN")}
                </h3>
                <p className={`text-sm ${(portfolio?.summary?.returnPercent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(portfolio?.summary?.returnPercent || 0) >= 0 ? "+" : ""}
                  {(portfolio?.summary?.returnPercent || 0).toFixed(2)}%
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${(portfolio?.summary?.totalReturn || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {(portfolio?.summary?.totalReturn || 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-background">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <h3 className="text-2xl font-bold mt-1">
                  ₹{portfolio?.summary?.walletBalance?.toLocaleString("en-IN") || "0"}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CAGR Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-background">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">CAGR</p>
                <h3 className={`text-2xl font-bold mt-1 ${(portfolio?.summary?.cagr || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(portfolio?.summary?.cagr || 0) >= 0 ? "+" : ""}
                  {(portfolio?.summary?.cagr || 0).toFixed(2)}%
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Compound Annual Growth Rate
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Gains Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-background">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Gains</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600">
                  +₹{(portfolio?.summary?.totalGains || 0).toLocaleString("en-IN")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Realized & unrealized profits
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Losses Card */}
        <Card className="bg-gradient-to-br from-red-500/10 to-background">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Losses</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">
                  -₹{(portfolio?.summary?.totalLosses || 0).toLocaleString("en-IN")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Unrealized losses
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Monthly Investment Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-background">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Avg Monthly SIP</p>
                <h3 className="text-2xl font-bold mt-1">
                  ₹{(portfolio?.summary?.avgMonthlyInvestment || 0).toLocaleString("en-IN")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Average monthly investment
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI by Investment Type & Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROI by Type */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ROI by Investment Type
            </CardTitle>
            <CardDescription>Performance breakdown by asset class</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolio?.roiByType?.length > 0 ? (
              <div className="space-y-4">
                {portfolio.roiByType.map((item, index) => (
                  <div 
                    key={item.type} 
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedAsset(item);
                      setAssetModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                        >
                          <DollarSign 
                            className="h-5 w-5" 
                            style={{ color: COLORS[index % COLORS.length] }}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.type.replace(/_/g, " ")}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.count} investment{item.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${item.returnPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.returnPercent >= 0 ? "+" : ""}{item.returnPercent.toFixed(2)}%
                        </p>
                        <p className={`text-sm ${item.return >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.return >= 0 ? "+" : ""}₹{Math.abs(item.return).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Invested: ₹{item.invested.toLocaleString("en-IN")}</span>
                      <span>•</span>
                      <span>Current: ₹{item.currentValue.toLocaleString("en-IN")}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, 50 + item.returnPercent))} 
                      className="h-2 mt-2" 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No investment data yet</p>
                <p className="text-sm text-muted-foreground">Start investing to see ROI breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best & Worst Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>Best and worst investments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Best Performer */}
            {portfolio?.performers?.best ? (
              <div className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Best Performer</span>
                </div>
                <h4 className="font-semibold">{portfolio.performers.best.symbol.replace(/_/g, " ")}</h4>
                <p className="text-sm text-muted-foreground">{portfolio.performers.best.type.replace(/_/g, " ")}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Invested: ₹{portfolio.performers.best.invested.toLocaleString("en-IN")}</span>
                  <span className="text-lg font-bold text-green-600">
                    +{portfolio.performers.best.returnPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No data yet</p>
              </div>
            )}

            {/* Worst Performer */}
            {portfolio?.performers?.worst && portfolio.performers.worst.returnPercent < 0 ? (
              <div className="p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Needs Attention</span>
                </div>
                <h4 className="font-semibold">{portfolio.performers.worst.symbol.replace(/_/g, " ")}</h4>
                <p className="text-sm text-muted-foreground">{portfolio.performers.worst.type.replace(/_/g, " ")}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Invested: ₹{portfolio.performers.worst.invested.toLocaleString("en-IN")}</span>
                  <span className="text-lg font-bold text-red-600">
                    {portfolio.performers.worst.returnPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed text-center">
                <Sparkles className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">All investments performing well!</p>
              </div>
            )}

            {/* Investment Start Date */}
            {portfolio?.summary?.investmentStartDate && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Investment Journey</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Started on {new Date(portfolio.summary.investmentStartDate).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Portfolio Performance</CardTitle>
              <div className="flex gap-1">
                {["1M", "3M", "6M", "1Y", "ALL"].map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPeriod(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {performance?.chartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performance.chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-medium">{payload[0]?.payload.month}</p>
                              <p className="text-sm text-primary">
                                Value: ₹{payload[0]?.value?.toLocaleString("en-IN")}
                              </p>
                              <p className="text-sm text-green-600">
                                Invested: ₹{payload[1]?.value?.toLocaleString("en-IN")}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeValue"
                      stroke="#6366f1"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name="Value"
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeInvested"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorInvested)"
                      name="Invested"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance data yet</p>
                    <p className="text-sm">Start investing to see your progress</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Your portfolio breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="h-[300px] cursor-pointer" 
              onClick={() => allocationData.length > 0 && setAllocationModalOpen(true)}
            >
              {allocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₹${value.toLocaleString("en-IN")}`}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No investments yet</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                ROI Transactions
              </CardTitle>
              <CardDescription>All your investment transactions with returns</CardDescription>
            </div>
            <Badge variant="outline">
              {portfolio?.roiTransactions?.length || 0} transactions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {portfolio?.roiTransactions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Plan</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Invested</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Current Value</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Return</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">ROI %</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Days Held</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.roiTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="text-sm">
                          {tx.executedAt ? new Date(tx.executedAt).toLocaleDateString("en-IN") : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.executedAt ? new Date(tx.executedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">
                          {tx.type.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm font-medium">{tx.planName}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-medium">₹{tx.amount.toLocaleString("en-IN")}</span>
                        {tx.units && (
                          <div className="text-xs text-muted-foreground">
                            {tx.units.toFixed(3)} units @ ₹{tx.buyPrice?.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-medium">₹{tx.currentValue.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-sm font-medium ${tx.returnAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.returnAmount >= 0 ? "+" : ""}₹{Math.abs(tx.returnAmount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={`inline-flex items-center gap-1 text-sm font-semibold ${tx.returnPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.returnPercent >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {tx.returnPercent >= 0 ? "+" : ""}{tx.returnPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm text-muted-foreground">{tx.daysHeld}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge 
                          variant={
                            tx.status === "COMPLETED" ? "default" : 
                            tx.status === "PENDING" ? "secondary" : 
                            "destructive"
                          }
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-semibold">
                    <td colSpan="3" className="py-3 px-2 text-sm">Total</td>
                    <td className="py-3 px-2 text-right text-sm">
                      ₹{portfolio.roiTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      ₹{portfolio.roiTransactions.reduce((sum, tx) => sum + tx.currentValue, 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      {(() => {
                        const totalReturn = portfolio.roiTransactions.reduce((sum, tx) => sum + tx.returnAmount, 0);
                        return (
                          <span className={totalReturn >= 0 ? "text-green-600" : "text-red-600"}>
                            {totalReturn >= 0 ? "+" : ""}₹{Math.abs(totalReturn).toLocaleString("en-IN")}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      {(() => {
                        const totalInvested = portfolio.roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
                        const totalCurrent = portfolio.roiTransactions.reduce((sum, tx) => sum + tx.currentValue, 0);
                        const totalROI = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
                        return (
                          <span className={`font-semibold ${totalROI >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {totalROI >= 0 ? "+" : ""}{totalROI.toFixed(2)}%
                          </span>
                        );
                      })()}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your investment transactions will appear here with their ROI
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Plans */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Investment Plans</CardTitle>
              <CardDescription>Your active and past investment plans</CardDescription>
            </div>
            <Button onClick={() => setCreatePlanOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length > 0 ? (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        plan.status === "ACTIVE" ? "bg-green-100 dark:bg-green-900/30" :
                        plan.status === "PAUSED" ? "bg-amber-100 dark:bg-amber-900/30" :
                        "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        {plan.status === "ACTIVE" ? (
                          <PlayCircle className="h-6 w-6 text-green-600" />
                        ) : plan.status === "PAUSED" ? (
                          <PauseCircle className="h-6 w-6 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{plan.name}</h4>
                          <Badge
                            variant={
                              plan.status === "ACTIVE" ? "default" :
                              plan.status === "PAUSED" ? "secondary" :
                              plan.status === "PENDING_APPROVAL" ? "outline" :
                              "secondary"
                            }
                          >
                            {plan.status.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline">{plan.riskLevel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ₹{plan.monthlyContribution.toLocaleString("en-IN")}/month • 
                          Target: ₹{plan.targetAmount.toLocaleString("en-IN")}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1 max-w-[200px]">
                            <Progress value={plan.progress} className="h-2" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {plan.progress.toFixed(1)}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        ₹{plan.currentAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-sm text-muted-foreground">invested</p>
                      {plan.status === "PENDING_APPROVAL" && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={(e) => handleApprovePlan(e, plan.id)}
                          disabled={approvingPlanId === plan.id}
                        >
                          {approvingPlanId === plan.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve Plan
                            </>
                          )}
                        </Button>
                      )}
                      {plan.nextExecution && plan.status === "ACTIVE" && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Next: {new Date(plan.nextExecution).toLocaleDateString()}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeletePlan(e, plan.id)}
                        disabled={deletingPlanId === plan.id}
                      >
                        {deletingPlanId === plan.id ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Investment Plans Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a personalized investment plan based on your risk profile
              </p>
              <Button onClick={() => setCreatePlanOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Broker Holdings */}
      {portfolio?.brokerHoldings?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Broker Holdings
            </CardTitle>
            <CardDescription>Your holdings from connected brokers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.brokerHoldings.map((holding, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {holding.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{holding.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {holding.name || holding.broker} • {holding.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{holding.currentValue.toLocaleString("en-IN")}
                    </p>
                    <p className={`text-sm ${holding.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {holding.pnl >= 0 ? "+" : ""}₹{Math.abs(holding.pnl).toLocaleString("en-IN")}
                      ({holding.pnlPercent?.toFixed(2) || 0}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulated Stock Holdings - Live */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Stock Holdings
                <Badge variant="outline" className="ml-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Live
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time prices • Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "-"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={updateLivePrices}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liveStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition cursor-pointer"
                onClick={() => {
                  setSelectedStockMF(stock);
                  setStockMFType("stock");
                  setStockMFModalOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-sm font-bold">{stock.symbol.slice(0, 3)}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{stock.symbol}</p>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                    <p className="text-xs text-muted-foreground">{stock.quantity} shares</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₹{stock.currentPrice?.toFixed(2)}
                  </p>
                  <p className={`text-sm flex items-center justify-end gap-1 ${
                    stock.changePercent >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {stock.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent?.toFixed(2)}%
                  </p>
                  <div className="mt-1 text-xs">
                    <span className="text-muted-foreground">P&L: </span>
                    <span className={stock.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                      {stock.pnl >= 0 ? "+" : ""}₹{stock.pnl?.toFixed(0)} ({stock.pnlPercent?.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Stock Value</p>
              <p className="text-xl font-bold">
                ₹{liveStocks.reduce((sum, s) => sum + (s.currentValue || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p className={`text-xl font-bold ${
                liveStocks.reduce((sum, s) => sum + (s.pnl || 0), 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {liveStocks.reduce((sum, s) => sum + (s.pnl || 0), 0) >= 0 ? "+" : ""}
                ₹{Math.abs(liveStocks.reduce((sum, s) => sum + (s.pnl || 0), 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulated Mutual Fund Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Mutual Fund Holdings
          </CardTitle>
          <CardDescription>Your mutual fund investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liveMutualFunds.map((mf) => (
              <div
                key={mf.symbol}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition cursor-pointer"
                onClick={() => {
                  setSelectedStockMF(mf);
                  setStockMFType("mf");
                  setStockMFModalOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{mf.name}</p>
                    <p className="text-sm text-muted-foreground">
                      NAV: ₹{mf.currentNav?.toFixed(2)} • {mf.units?.toFixed(2)} units
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₹{mf.currentValue?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </p>
                  <p className={`text-sm ${mf.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {mf.pnl >= 0 ? "+" : ""}₹{Math.abs(mf.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    ({mf.pnlPercent?.toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total MF Value</p>
              <p className="text-xl font-bold">
                ₹{liveMutualFunds.reduce((sum, mf) => sum + (mf.currentValue || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p className={`text-xl font-bold ${
                liveMutualFunds.reduce((sum, mf) => sum + (mf.pnl || 0), 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {liveMutualFunds.reduce((sum, mf) => sum + (mf.pnl || 0), 0) >= 0 ? "+" : ""}
                ₹{Math.abs(liveMutualFunds.reduce((sum, mf) => sum + (mf.pnl || 0), 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreatePlanModal
        open={createPlanOpen}
        onClose={() => setCreatePlanOpen(false)}
        onSuccess={loadPortfolioData}
      />

      {selectedPlan && (
        <PlanDetailsModal
          plan={selectedPlan}
          open={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onUpdate={loadPortfolioData}
        />
      )}

      {/* Stock/Mutual Fund Details Modal */}
      <StockDetailsModal
        stock={selectedStockMF}
        open={stockMFModalOpen}
        onClose={() => {
          setStockMFModalOpen(false);
          setSelectedStockMF(null);
        }}
        type={stockMFType}
      />

      {/* Complete Allocation Detail Modal */}
      <Dialog open={allocationModalOpen} onOpenChange={setAllocationModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <PieChart className="h-6 w-6" />
              Asset Allocation Breakdown
              <Badge variant="outline" className="ml-auto">
                {detailedAllocationData.length} Assets
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Complete portfolio allocation with risk analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl font-bold">₹{totalAllocationValue.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Asset Classes</p>
                  <p className="text-2xl font-bold">{detailedAllocationData.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Diversification</p>
                  <p className="text-2xl font-bold">
                    {detailedAllocationData.length >= 5 ? "High" : detailedAllocationData.length >= 3 ? "Medium" : "Low"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Allocation List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Detailed Breakdown</h3>
              <div className="space-y-3">
                {detailedAllocationData.map((item, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="h-12 w-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: item.color + '20' }}
                          >
                            <div 
                              className="h-6 w-6 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: item.color, color: item.color }}
                              >
                                {item.risk} Risk
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.percent}% of portfolio
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">₹{item.value.toLocaleString("en-IN")}</p>
                          <p className="text-sm font-semibold" style={{ color: item.color }}>
                            {item.percent}%
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={item.percent} 
                        className="h-2"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Risk Distribution */}
            <Card className="border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Risk Distribution
                </h4>
                <div className="space-y-2">
                  {[...new Set(detailedAllocationData.map(a => a.risk))].map((risk, idx) => {
                    const riskItems = detailedAllocationData.filter(a => a.risk === risk);
                    const riskTotal = riskItems.reduce((sum, item) => sum + item.percent, 0);
                    const riskColor = riskItems[0]?.color;
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: riskColor }}
                          />
                          <span className="text-sm font-medium">{risk} Risk</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {riskItems.length} asset{riskItems.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-sm font-bold" style={{ color: riskColor }}>
                            {riskTotal.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Allocation Insights */}
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-900/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Portfolio Insights
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Your portfolio is diversified across {detailedAllocationData.length} asset classes</li>
                  <li>• 
                    {detailedAllocationData.length >= 5 
                      ? "Excellent diversification reduces overall portfolio risk"
                      : detailedAllocationData.length >= 3
                      ? "Good diversification, consider adding more asset classes"
                      : "Limited diversification - consider diversifying further"
                    }
                  </li>
                  <li>• 
                    {detailedAllocationData.find(a => a.percent > 40)
                      ? `High concentration in ${detailedAllocationData.find(a => a.percent > 40)?.name} - consider rebalancing`
                      : "No single asset dominates your portfolio - good balance"
                    }
                  </li>
                  <li>• Review and rebalance your allocation quarterly for optimal performance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <AssetDetailModal
        asset={selectedAsset}
        open={assetModalOpen}
        onOpenChange={setAssetModalOpen}
        transactions={performance?.transactions || []}
      />
    </div>
  );
}
