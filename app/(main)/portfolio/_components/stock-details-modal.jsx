"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  Target,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StockDetailsModal({ stock, open, onClose, type = "stock" }) {
  const [performanceData, setPerformanceData] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [duration, setDuration] = useState("30"); // "7", "30", "90", "365"

  // Generate initial historical data (fixed, won't change)
  const generateHistoricalData = useCallback((days) => {
    if (!stock) return [];
    const data = [];
    const basePrice = type === "stock" ? stock.buyPrice : stock.buyNav;
    const currentPrice = type === "stock" ? stock.currentPrice : stock.currentNav;
    
    for (let i = 0; i < days; i++) {
      const progress = i / (days - 1);
      const price = basePrice + (currentPrice - basePrice) * progress + (Math.random() - 0.5) * basePrice * 0.02;
      data.push({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        price: parseFloat(price.toFixed(2)),
        timestamp: Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000,
      });
    }
    return data;
  }, [stock, type]);

  // Initialize historical data once
  useEffect(() => {
    if (stock && open) {
      const days = parseInt(duration);
      const historicalData = generateHistoricalData(days);
      setPerformanceData(historicalData);
    }
  }, [stock, open, duration, generateHistoricalData]);

  // Update only the latest price in real-time
  useEffect(() => {
    if (!stock || !open || performanceData.length === 0) return;

    const interval = setInterval(() => {
      setPerformanceData((prevData) => {
        if (prevData.length === 0) return prevData;
        
        // Update only the last data point with new current price
        const updatedData = [...prevData];
        const lastIndex = updatedData.length - 1;
        const currentPrice = type === "stock" ? stock.currentPrice : stock.currentNav;
        
        // Add small random variation to simulate live price changes
        const priceVariation = (Math.random() - 0.5) * currentPrice * 0.005; // 0.5% variation
        const newPrice = parseFloat((currentPrice + priceVariation).toFixed(2));
        
        updatedData[lastIndex] = {
          ...updatedData[lastIndex],
          price: newPrice,
        };
        
        return updatedData;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [stock, open, performanceData.length, type]);

  if (!stock) return null;

  const isProfit = stock.pnl >= 0;
  const Icon = type === "stock" ? Activity : Sparkles;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-background/95 backdrop-blur-xl border-2">
        {/* Blur overlay background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-purple-500/5" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                type === "stock" 
                  ? "bg-gradient-to-br from-primary/20 to-primary/5" 
                  : "bg-gradient-to-br from-purple-500/20 to-purple-500/5"
              }`}>
                <Icon className={`h-5 w-5 ${type === "stock" ? "text-primary" : "text-purple-500"}`} />
              </div>
              {type === "stock" ? stock.symbol : stock.name}
              <Badge variant={isProfit ? "default" : "destructive"} className="ml-auto">
                {isProfit ? "+" : ""}{stock.changePercent?.toFixed(2)}%
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-base">
              {type === "stock" ? stock.name : `NAV: ₹${stock.currentNav?.toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 pb-6 pt-6">
          <div className="space-y-6">
            {/* Performance Chart */}
            <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance Chart
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {/* Duration Selector */}
                  <Tabs value={duration} onValueChange={setDuration}>
                    <TabsList className="h-8">
                      <TabsTrigger value="7" className="text-xs px-3">7D</TabsTrigger>
                      <TabsTrigger value="30" className="text-xs px-3">1M</TabsTrigger>
                      <TabsTrigger value="90" className="text-xs px-3">3M</TabsTrigger>
                      <TabsTrigger value="365" className="text-xs px-3">1Y</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {/* Chart Type Selector */}
                  <Tabs value={chartType} onValueChange={setChartType}>
                    <TabsList className="h-8">
                      <TabsTrigger value="line" className="text-xs px-3">Line</TabsTrigger>
                      <TabsTrigger value="area" className="text-xs px-3">Area</TabsTrigger>
                      <TabsTrigger value="bar" className="text-xs px-3">Bar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                {chartType === "line" && (
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `₹${value.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => value != null ? [`₹${Number(value).toFixed(2)}`, 'Price'] : ['N/A', 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={isProfit ? "#22c55e" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
                {chartType === "area" && (
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `₹${value.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => value != null ? [`₹${Number(value).toFixed(2)}`, 'Price'] : ['N/A', 'Price']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={isProfit ? "#22c55e" : "#ef4444"}
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                )}
                {chartType === "bar" && (
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `₹${value.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => value != null ? [`₹${Number(value).toFixed(2)}`, 'Price'] : ['N/A', 'Price']}
                    />
                    <Bar 
                      dataKey="price" 
                      fill={isProfit ? "#22c55e" : "#ef4444"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs font-medium">Current {type === "stock" ? "Price" : "NAV"}</span>
                </div>
                <p className="text-2xl font-bold">
                  ₹{(type === "stock" ? stock.currentPrice : stock.currentNav)?.toFixed(2)}
                </p>
              </div>

              <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs font-medium">Buy {type === "stock" ? "Price" : "NAV"}</span>
                </div>
                <p className="text-2xl font-bold">
                  ₹{(type === "stock" ? stock.buyPrice : stock.buyNav)?.toFixed(2)}
                </p>
              </div>

              <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-2">
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-medium">Quantity</span>
                </div>
                <p className="text-2xl font-bold">
                  {type === "stock" ? stock.quantity : stock.units?.toFixed(2)} {type === "stock" ? "shares" : "units"}
                </p>
              </div>

              <div className={`p-5 rounded-xl border-2 ${
                isProfit 
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                  : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20"
              }`}>
                <div className={`flex items-center gap-2 mb-2 ${
                  isProfit ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                }`}>
                  {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="text-xs font-medium">P&L</span>
                </div>
                <p className={`text-2xl font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                  {isProfit ? "+" : ""}₹{Math.abs(stock.pnl || 0).toFixed(0)}
                </p>
                <p className={`text-sm ${isProfit ? "text-green-600" : "text-red-600"}`}>
                  ({isProfit ? "+" : ""}{stock.pnlPercent?.toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Investment Details */}
            <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <h4 className="font-semibold text-lg mb-4">Investment Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <span className="text-sm text-muted-foreground">Invested Value</span>
                  <span className="font-semibold">₹{stock.investedValue?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <span className="font-semibold">₹{stock.currentValue?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <span className="text-sm text-muted-foreground">Return</span>
                  <span className={`font-semibold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                    {isProfit ? "+" : ""}₹{Math.abs(stock.pnl || 0).toLocaleString("en-IN")} ({isProfit ? "+" : ""}{stock.pnlPercent?.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg">Performance</h4>
                <span className={`text-lg font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                  {isProfit ? "+" : ""}{stock.pnlPercent?.toFixed(2)}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, 50 + stock.pnlPercent))} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Loss</span>
                <span>Profit</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
