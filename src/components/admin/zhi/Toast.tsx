"use client";

import React, { useEffect, useCallback, useState, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a no-op function if not within provider (for backwards compatibility)
        return { showToast: () => { } };
    }
    return context;
};

interface ToastItemProps {
    toast: ToastData;
    onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const bgColor = toast.type === 'success'
        ? 'bg-emerald-500'
        : toast.type === 'error'
            ? 'bg-rose-500'
            : 'bg-blue-500';

    const Icon = toast.type === 'success'
        ? CheckCircle2
        : toast.type === 'error'
            ? AlertCircle
            : Info;

    return (
        <div className={`flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-2 duration-300`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => onClose(toast.id)} className="ml-2 hover:opacity-80">
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            {toasts.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};

// Simple standalone toast for components that don't use the provider
interface SimpleToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export const SimpleToast: React.FC<SimpleToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success'
        ? 'bg-emerald-500'
        : type === 'error'
            ? 'bg-rose-500'
            : 'bg-blue-500';

    const Icon = type === 'success'
        ? CheckCircle2
        : type === 'error'
            ? AlertCircle
            : Info;

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-300`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <X size={16} />
            </button>
        </div>
    );
};

