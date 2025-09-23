import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrionCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "feature" | "problem";
}

export const OrionCard = ({ 
  title, 
  description, 
  children, 
  icon, 
  className, 
  variant = "default" 
}: OrionCardProps) => {
  const variantStyles = {
    default: "border-space-medium hover:shadow-constellation transition-all duration-300 bg-space-white",
    feature: "border-constellation/20 hover:border-constellation/40 bg-gradient-to-br from-space-white to-space-light hover:shadow-glow transition-all duration-300",
    problem: "border-destructive/20 bg-gradient-to-br from-space-white to-red-50/30 hover:shadow-lg transition-all duration-300"
  };

  return (
    <Card className={cn(
      "rounded-2xl border-2 h-full",
      variantStyles[variant],
      className
    )}>
      <CardHeader className="space-y-3">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-constellation flex items-center justify-center text-space-white">
            {icon}
          </div>
        )}
        <CardTitle className="text-xl font-bold text-orion-deep">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-space-dark leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
};