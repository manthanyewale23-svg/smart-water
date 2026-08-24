import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<Props> = ({ size = 'md', text, className = '' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
};
