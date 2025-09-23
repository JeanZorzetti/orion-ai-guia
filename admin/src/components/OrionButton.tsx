import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface OrionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "action" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const OrionButton = forwardRef<HTMLButtonElement, OrionButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-gradient-primary text-white hover:shadow-card transition-all duration-300 hover:scale-105",
      action: "bg-action-primary hover:bg-action-bright text-white shadow-action hover:shadow-glow transition-all duration-300",
      outline: "border-2 border-orion-primary text-orion-primary hover:bg-orion-primary hover:text-white",
      ghost: "text-orion-primary hover:bg-neutral-100 transition-all duration-300"
    };

    const sizeStyles = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "font-semibold rounded-lg transition-all duration-300",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

OrionButton.displayName = "OrionButton";

export { OrionButton };