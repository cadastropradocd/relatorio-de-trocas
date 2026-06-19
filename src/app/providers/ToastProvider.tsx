import React, { createContext, useContext, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ToastMessage } from '../../shared/types/trocas';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

const MAX_TOASTS = 5;
const TOAST_DURATION = 4000;

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const remainingRef = useRef<Map<string, number>>(new Map());
  const startRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string): void => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    remainingRef.current.delete(id);
    startRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const scheduleRemoval = useCallback((id: string, duration: number): void => {
    const timer = setTimeout(() => removeToast(id), duration);
    timersRef.current.set(id, timer);
    startRef.current.set(id, Date.now());
    remainingRef.current.set(id, duration);
  }, [removeToast]);

  const pauseToast = useCallback((id: string): void => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    const start = startRef.current.get(id) || Date.now();
    const remaining = remainingRef.current.get(id) || TOAST_DURATION;
    remainingRef.current.set(id, remaining - (Date.now() - start));
  }, []);

  const resumeToast = useCallback((id: string): void => {
    const remaining = remainingRef.current.get(id) || TOAST_DURATION;
    scheduleRemoval(id, remaining);
  }, [scheduleRemoval]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info'): void => {
    const id = uuidv4();
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      if (next.length > MAX_TOASTS) {
        const removed = next.shift()!;
        const removedTimer = timersRef.current.get(removed.id);
        if (removedTimer) {
          clearTimeout(removedTimer);
          timersRef.current.delete(removed.id);
        }
      }
      return next;
    });

    scheduleRemoval(id, TOAST_DURATION);
  }, [scheduleRemoval]);

  const value = useMemo<ToastContextType>(() => ({
    toasts,
    addToast,
    removeToast,
    pauseToast,
    resumeToast,
  }), [toasts, addToast, removeToast, pauseToast, resumeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
