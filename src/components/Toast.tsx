import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onHide, duration = 2500 }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsLeaving(false);
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onHide, 200);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onHide]);

  if (!isVisible && !isLeaving) return null;

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        px-5 py-3 rounded-xl shadow-xl
        bg-slate-900 text-white text-sm font-medium
        flex items-center gap-2.5
        transition-all duration-200
        ${isLeaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 animate-in fade-in zoom-in-95'}
      `}
    >
      <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      {message}
    </div>
  );
}
