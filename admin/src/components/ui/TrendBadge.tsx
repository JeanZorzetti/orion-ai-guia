import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({
  value,
  size = 'md',
  showValue = true
}) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        sizeClasses[size],
        isPositive && 'text-green-600',
        value < 0 && 'text-red-600',
        isNeutral && 'text-muted-foreground'
      )}
    >
      {isPositive && <TrendingUp className={iconSizes[size]} />}
      {value < 0 && <TrendingDown className={iconSizes[size]} />}
      {isNeutral && <Minus className={iconSizes[size]} />}
      {showValue && (
        <span>
          {isPositive && '+'}
          {value.toFixed(1)}%
        </span>
      )}
    </span>
  );
};
