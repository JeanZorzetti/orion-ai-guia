import React from 'react';

interface FinancialSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
  showGradient?: boolean;
  className?: string;
}

export const FinancialSparkline: React.FC<FinancialSparklineProps> = ({
  data,
  color = '#3B82F6',
  height = 40,
  showArea = true,
  showGradient = true,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Gerar pontos para a linha
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((max - value) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  // Gerar pontos para a área (incluindo base)
  const areaPoints = data.length > 1
    ? `0,100 ${points} 100,100`
    : points;

  // ID único para o gradiente
  const gradientId = `gradient-${color.replace('#', '')}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
      )}

      {/* Área de preenchimento */}
      {showArea && (
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      )}

      {/* Linha principal */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
