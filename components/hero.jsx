"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";

const HeroSection = () => {
  const imageRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto text-center relative">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-sm font-medium text-purple-700 dark:text-purple-300 mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>AI-Powered Finance Platform</span>
          <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">New</span>
        </div>

        {/* Main Heading */}
        <h1 className={`text-5xl md:text-7xl lg:text-8xl pb-6 font-bold ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white">
            Manage Your Finances
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 animate-gradient">
            with Intelligence
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          An AI-powered financial management platform that helps you track,
          analyze, and optimize your spending with real-time insights.
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row justify-center gap-4 mb-12 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
          <Link href="/dashboard">
            <Button size="lg" className="group relative px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:-translate-y-0.5">
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="https://www.youtube.com/investiq">
            <Button size="lg" variant="outline" className="group px-8 hover:bg-white/50 dark:hover:bg-gray-800/50">
              <Play className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className={`flex flex-wrap justify-center gap-6 mb-12 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Bank-level Security</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Smart Analytics</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>AI-Powered Insights</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className={`hero-image-wrapper mt-5 md:mt-0 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '500ms' }}>
          <div ref={imageRef} className="hero-image relative group">
            {/* Glow effect behind image */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Decorative shapes */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl rotate-12 opacity-80 animate-float" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl -rotate-12 opacity-80 animate-float-delayed" />
            
            <Image
              src="/banner.jpeg"
              width={1280}
              height={720}
              alt="Dashboard Preview"
              className="relative rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 mx-auto transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
            
            {/* Floating stats cards */}
            <div className="absolute -left-4 top-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 hidden lg:flex items-center gap-3 animate-float border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Savings</p>
                <p className="font-bold text-green-600">+24.5%</p>
              </div>
            </div>
            
            <div className="absolute -right-4 bottom-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 hidden lg:flex items-center gap-3 animate-float-delayed border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">AI Score</p>
                <p className="font-bold text-purple-600">85/100</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
