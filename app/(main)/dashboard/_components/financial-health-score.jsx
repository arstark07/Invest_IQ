"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, TrendingUp, Wallet, Target, PiggyBank, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { getFinancialHealthScore } from "@/actions/dashboard-widgets";

const scoreColors = {
  green: "from-green-500 to-emerald-500",
  blue: "from-blue-500 to-cyan-500",
  yellow: "from-yellow-500 to-amber-500",
  orange: "from-orange-500 to-red-400",
  red: "from-red-500 to-rose-600",
};

const badgeColors = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-700",
};

// Score justifications and improvement suggestions
const scoreJustifications = {
  savingsRate: {
    getExplanation: (value, score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return `Excellent! You're saving ${value}% of your income, which exceeds the recommended 20% savings rate.`;
      if (percentage >= 60) return `Good job! You're saving ${value}% of your income. The recommended rate is 20% or more.`;
      if (percentage >= 40) return `You're saving ${value}% of your income. Consider increasing to at least 20% for better financial security.`;
      return `Your savings rate of ${value}% is below optimal. Aim for at least 20% of your income.`;
    },
    getImprovements: (score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return [];
      const suggestions = [];
      if (percentage < 80) suggestions.push("Set up automatic transfers to savings on payday");
      if (percentage < 60) suggestions.push("Review and cut unnecessary subscriptions");
      if (percentage < 40) suggestions.push("Create a detailed budget to identify saving opportunities");
      if (percentage < 20) suggestions.push("Start with saving even 5% and gradually increase");
      return suggestions;
    },
  },
  emergencyFund: {
    getExplanation: (value, score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return `Great! You have ${value} months of expenses saved, meeting the 6-month emergency fund goal.`;
      if (percentage >= 60) return `You have ${value} months of expenses saved. Aim for 6 months for full protection.`;
      if (percentage >= 40) return `Your emergency fund covers ${value} months. The recommended amount is 3-6 months of expenses.`;
      return `Your emergency fund of ${value} months is low. Building this up should be a priority.`;
    },
    getImprovements: (score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return [];
      const suggestions = [];
      if (percentage < 80) suggestions.push("Allocate a portion of each paycheck specifically to emergency savings");
      if (percentage < 60) suggestions.push("Keep emergency fund in a high-yield savings account");
      if (percentage < 40) suggestions.push("Set a specific monthly target for emergency fund contributions");
      if (percentage < 20) suggestions.push("Start with a goal of ₹50,000 as an initial emergency buffer");
      return suggestions;
    },
  },
  budgetAdherence: {
    getExplanation: (value, score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return `Excellent budget discipline! You're staying well within your budget limits.`;
      if (percentage >= 60) return `Good budget management with minor overspending in some categories.`;
      if (percentage >= 40) return `Your spending is exceeding budget in several categories. Review your allocations.`;
      return `Significant budget overruns detected. Consider revising your budget or reducing spending.`;
    },
    getImprovements: (score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return [];
      const suggestions = [];
      if (percentage < 80) suggestions.push("Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings");
      if (percentage < 60) suggestions.push("Track all expenses daily for better awareness");
      if (percentage < 40) suggestions.push("Identify your top 3 overspending categories and set stricter limits");
      if (percentage < 20) suggestions.push("Consider using cash envelopes for discretionary spending");
      return suggestions;
    },
  },
  incomeStability: {
    getExplanation: (value, score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return `Your income is very stable, which is excellent for financial planning.`;
      if (percentage >= 60) return `Your income shows good stability with minor variations.`;
      if (percentage >= 40) return `Your income has some variability. Consider building a larger emergency fund.`;
      return `Your income shows significant variation. Focus on building financial buffers.`;
    },
    getImprovements: (score, max) => {
      const percentage = (score / max) * 100;
      if (percentage >= 80) return [];
      const suggestions = [];
      if (percentage < 80) suggestions.push("Build a larger emergency fund to handle income fluctuations");
      if (percentage < 60) suggestions.push("Consider diversifying your income sources");
      if (percentage < 40) suggestions.push("Track your income patterns to better predict cash flow");
      if (percentage < 20) suggestions.push("Look for more stable income opportunities or side income");
      return suggestions;
    },
  },
};

