"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, AlertCircle, Clock } from "lucide-react";
import { getUpcomingBills } from "@/actions/dashboard-widgets";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function UpcomingBills({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getUpcomingBills(defaultAccountId);
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
            <Bell className="h-5 w-5" />
            Upcoming Bills
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

  if (!data || data.bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Bills
          </CardTitle>
          <CardDescription>Track your recurring payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No upcoming bills</p>
            <p className="text-xs text-muted-foreground">
              Mark transactions as recurring to track them here
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
            <Bell className="h-5 w-5 text-blue-500" />
            Upcoming Bills
          </CardTitle>
          <Badge variant="secondary">{data.count} bills</Badge>
        </div>
        <CardDescription>Total due: {formatCurrency(data.totalUpcoming)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.bills.slice(0, 5).map((bill) => {
          const isUrgent = bill.daysUntilDue <= 3;
          const isExpense = bill.type === "EXPENSE";
          
          return (
            <div 
              key={bill.id} 
              className={`flex items-center justify-between p-3 rounded-lg ${
                isUrgent ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800" : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  isExpense ? "bg-red-100 dark:bg-red-900" : "bg-green-100 dark:bg-green-900"
                }`}>
                  {isUrgent ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{bill.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{bill.category}</span>
                    <span>•</span>
                    <span className="capitalize">{bill.interval?.toLowerCase()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${isExpense ? "text-red-600" : "text-green-600"}`}>
                  {isExpense ? "-" : "+"}{formatCurrency(bill.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(bill.dueDate)}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span className={isUrgent ? "text-red-500 font-medium" : "text-muted-foreground"}>
                    {bill.daysUntilDue === 0 
                      ? "Today" 
                      : bill.daysUntilDue === 1 
                        ? "Tomorrow" 
                        : `${bill.daysUntilDue} days`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {data.bills.length > 5 && (
          <p className="text-center text-sm text-muted-foreground">
            +{data.bills.length - 5} more bills
          </p>
        )}
      </CardContent>
    </Card>
  );
}
