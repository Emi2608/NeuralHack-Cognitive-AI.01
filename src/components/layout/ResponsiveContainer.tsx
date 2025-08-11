import React from 'react';
import './ResponsiveContainer.css';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  className = '',
}) => {
  const containerClass = `responsive-container responsive-container-${maxWidth} ${className}`.trim();

  return (
    <div className={containerClass}>
      {children}
    </div>
  );
};