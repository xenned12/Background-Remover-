import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto p-3.5 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 text-xs transition-all duration-300 animate-in slide-in-from-bottom-5 bg-white/95',
            toast.type === 'success' && 'border-emerald-300 text-slate-900',
            toast.type === 'error' && 'border-red-300 text-slate-900',
            toast.type === 'info' && 'border-blue-300 text-slate-900'
          )}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900">{toast.title}</h4>
            {toast.description && <p className="text-[11px] text-slate-500 mt-0.5">{toast.description}</p>}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
