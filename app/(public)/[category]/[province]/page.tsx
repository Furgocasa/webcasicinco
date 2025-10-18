import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createClientBrowser } from '@supabase/supabase-js';
import Link from 'next/link';
import { Star, MapPin, TrendingUp, ChevronRight, Home } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';

type Props = {
  params: { category: string; province: string }
}

const VALID_CATEGORIES = ['restaurante', 'bar', 'cafe', 'hotel'];

const CATEGORY_CONFIG: Record<string, {
  title: string;
  titleSingular: string;
  emoji: string;
  description: string;
  color: string;
}> = {
  restaurante: {
    title: 'Restaurantes',
    titleSingular: 'Restaurante',
    emoji: '🍽️',
    description: 'Solo restaurantes con mínimo 4.7★ y validación de miles de comensales',
    color: 'from-blue-700 to-blue-900',
  },
  bar: {
    title: 'Bares',
    titleSingular: 'Bar',
    emoji: '🍺',
    description: 'Los mejores bares con ambiente increíble y valoraciones excepcionales',
    color: 'from-amber-700 to-amber-900',
  },
  cafe: {
    title: 'Cafeterías',
    titleSingular: 'Cafetería',
    emoji: '☕',
    description: 'Cafeterías de especialidad con los mejores cafés y atención premium',
    color: 'from-yellow-700 to-yellow-900',
  },
  hotel: {
    title: 'Hoteles',
    titleSingular: 'Hotel',
    emoji: '🏨',
    description: 'Hoteles excepcionales para una estancia inolvidable',
    color: 'from-blue-700 to-indigo-900',
  },
};

// Metadata dinámica para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, province } = params;
  
  if (!VALID_CATEGORIES.includes(category)) {
    return {
      title: 'Categoría no encontrada | Casi Cinco',
    };
  }

  const config = CATEGORY_CONFIG[category];
  const provinceName = province.charAt(0).toUpperCase() + province.slice(1);
  
  // Obtener cantidad de lugares
  const supabase = await createClient();
  const { count } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .eq('province', provinceName)
    .eq('published', true)
    .gte('rating', 4.7);
  
  const totalPlaces = count || 0;
  
  return {
    title: `Mejores ${config.title} en ${provinceName} +4.7★ (${totalPlaces}) | Casi Cinco`,
    description: `Descubre los ${totalPlaces} mejores ${config.title.toLowerCase()} de ${provinceName}. ${config.description}. Ordenados por calidad objetiva verificada.`,
    openGraph: {
      title: `Top ${config.title} en ${provinceName}`,
      description: `${totalPlaces} ${config.title.toLowerCase()} excepcionales con mínimo 4.7★ en ${provinceName}`,
      type: 'website',
    },
  };
}

// Pre-generar rutas estáticas (SSG) para las combinaciones más populares
// Utility para convertir provincia a slug URL-friendly
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones
}

export async function generateStaticParams() {
  const supabase = createClientBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Obtener todas las provincias únicas de TODAS las categorías
  const { data: places } = await supabase
    .from('places')
    .select('province')
    .eq('published', true);
  
  if (!places) return [];
  
  // Crear Set de provincias únicas
  const provinces = new Set<string>();
  places.forEach(place => {
    if (place.province) {
      provinces.add(place.province);
    }
  });
  
  // Convertir a array de params con slug correcto
  // Next.js ejecutará esto para CADA categoría generada por el padre
  return Array.from(provinces).map(province => ({
    province: toSlug(province), // Aplicar toSlug para URLs limpias sin tildes
  }));
}

