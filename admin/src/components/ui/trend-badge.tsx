import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  value: number;
  label?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({
  value,
  label = 'vs. mês anterior',
  className = '',
  showIcon = true,
  size = 'md'
}) => {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const absoluteValue = Math.abs(value);
  const formattedValue = absoluteValue.toFixed(1);

  // Definir cores baseadas na tendência
  const colorClass = isPositive
    ? 'bg-green-500/10 text-green-500 border-green-500/20'
    : isNegative
    ? 'bg-red-500/10 text-red-500 border-red-500/20'
    : 'bg-gray-500/10 text-gray-500 border-gray-500/20';

  // Ícone baseado na tendência
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  // Tamanhos
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        className={cn(
          'flex items-center gap-1 font-medium border',
          colorClass,
          sizeClasses[size]
        )}
      >
        {showIcon && <Icon className={iconSizes[size]} />}
        <span>
          {isPositive && '+'}
          {formattedValue}%
        </span>
      </Badge>
      {label && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};

export default TrendBadge;
