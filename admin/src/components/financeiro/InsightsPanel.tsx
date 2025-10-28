'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FinancialInsight, InsightType, InsightPriority } from '@/lib/financial-insights-ai';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  insights: FinancialInsight[];
  className?: string;
}

const INSIGHT_TYPE_CONFIG: Record<InsightType, {
  icon: typeof Lightbulb;
  label: string;
  color: string;
  bgColor: string;
}> = {
  opportunity: {
    icon: TrendingUp,
    label: 'Oportunidade',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Aviso',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  prediction: {
    icon: Sparkles,
    label: 'Previsão',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  recommendation: {
    icon: Target,
    label: 'Recomendação',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  pattern: {
    icon: Lightbulb,
    label: 'Padrão',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
  },
};

const PRIORITY_CONFIG: Record<InsightPriority, {
  label: string;
  variant: 'default' | 'destructive' | 'secondary';
}> = {
  high: { label: 'Alta', variant: 'destructive' },
  medium: { label: 'Média', variant: 'default' },
  low: { label: 'Baixa', variant: 'secondary' },
};

const InsightCard: React.FC<{
  insight: FinancialInsight;
  expanded: boolean;
  onToggle: () => void;
}> = ({ insight, expanded, onToggle }) => {
  const typeConfig = INSIGHT_TYPE_CONFIG[insight.type];
  const priorityConfig = PRIORITY_CONFIG[insight.priority];
  const Icon = typeConfig.icon;

  return (
    <Card className={cn('border-l-4', expanded && typeConfig.bgColor)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
                <Icon className={cn('h-5 w-5', typeConfig.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={priorityConfig.variant} className="text-xs">
                    {priorityConfig.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {typeConfig.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {insight.category}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {insight.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="flex-shrink-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Expanded Content */}
          {expanded && (
            <div className="space-y-4 pt-4 border-t">
              {/* Impact */}
              <div className={cn('p-4 rounded-lg', typeConfig.bgColor)}>
                <h4 className="text-sm font-semibold mb-2">Impacto Estimado</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {insight.impact.description}
                </p>
                {insight.impact.value && (
                  <p className={cn('text-2xl font-bold', typeConfig.color)}>
                    {insight.impact.value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                )}
                {insight.impact.percentage && (
                  <p className={cn('text-xl font-bold', typeConfig.color)}>
                    {insight.impact.percentage > 0 ? '+' : ''}
                    {insight.impact.percentage.toFixed(1)}%
                  </p>
                )}
              </div>

              {/* Recommendations */}
              {insight.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Ações Recomendadas
                  </h4>
                  <ul className="space-y-2">
                    {insight.recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className={cn('mt-1', typeConfig.color)}>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Confiança da Análise
                  </span>
                  <span className="text-xs font-semibold">
                    {insight.confidence}%
                  </span>
                </div>
                <Progress value={insight.confidence} className="h-2" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  className = '',
}) => {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(
    new Set([insights[0]?.id]) // Expandir primeiro insight por padrão
  );

  const toggleInsight = (id: string) => {
    setExpandedInsights((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedInsights(new Set(insights.map((i) => i.id)));
  };

  const collapseAll = () => {
    setExpandedInsights(new Set());
  };

  // Contar por tipo
  const countsByType = insights.reduce((acc, insight) => {
    acc[insight.type] = (acc[insight.type] || 0) + 1;
    return acc;
  }, {} as Record<InsightType, number>);

  const highPriorityCount = insights.filter((i) => i.priority === 'high').length;

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Nenhum insight disponível no momento.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Continue gerando dados financeiros para receber análises personalizadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <div>
              <CardTitle>Insights Financeiros com IA</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Análise inteligente dos seus dados financeiros
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expandir Todos
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Colapsar Todos
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <Badge variant="secondary">{insights.length} insights</Badge>
          </div>
          {highPriorityCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Alta Prioridade:
              </span>
              <Badge variant="destructive">{highPriorityCount}</Badge>
            </div>
          )}
          {Object.entries(countsByType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {INSIGHT_TYPE_CONFIG[type as InsightType].label}:
              </span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            expanded={expandedInsights.has(insight.id)}
            onToggle={() => toggleInsight(insight.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
};
