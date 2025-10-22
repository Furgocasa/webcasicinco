import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createClientBrowser } from '@supabase/supabase-js';
import Link from 'next/link';
import { Star, MapPin, TrendingUp, ArrowRight, Users } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';

type Props = {
  params: { category: string }
}

const VALID_CATEGORIES = ['restaurante', 'bar', 'cafe', 'hotel'];

const CATEGORY_CONFIG: Record<string, {
  title: string;
  emoji: string;
  description: string;
  color: string;
  colorLight: string;
}> = {
  restaurante: {
    title: 'Restaurantes',
    emoji: '🍽️',
    description: 'Solo restaurantes con mínimo 4.7★ y validación de miles de comensales',
    color: '#002196',
    colorLight: '#ffd935',
  },
  bar: {
    title: 'Bares',
    emoji: '🍺',
    description: 'Los mejores bares con ambiente increíble y valoraciones excepcionales',
    color: '#b45309',
    colorLight: '#fbbf24',
  },
  cafe: {
    title: 'Cafeterías',
    emoji: '☕',
    description: 'Cafeterías de especialidad con los mejores cafés y atención premium',
    color: '#92400e',
    colorLight: '#fcd34d',
  },
  hotel: {
    title: 'Hoteles',
    emoji: '🏨',
    description: 'Hoteles excepcionales para una estancia inolvidable',
    color: '#1e40af',
    colorLight: '#93c5fd',
  },
};

