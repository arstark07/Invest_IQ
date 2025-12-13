"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  RefreshCw,
  Gift,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const transactionIcons = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAWAL: ArrowUpRight,
  INVESTMENT: TrendingUp,
  REFUND: RefreshCw,
  TRANSFER_IN: ArrowDownLeft,
  TRANSFER_OUT: ArrowUpRight,
  REWARD: Gift,
};

const transactionColors = {
  DEPOSIT: "text-green-600",
  WITHDRAWAL: "text-red-600",
  INVESTMENT: "text-blue-600",
  REFUND: "text-purple-600",
  TRANSFER_IN: "text-green-600",
  TRANSFER_OUT: "text-red-600",
  REWARD: "text-amber-600",
};

const statusIcons = {
  COMPLETED: CheckCircle2,
  PENDING: Clock,
  FAILED: XCircle,
  CANCELLED: AlertCircle,
};

const statusColors = {
  COMPLETED: "text-green-600 bg-green-50 dark:bg-green-900/20",
  PENDING: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  FAILED: "text-red-600 bg-red-50 dark:bg-red-900/20",
  CANCELLED: "text-gray-600 bg-gray-50 dark:bg-gray-800",
};

export default function WalletTransactionList({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No transactions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add money to your wallet to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const Icon = transactionIcons[transaction.type] || ArrowUpRight;
            const StatusIcon = statusIcons[transaction.status] || Clock;
            const iconColor = transactionColors[transaction.type] || "text-gray-600";
            const isCredit = ["DEPOSIT", "REFUND", "TRANSFER_IN", "REWARD"].includes(
              transaction.type
            );

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isCredit ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.description || transaction.type.replace(/_/g, " ")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {transaction.paymentGateway && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.paymentGateway}
                        </Badge>
                      )}
                      {transaction.investmentPlan && (
                        <Badge variant="secondary" className="text-xs">
                          {transaction.investmentPlan}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      isCredit ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isCredit ? "+" : "-"}₹{transaction.amount.toLocaleString("en-IN")}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <StatusIcon
                      className={`h-3 w-3 ${
                        transaction.status === "COMPLETED"
                          ? "text-green-600"
                          : transaction.status === "PENDING"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
