"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Lightbulb } from "lucide-react";
import { getAccountRecommendations } from "@/actions/recommendations";

export function AccountRecommendations() {
  const [accountRisks, setAccountRisks] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load saved risk levels from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("accountRiskLevels");
    if (saved) {
      setAccountRisks(JSON.parse(saved));
    }
  }, []);

  // Fetch recommendations for all accounts with their individual risk levels
  const fetchAllRecommendations = async () => {
    setLoading(true);
    try {
      // First call with moderate to get all accounts
      const data = await getAccountRecommendations("moderate");
      if (data && data.success && data.recommendations && data.recommendations.length > 0) {
        // Initialize risk levels for all accounts if not already set
        const newRisks = { ...accountRisks };
        data.recommendations.forEach((rec) => {
          if (!newRisks[rec.accountId]) {
            newRisks[rec.accountId] = "moderate";
          }
        });
        setAccountRisks(newRisks);
        localStorage.setItem("accountRiskLevels", JSON.stringify(newRisks));
        setRecommendations(data.recommendations);
      } else if (data && !data.success) {
        console.error("Failed to fetch recommendations:", data.error);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRiskLevelChange = async (accountId, newRiskLevel) => {
    const updatedRisks = { ...accountRisks, [accountId]: newRiskLevel };
    setAccountRisks(updatedRisks);
    localStorage.setItem("accountRiskLevels", JSON.stringify(updatedRisks));
    
    // Update loading state for specific account only
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.accountId === accountId
          ? { ...rec, recommendation: "Generating recommendation..." }
          : rec
      )
    );

    // Fetch recommendation for this specific account only
    try {
      const data = await getAccountRecommendations(newRiskLevel);
      if (data && data.success && data.recommendations) {
        const updatedRec = data.recommendations.find((r) => r.accountId === accountId);
        if (updatedRec) {
          setRecommendations((prev) =>
            prev.map((rec) =>
              rec.accountId === accountId ? updatedRec : rec
            )
          );
        }
      } else if (data && !data.success) {
        console.error("Failed to update recommendation:", data.error);
        setRecommendations((prev) =>
          prev.map((rec) =>
            rec.accountId === accountId
              ? { ...rec, recommendation: "Failed to load recommendation" }
              : rec
          )
        );
      }
    } catch (error) {
      console.error("Error updating recommendation:", error);
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.accountId === accountId
            ? { ...rec, recommendation: "Failed to load recommendation" }
            : rec
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Investment Recommendations
        </h2>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!recommendations?.length) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Investment Recommendations
        </h2>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No accounts found. Create an account to get personalized investment
            recommendations.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Lightbulb className="h-6 w-6 text-yellow-500" />
        AI Investment Recommendations
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Select your risk tolerance for each account to get personalized investment advice.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <Card
            key={rec.accountId}
            className="border-l-4 border-l-gradient hover:shadow-lg transition-shadow"
            style={{
              borderLeftColor: getAccountColor(rec.accountType),
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{rec.accountName}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                  {rec.accountType}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <DollarSign className="h-5 w-5 text-green-600" />
                {parseFloat(rec.balance).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardHeader>
            <CardContent>
              {/* Risk Level Selector for Individual Account */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  📊 Your Risk Tolerance:
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "conservative", label: "Conservative", icon: "🛡️" },
                    { value: "moderate", label: "Moderate", icon: "⚖️" },
                    { value: "aggressive", label: "Aggressive", icon: "🚀" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleRiskLevelChange(rec.accountId, option.value)}
                      className={`px-2 py-1 text-xs rounded font-medium transition-all whitespace-nowrap ${
                        (accountRisks[rec.accountId] || "moderate") === option.value
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                      }`}
                      title={option.label}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: <strong>{accountRisks[rec.accountId] || "moderate"}</strong>
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  {rec.recommendation === "Generating recommendation..." ? (
                    <Loader2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0 animate-spin" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {rec.recommendation}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Pro Tip:</strong> These recommendations are AI-generated
          based on your financial data. For major investment decisions, consider
          consulting with a licensed financial advisor.
        </p>
      </div>
    </div>
  );
}

function getAccountColor(accountType) {
  const colors = {
    SAVINGS: "#10b981", // green
    CURRENT: "#3b82f6", // blue
    CHECKING: "#3b82f6", // blue
    INVESTMENT: "#8b5cf6", // purple
    CREDIT: "#ef4444", // red
  };
  return colors[accountType] || "#6b7280"; // gray as default
}
