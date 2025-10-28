import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#60A5FA',
  height = 40,
  className = ''
}) => {
  // Se não há dados suficientes, retornar vazio
  if (!data || data.length < 2) {
    return <div className={className} style={{ height }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Evitar divisão por zero

  // Gerar pontos do gráfico
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((max - value) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Gerar path para área preenchida
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
    >
      {/* Área preenchida com gradiente */}
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Área */}
      <polygon
        points={areaPoints}
        fill={`url(#gradient-${color})`}
      />

      {/* Linha */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default Sparkline;
