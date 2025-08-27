import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cricketCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border hover:shadow-md",
        auction: "border-primary/20 bg-gradient-to-br from-card to-card/50 hover:shadow-[var(--shadow-auction)]",
        team: "border-accent/30 hover:border-accent/60 hover:shadow-lg",
        player: "border-muted hover:border-primary/40 hover:shadow-md transform hover:scale-[1.02]",
        glow: "border-primary/30 shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-auction)]",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CricketCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cricketCardVariants> {}

const CricketCard = React.forwardRef<HTMLDivElement, CricketCardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cricketCardVariants({ variant, size, className }))}
      {...props}
    />
  )
);
CricketCard.displayName = "CricketCard";

const CricketCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CricketCardHeader.displayName = "CricketCardHeader";

const CricketCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CricketCardTitle.displayName = "CricketCardTitle";

const CricketCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CricketCardDescription.displayName = "CricketCardDescription";

const CricketCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CricketCardContent.displayName = "CricketCardContent";

const CricketCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CricketCardFooter.displayName = "CricketCardFooter";

export {
  CricketCard,
  CricketCardHeader,
  CricketCardTitle,
  CricketCardDescription,
  CricketCardContent,
  CricketCardFooter,
};