"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Building2, Landmark, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import {
  calculateFD,
  calculateRD,
  calculatePPF,
  calculateSCSS,
  calculateKVP,
  calculateNSC,
  calculateSSY,
  calculateSavingsAccount,
  calculateLumpsum,
  formatCurrency,
  GOVERNMENT_RATES,
} from "@/lib/investment-calculator";

const SCHEME_ICONS = {
  fd: Building2,
  rd: PiggyBank,
  mf: TrendingUp,
  stock: TrendingUp,
  ppf: Landmark,
  scss: Landmark,
  kvp: Landmark,
  nsc: Landmark,
  ssy: Landmark,
  sb: Wallet,
};

export function GenericCalculator({ scheme, onCalculate }) {
  const [principal, setPrincipal] = useState(100000);
  const [monthlyAmount, setMonthlyAmount] = useState(5000);
  const [yearlyAmount, setYearlyAmount] = useState(50000);
  const [rate, setRate] = useState(scheme.defaultRate || scheme.fixedRate || 8);
  const [years, setYears] = useState(scheme.fixedTenure || 5);
  const [result, setResult] = useState(null);

  const isGovernmentScheme = ["ppf", "scss", "kvp", "nsc", "ssy", "sb"].includes(scheme.id);
  const fixedRate = GOVERNMENT_RATES[scheme.id.toUpperCase()];
  const Icon = SCHEME_ICONS[scheme.id] || Calculator;

  const handleCalculate = useCallback(() => {
    let calculatedResult;

    switch (scheme.id) {
      case "fd":
        calculatedResult = calculateFD(principal, rate, years);
        break;
      case "rd":
        calculatedResult = calculateRD(monthlyAmount, rate, years);
        break;
      case "mf":
      case "stock":
        calculatedResult = calculateLumpsum(principal, rate, years);
        break;
      case "ppf":
        calculatedResult = calculatePPF(yearlyAmount, years);
        break;
      case "scss":
        calculatedResult = calculateSCSS(principal);
        break;
      case "kvp":
        calculatedResult = calculateKVP(principal);
        break;
      case "nsc":
        calculatedResult = calculateNSC(principal);
        break;
      case "ssy":
        calculatedResult = calculateSSY(yearlyAmount, years);
        break;
      case "sb":
        calculatedResult = calculateSavingsAccount(principal, years);
        break;
      default:
        calculatedResult = calculateFD(principal, rate, years);
    }

    setResult(calculatedResult);
    onCalculate?.({
      scheme: scheme.name,
      ...calculatedResult,
      inputs: { principal, monthlyAmount, yearlyAmount, rate, years },
    });
  }, [scheme, principal, monthlyAmount, yearlyAmount, rate, years, onCalculate]);

  const roi = useMemo(() => {
    if (!result) return 0;
    return ((result.returns / result.totalInvested) * 100).toFixed(2);
  }, [result]);

  // Determine which inputs to show
  const showPrincipal = ["fd", "mf", "stock", "scss", "kvp", "nsc", "sb"].includes(scheme.id);
  const showMonthly = scheme.id === "rd";
  const showYearly = ["ppf", "ssy"].includes(scheme.id);
  const showRate = !isGovernmentScheme;
  const showYears = !["scss", "kvp", "nsc"].includes(scheme.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          {scheme.name}
        </CardTitle>
        <CardDescription>{scheme.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Principal Amount */}
          {showPrincipal && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {scheme.id === "scss" ? "Investment Amount (Max ₹30 Lakhs)" : "Principal Amount (₹)"}
              </label>
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                min={scheme.minAmount || 1000}
                max={scheme.maxAmount || 10000000}
                step="1000"
              />
              <input
                type="range"
                min={scheme.minAmount || 1000}
                max={scheme.maxAmount || 1000000}
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          )}

          {/* Monthly Deposit */}
          {showMonthly && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Monthly Deposit (₹)
              </label>
              <Input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                min="100"
                step="100"
              />
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          )}

          {/* Yearly Deposit */}
          {showYearly && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Yearly Deposit (₹) {scheme.id === "ppf" && "(Min ₹500, Max ₹1.5 Lakhs)"}
              </label>
              <Input
                type="number"
                value={yearlyAmount}
                onChange={(e) => setYearlyAmount(Number(e.target.value))}
                min={scheme.minAmount || 500}
                max={scheme.maxAmount || 150000}
                step="1000"
              />
              <input
                type="range"
                min={scheme.minAmount || 500}
                max={scheme.maxAmount || 150000}
                step="1000"
                value={yearlyAmount}
                onChange={(e) => setYearlyAmount(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          )}

          {/* Interest Rate */}
          {showRate && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Interest Rate (% p.a.)
              </label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                min="1"
                max="30"
                step="0.1"
              />
              <input
                type="range"
                min="1"
                max="30"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          )}

          {/* Fixed Rate Info */}
          {isGovernmentScheme && fixedRate && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Current Interest Rate:</strong> {fixedRate}% p.a.
              </p>
            </div>
          )}

          {/* Time Period */}
          {showYears && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Period (Years)
                {scheme.id === "ppf" && " (Min 15 years)"}
                {scheme.id === "ssy" && " (Max 21 years)"}
              </label>
              <Input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                min={scheme.minTenure || 1}
                max={scheme.maxTenure || 40}
              />
              <input
                type="range"
                min={scheme.minTenure || 1}
                max={scheme.maxTenure || 40}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          )}

          {/* Fixed Tenure Info */}
          {["scss", "nsc"].includes(scheme.id) && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Fixed Tenure:</strong> 5 years
              </p>
            </div>
          )}

          {scheme.id === "kvp" && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Maturity:</strong> 115 months (9.6 years) - Doubles your money
              </p>
            </div>
          )}

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate
          </Button>
        </div>

        {/* Results */}
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
            {result.quarterlyInterest && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quarterly Interest</span>
                <span className="text-base font-medium text-blue-600">
                  {formatCurrency(result.quarterlyInterest)}
                </span>
              </div>
            )}
            {result.tenure && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Maturity Tenure</span>
                <span className="text-base font-medium">{result.tenure}</span>
              </div>
            )}
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