// 1. Metadata dinámica para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = params.category;
  
  if (!VALID_CATEGORIES.includes(category)) {
    return {
      title: 'Categoría no encontrada | Casi Cinco',
    };
  }

  const config = CATEGORY_CONFIG[category];
  
  return {
    title: `Top 10 ${config.title} +4.7★ en España | Casi Cinco`,
    description: `Descubre los mejores ${config.title.toLowerCase()} de España. ${config.description}. Ordenados por calidad objetiva.`,
    openGraph: {
      title: `Top 10 ${config.title} en España`,
      description: config.description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Top 10 ${config.title} en España`,
      description: config.description,
    },
  };
}

// 2. Pre-generar rutas estáticas (SSG)
export async function generateStaticParams() {
  // Generar para las 4 categorías válidas
  return VALID_CATEGORIES.map((category) => ({
    category,
  }));
}

// 3. Componente principal (Server Component)
export default async function CategoryPage({ params }: Props) {
  const { category } = params;
  
  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const config = CATEGORY_CONFIG[category];
  const supabase = await createClient();

  // Obtener top 10 lugares de esta categoría
  const { data: places, error } = await supabase
    .from('places')
    .select('*')
    .eq('category', category)
    .eq('published', true)
    .order('rating', { ascending: false })
    .order('user_ratings_total', { ascending: false })
    .limit(10);

  if (error || !places) {
    console.error('Error fetching places:', error);
    return notFound();
  }

  // Obtener ciudades principales con lugares en esta categoría
  const { data: topCities } = await supabase
    .from('places')
    .select('city, province')
    .eq('category', category)
    .eq('published', true)
    .gte('rating', 4.7)
    .order('rating', { ascending: false })
    .limit(50);

  // Contar lugares por ciudad
  const cityCount: Record<string, number> = {};
  topCities?.forEach((place) => {
    const key = `${place.city}|${place.province}`;
    cityCount[key] = (cityCount[key] || 0) + 1;
  });

  // Top 12 ciudades con más lugares
  const topCitiesFormatted = Object.entries(cityCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([key, count]) => {
      const [city, province] = key.split('|');
      return { city, province, count };
    });

  // Schema.org - ItemList
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Top 10 ${config.title} en España`,
    "description": config.description,
    "numberOfItems": places.length,
    "itemListElement": places.map((place, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": config.title === 'Restaurantes' ? 'Restaurant' :
                config.title === 'Hoteles' ? 'Hotel' :
                config.title === 'Bares' ? 'BarOrPub' :
                config.title === 'Cafeterías' ? 'CafeOrCoffeeShop' : 'LocalBusiness',
        "name": place.name,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": place.city,
          "addressRegion": place.province,
          "addressCountry": "ES"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": place.rating,
          "reviewCount": place.review_count
        }
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen bg-gray-50">
        {/* HERO */}
        <section className="relative text-white overflow-hidden py-24 md:py-32" style={{ backgroundColor: config.color }}>
          <div className="absolute inset-0 bg-black opacity-10"></div>
          
          <div className="relative container mx-auto px-4 z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Star className="h-4 w-4 fill-current" style={{ color: config.colorLight }} />
                <span className="text-sm font-medium">Top 10 {config.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Los Mejores
                <br />
                <span style={{ color: config.colorLight }}>
                  {config.title} de España
                </span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed mb-8">
                {config.description}.
                <br />Ordenados por nuestro algoritmo de calidad objetiva.
              </p>

              <div className="relative z-10">
                <Link href={`/mapa?category=${category}`}>
                  <Button className="font-bold px-8 py-6 text-lg" style={{ backgroundColor: config.colorLight, color: config.color }}>
                    Ver Todos en el Mapa
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
            </svg>
          </div>
        </section>

        {/* TOP 10 LIST */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="space-y-6">
                {places.map((place, index) => {
                  const photoUrl = getPlacePhotoUrl(place, 0, 800);
                  const isTopThree = index < 3;

                  return (
                    <Card 
                      key={place.id}
                      className={`overflow-hidden hover:shadow-2xl transition-all ${
                        isTopThree ? 'border-2' : ''
                      }`}
                      style={{ borderColor: isTopThree ? config.colorLight : undefined }}
                    >
                      <div className="grid md:grid-cols-3 gap-0">
                        {/* Foto */}
                        <div className="relative md:col-span-1 h-64 md:h-80">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={place.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${config.color}, ${config.colorLight})` }}>
                              <span className="text-6xl">{config.emoji}</span>
                            </div>
                          )}
                          {/* Ranking Badge */}
                          <div className={`absolute top-4 left-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-800' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-white text-gray-900'
                          }`}>
                            #{index + 1}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="md:col-span-2 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">{place.name}</h3>
                              <div className="flex items-center gap-2 text-gray-600 mb-3">
                                <MapPin className="h-4 w-4" />
                                <span>{place.city}, {place.province}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: config.colorLight }}>
                              <Star className="h-5 w-5 fill-current" style={{ color: config.color }} />
                              <span className="font-bold" style={{ color: config.color }}>{place.rating}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-5 w-5" />
                              <span className="font-semibold">{place.user_ratings_total?.toLocaleString()} reseñas</span>
                            </div>
                            {place.price_level && (
                              <span className="text-gray-600 font-semibold">
                                {'€'.repeat(place.price_level)}
                              </span>
                            )}
                          </div>

                          {place.ai_description && (
                            <p className="text-gray-700 mb-4 line-clamp-3">
                              {place.ai_description.substring(0, 200)}...
                            </p>
                          )}

                          <Link href={`/${category}/${place.province}/${place.slug}`}>
                            <Button style={{ backgroundColor: config.color }} className="text-white">
                              Ver Detalles
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* CTA para explorar por ciudad */}
              {topCitiesFormatted.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Explora {config.title} por Ciudad
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {topCitiesFormatted.map(({ city, province, count }) => (
                      <Link 
                        key={`${city}-${province}`}
                        href={`/${category}/${city.toLowerCase().replace(/\s+/g, '-')}`}
                        className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-500 transition text-center"
                      >
                        <p className="font-bold text-gray-900">{city}</p>
                        <p className="text-sm text-gray-600">{count} lugares</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA para ver más */}
              <div className="mt-12 text-center">
                <Card className="p-8 text-white" style={{ backgroundColor: config.color }}>
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" style={{ color: config.colorLight }} />
                  <h3 className="text-2xl font-bold mb-4">¿Quieres ver más {config.title.toLowerCase()} excepcionales?</h3>
                  <p className="text-white/90 mb-6">
                    Explora todos los {config.title.toLowerCase()} 4.7★+ de España en nuestro mapa interactivo
                  </p>
                  <Link href={`/mapa?category=${category}`}>
                    <Button className="font-bold px-8" style={{ backgroundColor: config.colorLight, color: config.color }}>
                      Explorar Mapa Completo
                    </Button>
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

// ISR: Revalidar cada 24 horas
export const revalidate = 86400;

