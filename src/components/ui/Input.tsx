'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon: Icon,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        
        <input
          {...props}
          className={`
            w-full px-4 py-2.5 rounded-lg
            border border-slate-200 
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
            transition-all duration-300
            font-medium text-slate-900
            placeholder:text-slate-400
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''}
            ${className}
          `}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs font-semibold text-rose-600">
          ⚠️ {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-2 text-xs text-slate-500 font-medium">
          {helperText}
        </p>
      )}
    </div>
  );
};
