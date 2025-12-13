"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp,
  CreditCard,
  Clock
} from "lucide-react";
import { getRecentActivity } from "@/actions/dashboard-widgets";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const activityIcons = {
  transaction: CreditCard,
  wallet: Wallet,
  investment: TrendingUp,
};

const subTypeColors = {
  INCOME: "text-green-600 bg-green-50 dark:bg-green-950",
  EXPENSE: "text-red-600 bg-red-50 dark:bg-red-950",
  DEPOSIT: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  WITHDRAWAL: "text-orange-600 bg-orange-50 dark:bg-orange-950",
  INVESTMENT: "text-purple-600 bg-purple-50 dark:bg-purple-950",
};

export function RecentActivityFeed({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getRecentActivity(15, defaultAccountId);
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [defaultAccountId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
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

  if (!data || data.activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your financial activities at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No recent activity</p>
            <p className="text-xs text-muted-foreground">
              Your transactions will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            Recent Activity
          </CardTitle>
          <Badge variant="secondary">{data.total} items</Badge>
        </div>
        <CardDescription>Unified stream of all financial activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {Object.entries(data.grouped).slice(0, 5).map(([date, activities]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                {date}
              </p>
              <div className="space-y-2">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || Activity;
                  const colorClass = subTypeColors[activity.subType] || "text-gray-600 bg-gray-50";
                  const isPositive = ["INCOME", "DEPOSIT", "TRANSFER_IN"].includes(activity.subType);

                  return (
                    <div 
                      key={activity.id} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${colorClass.split(" ").slice(1).join(" ")}`}>
                          <Icon className={`h-4 w-4 ${colorClass.split(" ")[0]}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{activity.title}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {activity.accountName && (
                              <span className="bg-muted px-1.5 py-0.5 rounded">{activity.accountName}</span>
                            )}
                            {activity.category && (
                              <span className="capitalize">{activity.category}</span>
                            )}
                            <span>•</span>
                            <span>{new Date(activity.date).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? "+" : "-"}{formatCurrency(activity.amount)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize">{activity.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
