import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  padding = 'md',
  className = '',
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-white rounded-lg border border-[var(--border)] shadow-sm ${className}`}
    >
      {(title || subtitle) && (
        <div className="border-b border-[var(--border)] px-6 py-4">
          {title && (
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};

export default Card;
