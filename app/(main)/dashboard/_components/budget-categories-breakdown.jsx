"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, AlertTriangle, TrendingDown } from "lucide-react";
import { getBudgetBreakdown } from "@/actions/dashboard-widgets";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

export function BudgetCategoriesBreakdown({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getBudgetBreakdown(defaultAccountId);
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
            <PieChart className="h-5 w-5" />
            Budget Breakdown
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

  if (!data || data.categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Budget Breakdown
          </CardTitle>
          <CardDescription>Monthly spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingDown className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No spending data this month</p>
            <p className="text-xs text-muted-foreground">
              Your category breakdown will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)} ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-violet-500" />
            Budget Breakdown
          </CardTitle>
          {data.isOverBudget && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Over Budget
            </Badge>
          )}
        </div>
        <CardDescription>
          {formatCurrency(data.totalSpent)} spent of {formatCurrency(data.budget)} budget
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Budget Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{data.percentUsed}% used</span>
            <span>{formatCurrency(data.remaining)} remaining</span>
          </div>
          <Progress 
            value={Math.min(100, parseFloat(data.percentUsed))} 
            className={`h-2 ${data.isOverBudget ? "[&>div]:bg-red-500" : ""}`}
          />
        </div>

        {/* Pie Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data.categories}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.categories.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Category List */}
        <div className="space-y-2 mt-4">
          {data.categories.slice(0, 5).map((cat, index) => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{cat.percentage}%</span>
                <span className="text-sm font-medium">{formatCurrency(cat.value)}</span>
              </div>
            </div>
          ))}
          {data.categories.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{data.categories.length - 5} more categories
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
