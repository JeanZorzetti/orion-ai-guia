'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Filtros Skeleton */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card Principal (2 colunas) */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-48" />
          </CardContent>
        </Card>

        {/* Cards Secundários */}
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-5 w-32" />
            </CardContent>
          </Card>
        ))}

        {/* Linha 2 - 4 cards pequenos */}
        {[1, 2, 3, 4].map((i) => (
          <Card key={`small-${i}`}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={`chart-${i}`}>
            <CardHeader>
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Skeleton */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={`insight-${i}`} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cards Inferiores Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={`bottom-${i}`}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {i === 5 ? (
                // Gráfico de vendas
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                // Cards de lista
                <>
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-16 w-full rounded-lg" />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;
