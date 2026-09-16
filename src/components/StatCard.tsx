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
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100',
    iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 shadow-lg shadow-emerald-200/50',
    border: 'border-l-4 border-l-emerald-500',
    accent: 'from-emerald-500 to-teal-500',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border-amber-100',
    iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 shadow-lg shadow-amber-200/50',
    border: 'border-l-4 border-l-amber-500',
    accent: 'from-amber-500 to-orange-500',
  },
  rose: {
    bg: 'bg-gradient-to-br from-rose-50 to-pink-50 text-rose-700 border-rose-100',
    iconBg: 'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 shadow-lg shadow-rose-200/50',
    border: 'border-l-4 border-l-rose-500',
    accent: 'from-rose-500 to-pink-500',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-100',
    iconBg: 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 shadow-lg shadow-blue-200/50',
    border: 'border-l-4 border-l-blue-500',
    accent: 'from-blue-500 to-cyan-500',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-700 border-purple-100',
    iconBg: 'bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 shadow-lg shadow-purple-200/50',
    border: 'border-l-4 border-l-purple-500',
    accent: 'from-purple-500 to-indigo-500',
  },
};

const badgeMap = {
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  danger: 'bg-rose-100 text-rose-800 border border-rose-200',
  info: 'bg-blue-100 text-blue-800 border border-blue-200',
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
    <div className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in ${colors.bg} ${colors.border}`}>
      {/* Background decoration */}
      <div className={`absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br ${colors.accent} opacity-5 rounded-full blur-3xl`}></div>
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 opacity-70">
            {title}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
          </div>
          {subtitle && (
            <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-4 rounded-xl transform transition-all duration-300 hover:scale-110 ${colors.iconBg}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>

      {badgeText && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badgeMap[badgeType]}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
};
