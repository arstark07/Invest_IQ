"use client";

/**
 * Animated Background Components
 * Beautiful, subtle background animations for the finance platform
 */

// Floating Gradient Orbs - Creates a subtle ambient effect
export function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Primary Orb */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-blob" />
      
      {/* Secondary Orb */}
      <div className="absolute top-3/4 -right-20 w-80 h-80 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-2s' }} />
      
      {/* Accent Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/10 to-pink-500/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-4s' }} />
    </div>
  );
}

// Grid Pattern Background
export function GridPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 opacity-30 dark:opacity-20">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      {/* Radial fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}

// Animated Particles
export function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            bottom: '-10px',
            animation: `float ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Geometric Shapes Background
export function GeometricShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Rotating Ring */}
      <div className="absolute top-20 right-20 w-32 h-32 border-2 border-indigo-500/20 rounded-full animate-rotate-slow" />
      <div className="absolute top-20 right-20 w-24 h-24 border border-purple-500/20 rounded-full animate-rotate-reverse" style={{ marginTop: '16px', marginRight: '16px' }} />
      
      {/* Floating Squares */}
      <div className="absolute bottom-40 left-20 w-16 h-16 border border-cyan-500/20 rotate-45 animate-float" />
      <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-indigo-500/10 rotate-12 animate-float" style={{ animationDelay: '-1.5s' }} />
      
      {/* Triangle */}
      <div 
        className="absolute bottom-1/4 right-1/4 w-0 h-0 animate-float"
        style={{
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderBottom: '35px solid rgba(99, 102, 241, 0.1)',
          animationDelay: '-3s',
        }}
      />
      
      {/* Dots Pattern */}
      <div className="absolute top-1/2 right-10 flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2">
            {[...Array(3)].map((_, j) => (
              <div
                key={j}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500/20"
                style={{ 
                  animationDelay: `${(i + j) * 0.1}s`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Gradient Mesh Background
export function GradientMesh() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
              radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
              radial-gradient(at 0% 50%, rgba(6, 182, 212, 0.1) 0px, transparent 50%),
              radial-gradient(at 80% 50%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
              radial-gradient(at 80% 100%, rgba(139, 92, 246, 0.1) 0px, transparent 50%)
            `,
          }}
        />
      </div>
    </div>
  );
}

// Animated Lines
export function AnimatedLines() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-20">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          style={{
            width: `${Math.random() * 200 + 100}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 180}deg)`,
            animation: `shimmer ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

// Combined Ambient Background
export function AmbientBackground({ variant = "default" }) {
  switch (variant) {
    case "orbs":
      return <GradientOrbs />;
    case "grid":
      return <GridPattern />;
    case "particles":
      return <FloatingParticles />;
    case "geometric":
      return <GeometricShapes />;
    case "mesh":
      return <GradientMesh />;
    case "lines":
      return <AnimatedLines />;
    case "full":
      return (
        <>
          <GradientMesh />
          <GeometricShapes />
        </>
      );
    default:
      return (
        <>
          <GradientOrbs />
          <GridPattern />
        </>
      );
  }
}

// Card Background Decoration
export function CardDecoration({ variant = "gradient" }) {
  if (variant === "gradient") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl" />
      </div>
    );
  }
  
  if (variant === "corner") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-transparent" 
          style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} 
        />
      </div>
    );
  }
  
  return null;
}

// Animated Icon Wrapper
export function AnimatedIcon({ children, animation = "bounce" }) {
  const animationClass = {
    bounce: "icon-bounce",
    pulse: "animate-pulse",
    float: "animate-float",
    glow: "animate-pulse-glow",
  }[animation] || "";

  return (
    <div className={`transition-transform ${animationClass}`}>
      {children}
    </div>
  );
}

// Stats Card with Animation
export function AnimatedStat({ value, label, prefix = "", suffix = "", trend = null }) {
  return (
    <div className="animate-scale-in">
      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <span className="text-2xl font-bold animate-count-up">{value}</span>
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
        {trend && (
          <span className={`text-sm ml-2 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

// Glow Button Effect
export function GlowButton({ children, className = "", ...props }) {
  return (
    <button
      className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-all duration-300 
        bg-gradient-to-r from-indigo-500 to-purple-500 text-white
        hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105
        active:scale-95 ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 hover:opacity-100 transition-opacity" />
    </button>
  );
}

// Shimmer Loading Effect
export function ShimmerCard({ className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
