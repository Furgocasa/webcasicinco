'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: 'half' | 'full';
}

const CLOSE_THRESHOLD = 100;

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'half',
}: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setDragY(0);
      dragStartRef.current = null;
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    setDragY(Math.max(0, e.clientY - dragStartRef.current));
  };

  const endDrag = () => {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    if (dragY > CLOSE_THRESHOLD) onClose();
    setDragY(0);
  };

  const heightClass = height === 'full' ? 'h-[90dvh]' : 'h-[60dvh]';

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-40 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className={`fixed left-0 right-0 bottom-0 bg-white rounded-t-3xl transform transition-transform duration-300 z-50 md:hidden flex flex-col pb-[env(safe-area-inset-bottom)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${heightClass}`}
      >
        <div
          className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-4">
          {children}
        </div>
      </div>
    </>
  );
}
