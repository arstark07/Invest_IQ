"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, TrendingUp } from "lucide-react";
import { calculateSIP, formatCurrency, INVESTMENT_SCHEMES } from "@/lib/investment-calculator";

export function SIPCalculator({ onCalculate }) {
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);
  const [result, setResult] = useState(null);

  const scheme = INVESTMENT_SCHEMES.SIP;

  const handleCalculate = useCallback(() => {
    const calculatedResult = calculateSIP(monthlyInvestment, expectedReturn, timePeriod);
    setResult(calculatedResult);
    onCalculate?.({
      scheme: "SIP",
      ...calculatedResult,
      inputs: { monthlyInvestment, expectedReturn, timePeriod },
    });
  }, [monthlyInvestment, expectedReturn, timePeriod, onCalculate]);

  const roi = useMemo(() => {
    if (!result) return 0;
    return ((result.returns / result.totalInvested) * 100).toFixed(2);
  }, [result]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          SIP Calculator
        </CardTitle>
        <CardDescription>{scheme.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Monthly Investment (₹)
            </label>
            <Input
              type="number"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              min={scheme.minAmount}
              max={scheme.maxAmount}
              step="500"
            />
            <input
              type="range"
              min={scheme.minAmount}
              max={scheme.maxAmount}
              step="500"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              className="w-full mt-2 accent-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Expected Return Rate (% p.a.)
            </label>
            <Input
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              min="1"
              max="30"
              step="0.5"
            />
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full mt-2 accent-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Time Period (Years)
            </label>
            <Input
              type="number"
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              min="1"
              max="40"
            />
            <input
              type="range"
              min="1"
              max="40"
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              className="w-full mt-2 accent-primary"
            />
          </div>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate
          </Button>
        </div>

        {result && (
          <div className="mt-6 space-y-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Invested</span>
              <span className="text-lg font-semibold">{formatCurrency(result.totalInvested)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated Returns</span>
              <span className="text-lg font-semibold text-green-600">
                +{formatCurrency(result.returns)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ROI</span>
              <span className="text-lg font-semibold text-green-600">{roi}%</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="font-medium">Maturity Amount</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(result.maturityAmount)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
