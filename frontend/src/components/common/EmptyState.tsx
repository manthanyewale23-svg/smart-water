import React from 'react';
import { DivideSquare } from 'lucide-react';

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 text-gray-300">
      {icon || <DivideSquare size={48} />}
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-xs mb-4">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
