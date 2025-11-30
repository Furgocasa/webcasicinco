'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostrar el botón cuando el usuario hace scroll más de 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-[998] bg-white hover:bg-gray-50 text-gray-700 p-4 rounded-full shadow-lg border-2 border-gray-200 transition-all duration-300 hover:scale-110 hover:shadow-xl group"
          aria-label="Volver arriba"
        >
          <ArrowUp className="h-6 w-6 text-[#063971] group-hover:animate-bounce" />
        </button>
      )}
    </>
  );
}

