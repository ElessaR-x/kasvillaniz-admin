interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
}

export default function AlertModal({ isOpen, onClose, message, type = 'error' }: AlertModalProps) {
  if (!isOpen) return null;

  const bgColor = {
    error: 'bg-red-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50'
  }[type];

  const textColor = {
    error: 'text-red-800',
    success: 'text-green-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }[type];

  const iconColor = {
    error: 'text-red-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className={`relative transform overflow-hidden rounded-lg ${bgColor} px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6`}>
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${bgColor} sm:mx-0 sm:h-10 sm:w-10`}>
              <svg className={`h-6 w-6 ${iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className={`text-base font-semibold leading-6 ${textColor}`}>
                Uyarı
              </h3>
              <div className="mt-2">
                <p className={`text-sm ${textColor}`}>{message}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto
                ${type === 'error' ? 'bg-red-600 hover:bg-red-500' : 
                  type === 'success' ? 'bg-green-600 hover:bg-green-500' :
                  type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-500' :
                  'bg-blue-600 hover:bg-blue-500'}`}
              onClick={onClose}
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 