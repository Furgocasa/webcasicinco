'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: 'half' | 'full';
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'half',
}: BottomSheetProps) {
  // Prevenir scroll del body cuando el sheet está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const heightClass = height === 'full' 
    ? 'h-[90vh] top-[10vh]' 
    : 'h-[70vh] top-[30vh]';

  return (
    <>
      {/* Overlay - z-30 para estar DEBAJO del BottomNavigation (z-50) */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-30 md:hidden ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet - z-40 para estar DEBAJO del BottomNavigation (z-50) */}
      <div
        className={`fixed left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 z-40 md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${heightClass}`}
      >
        {/* Handle (barra para arrastrar) */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-24 px-4">
          {children}
        </div>
      </div>
    </>
  );
}

