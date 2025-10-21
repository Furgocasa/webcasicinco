'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Footer from '@/components/layout/Footer';
import type { BlogPost } from '@/types/blog';

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
};

export function BlogListContent({ initialPosts }: BlogListContentProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [filter, setFilter] = useState<string>('all');

  const handleFilterChange = async (newFilter: string) => {
    setFilter(newFilter);
    
    // Filtrar en cliente para mejor UX (posts ya están cargados)
    if (newFilter === 'all') {
      setPosts(initialPosts);
    } else {
      setPosts(initialPosts.filter(p => p.category === newFilter));
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* HERO */}
        <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-gray-800 text-white overflow-hidden py-16 md:py-24">
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

              {/* Filtros */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleFilterChange('restaurante')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'restaurante'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  🍽️ Restaurantes
                </button>
                <button
                  onClick={() => handleFilterChange('hotel')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'hotel'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  🏨 Hoteles
                </button>
                <button
                  onClick={() => handleFilterChange('bar')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'bar'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  🍺 Bares
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* POSTS */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {posts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {posts.map((post) => {
                  // Usar la foto del primer lugar (URL directa de Supabase Storage)
                  const featuredImage = post.first_place_photo || post.featured_image_url || '/images/placeholder.jpg';

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
                              // Fallback si la imagen no carga
                              e.currentTarget.src = '/images/placeholder.jpg';
                            }}
                          />
                          <div className="absolute top-3 left-3">
                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium">
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

                          <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-indigo-600 transition">
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
            ) : (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay artículos disponibles
                </h3>
                <p className="text-gray-600">
                  Estamos trabajando en nuevas guías. Vuelve pronto.
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