// Página principal
export default async function CategoryProvincePage({ params }: Props) {
  const { category, province } = params;
  
  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const config = CATEGORY_CONFIG[category];
  // Convertir slug de URL a nombre de provincia para buscar en BD
  // BD tiene: "Málaga", "Madrid", "A Coruña"
  // URL tiene: "malaga", "madrid", "a-coruna"
  const provinceName = province
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const supabase = await createClient();
  
  // Obtener total de lugares para mostrar en estadísticas
  const { count: totalPlacesCount } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .eq('province', provinceName)
    .eq('published', true)
    .gte('rating', 4.7);
  
  const totalPlaces = totalPlacesCount || 0;
  
  // Obtener solo Top 10 para mostrar públicamente
  const { data: places, error } = await supabase
    .from('places')
    .select('*')
    .eq('category', category)
    .eq('province', provinceName)
    .eq('published', true)
    .gte('rating', 4.7)
    .order('rating', { ascending: false })
    .order('user_ratings_total', { ascending: false })
    .limit(10); // Solo Top 10 públicos - resto en el mapa
  
  // Debug: Log si no hay lugares
  if (error) {
    console.error('Error fetching places:', error, { category, provinceName });
  }
  
  if (!places || places.length === 0) {
    console.log('No places found for:', { category, province, provinceName, totalPlaces });
    notFound();
  }

  // Calcular estadísticas
  const avgRating = (places.reduce((sum, p) => sum + p.rating, 0) / places.length).toFixed(1);
  const totalReviews = places.reduce((sum, p) => sum + (p.user_ratings_total || 0), 0);

  // Schema.org para SEO
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Mejores ${config.title} en ${provinceName}`,
    "description": `Lista de los mejores ${config.title.toLowerCase()} en ${provinceName} con mínimo 4.7 estrellas`,
    "numberOfItems": places.length,
    "itemListElement": places.slice(0, 10).map((place, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": place.name,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": place.rating,
          "reviewCount": place.user_ratings_total,
          "bestRating": 5
        }
      }
    }))
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://casicinco.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": config.title,
        "item": `https://casicinco.com/${category}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": provinceName
      }
    ]
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className={`bg-gradient-to-br ${config.color} text-white py-16 px-4`}>
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-white/80 mb-6">
              <Link href="/" className="hover:text-white transition flex items-center gap-1">
                <Home className="h-4 w-4" />
                Inicio
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/${category}`} className="hover:text-white transition">
                {config.title}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white font-medium">{provinceName}</span>
            </nav>

            {/* Título principal */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{config.emoji}</span>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {config.title} en {provinceName}
                </h1>
                <p className="text-xl text-white/90">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="text-2xl font-bold">{totalPlaces}</span>
                </div>
                <p className="text-sm text-white/80 mt-1">{config.title} encontrados</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{avgRating}★</span>
                </div>
                <p className="text-sm text-white/80 mt-1">Rating medio</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold">{totalReviews.toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/80 mt-1">Reseñas totales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Descripción SEO */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Top 10: Los mejores {config.title.toLowerCase()} de {provinceName}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              En Casi Cinco solo incluimos {config.title.toLowerCase()} con <strong>mínimo 4.7 estrellas</strong> y 
              cientos de reseñas verificadas. Cada {config.titleSingular.toLowerCase()} en {provinceName} ha sido 
              validado por miles de clientes reales en Google Maps.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Hemos encontrado <strong>{totalPlaces} {config.title.toLowerCase()}</strong> en {provinceName} que 
              cumplen nuestros estrictos criterios de calidad. Aquí mostramos el <strong>Top 10</strong> con la valoración 
              media de <strong>{avgRating} estrellas</strong>. Para ver todos los lugares, usa nuestro mapa interactivo.
            </p>
          </div>

          {/* Grid de lugares */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place, index) => {
              const tier = calculateQualityTier(place.rating, place.user_ratings_total);
              const tierInfo = getTierInfo(tier);
              const photoUrl = getPlacePhotoUrl(place, 0, 600);
              
              return (
                <Link 
                  key={place.id}
                  href={`/${place.category}/${place.province}/${place.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                    {/* Imagen */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt={place.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                          <span className="text-6xl">{tierInfo.icon}</span>
                        </div>
                      )}
                      
                      {/* Badge de posición */}
                      {index < 3 && (
                        <div className="absolute top-3 left-3">
                          <Badge className={`${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            'bg-amber-600'
                          } text-white font-bold`}>
                            #{index + 1}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Tier badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={`bg-gradient-to-r ${tierInfo.color} text-white font-bold`}>
                          {tierInfo.icon} {tierInfo.name}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Contenido */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                        {place.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-gray-900">{place.rating}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          ({place.user_ratings_total?.toLocaleString()} reseñas)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{place.city}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* CTA al Mapa */}
          {totalPlaces > 10 && (
            <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-10 shadow-2xl">
              <div className="text-center max-w-2xl mx-auto">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-3xl font-bold mb-3">
                  ¿Quieres ver los {totalPlaces - 10} {config.title.toLowerCase()} restantes?
                </h3>
                <p className="text-xl text-white/90 mb-6 leading-relaxed">
                  Descubre todos los lugares de {provinceName} en nuestro <strong>mapa interactivo</strong> con 
                  filtros avanzados, planificador de rutas, y mucho más
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/mapa">
                    <button className="bg-white text-blue-600 font-bold px-8 py-4 rounded-lg hover:shadow-2xl hover:scale-105 transition-all text-lg w-full sm:w-auto">
                      Ver todos en el Mapa
                    </button>
                  </Link>
                  <Link href={`/${category}`}>
                    <button className="bg-white/10 backdrop-blur-sm border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white/20 transition-all text-lg w-full sm:w-auto">
                      Explorar otras provincias
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* CTA alternativo si hay menos de 10 */}
          {totalPlaces <= 10 && (
            <div className="mt-12 text-center bg-blue-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¿Buscas más opciones?
              </h3>
              <p className="text-gray-700 mb-4">
                Explora todos nuestros {config.title.toLowerCase()} en España
              </p>
              <Link href={`/${category}`}>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition">
                  Ver todos los {config.title}
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Revalidar cada 24 horas (ISR)
export const revalidate = 86400;

