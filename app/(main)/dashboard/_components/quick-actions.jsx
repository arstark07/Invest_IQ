"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Target, 
  Receipt, 
  Wallet, 
  PiggyBank,
  CreditCard,
  Zap
} from "lucide-react";
import Link from "next/link";
import { CreateAccountDrawer } from "@/components/create-account-drawer";

const quickActions = [
  {
    label: "Add Transaction",
    icon: Plus,
    href: "/transaction/create",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    label: "Set Budget",
    icon: Target,
    href: "/dashboard",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    label: "Add to Wallet",
    icon: Wallet,
    href: "/wallet",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    label: "View Portfolio",
    icon: CreditCard,
    href: "/portfolio",
    color: "bg-orange-500 hover:bg-orange-600",
  },
  {
    label: "Savings Goal",
    icon: PiggyBank,
    href: "/dashboard",
    color: "bg-pink-500 hover:bg-pink-600",
  },
  {
    label: "Calculator",
    icon: Receipt,
    href: "/calculator",
    color: "bg-cyan-500 hover:bg-cyan-600",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
        <CardDescription>One-click access to common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-3 px-3 flex flex-col items-center gap-2 hover:border-primary transition-colors"
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Add Account Button */}
        <div className="mt-4">
          <CreateAccountDrawer>
            <Button variant="secondary" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Account
            </Button>
          </CreateAccountDrawer>
        </div>
      </CardContent>
    </Card>
  );
}
