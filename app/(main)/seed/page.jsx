"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedUserTransactions, seedSavingsGoals, seedBudget, seedAllData } from "@/actions/seed-data";
import { seedInvestmentHistory } from "@/actions/seed";
import { Loader2, Database, CheckCircle2, XCircle, Sparkles, TrendingUp, Target, Wallet, LineChart } from "lucide-react";
import { toast } from "sonner";

export default function SeedDataPage() {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});

  const runSeed = async (name, fn) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
    try {
      const result = await fn();
      setResults((prev) => ({ ...prev, [name]: result }));
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(error.message);
      setResults((prev) => ({ ...prev, [name]: { success: false, error: error.message } }));
    }
    setLoading((prev) => ({ ...prev, [name]: false }));
  };

  const seedOptions = [
    {
      name: "transactions",
      title: "Seed Transactions",
      description: "Generate 6 months of realistic transaction data with various categories",
      icon: TrendingUp,
      fn: seedUserTransactions,
      color: "text-blue-500",
    },
    {
      name: "investments",
      title: "Seed Investment History",
      description: "Generate 2 years of investment transactions (SIP, Stocks, ELSS, Gold) with realistic returns",
      icon: LineChart,
      fn: seedInvestmentHistory,
      color: "text-emerald-500",
    },
    {
      name: "goals",
      title: "Seed Savings Goals",
      description: "Create sample savings goals like Emergency Fund, Vacation, etc.",
      icon: Target,
      fn: seedSavingsGoals,
      color: "text-green-500",
    },
    {
      name: "budget",
      title: "Set Budget",
      description: "Set a monthly budget of ₹75,000",
      icon: Wallet,
      fn: seedBudget,
      color: "text-purple-500",
    },
    {
      name: "all",
      title: "Seed All Data",
      description: "Run all seed operations at once for a complete setup",
      icon: Sparkles,
      fn: seedAllData,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-title mb-2">Seed Demo Data</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Populate your account with realistic financial data to see the platform in action.
            This will replace any existing data.
          </p>
        </div>

        {/* Seed Options */}
        <div className="grid gap-4 md:grid-cols-2">
          {seedOptions.map((option) => {
            const Icon = option.icon;
            const result = results[option.name];
            const isLoading = loading[option.name];

            return (
              <Card 
                key={option.name} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  result?.success ? 'ring-2 ring-green-500/50' : ''
                }`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full -translate-y-16 translate-x-16" />
                
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${option.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => runSeed(option.name, option.fn)}
                      disabled={isLoading}
                      className={option.name === 'all' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Seeding...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 mr-2" />
                          Run Seed
                        </>
                      )}
                    </Button>
                    
                    {result && (
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.success ? 'Success!' : 'Failed'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">📝 Instructions</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Click &quot;Seed All Data&quot; for a complete demo setup</li>
              <li>• <strong>Seed Investment History</strong> creates 2 years of SIP, Stocks, ELSS, Gold investments with returns</li>
              <li>• Transactions span 6 months with realistic merchants and amounts</li>
              <li>• All amounts are in INR (Indian Rupees)</li>
              <li>• After seeding, visit the Dashboard and Portfolio to see your data</li>
              <li>• You can run seeds multiple times - they replace existing data</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
