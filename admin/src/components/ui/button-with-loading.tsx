import { Button, ButtonProps } from "./button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonWithLoadingProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function ButtonWithLoading({
  loading,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: ButtonWithLoadingProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
