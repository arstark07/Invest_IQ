"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { getAIInsights } from "@/actions/dashboard-widgets";

const priorityColors = {
  high: "bg-red-100 dark:bg-red-950 border-red-200 dark:border-red-800",
  medium: "bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  low: "bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-800",
};

const priorityIcons = {
  high: AlertTriangle,
  medium: Lightbulb,
  low: CheckCircle2,
};

const priorityTextColors = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-green-600",
};

export function AIInsightsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const result = await getAIInsights();
    if (result.success) {
      setData(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Financial Insights
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

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Financial Insights
            </CardTitle>
            <CardDescription>Personalized advice powered by Gemini AI</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Financial Snapshot */}
        {data?.financialSnapshot && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <p className="font-bold">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.financialSnapshot.totalBalance)}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Savings Rate</p>
              <p className="font-bold">{data.financialSnapshot.savingsRate}%</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Risk Profile</p>
              <p className="font-bold capitalize">{data.financialSnapshot.riskProfile?.toLowerCase() || "Not set"}</p>
            </div>
          </div>
        )}

        {/* Insights Grid */}
        {data?.insights && data.insights.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {data.insights.map((insight, index) => {
              const Icon = priorityIcons[insight.priority] || Lightbulb;
              const colorClass = priorityColors[insight.priority] || priorityColors.medium;
              const textColor = priorityTextColors[insight.priority] || priorityTextColors.medium;

              return (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${colorClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full bg-background`}>
                      <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs capitalize ${textColor}`}
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.insight}</p>
                      
                      {insight.actionable && insight.action && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="outline" size="sm" className="text-xs">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {insight.action.length > 30 
                              ? insight.action.substring(0, 30) + "..." 
                              : insight.action}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              Add more transactions to get personalized insights
            </p>
          </div>
        )}

        {/* Last Updated */}
        {data?.lastUpdated && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
