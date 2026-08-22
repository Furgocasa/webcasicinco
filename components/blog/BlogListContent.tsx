'use client';

import Link from 'next/link';
import { BookOpen, MapPin, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Footer from '@/components/layout/Footer';
import type { BlogPost } from '@/types/blog';
import { BLOG_COVER_FALLBACK, isBrokenFeaturedImage } from '@/lib/utils/blog-places';

const getCategoryEmoji = (category: string) => {
  const emojis: Record<string, string> = {
    restaurante: '🍽️',
    bar: '🍺',
    hotel: '🏨'
  };
  return emojis[category] || '📍';
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    restaurante: 'Restaurantes',
    bar: 'Bares',
    hotel: 'Hoteles'
  };
  return labels[category] || category;
};

// Ya no necesitamos buildPhotoUrl porque usamos URLs directas de Supabase

type BlogListContentProps = {
  initialPosts: BlogPost[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  postsPerPage: number;
  currentCategory: string;
};

function buildBlogHref(page: number, category: string, hash?: string): string {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('categoria', category);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  const path = qs ? `/blog?${qs}` : '/blog';
  return hash ? `${path}#${hash}` : path;
}

function getPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);

  return pages;
}

export function BlogListContent({
  initialPosts,
  currentPage,
  totalPages,
  totalCount,
  postsPerPage,
  currentCategory,
}: BlogListContentProps) {
  const posts = initialPosts;
  const filter = currentCategory;
  const fromItem = totalCount === 0 ? 0 : (currentPage - 1) * postsPerPage + 1;
  const toItem = Math.min(currentPage * postsPerPage, totalCount);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const filterClass = (value: string) =>
    `px-4 py-2 rounded-lg font-medium transition ${
      filter === value
        ? 'bg-white text-[#002297]'
        : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
    }`;

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* HERO */}
        <section className="relative bg-gradient-to-br from-[#002297] via-[#052d5a] to-gray-800 text-white overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          
          <div className="relative container mx-auto px-4 z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Blog de Viajes</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Guías de los Mejores Lugares
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Descubre los lugares top de cada ciudad. Solo establecimientos con +4.7 estrellas.
              </p>

              {/* Filtros (reinician a la página 1) */}
              <div className="flex flex-wrap justify-center gap-3">
                <Link href={buildBlogHref(1, 'all')} className={filterClass('all')}>
                  Todos
                </Link>
                <Link href={buildBlogHref(1, 'restaurante')} className={filterClass('restaurante')}>
                  🍽️ Restaurantes
                </Link>
                <Link href={buildBlogHref(1, 'hotel')} className={filterClass('hotel')}>
                  🏨 Hoteles
                </Link>
                <Link href={buildBlogHref(1, 'bar')} className={filterClass('bar')}>
                  🍺 Bares
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* POSTS */}
        <section id="articulos" className="py-16 scroll-mt-4">
          <div className="container mx-auto px-4">
            {posts.length > 0 ? (
              <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {posts.map((post) => {
                  // Foto del Top 1; ignorar Unsplash Source (API muerta)
                  const raw = post.first_place_photo || post.featured_image_url;
                  const featuredImage = isBrokenFeaturedImage(raw)
                    ? BLOG_COVER_FALLBACK
                    : (raw as string);

                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col cursor-pointer">
                        {/* Imagen */}
                        <div className="relative h-48 overflow-hidden bg-gray-200">
                          <img
                            src={featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              // Fallback corporativo si la imagen no carga
                              e.currentTarget.src = BLOG_COVER_FALLBACK;
                            }}
                          />
                          <div className="absolute top-3 left-3">
                            <span className="bg-[#002297] text-white px-3 py-1 rounded-full text-xs font-medium">
                              {getCategoryLabel(post.category)}
                            </span>
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{post.location}</span>
                            <span className="mx-2">•</span>
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(post.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>

                          <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-[#002297] transition">
                            {post.title}
                          </h2>

                          <p className="text-gray-600 text-sm line-clamp-3 flex-1 mb-4">
                            {post.meta_description || post.intro_text?.substring(0, 150)}...
                          </p>

                          {post.views_count > 0 && (
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                              <TrendingUp className="h-3 w-3" />
                              <span>{post.views_count} vistas</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-12 max-w-7xl mx-auto flex flex-col items-center gap-4"
                  aria-label="Paginación del blog"
                >
                  <p className="text-sm text-gray-600">
                    Mostrando {fromItem}–{toItem} de {totalCount} artículos
                    {totalPages > 1 && (
                      <span className="text-gray-400"> · Página {currentPage} de {totalPages}</span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {currentPage > 1 ? (
                      <Link
                        href={buildBlogHref(currentPage - 1, filter, 'articulos')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#002297] hover:text-[#002297] transition"
                        rel="prev"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed">
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </span>
                    )}

                    <div className="hidden sm:flex items-center gap-1">
                      {pageNumbers.map((item, index) =>
                        item === 'ellipsis' ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-gray-400"
                            aria-hidden="true"
                          >
                            …
                          </span>
                        ) : item === currentPage ? (
                          <span
                            key={item}
                            aria-current="page"
                            className="min-w-[2.5rem] h-10 px-3 inline-flex items-center justify-center rounded-lg bg-[#002297] text-white text-sm font-semibold"
                          >
                            {item}
                          </span>
                        ) : (
                          <Link
                            key={item}
                            href={buildBlogHref(item, filter, 'articulos')}
                            className="min-w-[2.5rem] h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#002297] hover:text-[#002297] transition"
                          >
                            {item}
                          </Link>
                        )
                      )}
                    </div>

                    <span className="sm:hidden text-sm font-medium text-gray-600 px-2">
                      {currentPage} / {totalPages}
                    </span>

                    {currentPage < totalPages ? (
                      <Link
                        href={buildBlogHref(currentPage + 1, filter, 'articulos')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#002297] hover:text-[#002297] transition"
                        rel="next"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed">
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </nav>
              )}
              </>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay artículos disponibles
                </h3>
                <p className="text-gray-600">
                  {filter !== 'all' ? (
                    <>
                      No hay guías en esta categoría.{' '}
                      <Link href="/blog" className="text-[#002297] font-medium hover:underline">
                        Ver todos los artículos
                      </Link>
                    </>
                  ) : (
                    'Estamos trabajando en nuevas guías. Vuelve pronto.'
                  )}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

