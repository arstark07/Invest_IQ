"use client";

import { cn } from "@/lib/utils";
import { Badge } from "./badge";

// Pulse Badge - Badge with pulse animation
function PulseBadge({ className, children, variant = "default", ...props }) {
  return (
    <Badge
      variant={variant}
      className={cn("relative", className)}
      {...props}
    >
      <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-current" />
      <span className="relative">{children}</span>
    </Badge>
  );
}

// Glow Badge - Badge with glow effect
function GlowBadge({ className, color = "blue", children, ...props }) {
  const colors = {
    blue: "bg-blue-500/20 text-blue-600 shadow-blue-500/30",
    green: "bg-green-500/20 text-green-600 shadow-green-500/30",
    red: "bg-red-500/20 text-red-600 shadow-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-600 shadow-yellow-500/30",
    purple: "bg-purple-500/20 text-purple-600 shadow-purple-500/30",
  };

  return (
    <Badge
      className={cn(
        "border-none shadow-lg",
        colors[color],
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}

// Animated Status Dot - Live status indicator
function StatusDot({ status = "online", size = "md", className }) {
  const sizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-yellow-500",
    processing: "bg-blue-500",
  };

  return (
    <span className={cn("relative inline-flex", sizes[size], className)}>
      {status === "online" || status === "processing" ? (
        <span className={cn("absolute inset-0 rounded-full animate-ping opacity-75", colors[status])} />
      ) : null}
      <span className={cn("relative rounded-full w-full h-full", colors[status])} />
    </span>
  );
}

// Live Badge - Badge with live indicator
function LiveBadge({ className, children, ...props }) {
  return (
    <Badge
      className={cn(
        "bg-red-500 text-white flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      {children || "LIVE"}
    </Badge>
  );
}

// Gradient Badge - Badge with gradient background
function GradientBadge({ className, gradient = "purple", children, ...props }) {
  const gradients = {
    purple: "from-purple-500 to-pink-500",
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-yellow-500",
    red: "from-red-500 to-rose-500",
    rainbow: "from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
  };

  return (
    <Badge
      className={cn(
        "bg-gradient-to-r text-white border-none",
        gradients[gradient],
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}

// Counter Badge - Badge with animated counter
function CounterBadge({ count, className, ...props }) {
  const displayCount = count > 99 ? "99+" : count;

  return (
    <Badge
      className={cn(
        "min-w-[20px] h-5 flex items-center justify-center",
        "bg-red-500 text-white text-xs font-bold",
        "animate-scale-in",
        className
      )}
      {...props}
    >
      {displayCount}
    </Badge>
  );
}

// New Badge - "New" indicator
function NewBadge({ className }) {
  return (
    <Badge
      className={cn(
        "bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[10px]",
        "px-1.5 py-0 animate-bounce-subtle",
        className
      )}
    >
      NEW
    </Badge>
  );
}

// Trending Badge - With arrow indicator
function TrendingBadge({ direction = "up", value, className }) {
  const isUp = direction === "up";

  return (
    <Badge
      className={cn(
        "flex items-center gap-1 text-xs",
        isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
        className
      )}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="currentColor"
        className={cn(!isUp && "rotate-180")}
      >
        <path d="M6 2L10 8H2L6 2Z" />
      </svg>
      {value}
    </Badge>
  );
}

// Progress Badge - Badge with progress indicator
function ProgressBadge({ value = 0, className, children }) {
  return (
    <Badge
      className={cn(
        "relative overflow-hidden bg-muted text-foreground",
        className
      )}
    >
      <span
        className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
      <span className="relative">{children}</span>
    </Badge>
  );
}

// Notification Badge - Positioned indicator for icons
function NotificationBadge({ count, className, children }) {
  return (
    <span className="relative inline-flex">
      {children}
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1 flex items-center justify-center",
            "min-w-[18px] h-[18px] rounded-full",
            "bg-red-500 text-white text-[10px] font-bold",
            "animate-scale-in",
            className
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

// Verified Badge - Checkmark indicator
function VerifiedBadge({ size = "md", className }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-blue-500 text-white",
        sizes[size],
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3/4 h-3/4">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    </span>
  );
}

export {
  PulseBadge,
  GlowBadge,
  StatusDot,
  LiveBadge,
  GradientBadge,
  CounterBadge,
  NewBadge,
  TrendingBadge,
  ProgressBadge,
  NotificationBadge,
  VerifiedBadge,
};
