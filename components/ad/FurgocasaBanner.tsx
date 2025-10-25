'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Compass, MapPin, Calendar } from 'lucide-react';
import { trackEvent, CATEGORIES } from '@/lib/analytics/tracker';

type FurgocasaBannerProps = {
  variant?: 'blog' | 'place' | 'home';
  orientation?: 'horizontal' | 'vertical' | 'sidebar';
  location?: string;
  placeName?: string;
  autoRotate?: boolean;
  rotateInterval?: number; // en milisegundos
};

// Definir las diferentes variantes del banner
type BannerVariant = {
  id: string;
  image: string;
  headline: string;
  headlineSidebar?: string; // Versión corta para sidebar
  subheadline: string;
  subheadlineSidebar?: string; // Versión corta para sidebar
  cta: string;
  ctaLink: string;
  secondaryCta?: string;
  secondaryLink?: string;
  badge?: string;
  icon?: 'compass' | 'map' | 'calendar';
};

const BANNER_VARIANTS: BannerVariant[] = [
  {
    id: 'freedom',
    image: '/images/furgocasa/2019.02.23_1912.JPG',
    headline: 'Descubre los mejores restaurantes de [LOCATION] con tu casa a cuestas',
    headlineSidebar: 'Descubre [LOCATION] con tu casa a cuestas',
    subheadline: 'Alquila una campervan premium y visita todos estos lugares con total libertad.',
    subheadlineSidebar: 'Alquila una campervan premium con total libertad.',
    cta: 'Reservar Ahora',
    ctaLink: '/es/reservar',
    secondaryCta: 'Ver Campervans',
    secondaryLink: '/es/vehiculos-campervans'
  },
  {
    id: 'lifestyle',
    image: '/images/furgocasa/AdobeStock_136414223.jpeg',
    headline: 'Visita los mejores bares de [LOCATION] en camper',
    headlineSidebar: 'Visita [LOCATION] en camper premium',
    subheadline: 'Campervans de máxima calidad para explorar sin límites. Recogida en Murcia o Madrid.',
    subheadlineSidebar: 'Máxima calidad. Recogida en Murcia o Madrid.',
    cta: 'Ver Flota',
    ctaLink: '/es/vehiculos-campervans',
    secondaryCta: 'Reservar Ahora',
    secondaryLink: '/es/reservar',
    badge: '🚐 Máxima Calidad'
  },
  {
    id: 'adventure',
    image: '/images/furgocasa/AdobeStock_45125037.jpeg',
    headline: 'Visita todos estos lugares de [LOCATION] con tu camper de alquiler',
    headlineSidebar: 'Visita [LOCATION] con tu camper',
    subheadline: 'Especialistas en alquiler de campervans premium. Desde Murcia para toda España. Descuentos hasta -30%.',
    subheadlineSidebar: 'Campervans premium desde Murcia. Hasta -30%.',
    cta: 'Ver Ofertas',
    ctaLink: '/es/reservar',
    secondaryCta: 'Ver Modelos',
    secondaryLink: '/es/vehiculos-campervans',
    badge: '💰 Hasta -30%'
  },
  {
    id: 'quality',
    image: '/images/furgocasa/AdobeStock_136326717.jpeg',
    headline: 'Recorre [LOCATION] con una campervan de gran volumen',
    headlineSidebar: 'Recorre [LOCATION] en campervan',
    subheadline: 'Knaus, Weinsberg, Adria, Challenger... Los mejores modelos para tu escapada.',
    subheadlineSidebar: 'Knaus, Weinsberg, Adria... Los mejores modelos.',
    cta: 'Explorar Modelos',
    ctaLink: '/es/vehiculos-campervans',
    secondaryCta: 'Consultar Precio',
    secondaryLink: '/es/reservar',
    badge: '🏆 Premium'
  },
  {
    id: 'beach',
    image: '/images/furgocasa/AdobeStock_42669967.jpeg',
    headline: 'Descubre [LOCATION] durmiendo donde tú elijas con tu camper',
    headlineSidebar: 'Descubre [LOCATION] en camper',
    subheadline: 'La forma más cómoda de visitar estos lugares. Espacio, confort y libertad.',
    subheadlineSidebar: 'Espacio, confort y libertad total.',
    cta: 'Reservar',
    ctaLink: '/es/reservar',
    secondaryCta: 'Ver Vehículos',
    secondaryLink: '/es/vehiculos-campervans',
    badge: '🏖️ Escapadas'
  }
];

