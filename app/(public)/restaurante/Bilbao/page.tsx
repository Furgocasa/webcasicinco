import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Star, MapPin, TrendingUp, ChevronRight, Home, ArrowRight, Users } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';

const CATEGORY = 'restaurante';
const PROVINCE = 'Vizcaya';

// Metadata para SEO
export const metadata: Metadata = {
  title: `Mejores Restaurantes en Vizcaya +4.7★ | Casi Cinco`,
  description: `Descubre los mejores restaurantes de Vizcaya con mínimo 4.7★. Solo restaurantes con validación de miles de comensales. Ordenados por calidad objetiva verificada.`,
  openGraph: {
    title: `Mejores Restaurantes en Vizcaya`,
    description: `Los mejores restaurantes de Vizcaya con mínimo 4.7 estrellas`,
    type: 'website',
  },
};

// Página principal
export default async function RestaurantesMadridPage() {
  const supabase = await createClient();
  
  // Obtener total de lugares para mostrar en estadísticas
  const { count: totalPlacesCount } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true })
    .eq('category', CATEGORY)
    .eq('province', PROVINCE)
    .eq('published', true)
    .gte('rating', 4.7);
  
  const totalPlaces = totalPlacesCount || 0;
  
  // Obtener solo Top 10 para mostrar públicamente
  const { data: places, error } = await supabase
    .from('places')
    .select('*')
    .eq('category', CATEGORY)
    .eq('province', PROVINCE)
    .eq('published', true)
    .gte('rating', 4.7)
    .order('rating', { ascending: false })
    .order('user_ratings_total', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error fetching places:', error);
  }
  
  if (!places || places.length === 0) {
    notFound();
  }

  // Calcular estadísticas
  const avgRating = (places.reduce((sum, p) => sum + p.rating, 0) / places.length).toFixed(1);
  const totalReviews = places.reduce((sum, p) => sum + (p.user_ratings_total || 0), 0);

  // Schema.org para SEO
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Mejores Restaurantes en ${PROVINCE}`,
    "description": `Lista de los mejores restaurantes en ${PROVINCE} con mínimo 4.7 estrellas`,
    "numberOfItems": places.length,
    "itemListElement": places.map((place, index) => ({
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
        "name": "Restaurantes",
        "item": "https://casicinco.com/restaurante"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": PROVINCE
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
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-white/80 mb-6">
              <Link href="/" className="hover:text-white transition flex items-center gap-1">
                <Home className="h-4 w-4" />
                Inicio
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/restaurante" className="hover:text-white transition">
                Restaurantes
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white font-medium">{PROVINCE}</span>
            </nav>

            {/* Título principal */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">🍽️</span>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  Restaurantes en {PROVINCE}
                </h1>
                <p className="text-xl text-white/90">
                  Solo restaurantes con mínimo 4.7★ y validación de miles de comensales
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
                <p className="text-sm text-white/80 mt-1">Restaurantes encontrados</p>
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
                  <Users className="h-5 w-5" />
                  <span className="text-2xl font-bold">{totalReviews.toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/80 mt-1">Reseñas totales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de lugares */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid gap-6">
            {places.map((place, index) => {
              const photoUrl = getPlacePhotoUrl(place, 0, 800);
              const tier = calculateQualityTier(place.rating, place.user_ratings_total || 0);
              const tierInfo = getTierInfo(tier);

              return (
                <Card key={place.id} className="overflow-hidden hover:shadow-xl transition">
                  <div className="grid md:grid-cols-3 gap-0">
                    {/* Foto */}
                    <div className="relative md:col-span-1 h-64">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                          <span className="text-6xl">🍽️</span>
                        </div>
                      )}
                      
                      {/* Badge de ranking */}
                      <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 font-bold text-gray-900">
                        #{index + 1}
                      </div>

                      {/* Badge de tier */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${tierInfo.color}`}>
                        {tierInfo.icon} {tierInfo.name}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="md:col-span-2 p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{place.name}</h3>
                      
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{place.city}, {place.province}</span>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 bg-yellow-400 px-4 py-2 rounded-full">
                          <Star className="h-5 w-5 fill-blue-900 text-blue-900" />
                          <span className="font-bold text-blue-900">{place.rating}</span>
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
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {place.ai_description.substring(0, 200)}...
                        </p>
                      )}

                      <Link href={`/restaurante/${place.province}/${place.slug}`}>
                        <Button className="bg-blue-700 text-white hover:bg-blue-800">
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

          {/* CTA para ver más */}
          <div className="mt-12 text-center">
            <Card className="p-8 bg-blue-700 text-white">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-2xl font-bold mb-4">¿Quieres ver más restaurantes en {PROVINCE}?</h3>
              <p className="text-white/90 mb-6">
                Explora todos los {totalPlaces} restaurantes 4.7★+ de {PROVINCE} en nuestro mapa interactivo
              </p>
              <Link href={`/mapa?category=restaurante&province=${PROVINCE}`}>
                <Button className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-bold px-8">
                  Explorar Mapa Completo
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

// ISR: Revalidar cada 24 horas
export const revalidate = 86400;

