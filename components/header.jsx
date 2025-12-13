import React from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard, Calculator, Wallet, PieChart, Shield, Fingerprint, Sparkles } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";

const Header = async () => {
  await checkUser();

  return (
    <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200/50 dark:border-gray-700/50">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
      
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="group">
          <div className="relative">
            <Image
              src={"/logo3.png"}
              alt="InvestIQ Logo"
              width={200}
              height={60}
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        {/* Navigation Links - Different for signed in/out users */}
        <div className="hidden md:flex items-center space-x-1">
          <SignedOut>
            <a href="#features" className="px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">
              Features
            </a>
            <a
              href="#testimonials"
              className="px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              Testimonials
            </a>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="group px-3 py-2 text-gray-600 hover:text-purple-600 flex items-center gap-2 text-sm rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
            >
              <LayoutDashboard size={16} className="group-hover:scale-110 transition-transform" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/wallet"
              className="group px-3 py-2 text-gray-600 hover:text-green-600 flex items-center gap-2 text-sm rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
            >
              <Wallet size={16} className="group-hover:scale-110 transition-transform" />
              <span>Wallet</span>
            </Link>
            <Link
              href="/portfolio"
              className="group px-3 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-2 text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <PieChart size={16} className="group-hover:scale-110 transition-transform" />
              <span>Portfolio</span>
            </Link>
            <Link
              href="/risk-assessment"
              className="group px-3 py-2 text-gray-600 hover:text-amber-600 flex items-center gap-2 text-sm rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
            >
              <Shield size={16} className="group-hover:scale-110 transition-transform" />
              <span>Risk Profile</span>
            </Link>
            <Link
              href="/kyc"
              className="group px-3 py-2 text-gray-600 hover:text-pink-600 flex items-center gap-2 text-sm rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all"
            >
              <Fingerprint size={16} className="group-hover:scale-110 transition-transform" />
              <span>KYC</span>
            </Link>
          </SignedIn>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <SignedIn>
            <Link href="/calculator">
              <Button variant="outline" size="sm" className="flex items-center gap-2 hover:border-purple-500 hover:text-purple-600 transition-colors">
                <Calculator size={16} />
                <span className="hidden md:inline">Calculator</span>
              </Button>
            </Link>
            <a href="/transaction/create">
              <Button size="sm" className="group relative flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:-translate-y-0.5">
                <PenBox size={16} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden md:inline">Add Transaction</span>
                <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </Button>
            </a>
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline" className="hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent transition-all">
                Login
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
