'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  ExternalLink,
  Heart,
  Share2,
  Navigation,
  Euro,
  Award,
  TrendingUp,
  Users,
  Copy,
  MessageCircle,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Check,
  X,
  ChevronRight,
  Home,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Footer from '@/components/layout/Footer';
import { MarkdownText } from '@/lib/utils/markdown';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { toast } from 'sonner';
import { trackEvent, EVENTS, CATEGORIES as ANALYTICS_CATEGORIES } from '@/lib/analytics/tracker';
import { FurgocasaBanner } from '@/components/ad/FurgocasaBanner';
import { toSlug } from '@/lib/utils/url-helper';

type PlaceContentProps = {
  place: any;
  tier: string;
  tierInfo: any;
};

export function PlaceContent({ place, tier, tierInfo }: PlaceContentProps) {
  const router = useRouter();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');
  const [visitRating, setVisitRating] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Convertir provincia a slug para URLs (Málaga → malaga)
  const provinceSlug = toSlug(place.province);

  // Obtener la API key de Google Maps desde variable de entorno
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Usar Google Maps Static API para preview (no requiere JavaScript)
  // Esto es más rápido, mejor para SEO, y no consume cuota de JavaScript API

  // Detectar si es móvil para mostrar banner optimizado
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar al montar
    checkMobile();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showShareMenu && !target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  // Limpiar estados al desmontar componente
  useEffect(() => {
    return () => {
      setShowShareMenu(false);
      setShowVisitModal(false);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const photoUrl = getPlacePhotoUrl(place, 0, 1200);
  const priceLevel = place.price_level ? '€'.repeat(place.price_level) : null;

  const handleRegisterVisit = async () => {
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: place.id,
          notes: visitNotes,
          rating: visitRating > 0 ? visitRating : null,
        }),
      });

      if (response.ok) {
        toast.success('✅ Visita registrada');
        setShowVisitModal(false);
        setVisitNotes('');
        setVisitRating(0);
      } else {
        const data = await response.json();
        if (response.status === 401) {
          toast.error('Debes iniciar sesión para registrar visitas');
          router.push('/login');
        } else {
          toast.error(data.error || 'Error al registrar visita');
        }
      }
    } catch (error) {
      toast.error('Error al registrar visita');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: place.id }),
      });

      if (response.ok) {
        toast.success('❤️ Guardado en favoritos');
      } else if (response.status === 401) {
        toast.error('Debes iniciar sesión para guardar favoritos');
        router.push('/login');
      }
    } catch (error) {
      toast.error('Error al guardar favorito');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section con Foto */}
      <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-blue-700 to-blue-900">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900">
            <span className="text-8xl">{tierInfo.icon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Contenido sobre la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 text-white">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-white/80 mb-4">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link 
                href={`/${place.category}`}
                className="hover:text-white transition-colors"
              >
                {place.category === 'restaurante' ? 'Restaurantes' : 
                 place.category === 'hotel' ? 'Hoteles' :
                 place.category === 'bar' ? 'Bares' :
                 place.category === 'cafe' ? 'Cafeterías' : place.category}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link 
                href={`/${place.category}/${provinceSlug}`}
                className="hover:text-white transition-colors font-medium"
              >
                {place.province}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white font-medium truncate max-w-[200px]">{place.name}</span>
            </nav>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{tierInfo.icon}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${tierInfo.color}`}>
                    {tierInfo.name}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 drop-shadow-lg">{place.name}</h1>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-xl">{place.rating}</span>
                    <span className="text-sm">({place.user_ratings_total || place.review_count} reseñas)</span>
                  </div>
                  {priceLevel && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Euro className="h-4 w-4" />
                      <span className="font-semibold">{priceLevel}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {place.category && (
                    <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
                      <span className="text-lg">🏷️</span>
                      <span className="font-medium capitalize">{place.category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="h-4 w-4" />
                    <span>{place.city}, {place.province}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Descripción */}
            {place.ai_description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Sobre {place.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownText 
                    text={place.ai_description}
                    className="text-gray-700 leading-relaxed text-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Resumen de Reseñas */}
            {place.ai_review_summary && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Users className="h-5 w-5" />
                    Lo que dicen los clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-blue-900 italic leading-relaxed">
                    "<MarkdownText text={place.ai_review_summary} className="inline" />"
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {place.ai_highlights?.highlights && place.ai_highlights.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Destacados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {place.ai_highlights.highlights.map((highlight: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className="text-sm text-gray-800">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Banner Furgocasa - Responsive según dispositivo */}
            <FurgocasaBanner 
              variant="place"
              orientation={isMobile ? "vertical" : "horizontal"}
              location={place.province || place.city}
              placeName={place.name}
              autoRotate={true}
              rotateInterval={10000}
            />

            {/* Galería de Fotos */}
            {(() => {
              const maxPhotos = 6;
              const photos = [];
              
              if (place.photo_urls && Array.isArray(place.photo_urls) && place.photo_urls.length > 0) {
                photos.push(...place.photo_urls.slice(0, maxPhotos).map((url: string, index: number) => ({
                  src: url,
                  index,
                  alt: `${place.name} - Foto ${index + 1}`
                })));
              }
              
              if (photos.length < maxPhotos && place.photos) {
                let parsedPhotos = place.photos;
                if (typeof place.photos === 'string') {
                  try {
                    parsedPhotos = JSON.parse(place.photos);
                  } catch (error) {
                    parsedPhotos = [];
                  }
                }
                
                if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
                  const remainingSlots = maxPhotos - photos.length;
                  const googlePhotos = parsedPhotos.slice(0, remainingSlots).map((photoRef: string, index: number) => {
                    const googleUrl = getPlacePhotoUrl(place, photos.length + index, 600);
                    return googleUrl ? {
                      src: googleUrl,
                      index: photos.length + index,
                      alt: `${place.name} - Foto ${photos.length + index + 1}`
                    } : null;
                  }).filter(Boolean);
                  
                  photos.push(...googlePhotos);
                }
              }
              
              return photos.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Galería</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.index} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={photo.src}
                            alt={photo.alt}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </div>

          {/* Columna Lateral */}
          <div className="space-y-6">
            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {/* Teléfono */}
                {place.phone && (
                  <a 
                    href={`tel:${place.phone}`}
                    onClick={() => {
                      trackEvent(EVENTS.PHONE_CLICK, ANALYTICS_CATEGORIES.PLACE, {
                        place_id: place.id,
                        place_name: place.name,
                        place_category: place.category,
                        place_city: place.city
                      });
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition group"
                  >
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700 group-hover:text-blue-600">{place.phone}</span>
                  </a>
                )}

                {/* Sitio web */}
                {place.website && (
                  <a 
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent(EVENTS.WEBSITE_CLICK, ANALYTICS_CATEGORIES.PLACE, {
                        place_id: place.id,
                        place_name: place.name,
                        place_category: place.category,
                        place_city: place.city,
                        website_url: place.website
                      });
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition group"
                  >
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700 group-hover:text-blue-600">Visitar sitio web</span>
                    <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition" />
                  </a>
                )}

                {/* Dirección */}
                <div className="flex items-start gap-3 p-3">
                  <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Dirección</p>
                    <p className="text-sm text-gray-600 mt-1">{place.address}</p>
                  </div>
                </div>

                {/* Rango de precio */}
                {priceLevel && (
                  <div className="flex items-center gap-3 p-3">
                    <Euro className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rango de precio</p>
                      <p className="text-sm text-gray-600 mt-1">{priceLevel}</p>
                    </div>
                  </div>
                )}

                {/* Separador y Redes Sociales */}
                {(place.instagram_url || place.facebook_url || place.twitter_url || place.tiktok_url) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 px-3">
                      <Share2 className="h-4 w-4 text-gray-600" />
                      Redes Sociales
                    </h4>
                    <div className="flex flex-wrap gap-2 px-3">
                      {place.instagram_url && (
                        <a
                          href={place.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span className="text-sm font-medium">Instagram</span>
                        </a>
                      )}
                      
                      {place.facebook_url && (
                        <a
                          href={place.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-[#1877F2] text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          <Facebook className="h-4 w-4" />
                          <span className="text-sm font-medium">Facebook</span>
                        </a>
                      )}
                      
                      {place.twitter_url && (
                        <a
                          href={place.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          <Twitter className="h-4 w-4" />
                          <span className="text-sm font-medium">X</span>
                        </a>
                      )}
                      
                      {place.tiktok_url && (
                        <a
                          href={place.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                          <span className="text-sm font-medium">TikTok</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mapa */}
            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
              </CardHeader>
              <CardContent>
                {place.latitude && place.longitude ? (
                  <div className="rounded-lg overflow-hidden mb-4 relative group cursor-pointer"
                       onClick={() => place.google_maps_url && window.open(place.google_maps_url, '_blank')}>
                    {/* Google Maps Static API - Imagen estática del mapa */}
                    {googleMapsApiKey ? (
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${place.latitude},${place.longitude}&zoom=15&size=600x300&markers=color:red%7C${place.latitude},${place.longitude}&key=${googleMapsApiKey}`}
                        alt={`Mapa de ${place.name}`}
                        className="w-full h-[300px] object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Si falla la carga, mostrar placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'bg-gray-100 rounded-lg h-[300px] flex items-center justify-center';
                            placeholder.innerHTML = '<svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
                            target.parentElement.insertBefore(placeholder, target);
                          }
                        }}
                      />
                    ) : (
                      <div className="bg-gray-100 rounded-lg h-[300px] flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {/* Overlay para indicar que es clickeable */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-sm font-medium text-gray-900">Haz clic para ver en Google Maps</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg h-[300px] flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {place.google_maps_url && (
                  <Button
                    onClick={() => {
                      trackEvent(EVENTS.DIRECTIONS_CLICK, ANALYTICS_CATEGORIES.PLACE, {
                        place_id: place.id,
                        place_name: place.name,
                        place_category: place.category,
                        place_city: place.city
                      });
                      window.open(place.google_maps_url, '_blank');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Ver en Google Maps
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={handleToggleFavorite}
                  variant="outline"
                  className="w-full hover:bg-pink-50 hover:border-pink-500"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Guardar en Favoritos
                </Button>

                <Button
                  onClick={() => setShowVisitModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Registrar Visita
                </Button>
                
                <div className="relative share-menu-container">
                  <Button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>

                  {/* Menú desplegable de compartir */}
                  {showShareMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-2 z-50">
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('✅ Enlace copiado al portapapeles');
                            setShowShareMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition text-left"
                        >
                          <Copy className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Copiar enlace</span>
                        </button>

                        <button
                          onClick={() => {
                            const text = `¡Mira este lugar increíble! ${place.name} - ⭐ ${place.rating} (${place.user_ratings_total || place.review_count} reseñas)`;
                            const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.href)}`;
                            window.open(url, '_blank');
                            setShowShareMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-green-50 rounded-lg transition text-left"
                        >
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">WhatsApp</span>
                        </button>

                        <button
                          onClick={() => {
                            const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                            window.open(url, '_blank', 'width=600,height=400');
                            setShowShareMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg transition text-left"
                        >
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Facebook</span>
                        </button>

                        <button
                          onClick={() => {
                            const text = `${place.name} - ⭐ ${place.rating} (${place.user_ratings_total || place.review_count} reseñas) en ${place.city}`;
                            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
                            window.open(url, '_blank', 'width=600,height=400');
                            setShowShareMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition text-left"
                        >
                          <Twitter className="h-4 w-4 text-gray-900" />
                          <span className="text-sm font-medium text-gray-900">Twitter / X</span>
                        </button>

                        <button
                          onClick={() => {
                            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                            window.open(url, '_blank', 'width=600,height=400');
                            setShowShareMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg transition text-left"
                        >
                          <Linkedin className="h-4 w-4 text-blue-700" />
                          <span className="text-sm font-medium text-gray-900">LinkedIn</span>
                        </button>

                        <button
                          onClick={() => {
                            const subject = `Te recomiendo: ${place.name}`;
                            const body = `Encontré este lugar increíble:\n\n${place.name}\n⭐ ${place.rating} (${place.user_ratings_total || place.review_count} reseñas)\n📍 ${place.city}, ${place.province}\n\n${window.location.href}`;
                            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            setShowShareMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition text-left"
                        >
                          <Mail className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Email</span>
                        </button>
                      </div>

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => setShowShareMenu(false)}
                          className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Registrar Visita */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Registrar Visita</h3>
              <button
                onClick={() => {
                  setShowVisitModal(false);
                  setVisitNotes('');
                  setVisitRating(0);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{tierInfo.icon}</span>
                  <h4 className="font-semibold text-gray-900">{place.name}</h4>
                </div>
                <p className="text-sm text-gray-600">{place.city}, {place.province}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ¿Cómo fue tu experiencia? (Opcional)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setVisitRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= visitRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Notas personales (Opcional)
                </label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="¿Qué tal fue? ¿Volverías? Tus impresiones..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowVisitModal(false);
                    setVisitNotes('');
                    setVisitRating(0);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegisterVisit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Registrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Banner de Conversión - Antes del Footer */}
      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border-t border-b border-blue-200 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            {/* Icon */}
            <div className="inline-block mb-4">
              <span className="text-5xl">🗺️</span>
            </div>
            
            {/* Headline */}
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              ¿Te ha gustado {place.name}?
            </h3>
            
            {/* Description */}
            <p className="text-lg text-gray-700 mb-2 max-w-2xl mx-auto">
              Descubre <strong>3,133 lugares excepcionales</strong> como este en toda España.
            </p>
            <p className="text-base text-gray-600 mb-6 max-w-2xl mx-auto">
              Todos con <strong className="text-[#002297]">+4.7★</strong> en Google Maps. 
              Usa nuestro mapa interactivo, crea rutas y guarda favoritos.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Link href="/mapa">
                <Button 
                  className="bg-[#002297] hover:bg-[#052d5a] text-white px-8 py-3 text-base font-semibold w-full sm:w-auto"
                  onClick={() => {
                    trackEvent(EVENTS.PLACE_DETAIL_CLICK, ANALYTICS_CATEGORIES.ENGAGEMENT, {
                      place_id: place.id,
                      place_name: place.name,
                      source: 'cta_banner',
                      cta_type: 'explore_map'
                    });
                  }}
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Explorar Mapa Interactivo
                </Button>
              </Link>
              <Link href="/registro">
                <Button 
                  variant="outline" 
                  className="border-2 border-[#002297] text-[#002297] hover:bg-blue-50 px-8 py-3 text-base font-semibold w-full sm:w-auto"
                  onClick={() => {
                    trackEvent(EVENTS.PLACE_DETAIL_CLICK, ANALYTICS_CATEGORIES.ENGAGEMENT, {
                      place_id: place.id,
                      place_name: place.name,
                      source: 'cta_banner',
                      cta_type: 'register'
                    });
                  }}
                >
                  Prueba Gratis 30 Días
                </Button>
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="text-green-600">✓</span> 30 días gratis
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-600">✓</span> Sin permanencia
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-600">✓</span> Solo +4.7★
              </span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

