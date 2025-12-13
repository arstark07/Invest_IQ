"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Loader2, ArrowLeft, Lightbulb, Target, AlertCircle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { getAccountRecommendations } from "@/actions/recommendations";

export default function AssetDetailModal({ asset, open, onOpenChange, transactions = [] }) {
  const [view, setView] = useState("summary"); // summary | transactions | insights
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  
  // Reset view when modal opens/closes
  useEffect(() => {
    if (open) {
      setView("summary");
      setRecommendations(null);
    }
  }, [open]);

  if (!asset) return null;

  const {
    type,
    invested = 0,
    currentValue = 0,
    returnAmount = 0,
    returnPercent = 0,
    count = 0,
  } = asset;

  const isPositive = returnAmount >= 0;

  // Filter all transactions for this asset type
  const assetTransactions = transactions.filter(
    t => t.category === type || t.type === type
  );

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    try {
      const result = await getAccountRecommendations();
      if (result.success) {
        setRecommendations(result);
        setView("insights");
      } else {
        toast.error("Failed to generate insights", {
          description: result.error || "Please try again later"
        });
      }
    } catch (error) {
      console.error("Error getting insights:", error);
      toast.error("Error generating insights", {
        description: "An unexpected error occurred"
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  // Mock historical data for sparkline
  const chartData = [
    { value: invested * 0.95 },
    { value: invested * 0.98 },
    { value: invested * 1.02 },
    { value: invested * 1.05 },
    { value: currentValue },
  ];

  // Get investment alternatives based on performance and risk profile
  const getAlternatives = () => {
    const riskProfile = recommendations?.riskProfile || "moderate";
    
    if (isPositive && returnPercent < 5) {
      // Low returns - suggest higher yield alternatives
      if (riskProfile === "conservative") {
        return [
          { name: "High-Yield Bonds", expectedReturn: "6-8%", risk: "Low-Medium", description: "Stable returns with moderate risk" },
          { name: "Dividend Stocks", expectedReturn: "7-10%", risk: "Medium", description: "Regular income with growth potential" }
        ];
      } else if (riskProfile === "aggressive") {
        return [
          { name: "Growth Stocks", expectedReturn: "12-18%", risk: "High", description: "High growth potential in tech/emerging sectors" },
          { name: "Cryptocurrency", expectedReturn: "15-25%", risk: "Very High", description: "Volatile but potentially high returns" },
          { name: "Sector ETFs", expectedReturn: "10-15%", risk: "Medium-High", description: "Diversified exposure to high-growth sectors" }
        ];
      } else {
        return [
          { name: "Index Funds", expectedReturn: "8-12%", risk: "Medium", description: "Broad market exposure with steady growth" },
          { name: "Balanced Mutual Funds", expectedReturn: "9-13%", risk: "Medium", description: "Mix of equity and debt for stability" }
        ];
      }
    } else if (!isPositive) {
      // Negative returns - suggest safer alternatives
      if (riskProfile === "aggressive") {
        return [
          { name: "Diversified ETFs", expectedReturn: "7-10%", risk: "Medium", description: "Reduce volatility with broad diversification" },
          { name: "Blue-Chip Stocks", expectedReturn: "8-12%", risk: "Medium", description: "Established companies with proven track records" }
        ];
      } else {
        return [
          { name: "Government Bonds", expectedReturn: "4-6%", risk: "Low", description: "Capital preservation with guaranteed returns" },
          { name: "Fixed Deposits", expectedReturn: "5-7%", risk: "Very Low", description: "Safest option with fixed interest" },
          { name: "Money Market Funds", expectedReturn: "4-5%", risk: "Very Low", description: "High liquidity with minimal risk" }
        ];
      }
    } else {
      // Good returns - suggest maintaining or scaling
      return [
        { name: `Continue with ${type.replace(/_/g, " ")}`, expectedReturn: `${returnPercent.toFixed(1)}%+`, risk: "Current", description: "Your current strategy is performing well" },
        { name: "Scale Up Investment", expectedReturn: "Similar Returns", risk: "Current", description: "Increase allocation to capitalize on success" }
      ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {view === "summary" && (
              <>
                {type.replace(/_/g, " ")}
                <Badge variant={isPositive ? "default" : "destructive"} className="ml-2">
                  {count} {count === 1 ? "Transaction" : "Transactions"}
                </Badge>
              </>
            )}
            {view === "transactions" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("summary")}
                  className="mr-2 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                All Transactions
              </>
            )}
            {view === "insights" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("summary")}
                  className="mr-2 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Investment Insights & Recommendations
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {view === "summary" && "Detailed performance metrics and recent activity"}
            {view === "transactions" && `Showing all ${assetTransactions.length} transactions for ${type.replace(/_/g, " ")}`}
            {view === "insights" && "AI-powered recommendations tailored to your portfolio"}
          </DialogDescription>
        </DialogHeader>

        {/* Summary View */}
        {view === "summary" && (
          <div className="space-y-6 mt-4">
            {/* Performance Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                  <p className="text-2xl font-bold">₹{invested.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                  <p className="text-2xl font-bold">₹{currentValue.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
            </div>

            {/* ROI Card with Sparkline */}
            <Card className={cn(
              "border-2",
              isPositive ? "border-green-500/50 bg-green-50/50" : "border-red-500/50 bg-red-50/50"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Return on Investment</p>
                    <div className="flex items-baseline gap-2">
                      <p className={cn(
                        "text-3xl font-bold",
                        isPositive ? "text-green-600" : "text-red-600"
                      )}>
                        {isPositive ? "+" : ""}₹{Math.abs(returnAmount).toLocaleString("en-IN")}
                      </p>
                      <Badge variant={isPositive ? "default" : "destructive"} className="text-sm">
                        {isPositive ? "+" : ""}{returnPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  {isPositive ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
                
                {/* Sparkline Chart */}
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart data={chartData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={isPositive ? "#16a34a" : "#dc2626"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Recent Transactions
                {assetTransactions.length > 5 && (
                  <Badge variant="outline">{assetTransactions.length} total</Badge>
                )}
              </h3>
              {assetTransactions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No transactions found for this asset type
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {assetTransactions.slice(0, 5).map((transaction) => (
                    <Card key={transaction.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              transaction.type === "INCOME" ? "bg-green-100" : "bg-red-100"
                            )}>
                              {transaction.type === "INCOME" ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-semibold",
                              transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                            )}>
                              {transaction.type === "INCOME" ? "+" : "-"}₹{Math.abs(transaction.amount).toLocaleString("en-IN")}
                            </p>
                            {transaction.status && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {transaction.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setView("transactions")}
                disabled={assetTransactions.length === 0}
              >
                View All Transactions ({assetTransactions.length})
              </Button>
              <Button
                className="flex-1"
                onClick={handleGetInsights}
                disabled={loadingInsights}
              >
                {loadingInsights ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get Rebalance Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* All Transactions View */}
        {view === "transactions" && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              {assetTransactions.map((transaction) => (
                <Card key={transaction.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          transaction.type === "INCOME" ? "bg-green-100" : "bg-red-100"
                        )}>
                          {transaction.type === "INCOME" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </p>
                            {transaction.category && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold text-lg",
                          transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.type === "INCOME" ? "+" : "-"}₹{Math.abs(transaction.amount).toLocaleString("en-IN")}
                        </p>
                        {transaction.status && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {transaction.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{assetTransactions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invested</p>
                    <p className="text-2xl font-bold">₹{invested.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-bold">₹{currentValue.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insights View */}
        {view === "insights" && recommendations && (
          <div className="space-y-6 mt-4">
            {/* Performance Alert */}
            <Card className={cn(
              "border-2",
              isPositive ? "border-green-500/50 bg-green-50/50" : "border-amber-500/50 bg-amber-50/50"
            )}>
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className={cn(
                  "h-5 w-5 mt-0.5",
                  isPositive ? "text-green-600" : "text-amber-600"
                )} />
                <div>
                  <h4 className="font-semibold mb-1">
                    {isPositive ? "Strong Performance" : "Performance Review Needed"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Your {type.replace(/_/g, " ")} investment has {isPositive ? "gained" : "lost"} {" "}
                    ₹{Math.abs(returnAmount).toLocaleString("en-IN")} ({Math.abs(returnPercent).toFixed(2)}%).
                    {isPositive && returnPercent > 10 
                      ? " Excellent returns! Consider maintaining or scaling this allocation."
                      : !isPositive
                      ? " We recommend reviewing your strategy and considering alternatives below."
                      : " Consider alternatives below for potentially higher returns."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            {recommendations.recommendations && recommendations.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  AI-Powered Recommendations
                </h3>
                <div className="space-y-3">
                  {recommendations.recommendations.slice(0, 3).map((rec, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">
                            {rec.priority || "Medium"}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium mb-1">{rec.suggestion}</p>
                            {rec.reason && (
                              <p className="text-sm text-muted-foreground">{rec.reason}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Investment Alternatives */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Alternative Investment Options
                <Badge variant="secondary" className="ml-auto">
                  Based on {recommendations.riskProfile || "Moderate"} Risk Profile
                </Badge>
              </h3>
              <div className="grid gap-3">
                {getAlternatives().map((alt, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{alt.name}</h4>
                        <Badge variant="outline">{alt.risk}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alt.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Expected Return:</span>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {alt.expectedReturn}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Suggestion */}
            <Card className="border-2 border-blue-500/50 bg-blue-50/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Next Steps</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Review the alternative options above based on your risk tolerance</li>
                  <li>• Consider diversifying into 2-3 different asset classes</li>
                  <li>• Consult with a financial advisor for personalized guidance</li>
                  <li>• Monitor performance monthly and rebalance quarterly</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
