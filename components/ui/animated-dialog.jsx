"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const AnimatedDialog = DialogPrimitive.Root;
const AnimatedDialogTrigger = DialogPrimitive.Trigger;
const AnimatedDialogClose = DialogPrimitive.Close;

const AnimatedDialogPortal = ({ children, ...props }) => (
  <DialogPrimitive.Portal {...props}>
    <AnimatePresence>{children}</AnimatePresence>
  </DialogPrimitive.Portal>
);
AnimatedDialogPortal.displayName = "AnimatedDialogPortal";

const AnimatedDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay asChild ref={ref}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed inset-0 z-50 bg-black/70 backdrop-blur-md",
        className
      )}
      {...props}
    />
  </DialogPrimitive.Overlay>
));
AnimatedDialogOverlay.displayName = "AnimatedDialogOverlay";

const AnimatedDialogContent = React.forwardRef(
  ({ className, children, originRect, ...props }, ref) => {
    // Calculate initial position and scale based on origin card
    const getInitialStyle = () => {
      if (!originRect || typeof window === 'undefined') {
        return {
          scale: 0.9,
          opacity: 0,
        };
      }

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate origin card center
      const originCenterX = originRect.left + originRect.width / 2;
      const originCenterY = originRect.top + originRect.height / 2;
      
      // Calculate scale to match card size
      // Assuming modal will be around 1152px wide (max-w-6xl) or 90% viewport
      const estimatedModalWidth = Math.min(viewportWidth * 0.9, 1152);
      const estimatedModalHeight = viewportHeight * 0.85;
      
      const scaleX = originRect.width / estimatedModalWidth;
      const scaleY = originRect.height / estimatedModalHeight;
      
      // Use the smaller scale to ensure card fits
      const scale = Math.min(scaleX, scaleY, 1);
      
      // Calculate offset from center (modal is already centered via left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%])
      // We need to offset FROM center TO card position
      const offsetX = originCenterX - (viewportWidth / 2);
      const offsetY = originCenterY - (viewportHeight / 2);
      
      return {
        x: offsetX,
        y: offsetY,
        scale: scale,
        opacity: 0.3,
      };
    };

    return (
      <AnimatedDialogPortal>
        <AnimatedDialogOverlay />
        <DialogPrimitive.Content asChild ref={ref} {...props}>
          <motion.div
            initial={getInitialStyle()}
            animate={{
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
            }}
            exit={getInitialStyle()}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background/98 backdrop-blur-xl shadow-2xl sm:rounded-2xl",
              className
            )}
          >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </AnimatedDialogPortal>
    );
  }
);
AnimatedDialogContent.displayName = "AnimatedDialogContent";

const AnimatedDialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
AnimatedDialogHeader.displayName = "AnimatedDialogHeader";

const AnimatedDialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
AnimatedDialogFooter.displayName = "AnimatedDialogFooter";

const AnimatedDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
AnimatedDialogTitle.displayName = "AnimatedDialogTitle";

const AnimatedDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AnimatedDialogDescription.displayName = "AnimatedDialogDescription";

export {
  AnimatedDialog,
  AnimatedDialogPortal,
  AnimatedDialogOverlay,
  AnimatedDialogClose,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogFooter,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
};
