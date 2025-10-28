'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Calendar,
  DollarSign,
  Package,
  Target
} from 'lucide-react';

export type InsightType = 'success' | 'warning' | 'danger' | 'info' | 'trend';
export type InsightPriority = 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  metric?: string;
  change?: number;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: React.ReactNode;
}

interface InsightCardProps {
  insights: Insight[];
  maxDisplay?: number;
  className?: string;
}

const getInsightIcon = (type: InsightType, customIcon?: React.ReactNode) => {
  if (customIcon) return customIcon;

  const iconMap = {
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    danger: <TrendingDown className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
    trend: <TrendingUp className="h-5 w-5" />
  };

  return iconMap[type];
};

const getInsightColor = (type: InsightType) => {
  const colorMap = {
    success: 'text-green-500',
    warning: 'text-orange-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
    trend: 'text-purple-500'
  };

  return colorMap[type];
};

const getInsightBgColor = (type: InsightType) => {
  const bgMap = {
    success: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-orange-500/10 border-orange-500/20',
    danger: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    trend: 'bg-purple-500/10 border-purple-500/20'
  };

  return bgMap[type];
};

const getPriorityBadge = (priority: InsightPriority) => {
  const badgeMap = {
    high: { label: 'Alta Prioridade', variant: 'destructive' as const },
    medium: { label: 'Média', variant: 'secondary' as const },
    low: { label: 'Baixa', variant: 'outline' as const }
  };

  return badgeMap[priority];
};

export const InsightCard: React.FC<InsightCardProps> = ({
  insights,
  maxDisplay = 5,
  className = ''
}) => {
  // Ordenar por prioridade
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const displayInsights = sortedInsights.slice(0, maxDisplay);

  if (displayInsights.length === 0) {
    return (
      <Card className={`border-primary/20 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights do Orion AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm font-medium text-foreground">
              Tudo está funcionando perfeitamente!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum insight crítico no momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Insights do Orion AI
          <Badge variant="secondary" className="ml-auto">
            {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayInsights.map((insight) => {
          const icon = getInsightIcon(insight.type, insight.icon);
          const color = getInsightColor(insight.type);
          const bgColor = getInsightBgColor(insight.type);
          const priorityBadge = getPriorityBadge(insight.priority);

          return (
            <div
              key={insight.id}
              className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} transition-all hover:scale-[1.02]`}
            >
              <div className={`${color} mt-0.5 flex-shrink-0`}>
                {icon}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {insight.title}
                    </p>
                    {insight.priority === 'high' && (
                      <Badge variant={priorityBadge.variant} className="text-xs mt-1">
                        {priorityBadge.label}
                      </Badge>
                    )}
                  </div>
                  {insight.change !== undefined && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {insight.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        insight.change > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
                {insight.metric && (
                  <p className="text-xs font-medium text-foreground">
                    {insight.metric}
                  </p>
                )}
                {insight.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={insight.action.onClick}
                  >
                    {insight.action.label}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {insights.length > maxDisplay && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              +{insights.length - maxDisplay} insights adicionais
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightCard;

export { Calendar, DollarSign, Package, Target };
