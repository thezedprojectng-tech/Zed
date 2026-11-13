import * as React from "react";
import { cn } from "@/lib/utils";

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "subtle" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export const AdminCard = React.forwardRef<HTMLDivElement, AdminCardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      className,
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      none: "p-0",
      sm: "p-3 sm:p-4",
      md: "p-4 sm:p-5",
      lg: "p-6 sm:p-8",
    }[padding];

    const variantStyles = {
      default: "border border-border/70 bg-card shadow-xs",
      subtle: "border border-border/50 bg-secondary/30",
      interactive:
        "border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all duration-150 cursor-pointer",
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl overflow-hidden text-card-foreground",
          variantStyles,
          paddingStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AdminCard.displayName = "AdminCard";

