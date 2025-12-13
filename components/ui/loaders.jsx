"use client";

import { cn } from "@/lib/utils";

// Spinner - Classic loading spinner
function Spinner({ size = "md", className }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
    xl: "w-12 h-12 border-4",
  };

  return (
    <div
      className={cn(
        "rounded-full border-primary/30 border-t-primary animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

// Dots Loader - Three bouncing dots
function DotsLoader({ className }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// Pulse Loader - Pulsing circle
function PulseLoader({ size = "md", className }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-primary animate-pulse" />
    </div>
  );
}

// Bar Loader - Animated progress bar
function BarLoader({ className }) {
  return (
    <div className={cn("w-full h-1 bg-muted rounded-full overflow-hidden", className)}>
      <div className="h-full bg-primary rounded-full animate-progress-bar" />
    </div>
  );
}

// Skeleton - Content placeholder
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-muted rounded-md animate-pulse",
        className
      )}
      {...props}
    />
  );
}

// Skeleton Text - Text placeholder
function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

// Skeleton Card - Card placeholder
function SkeletonCard({ className }) {
  return (
    <div className={cn("p-4 rounded-xl border bg-card space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Shimmer Skeleton - Skeleton with shimmer effect
function ShimmerSkeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted rounded-md",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// Wave Loader - Audio wave style
function WaveLoader({ className }) {
  return (
    <div className={cn("flex items-end gap-1 h-8", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full animate-wave"
          style={{
            height: "100%",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Circular Progress - Ring progress indicator
function CircularProgress({ value = 0, size = 40, strokeWidth = 4, className }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className={cn("transform -rotate-90", className)}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-500 ease-out"
      />
    </svg>
  );
}

// Full Page Loader - Overlay loading
function FullPageLoader({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}

// Typing Indicator - Chat style dots
function TypingIndicator({ className }) {
  return (
    <div className={cn("flex items-center gap-1 p-2", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// Gradient Spinner - Colorful spinner
function GradientSpinner({ size = 40, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      className={cn("animate-spin", className)}
    >
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="80, 200"
      />
    </svg>
  );
}

export {
  Spinner,
  DotsLoader,
  PulseLoader,
  BarLoader,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  ShimmerSkeleton,
  WaveLoader,
  CircularProgress,
  FullPageLoader,
  TypingIndicator,
  GradientSpinner,
};
