import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { DashboardContent } from "./_components/dashboard-content";

export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  return <DashboardContent accounts={accounts} transactions={transactions} />;
}
