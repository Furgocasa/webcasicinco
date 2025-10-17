'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Phone, Globe, Navigation, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import type { BlogPostWithPlaces } from '@/types/blog';

// Función para renderizar Markdown básico
const renderMarkdown = (text: string) => {
  if (!text) return '';
  
  return text
    // Negritas: **texto** -> <strong>texto</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Itálica: *texto* -> <em>texto</em>
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Saltos de línea
    .replace(/\n/g, '<br />');
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPostWithPlaces | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setPost(data.post);
        document.title = `${data.post.title} | Casi Cinco`;
      } else {
        router.push('/blog');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      restaurante: '🍽️',
      bar: '🍺',
      cafe: '☕',
      hotel: '🏨'
    };
    return emojis[category] || '📍';
  };

  // Usar la foto del primer lugar si existe
  const featuredImage = post.places && post.places.length > 0 && post.places[0].photo_reference
    ? getPlacePhotoUrl(post.places[0].photo_reference || '', 1200)
    : post.featured_image_url;

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-gray-800 text-white py-12 md:py-20">
          <div className="container mx-auto px-4">
            <Link 
              href="/blog"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Blog</span>
            </Link>

            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{getCategoryEmoji(post.category)}</span>
                <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{post.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  <span>Solo lugares +4.7★</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENIDO */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Imagen destacada */}
              {featuredImage && (
                <div className="mb-12 rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={featuredImage} 
                    alt={post.title}
                    className="w-full h-auto object-cover max-h-[500px]"
                  />
                </div>
              )}

              {/* Intro */}
              <div className="prose prose-lg max-w-none mb-12">
                <div 
                  className="text-gray-700 text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(post.intro_text) }}
                />
              </div>

              {/* TOP 10 */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <span className="text-4xl">🏆</span>
                  Top 10 Lugares
                </h2>

                {post.places && post.places.length > 0 ? (
                  <div className="space-y-6">
                    {post.places.map((place, index) => (
                      <Card key={place.id} className="overflow-hidden hover:shadow-xl transition">
                        <div className="md:flex">
                          {/* Imagen */}
                          {(place.photo_urls || place.photos || place.photo_reference) && (
                            <div className="md:w-1/3 h-48 md:h-auto">
                              <img
                                src={getPlacePhotoUrl({ 
                                  photo_urls: place.photo_urls, 
                                  photos: place.photos || (place.photo_reference ? [place.photo_reference] : null)
                                }, 0, 400) || '/images/placeholder.png'}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Contenido */}
                          <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
                                  <h3 className="text-xl font-bold text-gray-900">{place.name}</h3>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{place.rating}</span>
                                  </div>
                                  {place.review_count && (
                                    <span>({place.review_count} reseñas)</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {place.address && (
                              <div className="flex items-start gap-2 text-gray-600 mb-3">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{place.address}</span>
                              </div>
                            )}

                            {place.ai_description && (
                              <p className="text-gray-700 mb-4 line-clamp-3">{place.ai_description}</p>
                            )}

                            {/* Botones */}
                            <div className="flex flex-wrap gap-2">
                              <Link href={`/${place.category}/${place.province}/${place.slug}`}>
                                <Button variant="outline" size="sm">
                                  Ver Detalles
                                </Button>
                              </Link>
                              {place.google_maps_url && (
                                <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm">
                                    <Navigation className="h-4 w-4 mr-1" />
                                    Cómo llegar
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay lugares disponibles para esta ubicación</p>
                  </div>
                )}
              </div>

              {/* Conclusión */}
              {post.conclusion_text && (
                <div className="prose prose-lg max-w-none mb-12 bg-gray-100 p-6 rounded-xl">
                  <div 
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(post.conclusion_text) }}
                  />
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-8 rounded-2xl text-center">
                <h3 className="text-2xl font-bold mb-3">¿Quieres explorar más opciones?</h3>
                <p className="text-white/90 mb-6">
                  Usa nuestro mapa interactivo o planifica una ruta completa
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href={`/mapa?category=${post.category}&city=${post.location}`}>
                    <Button className="bg-white text-indigo-600 hover:bg-gray-50">
                      <MapPin className="h-4 w-4 mr-2" />
                      Ver en Mapa
                    </Button>
                  </Link>
                  <Link href="/ruta">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      <Navigation className="h-4 w-4 mr-2" />
                      Planificar Ruta
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

