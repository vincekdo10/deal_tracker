import { Card } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'orange' | 'teal' | 'blue' | 'green' | 'purple';
}

export function MetricCard({ title, value, change, icon, color = 'orange' }: MetricCardProps) {
  const colorClasses = {
    orange: 'text-slate-700 bg-slate-100',
    teal: 'text-teal-600 bg-teal-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-500',
    neutral: 'text-text-secondary'
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {value}
            </p>
          </div>
          {icon && (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
        </div>
        
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${trendClasses[change.trend]}`}>
            {change.trend === 'up' && <ArrowUpIcon className="w-4 h-4" />}
            {change.trend === 'down' && <ArrowDownIcon className="w-4 h-4" />}
            <span>{change.value}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
