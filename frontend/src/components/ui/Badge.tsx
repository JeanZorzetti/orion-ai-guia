import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full';

  const variantStyles = {
    primary:
      'bg-blue-100 text-blue-700 border border-blue-200',
    secondary:
      'bg-purple-100 text-purple-700 border border-purple-200',
    success:
      'bg-green-100 text-green-700 border border-green-200',
    warning:
      'bg-yellow-100 text-yellow-700 border border-yellow-200',
    danger:
      'bg-red-100 text-red-700 border border-red-200',
    neutral:
      'bg-gray-100 text-gray-700 border border-gray-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return <span className={combinedClassName}>{children}</span>;
};

export default Badge;
