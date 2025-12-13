"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { convertCurrency, getCurrencyRates } from "@/actions/dashboard-widgets";

const popularCurrencies = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "AUD", "CAD"];

export function CurrencyConverter() {
  const [currencies, setCurrencies] = useState([]);
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [amount, setAmount] = useState("1000");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchRates() {
      const res = await getCurrencyRates();
      if (res.success) {
        setCurrencies(res.data.currencies);
        setLastUpdated(res.data.lastUpdated);
      }
    }
    fetchRates();
  }, []);

  const handleConvert = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setResult(null);
      return;
    }

    setLoading(true);
    const res = await convertCurrency(parseFloat(amount), fromCurrency, toCurrency);
    if (res.success) {
      setResult(res.data);
    }
    setLoading(false);
  }, [amount, fromCurrency, toCurrency]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const formatAmount = (value, currency) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-cyan-500" />
          Currency Converter
        </CardTitle>
        <CardDescription>Real-time conversion with 30+ currencies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
              placeholder="Enter amount"
            />
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.length > 0 ? (
                  currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))
                ) : (
                  popularCurrencies.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button variant="outline" size="icon" onClick={swapCurrencies}>
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Converted To</label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted rounded-md text-lg font-bold">
              {loading ? (
                <span className="text-muted-foreground">Converting...</span>
              ) : result ? (
                formatAmount(result.convertedAmount, toCurrency)
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.length > 0 ? (
                  currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))
                ) : (
                  popularCurrencies.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exchange Rate */}
        {result && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">
                1 {fromCurrency} = {result.rate} {toCurrency}
              </span>
            </div>
          </div>
        )}

        {/* Quick Conversions */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Convert</p>
          <div className="flex flex-wrap gap-2">
            {popularCurrencies
              .filter((c) => c !== fromCurrency)
              .slice(0, 4)
              .map((currency) => (
                <Button
                  key={currency}
                  variant="outline"
                  size="sm"
                  onClick={() => setToCurrency(currency)}
                  className={toCurrency === currency ? "border-primary" : ""}
                >
                  {currency}
                </Button>
              ))}
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center">
            Rates simulated • Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
