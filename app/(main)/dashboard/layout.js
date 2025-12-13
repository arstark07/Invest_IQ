import DashboardPage from "./page";
import { BarLoader } from "react-spinners";
import { Suspense } from "react";

export default function Layout() {
  return (
    <div className="relative px-5 min-h-screen">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Header with Animation */}
      <div className="flex items-center justify-between mb-5 animate-fade-in">
        <div className="relative">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight gradient-title animate-slide-up">
            Dashboard
          </h1>
          <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-scale-in" />
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mt-4 space-y-4">
            <BarLoader width={"100%"} color="#9333ea" />
            <p className="text-center text-muted-foreground animate-pulse">Loading your financial overview...</p>
          </div>
        }
      >
        <DashboardPage />
      </Suspense>
    </div>
  );
}
