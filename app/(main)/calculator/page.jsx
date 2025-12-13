"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, BarChart3, Trash2 } from "lucide-react";
import { INVESTMENT_SCHEMES } from "@/lib/investment-calculator";
import { SIPCalculator } from "@/components/calculators/sip-calculator";
import { GenericCalculator } from "@/components/calculators/generic-calculator";
import { ComparisonView } from "@/components/calculators/comparison-view";
import { toast } from "sonner";

export default function InvestmentCalculatorPage() {
  const [activeScheme, setActiveScheme] = useState("sip");
  const [calculationResults, setCalculationResults] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const handleCalculate = useCallback((result) => {
    setCalculationResults((prev) => [...prev, {
      ...result,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    }]);
    toast.success("Calculation added to comparison");
  }, []);

  const handleExportCSV = useCallback(() => {
    if (calculationResults.length === 0) {
      toast.error("No calculations to export");
      return;
    }

    const csvContent = [
      ["Scheme", "Total Invested", "Returns", "Maturity Amount", "ROI %", "Date"],
      ...calculationResults.map((r) => [
        r.scheme,
        r.totalInvested,
        r.returns,
        r.maturityAmount,
        ((r.returns / r.totalInvested) * 100).toFixed(2),
        new Date(r.timestamp).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investment-calculations-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  }, [calculationResults]);

  const handleShare = useCallback(async () => {
    if (calculationResults.length === 0) {
      toast.error("No calculations to share");
      return;
    }

    const latest = calculationResults[calculationResults.length - 1];
    const shareText = `Investment Calculator Result\n\nScheme: ${latest.scheme}\nInvested: ₹${latest.totalInvested.toLocaleString()}\nReturns: ₹${latest.returns.toLocaleString()}\nMaturity: ₹${latest.maturityAmount.toLocaleString()}\n\nCalculated on InvestIQ`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Investment Calculation", text: shareText });
        toast.success("Shared successfully");
      } catch (error) {
        if (error.name !== "AbortError") {
          navigator.clipboard.writeText(shareText);
          toast.success("Copied to clipboard");
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard");
    }
  }, [calculationResults]);

  const clearResults = useCallback(() => {
    setCalculationResults([]);
    toast.success("Results cleared");
  }, []);

  const schemes = Object.values(INVESTMENT_SCHEMES);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Investment Calculator</h1>
        <p className="text-gray-600">
          Calculate returns for various Indian investment schemes
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button onClick={handleShare} variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button
          onClick={() => setShowComparison(!showComparison)}
          variant={showComparison ? "default" : "outline"}
          size="sm"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Compare ({calculationResults.length})
        </Button>
        {calculationResults.length > 0 && (
          <Button onClick={clearResults} variant="ghost" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Comparison View */}
      {showComparison && calculationResults.length > 0 && (
        <div className="mb-6">
          <ComparisonView results={calculationResults} />
        </div>
      )}

      {/* Calculator Tabs */}
      <Tabs value={activeScheme} onValueChange={setActiveScheme}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 h-auto mb-6">
          {schemes.map((scheme) => (
            <TabsTrigger
              key={scheme.id}
              value={scheme.id}
              className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {scheme.name.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="sip">
          <SIPCalculator onCalculate={handleCalculate} />
        </TabsContent>

        {schemes.filter(s => s.id !== "sip").map((scheme) => (
          <TabsContent key={scheme.id} value={scheme.id}>
            <GenericCalculator
              scheme={scheme}
              onCalculate={handleCalculate}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
