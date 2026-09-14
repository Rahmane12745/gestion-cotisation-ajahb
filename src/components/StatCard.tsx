'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info';
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-700',
    border: 'border-l-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50 text-amber-700 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-700',
    border: 'border-l-amber-500',
  },
  rose: {
    bg: 'bg-rose-50 text-rose-700 border-rose-100',
    iconBg: 'bg-rose-100 text-rose-700',
    border: 'border-l-rose-500',
  },
  blue: {
    bg: 'bg-blue-50 text-blue-700 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-700',
    border: 'border-l-blue-500',
  },
  purple: {
    bg: 'bg-purple-50 text-purple-700 border-purple-100',
    iconBg: 'bg-purple-100 text-purple-700',
    border: 'border-l-purple-500',
  },
};

const badgeMap = {
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-800',
  info: 'bg-blue-100 text-blue-800',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  badgeText,
  badgeType = 'info',
}) => {
  const colors = colorMap[colorScheme];

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colors.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {badgeText && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeMap[badgeType]}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
};
