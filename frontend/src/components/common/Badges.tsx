import React from 'react';
import { getStatusColor, STATUS_LABELS } from '../../utils';

interface Props {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => (
  <span className={`badge ${getStatusColor(status)} ${className}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

interface PriorityProps {
  priority: string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityProps> = ({ priority, className = '' }) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`badge ${colors[priority] || colors.medium} ${className}`}>
      {priority?.toUpperCase()}
    </span>
  );
};

interface SeverityProps {
  severity: string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityProps> = ({ severity, className = '' }) => {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`badge ${colors[severity] || colors.medium} ${className}`}>
      {severity?.toUpperCase()}
    </span>
  );
};