export function FinancialHealthScore({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const result = await getFinancialHealthScore(defaultAccountId);
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [defaultAccountId]);

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Financial Health Score
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
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Unable to calculate score</p>
        </CardContent>
      </Card>
    );
  }

  const breakdown = [
    { key: "savingsRate", icon: PiggyBank, label: "Savings Rate", suffix: "%" },
    { key: "emergencyFund", icon: Wallet, label: "Emergency Fund", suffix: " months" },
    { key: "budgetAdherence", icon: Target, label: "Budget", suffix: "" },
    { key: "incomeStability", icon: TrendingUp, label: "Income Stability", suffix: "" },
  ];

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Financial Health Score
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={badgeColors[data.color]}>
                {data.status}
              </Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <CardDescription>Comprehensive analysis of your financial wellbeing</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Main Score Circle */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${scoreColors[data.color]} flex items-center justify-center shadow-lg`}>
                <div className="w-24 h-24 rounded-full bg-card flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{data.totalScore}</span>
                  <span className="text-2xl font-semibold text-muted-foreground">{data.grade}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {breakdown.map(({ key, icon: Icon, label, suffix }) => {
              const item = data.breakdown[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{label}</span>
                    </div>
                    <span className="font-medium">{item.score}/{item.max}</span>
                  </div>
                  <Progress value={(item.score / item.max) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">{item.value}{suffix}</p>
                </div>
              );
            })}
          </div>

          {/* Insights */}
          {data.insights && data.insights.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Recommendations</p>
              {data.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Score Breakdown Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Financial Health Score Breakdown
            </DialogTitle>
            <DialogDescription>
              Detailed analysis of each component contributing to your financial health score
            </DialogDescription>
          </DialogHeader>

          {/* Overall Score Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${scoreColors[data.color]} flex items-center justify-center shadow-lg`}>
              <div className="w-16 h-16 rounded-full bg-card flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{data.totalScore}</span>
                <span className="text-sm font-semibold text-muted-foreground">{data.grade}</span>
              </div>
            </div>
            <div className="flex-1">
              <Badge className={badgeColors[data.color]}>{data.status}</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Your overall financial health score is calculated from 4 key metrics below.
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-6">
            {breakdown.map(({ key, icon: Icon, label, suffix }) => {
              const item = data.breakdown[key];
              const justification = scoreJustifications[key];
              const explanation = justification.getExplanation(item.value, item.score, item.max);
              const improvements = justification.getImprovements(item.score, item.max);
              const scorePercentage = (item.score / item.max) * 100;

              return (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${
                        scorePercentage >= 80 ? 'bg-green-100' :
                        scorePercentage >= 60 ? 'bg-blue-100' :
                        scorePercentage >= 40 ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          scorePercentage >= 80 ? 'text-green-600' :
                          scorePercentage >= 60 ? 'text-blue-600' :
                          scorePercentage >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{label}</h4>
                        <p className="text-sm text-muted-foreground">Current: {item.value}{suffix}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold">{item.score}</span>
                      <span className="text-muted-foreground">/{item.max}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={scorePercentage} className="h-3" />

                  {/* Explanation */}
                  <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-md">
                    {scorePercentage >= 60 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{explanation}</p>
                  </div>

                  {/* Improvement Suggestions */}
                  {improvements.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">How to improve:</p>
                      <ul className="space-y-1">
                        {improvements.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* General Recommendations */}
          {data.insights && data.insights.length > 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Priority Recommendations
              </p>
              <ul className="space-y-2">
                {data.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-1">→</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
