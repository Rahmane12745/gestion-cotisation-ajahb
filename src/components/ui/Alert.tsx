'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title: string;
  message?: string;
  onClose?: () => void;
  closeable?: boolean;
}

const typeStyles: Record<AlertType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  error: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: <Info className="w-5 h-5" />,
  },
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  closeable = false,
}) => {
  const style = typeStyles[type];

  return (
    <div className={`rounded-lg border ${style.bg} ${style.border} p-4 animate-slideUp`}>
      <div className="flex items-start gap-3">
        <div className={style.text}>{style.icon}</div>
        <div className="flex-1">
          <p className={`font-bold ${style.text}`}>{title}</p>
          {message && (
            <p className={`text-sm mt-1 ${style.text} opacity-90`}>
              {message}
            </p>
          )}
        </div>
        {closeable && onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-white/50 transition-colors ${style.text}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
