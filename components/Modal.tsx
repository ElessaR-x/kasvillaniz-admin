"use client";
import { Dialog } from '@headlessui/react';
import { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Dialog
      as="div"
      open={isOpen}
      onClose={onClose}
      className={`relative z-50 ${className}`}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={`w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl
          sm:max-w-[90%] lg:max-w-[1200px] xl:max-w-[1400px] ${className}`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold">
                {title}
              </Dialog.Title>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 