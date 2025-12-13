"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/investment-calculator";

export function ComparisonView({ results }) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No calculations to compare yet. Start calculating!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Scheme</th>
                <th className="text-right p-3 font-semibold">Invested</th>
                <th className="text-right p-3 font-semibold">Returns</th>
                <th className="text-right p-3 font-semibold">Maturity</th>
                <th className="text-right p-3 font-semibold">ROI %</th>
                <th className="text-right p-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const roi = ((result.returns / result.totalInvested) * 100).toFixed(2);
                return (
                  <tr key={result.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{result.scheme}</td>
                    <td className="p-3 text-right">{formatCurrency(result.totalInvested)}</td>
                    <td className="p-3 text-right text-green-600 font-semibold">
                      {formatCurrency(result.returns)}
                    </td>
                    <td className="p-3 text-right text-blue-600 font-bold">
                      {formatCurrency(result.maturityAmount)}
                    </td>
                    <td className="p-3 text-right font-semibold">{roi}%</td>
                    <td className="p-3 text-right text-sm text-gray-500">
                      {new Date(result.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Best Investment Highlight */}
        {results.length > 1 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Best Returns</h3>
            {(() => {
              const best = results.reduce((prev, current) =>
                current.returns > prev.returns ? current : prev
              );
              return (
                <p className="text-sm">
                  <strong>{best.scheme}</strong> offers the highest returns of{" "}
                  <span className="text-green-600 font-bold">
                    {formatCurrency(best.returns)}
                  </span>{" "}
                  with a maturity amount of{" "}
                  <span className="text-blue-600 font-bold">
                    {formatCurrency(best.maturityAmount)}
                  </span>
                </p>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
