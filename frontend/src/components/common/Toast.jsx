import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white text-sm animate-in slide-in-from-bottom-2 duration-200 ${
              isSuccess
                ? 'border-emerald-200 text-emerald-900'
                : isError
                ? 'border-rose-200 text-rose-900'
                : 'border-slate-200 text-slate-900'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />}
            <div className="flex-1 font-medium">{toast.message}</div>
          </div>
        );
      })}
    </div>
  );
};
