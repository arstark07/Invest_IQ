"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { getSpendingInsights } from "@/actions/dashboard-widgets";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const insightIcons = {
  warning: AlertTriangle,
  tip: Lightbulb,
  success: CheckCircle2,
  info: Info,
};

const insightColors = {
  warning: "text-amber-500 bg-amber-50 dark:bg-amber-950",
  tip: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  success: "text-green-500 bg-green-50 dark:bg-green-950",
  info: "text-purple-500 bg-purple-50 dark:bg-purple-950",
};

export function SpendingInsights({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getSpendingInsights(defaultAccountId);
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
            <Lightbulb className="h-5 w-5" />
            Spending Insights
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
            <Lightbulb className="h-5 w-5" />
            Spending Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No spending data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Spending Insights
        </CardTitle>
        <CardDescription>AI-powered analysis of your spending patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Spent */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Total Spent (Last 2 Months)</span>
          <span className="font-bold">{formatCurrency(data.totalSpent)}</span>
        </div>

        {/* AI Insights */}
        <div className="space-y-3">
          {data.insights.map((insight, index) => {
            const Icon = insightIcons[insight.type] || Info;
            const colorClass = insightColors[insight.type] || insightColors.info;
            
            return (
              <div key={index} className={`p-3 rounded-lg ${colorClass.split(" ").slice(1).join(" ")}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${colorClass.split(" ")[0]}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    {insight.savings && (
                      <Badge variant="outline" className="mt-2">
                        Potential savings: {formatCurrency(insight.savings)}/month
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Categories */}
        {data.categoryBreakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Top Spending Categories</p>
            {data.categoryBreakdown.slice(0, 4).map((cat, index) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{cat.count} txns</span>
                  <span className="font-medium">{formatCurrency(cat.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
