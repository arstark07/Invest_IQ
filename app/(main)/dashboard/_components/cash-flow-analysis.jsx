"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { getCashFlowAnalysis } from "@/actions/dashboard-widgets";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function CashFlowAnalysis({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6M");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getCashFlowAnalysis(period, defaultAccountId);
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [period, defaultAccountId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cash Flow Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cash Flow Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            No transaction data available yet. Start adding transactions to see your cash flow analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Cash Flow Analysis
            </CardTitle>
            <CardDescription>Income vs Expenses trend</CardDescription>
          </div>
          <div className="flex gap-1">
            {["3M", "6M", "1Y"].map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
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
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Income</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(data.summary.totalIncome)}</p>
            <div className="flex items-center gap-1 text-xs">
              {parseFloat(data.summary.incomeTrend) >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{data.summary.incomeTrend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{data.summary.incomeTrend}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Expenses</span>
            </div>
            <p className="text-lg font-bold text-red-600">{formatCurrency(data.summary.totalExpenses)}</p>
            <div className="flex items-center gap-1 text-xs">
              {parseFloat(data.summary.expensesTrend) <= 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{data.summary.expensesTrend}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">+{data.summary.expensesTrend}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${data.summary.netFlow >= 0 ? "bg-blue-50 dark:bg-blue-950" : "bg-orange-50 dark:bg-orange-950"}`}>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Net Flow</span>
            </div>
            <p className={`text-lg font-bold ${data.summary.netFlow >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              {formatCurrency(data.summary.netFlow)}
            </p>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.summary.avgMonthlyIncome - data.summary.avgMonthlyExpenses)}/mo
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis 
                className="text-xs" 
                tickFormatter={(value) => `₹${(value / 1000)}k`}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelStyle={{ color: 'var(--foreground)' }}
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
