"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated Number Counter
 * Smoothly animates from 0 to the target value
 */
export function AnimatedNumber({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  formatOptions = {},
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    const targetValue = typeof value === "number" ? value : parseFloat(value) || 0;
    
    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }
      
      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = easeOut * targetValue;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    startTime.current = null;
    animationFrame.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  const formattedValue = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...formatOptions,
  }).format(displayValue);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

/**
 * Animated Currency Display
 */
export function AnimatedCurrency({
  value,
  currency = "INR",
  duration = 1000,
  className = "",
  showSign = false,
}) {
  const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
  const isPositive = numValue >= 0;
  
  return (
    <span className={cn(
      "tabular-nums",
      showSign && (isPositive ? "text-green-600" : "text-red-600"),
      className
    )}>
      {showSign && (isPositive ? "+" : "")}
      <AnimatedNumber
        value={Math.abs(numValue)}
        duration={duration}
        formatOptions={{
          style: "currency",
          currency: currency,
          maximumFractionDigits: 0,
        }}
      />
    </span>
  );
}

/**
 * Animated Percentage Display
 */
export function AnimatedPercentage({
  value,
  duration = 800,
  className = "",
  showSign = true,
  colorCode = true,
}) {
  const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
  const isPositive = numValue >= 0;
  
  return (
    <span className={cn(
      "tabular-nums inline-flex items-center gap-1",
      colorCode && (isPositive ? "text-green-600" : "text-red-600"),
      className
    )}>
      {showSign && (isPositive ? "↑" : "↓")}
      <AnimatedNumber
        value={Math.abs(numValue)}
        duration={duration}
        decimals={1}
        suffix="%"
      />
    </span>
  );
}

/**
 * Animated Progress Ring
 */
export function AnimatedProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  duration = 1000,
  color = "stroke-primary",
  bgColor = "stroke-muted",
  showValue = true,
  className = "",
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={bgColor}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={cn(color, "transition-all ease-out")}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transitionDuration: `${duration}ms`,
          }}
          strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedNumber
            value={progress}
            duration={duration}
            suffix="%"
            decimals={0}
            className="text-lg font-bold"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Animated Score Display (like financial health score)
 */
export function AnimatedScore({
  score,
  maxScore = 100,
  size = "md",
  showGrade = true,
  className = "",
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getGrade = (s) => {
    if (s >= 90) return { grade: "A+", color: "text-green-500" };
    if (s >= 80) return { grade: "A", color: "text-green-500" };
    if (s >= 70) return { grade: "B", color: "text-blue-500" };
    if (s >= 60) return { grade: "C", color: "text-yellow-500" };
    if (s >= 50) return { grade: "D", color: "text-orange-500" };
    return { grade: "F", color: "text-red-500" };
  };

  const { grade, color } = getGrade(animatedScore);
  
  const sizeClasses = {
    sm: "w-20 h-20 text-lg",
    md: "w-28 h-28 text-2xl",
    lg: "w-36 h-36 text-3xl",
  };

  const getColor = (s) => {
    if (s >= 80) return "from-green-500 to-emerald-500";
    if (s >= 60) return "from-blue-500 to-cyan-500";
    if (s >= 40) return "from-yellow-500 to-amber-500";
    if (s >= 20) return "from-orange-500 to-red-400";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
        sizeClasses[size],
        getColor(animatedScore)
      )}>
        <div className={cn(
          "rounded-full bg-card flex flex-col items-center justify-center",
          size === "sm" ? "w-16 h-16" : size === "md" ? "w-22 h-22" : "w-28 h-28"
        )} style={{ width: '80%', height: '80%' }}>
          <AnimatedNumber
            value={animatedScore}
            duration={1500}
            className="font-bold"
          />
          {showGrade && (
            <span className={cn("text-sm font-semibold", color)}>{grade}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Animated List Item (for staggered animations)
 */
export function AnimatedListItem({ children, index = 0, className = "" }) {
  return (
    <div
      className={cn("animate-slide-up opacity-0", className)}
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: "forwards" }}
    >
      {children}
    </div>
  );
}

/**
 * Typewriter Text Effect
 */
export function TypewriterText({ text, speed = 50, className = "" }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

/**
 * Animated Badge
 */
export function AnimatedBadge({ 
  children, 
  variant = "default",
  pulse = false,
  className = "" 
}) {
  const variants = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all",
      variants[variant],
      pulse && "animate-pulse",
      className
    )}>
      {children}
    </span>
  );
}

/**
 * Skeleton with shimmer effect
 */
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}
