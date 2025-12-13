"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Building2, CreditCard, DollarSign, ChevronRight, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getNetWorth } from "@/actions/dashboard-widgets";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const breakdownIcons = {
  bankAccounts: Building2,
  wallet: Wallet,
  investments: TrendingUp,
  savings: PiggyBank,
};

const breakdownColors = {
  bankAccounts: "bg-blue-100 dark:bg-blue-900 text-blue-600",
  wallet: "bg-purple-100 dark:bg-purple-900 text-purple-600",
  investments: "bg-green-100 dark:bg-green-900 text-green-600",
  savings: "bg-pink-100 dark:bg-pink-900 text-pink-600",
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#ec4899", "#f59e0b"];

// Justifications for net worth components
const netWorthJustifications = {
  bankAccounts: {
    getExplanation: (value, totalNetWorth) => {
      const percentage = totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0;
      if (percentage >= 50) return `Bank accounts form the majority of your net worth at ${percentage.toFixed(1)}%. This is liquid and easily accessible.`;
      if (percentage >= 30) return `Bank accounts represent a healthy ${percentage.toFixed(1)}% of your total assets, providing good liquidity.`;
      if (percentage >= 15) return `Bank accounts make up ${percentage.toFixed(1)}% of your net worth. Consider if this meets your emergency fund needs.`;
      return `Bank accounts are ${percentage.toFixed(1)}% of your net worth. You may want more liquid assets for emergencies.`;
    },
    getInsights: (value, totalNetWorth) => {
      const percentage = totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0;
      const insights = [];
      if (percentage < 20) insights.push("Consider keeping 3-6 months expenses in accessible bank accounts");
      if (percentage > 60) insights.push("You might earn better returns by investing some of this balance");
      insights.push("Bank deposits are generally safe but may not beat inflation");
      return insights;
    }
  },
  wallet: {
    getExplanation: (value, totalNetWorth) => {
      const percentage = totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0;
      if (percentage >= 20) return `Your digital wallet holds ${percentage.toFixed(1)}% of your net worth. Consider moving some to investments.`;
      if (percentage >= 10) return `Digital wallet balance is ${percentage.toFixed(1)}% of your total. Good for quick transactions.`;
      return `Wallet holds ${percentage.toFixed(1)}% of your assets. This is instantly accessible for transactions.`;
    },
    getInsights: (value, totalNetWorth) => {
      const insights = [];
      insights.push("Wallet balance is ideal for day-to-day transactions");
      if (value > 50000) insights.push("Consider investing excess wallet balance for better returns");
      insights.push("Keep enough for regular expenses and small emergencies");
      return insights;
    }
  },
  investments: {
    getExplanation: (value, totalNetWorth) => {
      const percentage = totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0;
      if (percentage >= 50) return `Investments make up ${percentage.toFixed(1)}% of your net worth. Excellent wealth-building strategy!`;
      if (percentage >= 30) return `${percentage.toFixed(1)}% invested is a solid allocation for long-term growth.`;
      if (percentage >= 15) return `Investments are ${percentage.toFixed(1)}% of your portfolio. Consider increasing for better returns.`;
      return `Only ${percentage.toFixed(1)}% is invested. You're missing potential growth opportunities.`;
    },
    getInsights: (value, totalNetWorth) => {
      const percentage = totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0;
      const insights = [];
      if (percentage < 30) insights.push("Aim to invest at least 30% of your net worth for long-term wealth creation");
      if (percentage >= 50) insights.push("Great investment allocation! Ensure portfolio is diversified");
      insights.push("Regular SIP investments can help build wealth consistently");
      insights.push("Review investment performance quarterly");
      return insights;
    }
  },
  savings: {
    getExplanation: (value, totalNetWorth) => {
      const percentage = totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0;
      if (percentage >= 30) return `Savings accounts hold ${percentage.toFixed(1)}% of your wealth. Good safety net!`;
      if (percentage >= 15) return `${percentage.toFixed(1)}% in savings provides a reasonable buffer.`;
      return `Savings are ${percentage.toFixed(1)}% of your net worth. Consider building this up.`;
    },
    getInsights: (value, totalNetWorth) => {
      const insights = [];
      insights.push("High-yield savings accounts can provide better interest rates");
      insights.push("Keep 3-6 months of expenses as emergency savings");
      insights.push("Consider FDs or liquid funds for better returns on excess savings");
      return insights;
    }
  }
};

export function NetWorthTracker({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const result = await getNetWorth(defaultAccountId);
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [defaultAccountId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Net Worth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Net Worth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Unable to calculate net worth</p>
        </CardContent>
      </Card>
    );
  }

  const isPositiveChange = data.monthlyChange >= 0;

  // Prepare pie chart data
  const pieData = Object.entries(data.breakdown).map(([key, item], index) => ({
    name: item.label,
    value: item.value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })).filter(item => item.value > 0);

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
        onClick={() => setDialogOpen(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Net Worth
              </CardTitle>
              <CardDescription>Total assets across all accounts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isPositiveChange ? "default" : "destructive"} className={isPositiveChange ? "bg-green-500" : ""}>
                {isPositiveChange ? "Growing" : "Declining"}
              </Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Total Net Worth & Change */}
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold">{formatCurrency(data.totalNetWorth)}</p>
                <div className={`flex items-center gap-1 text-sm ${
                  isPositiveChange ? "text-green-600" : "text-red-600"
                }`}>
                  {isPositiveChange ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {isPositiveChange ? "+" : ""}{formatCurrency(data.monthlyChange)} ({data.monthlyChangePercent.toFixed(1)}%)
                  </span>
                  <span className="text-muted-foreground">this month</span>
                </div>
              </div>

              {/* Mini Trend Chart */}
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.history}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" hide />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#netWorthGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Center: Pie Chart */}
            <div className="flex items-center justify-center">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Breakdown */}
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3">Asset Breakdown</p>
              {Object.entries(data.breakdown).map(([key, item], index) => {
                const Icon = breakdownIcons[key] || CreditCard;
                const colorClass = breakdownColors[key] || "bg-gray-100 text-gray-600";
                const percentage = data.totalNetWorth > 0 
                  ? ((item.value / data.totalNetWorth) * 100).toFixed(1) 
                  : 0;

                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${colorClass}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{percentage}%</span>
                      <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Net Worth Breakdown & Analysis
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of your assets with insights and recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Summary Card */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Net Worth</p>
                  <p className="text-3xl font-bold">{formatCurrency(data.totalNetWorth)}</p>
                </div>
                <div className={`text-right ${isPositiveChange ? "text-green-600" : "text-red-600"}`}>
                  <div className="flex items-center gap-1 justify-end">
                    {isPositiveChange ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    <span className="text-xl font-semibold">
                      {isPositiveChange ? "+" : ""}{formatCurrency(data.monthlyChange)}
                    </span>
                  </div>
                  <p className="text-sm">{data.monthlyChangePercent.toFixed(1)}% this month</p>
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="p-4 rounded-lg border">
              <h3 className="font-medium mb-4">Net Worth Trend (Last 6 Months)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.history}>
                    <defs>
                      <linearGradient id="netWorthGradientLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => `₹${(value / 1000)}k`}
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#netWorthGradientLarge)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Asset Breakdown */}
            <div className="space-y-4">
              <h3 className="font-medium">Asset Breakdown & Insights</h3>
              {Object.entries(data.breakdown).map(([key, item], index) => {
                const Icon = breakdownIcons[key] || CreditCard;
                const colorClass = breakdownColors[key] || "bg-gray-100 text-gray-600";
                const percentage = data.totalNetWorth > 0 
                  ? ((item.value / data.totalNetWorth) * 100) 
                  : 0;
                const justification = netWorthJustifications[key];

                return (
                  <div key={key} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold">{formatCurrency(item.value)}</p>
                    </div>

                    {/* Progress bar */}
                    <Progress value={percentage} className="h-2" />

                    {/* Explanation */}
                    {justification && (
                      <p className="text-sm text-muted-foreground">
                        {justification.getExplanation(item.value, data.totalNetWorth)}
                      </p>
                    )}

                    {/* Insights */}
                    {justification && (
                      <div className="space-y-1">
                        {justification.getInsights(item.value, data.totalNetWorth).map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                            <span className="text-muted-foreground">{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall Recommendation */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Overall Recommendation</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {data.totalNetWorth < 100000 
                  ? "Focus on building your emergency fund first. Aim for 3-6 months of expenses in accessible accounts."
                  : data.breakdown.investments?.value / data.totalNetWorth < 0.3
                  ? "Consider increasing your investment allocation for long-term wealth creation. A balanced portfolio can help beat inflation."
                  : "Your asset allocation looks healthy! Continue your current strategy and review quarterly to maintain balance."
                }
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
