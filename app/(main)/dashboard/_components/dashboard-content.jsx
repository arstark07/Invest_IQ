"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AccountCard } from "./account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { DashboardOverview } from "./transaction-overview";
import { AccountRecommendations } from "./account-recommendations";
import { FinancialHealthScore } from "./financial-health-score";
import { CashFlowAnalysis } from "./cash-flow-analysis";
import { QuickActions } from "./quick-actions";
import { UpcomingBills } from "./upcoming-bills";
import { NetWorthTracker } from "./net-worth-tracker";
import { RecentActivityFeed } from "./recent-activity-feed";
import { FinancialCalendar } from "./financial-calendar";
import { CurrencyConverter } from "./currency-converter";
      
// Section wrapper with animation
function AnimatedSection({ children, delay = 0, className = "" }) {
  return (
    <div 
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

export function DashboardContent({ accounts, transactions }) {
  const defaultAccount = accounts?.find((account) => account.isDefault);
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccount?.id);
  
  const selectedAccount = accounts?.find(acc => acc.id === selectedAccountId) || defaultAccount;

  const handleAccountSelect = (accountId) => {
    setSelectedAccountId(accountId);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Selected Account Indicator */}
      {selectedAccount && (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm">
            Viewing data for: <strong className="text-purple-600 dark:text-purple-400">{selectedAccount.name}</strong>
          </span>
          {selectedAccount.id !== defaultAccount?.id && (
            <button 
              onClick={() => setSelectedAccountId(defaultAccount?.id)}
              className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Reset to default
            </button>
          )}
        </div>
      )}

      {/* Row 1: Quick Actions + Financial Health Score (2 tiles) */}
      <AnimatedSection delay={0}>
        <div className="grid gap-4 md:grid-cols-2">
          <QuickActions />
          <FinancialHealthScore defaultAccountId={selectedAccountId} />
        </div>
      </AnimatedSection>

      {/* Row 2: Net Worth (Full Width - clickable for details) */}
      <AnimatedSection delay={100}>
        <NetWorthTracker defaultAccountId={selectedAccountId} />
      </AnimatedSection>

      {/* Row 3: Cash Flow Analysis (Full Width - has chart) */}
      <AnimatedSection delay={200}>
        <CashFlowAnalysis defaultAccountId={selectedAccountId} />
      </AnimatedSection>

      {/* Row 4: Financial Calendar (Full Width - has calendar grid) */}
      <AnimatedSection delay={300}>
        <FinancialCalendar defaultAccountId={selectedAccountId} />
      </AnimatedSection>

      {/* Row 5: Upcoming Bills (Full Width) */}
      <AnimatedSection delay={400}>
        <UpcomingBills defaultAccountId={selectedAccountId} />
      </AnimatedSection>

      {/* Row 6: Recent Activity (Full Width) */}
      <AnimatedSection delay={500}>
        <RecentActivityFeed defaultAccountId={selectedAccountId} />
      </AnimatedSection>

      {/* Row 7: Transaction Overview + Currency Converter (2 tiles) */}
      <AnimatedSection delay={600}>
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardOverview
            accounts={accounts}
            transactions={transactions || []}
            selectedAccountId={selectedAccountId}
          />
          <CurrencyConverter />
        </div>
      </AnimatedSection>

      {/* Row 8: Accounts Grid */}
      <AnimatedSection delay={700}>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Your Accounts</h2>
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Click on any account to view its data in the dashboard above
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CreateAccountDrawer>
              <Card className="group hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer border-dashed hover:border-purple-500/50 hover:-translate-y-1">
                <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5 min-h-32">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-purple-500 transition-colors">Add New Account</p>
                </CardContent>
              </Card>
            </CreateAccountDrawer>
            {accounts.length > 0 &&
              accounts?.map((account, index) => (
                <div
                  key={account.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'both' }}
                >
                  <AccountCard 
                    account={account} 
                    isSelected={account.id === selectedAccountId}
                    onSelect={handleAccountSelect}
                  />
                </div>
              ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Row 9: AI Investment Recommendations */}
      <AnimatedSection delay={800}>
        <AccountRecommendations />
      </AnimatedSection>
    </div>
  );
}
