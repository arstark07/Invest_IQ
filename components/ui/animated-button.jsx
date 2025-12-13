"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// Shimmer Button - Luxurious shine effect
const ShimmerButton = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:animate-shimmer hover:shadow-lg hover:shadow-blue-500/25",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
});
ShimmerButton.displayName = "ShimmerButton";

// Glow Button - Soft glow on hover
const GlowButton = forwardRef(({ className, variant = "default", children, ...props }, ref) => {
  const glowColors = {
    default: "hover:shadow-blue-500/50",
    success: "hover:shadow-green-500/50",
    warning: "hover:shadow-yellow-500/50",
    danger: "hover:shadow-red-500/50",
    purple: "hover:shadow-purple-500/50",
  };

  return (
    <Button
      ref={ref}
      className={cn(
        "transition-all duration-300 hover:shadow-lg",
        glowColors[variant] || glowColors.default,
        "hover:-translate-y-0.5 active:translate-y-0",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
});
GlowButton.displayName = "GlowButton";

// Ripple Button - Material design ripple effect
const RippleButton = forwardRef(({ className, children, ...props }, ref) => {
  const handleClick = (e) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    props.onClick?.(e);
  };

  return (
    <Button
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
});
RippleButton.displayName = "RippleButton";

// Gradient Border Button - Animated gradient border
const GradientBorderButton = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative p-[2px] rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-gradient-x">
      <Button
        ref={ref}
        className={cn(
          "relative bg-background hover:bg-background/90 text-foreground",
          "rounded-[6px] w-full",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </div>
  );
});
GradientBorderButton.displayName = "GradientBorderButton";

// Magnetic Button - Follows cursor slightly
const MagneticButton = forwardRef(({ className, children, strength = 0.3, ...props }, ref) => {
  const handleMouseMove = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    button.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "translate(0, 0)";
  };

  return (
    <Button
      ref={ref}
      className={cn("transition-transform duration-200 ease-out", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Button>
  );
});
MagneticButton.displayName = "MagneticButton";

// 3D Press Button - Depth effect on click
const PressButton = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn(
        "relative shadow-[0_4px_0_0] shadow-blue-700",
        "hover:shadow-[0_2px_0_0] hover:translate-y-[2px]",
        "active:shadow-none active:translate-y-[4px]",
        "transition-all duration-100",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
});
PressButton.displayName = "PressButton";

// Icon Button with Scale
const ScaleIconButton = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      size="icon"
      className={cn(
        "transition-transform duration-200",
        "hover:scale-110 active:scale-95",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
});
ScaleIconButton.displayName = "ScaleIconButton";

// Loading Button - With spinner
const LoadingButton = forwardRef(({ className, loading, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={loading}
      className={cn("relative transition-all duration-200", className)}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-md">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <span className={cn(loading && "opacity-0")}>{children}</span>
    </Button>
  );
});
LoadingButton.displayName = "LoadingButton";

export {
  ShimmerButton,
  GlowButton,
  RippleButton,
  GradientBorderButton,
  MagneticButton,
  PressButton,
  ScaleIconButton,
  LoadingButton,
};
