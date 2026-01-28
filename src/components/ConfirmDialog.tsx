interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  warning,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              {variant === 'danger' ? (
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {message}
              </p>
              
              {warning && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ {warning}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-border flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-sm"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                : 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
            }`}
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
