"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Enhanced Card with animations and visual effects
 */
const AnimatedCard = React.forwardRef(({ 
  className, 
  variant = "default",
  hover = true,
  glow = false,
  gradient = null,
  children,
  ...props 
}, ref) => {
  const baseClasses = "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300";
  
  const variantClasses = {
    default: "",
    glass: "bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20 dark:border-white/10",
    gradient: "border-0 bg-gradient-to-br",
    elevated: "shadow-lg hover:shadow-xl",
    outline: "border-2",
  };

  const hoverClasses = hover ? "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50" : "";
  const glowClasses = glow ? "animate-border-glow" : "";
  
  const gradientClasses = gradient ? {
    primary: "from-indigo-500/10 to-purple-500/10",
    success: "from-green-500/10 to-emerald-500/10",
    warning: "from-amber-500/10 to-orange-500/10",
    danger: "from-red-500/10 to-rose-500/10",
    info: "from-blue-500/10 to-cyan-500/10",
  }[gradient] : "";

  return (
    <div
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        glowClasses,
        gradientClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
AnimatedCard.displayName = "AnimatedCard";

const AnimatedCardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
AnimatedCardHeader.displayName = "AnimatedCardHeader";

const AnimatedCardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AnimatedCardTitle.displayName = "AnimatedCardTitle";

const AnimatedCardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AnimatedCardDescription.displayName = "AnimatedCardDescription";

const AnimatedCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
AnimatedCardContent.displayName = "AnimatedCardContent";

const AnimatedCardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
AnimatedCardFooter.displayName = "AnimatedCardFooter";

/**
 * Stats Card Component
 */
function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendLabel,
  variant = "default",
  iconColor = "text-primary",
  className,
}) {
  return (
    <AnimatedCard variant={variant} className={cn("overflow-hidden relative", className)}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
      
      <div className="p-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 animate-count-up">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl bg-primary/10", iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
        
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            <span className={cn(
              "text-sm font-medium",
              trend >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({
  title,
  description,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  action,
  className,
}) {
  return (
    <AnimatedCard className={cn("group", className)}>
      <div className="p-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
          iconBg
        )}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && (
          <div className="mt-4">{action}</div>
        )}
      </div>
    </AnimatedCard>
  );
}

/**
 * Gradient Border Card
 */
function GradientBorderCard({ children, className, gradientFrom = "from-indigo-500", gradientTo = "to-purple-500" }) {
  return (
    <div className={cn("relative p-[1px] rounded-xl bg-gradient-to-r", gradientFrom, gradientTo, className)}>
      <div className="bg-background rounded-xl h-full">
        {children}
      </div>
    </div>
  );
}

/**
 * Glass Card Component
 */
function GlassCard({ children, className }) {
  return (
    <div className={cn(
      "rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Metric Card with mini chart placeholder
 */
function MetricCard({
  title,
  value,
  change,
  changeLabel,
  sparkline,
  icon: Icon,
  className,
}) {
  return (
    <AnimatedCard className={cn("overflow-hidden", className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded",
                  change >= 0 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {change >= 0 ? "+" : ""}{change}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          
          {sparkline && (
            <div className="h-12 w-20 opacity-50">
              {/* Placeholder for sparkline - can integrate recharts here */}
              <svg viewBox="0 0 80 48" className="w-full h-full">
                <path
                  d="M0 40 L15 35 L30 38 L45 25 L60 30 L75 15 L80 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}

export {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardDescription,
  AnimatedCardContent,
  AnimatedCardFooter,
  StatsCard,
  FeatureCard,
  GradientBorderCard,
  GlassCard,
  MetricCard,
};
