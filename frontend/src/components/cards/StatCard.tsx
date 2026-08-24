import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  className?: string;
  valueColor?: string;
}

export const StatCard: React.FC<Props> = ({
  title, value, subtitle, icon, iconBg = 'bg-blue-100',
  trend, trendValue, trendLabel, className = '', valueColor = 'text-gray-900'
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <p className={`text-2xl font-bold ${valueColor} truncate`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon size={14} />
              <span className="text-xs font-medium">{trendValue}</span>
              {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-xl flex-shrink-0 ml-4`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