export function FurgocasaBanner({ 
  variant = 'blog',
  orientation = 'horizontal',
  location = 'España',
  placeName,
  autoRotate = true,
  rotateInterval = 10000
}: FurgocasaBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotación de banners
  useEffect(() => {
    if (!autoRotate) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNER_VARIANTS.length);
    }, rotateInterval);

    return () => clearInterval(timer);
  }, [autoRotate, rotateInterval]);

  const handleClick = (ctaType: string, variantId: string) => {
    trackEvent('furgocasa_ad_click', CATEGORIES.ENGAGEMENT, {
      variant,
      cta_type: ctaType,
      banner_variant: variantId,
      location,
      place_name: placeName || 'N/A'
    });
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    trackEvent('furgocasa_ad_navigation', CATEGORIES.ENGAGEMENT, {
      to_variant: BANNER_VARIANTS[index].id
    });
  };

  const currentBanner = BANNER_VARIANTS[currentIndex];
  
  // Reemplazar placeholders dinámicos
  const headline = (orientation === 'sidebar' && currentBanner.headlineSidebar 
    ? currentBanner.headlineSidebar 
    : currentBanner.headline)
    .replace('[LOCATION]', location)
    .replace('[PLACE]', placeName || location);

  const subheadline = orientation === 'sidebar' && currentBanner.subheadlineSidebar
    ? currentBanner.subheadlineSidebar
    : currentBanner.subheadline;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'compass':
        return <Compass className="h-5 w-5" />;
      case 'map':
        return <MapPin className="h-5 w-5" />;
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  // ============================================
  // VERSIÓN HORIZONTAL (blog, places)
  // ============================================
  if (orientation === 'horizontal') {
    return (
      <div className="my-8 md:my-12 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl shadow-2xl overflow-hidden relative h-auto md:h-[280px]">
        <div className="flex flex-col md:flex-row items-stretch h-full">
          {/* Imagen */}
          <div className="w-full md:w-1/3 flex-shrink-0 h-64 md:h-full">
            <img 
              src={currentBanner.image}
              alt={`Furgocasa - ${currentBanner.id}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Contenido */}
          <div className="w-full md:w-2/3 text-white p-4 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <img 
                  src="/images/furgocasa/LOGO BLANCO_500.png"
                  alt="Furgocasa Campervans"
                  className="h-8"
                />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  Publicidad
                </span>
                {currentBanner.badge && (
                  <span className="text-xs bg-white/30 px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                    {currentBanner.badge}
                  </span>
                )}
              </div>

              <h3 className="text-xl md:text-2xl font-bold mb-2 leading-tight">
                {headline}
              </h3>
              
              <p className="text-white/95 mb-4 text-sm md:text-base leading-relaxed">
                {subheadline}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <a
                href={`https://www.furgocasa.com${currentBanner.ctaLink}?utm_source=casicinco&utm_medium=${variant}_banner_horizontal&utm_campaign=${currentBanner.id}`}
                target="_blank"
                rel="noopener"
                onClick={() => handleClick('main_cta', currentBanner.id)}
                className="bg-white text-blue-900 font-bold py-2.5 px-5 rounded-lg text-center hover:bg-blue-50 transition-all text-sm"
              >
                {currentBanner.cta}
              </a>
              
              {currentBanner.secondaryCta && currentBanner.secondaryLink && (
                <a
                  href={`https://www.furgocasa.com${currentBanner.secondaryLink}?utm_source=casicinco&utm_medium=banner&utm_campaign=secondary_${currentBanner.id}`}
                  target="_blank"
                  rel="noopener"
                  onClick={() => handleClick('secondary_cta', currentBanner.id)}
                  className="border-2 border-white text-white font-semibold py-2.5 px-5 rounded-lg text-center hover:bg-white/10 transition-colors text-sm"
                >
                  {currentBanner.secondaryCta}
                </a>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-white/90">
                  <a 
                    href="https://www.furgocasa.com/es/reservar?utm_source=casicinco&utm_medium=seo_link&utm_campaign=alquiler_murcia"
                    target="_blank"
                    rel="dofollow"
                    className="hover:underline"
                  >
                    📍 Camper Murcia
                  </a>
                  <a 
                    href="https://www.furgocasa.com/es/vehiculos-campervans?utm_source=casicinco&utm_medium=seo_link&utm_campaign=campervans_premium"
                    target="_blank"
                    rel="dofollow"
                    className="hover:underline"
                  >
                    🚐 Premium
                  </a>
                </div>

                {/* Dots de navegación */}
                <div className="flex items-center gap-1.5">
                  {BANNER_VARIANTS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Ver variante ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VERSIÓN VERTICAL (tarjeta completa)
  // ============================================
  if (orientation === 'vertical') {
    return (
      <div className="my-8 md:my-12 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl shadow-2xl overflow-hidden relative max-w-md mx-auto h-[600px] flex flex-col">
        <div className="relative h-64 flex-shrink-0">
          <img 
            src={currentBanner.image}
            alt={`Furgocasa - ${currentBanner.id}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4">
            <img 
              src="/images/furgocasa/LOGO BLANCO_500.png"
              alt="Furgocasa Campervans"
              className="h-12"
            />
          </div>
        </div>

        <div className="p-5 text-white flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                Publicidad
              </span>
              {currentBanner.badge && (
                <span className="text-xs bg-white/30 px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                  {currentBanner.badge}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2 leading-tight">
              {headline}
            </h3>
            
            <p className="text-white/95 mb-4 text-sm leading-relaxed">
              {subheadline}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mb-4">
            <a
              href={`https://www.furgocasa.com${currentBanner.ctaLink}?utm_source=casicinco&utm_medium=${variant}_banner_vertical&utm_campaign=${currentBanner.id}`}
              target="_blank"
              rel="noopener"
              onClick={() => handleClick('main_cta', currentBanner.id)}
              className="bg-white text-blue-900 font-bold py-2.5 px-5 rounded-lg text-center hover:bg-blue-50 transition-all text-sm"
            >
              {currentBanner.cta}
            </a>
            
            {currentBanner.secondaryCta && currentBanner.secondaryLink && (
              <a
                href={`https://www.furgocasa.com${currentBanner.secondaryLink}?utm_source=casicinco&utm_medium=banner&utm_campaign=secondary_${currentBanner.id}`}
                target="_blank"
                rel="noopener"
                onClick={() => handleClick('secondary_cta', currentBanner.id)}
                className="border-2 border-white text-white font-semibold py-2.5 px-5 rounded-lg text-center hover:bg-white/10 transition-colors text-sm"
              >
                {currentBanner.secondaryCta}
              </a>
            )}
          </div>

          <div>
            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-3 text-xs text-white/90">
                  <a 
                    href="https://www.furgocasa.com/es/reservar?utm_source=casicinco&utm_medium=seo_link&utm_campaign=alquiler_murcia"
                    target="_blank"
                    rel="dofollow"
                    className="hover:underline"
                  >
                    📍 Camper Murcia
                  </a>
                  <a 
                    href="https://www.furgocasa.com/es/vehiculos-campervans?utm_source=casicinco&utm_medium=seo_link&utm_campaign=furgonetas_camper"
                    target="_blank"
                    rel="dofollow"
                    className="hover:underline"
                  >
                    🚐 Premium
                  </a>
                </div>

                {/* Dots de navegación */}
                <div className="flex items-center gap-1.5">
                  {BANNER_VARIANTS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Ver variante ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VERSIÓN SIDEBAR (fijo lateral derecho)
  // ============================================
  if (orientation === 'sidebar') {
    return (
      <aside className="hidden lg:block fixed right-4 top-24 w-72 xl:w-80 z-40">
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-xl shadow-2xl overflow-hidden relative h-[540px] flex flex-col">
          <div className="relative h-48 flex-shrink-0">
            <img 
              src={currentBanner.image}
              alt={`Furgocasa - ${currentBanner.id}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="p-4 text-white flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <img 
                  src="/images/furgocasa/LOGO BLANCO_500.png"
                  alt="Furgocasa"
                  className="h-7"
                />
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Publicidad</span>
              </div>

              {currentBanner.badge && (
                <span className="inline-block text-xs bg-white/30 px-2 py-0.5 rounded-full mb-2">
                  {currentBanner.badge}
                </span>
              )}

              <h3 className="text-base font-bold mb-1.5 leading-tight">
                {headline}
              </h3>
              
              <p className="text-white/90 mb-3 text-xs leading-relaxed">
                {subheadline}
              </p>
            </div>

            <div>
              <a
                href={`https://www.furgocasa.com${currentBanner.ctaLink}?utm_source=casicinco&utm_medium=${variant}_banner_sidebar&utm_campaign=${currentBanner.id}`}
                target="_blank"
                rel="noopener"
                onClick={() => handleClick('main_cta', currentBanner.id)}
                className="block w-full bg-white text-blue-900 font-bold py-2 px-3 rounded-lg text-center hover:bg-blue-50 transition-colors mb-2 text-sm"
              >
                {currentBanner.cta}
              </a>
              
              {currentBanner.secondaryCta && currentBanner.secondaryLink && (
                <a
                  href={`https://www.furgocasa.com${currentBanner.secondaryLink}?utm_source=casicinco&utm_medium=banner&utm_campaign=secondary_${currentBanner.id}`}
                  target="_blank"
                  rel="noopener"
                  onClick={() => handleClick('secondary_cta', currentBanner.id)}
                  className="block w-full border-2 border-white text-white font-semibold py-2 px-3 rounded-lg text-center hover:bg-white/10 transition-colors mb-3 text-xs"
                >
                  {currentBanner.secondaryCta}
                </a>
              )}

              <div className="flex items-center justify-between text-xs text-white/80">
                <a 
                  href="https://www.furgocasa.com/es/reservar?utm_source=casicinco&utm_medium=seo_link&utm_campaign=camper_alquiler"
                  target="_blank"
                  rel="dofollow"
                  className="hover:underline text-white/90"
                >
                  📍 Camper alquiler
                </a>
                
                {/* Dots horizontales pequeños */}
                <div className="flex items-center gap-1">
                  {BANNER_VARIANTS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-white w-4' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Ver variante ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
