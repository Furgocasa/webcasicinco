'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Navigation, Calendar, ArrowLeft, Facebook, Twitter, Linkedin, MessageCircle, Eye, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { getPlaceUrl } from '@/lib/utils/url-helper';
import { FurgocasaBanner } from '@/components/ad/FurgocasaBanner';
import type { BlogPostWithPlaces } from '@/types/blog';
import { isBlogFullHtml, extractBlogHtml, splitBlogArticleHtml } from '@/types/blog';

// Función para renderizar Markdown básico
const renderMarkdown = (text: string) => {
  if (!text) return '';

  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
};

const getCategoryEmoji = (category: string) => {
  const emojis: Record<string, string> = {
    restaurante: '🍽️',
    bar: '🍺',
    hotel: '🏨'
  };
  return emojis[category] || '📍';
};

type BlogPostContentProps = {
  post: BlogPostWithPlaces;
};

export function BlogPostContent({ post }: BlogPostContentProps) {
  const featuredImage = post.first_place_photo || post.featured_image_url;
  const [copied, setCopied] = useState(false);
  const fullHtmlMode = isBlogFullHtml(post.intro_text);

  // Misma estructura visual que posts clásicos (Madrid): intro + banner + Top 10 cards
  const { introHtml, restHtml } = fullHtmlMode
    ? splitBlogArticleHtml(
        extractBlogHtml(post.intro_text),
        (post.places || []).map((p: { name?: string }) => p.name || '')
      )
    : { introHtml: '', restHtml: '' };

  const fullUrl = typeof window !== 'undefined' ? window.location.href : `https://www.casicinco.com/blog/${post.slug}`;

  const shareOnSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(post.title);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando:', err);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <section className="bg-gradient-to-br from-[#002297] via-[#052d5a] to-gray-800 text-white py-12 md:py-20">
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
              <div className="mb-8 rounded-2xl overflow-hidden shadow-xl bg-gray-200">
                <img
                  src={featuredImage || '/images/placeholder.jpg'}
                  alt={post.title}
                  className="w-full h-auto object-cover max-h-[500px]"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.jpg';
                  }}
                />
              </div>

              {/* Estadísticas y Compartir */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">
                      <span className="font-bold text-blue-700">{post.views_count?.toLocaleString() || 0}</span> visitas
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 mr-2 hidden sm:inline">Compartir:</span>

                    <button
                      onClick={() => shareOnSocial('facebook')}
                      className="p-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-blue-600 group"
                      title="Compartir en Facebook"
                    >
                      <Facebook className="h-5 w-5 text-blue-600 group-hover:text-white" />
                    </button>

                    <button
                      onClick={() => shareOnSocial('twitter')}
                      className="p-2 rounded-lg bg-white hover:bg-black hover:text-white transition-all shadow-sm border border-gray-200 hover:border-black group"
                      title="Compartir en Twitter/X"
                    >
                      <Twitter className="h-5 w-5 text-gray-800 group-hover:text-white" />
                    </button>

                    <button
                      onClick={() => shareOnSocial('linkedin')}
                      className="p-2 rounded-lg bg-white hover:bg-blue-700 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-blue-700 group"
                      title="Compartir en LinkedIn"
                    >
                      <Linkedin className="h-5 w-5 text-blue-700 group-hover:text-white" />
                    </button>

                    <button
                      onClick={() => shareOnSocial('whatsapp')}
                      className="p-2 rounded-lg bg-white hover:bg-green-600 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-green-600 group"
                      title="Compartir en WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5 text-green-600 group-hover:text-white" />
                    </button>

                    <button
                      onClick={copyLink}
                      className="p-2 rounded-lg bg-white hover:bg-gray-700 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-gray-700 group"
                      title="Copiar enlace"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-gray-700 group-hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Intro — misma tipografía que posts clásicos */}
              <div className="prose prose-lg max-w-none mb-12">
                {fullHtmlMode ? (
                  <div
                    className="blog-article-html text-gray-700 text-lg leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: introHtml }}
                  />
                ) : (
                  <div
                    className="text-gray-700 text-lg leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(post.intro_text) }}
                  />
                )}
              </div>

              {/* Banner Furgocasa — misma posición que Madrid */}
              <div className="hidden md:block">
                <FurgocasaBanner
                  variant="blog"
                  orientation="horizontal"
                  location={post.location || 'España'}
                  placeName={post.title}
                  autoRotate={true}
                  rotateInterval={10000}
                />
              </div>
              <div className="md:hidden">
                <FurgocasaBanner
                  variant="blog"
                  orientation="vertical"
                  location={post.location || 'España'}
                  placeName={post.title}
                  autoRotate={true}
                  rotateInterval={10000}
                />
              </div>

              {/* TOP 10 — cards con foto (estética clásica) */}
              <div className="mb-12 mt-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <span className="text-4xl">🏆</span>
                  Top 10 Lugares
                </h2>

                {post.places && post.places.length > 0 ? (
                  <div className="space-y-6">
                    {post.places.map((place, index) => {
                      // Solo photo_urls de Supabase: el fallback Google suele fallar en el navegador
                      // (key restringida / refs caducadas) y [] vacío es truthy → imagen rota.
                      const photoUrl = getPlacePhotoUrl(
                        { photo_urls: place.photo_urls, photos: null },
                        0,
                        400
                      );

                      return (
                      <Card key={place.id} className="overflow-hidden hover:shadow-xl transition">
                        <div className="md:flex">
                          <div className="md:w-1/3 h-48 md:h-auto min-h-[12rem] bg-gray-100 flex items-center justify-center overflow-hidden">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={place.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  // Si la URL de Storage falla, ocultar img y dejar el fondo gris
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-4xl" aria-hidden>
                                📍
                              </span>
                            )}
                          </div>

                          <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl font-bold text-[#002297]">#{index + 1}</span>
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

                            <div className="flex flex-wrap gap-2">
                              <Link href={getPlaceUrl(place.category, place.province, place.slug)}>
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
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay lugares disponibles para esta ubicación</p>
                  </div>
                )}
              </div>

              {/* Contenido SEO extra (consejos, FAQ…) sin duplicar fichas de lugares */}
              {fullHtmlMode && restHtml && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Guía y consejos prácticos</h2>
                  <div
                    className="blog-article-html prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: restHtml }}
                  />
                </div>
              )}

              {/* Conclusión legacy */}
              {!fullHtmlMode && post.conclusion_text && (
                <div className="prose prose-lg max-w-none mb-12 bg-gray-100 p-6 rounded-xl">
                  <div
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(post.conclusion_text) }}
                  />
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-r from-[#002297] to-[#052d5a] text-white p-8 rounded-2xl text-center">
                <h3 className="text-2xl font-bold mb-3">¿Quieres explorar más opciones?</h3>
                <p className="text-white/90 mb-6">
                  Usa nuestro mapa interactivo o planifica una ruta completa
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href={`/mapa?category=${post.category}&city=${post.location}`}>
                    <Button className="bg-white text-[#002297] hover:bg-gray-50">
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
