'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Footer from '@/components/layout/Footer';
import type { BlogPost } from '@/types/blog';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    document.title = 'Blog - Guías de los Mejores Lugares | Casi Cinco';
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/blog' 
        : `/api/blog?category=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      restaurante: '🍽️',
      bar: '🍺',
      cafe: '☕',
      hotel: '🏨'
    };
    return emojis[category] || '📍';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      restaurante: 'Restaurantes',
      bar: 'Bares',
      cafe: 'Cafeterías',
      hotel: 'Hoteles'
    };
    return labels[category] || category;
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* HERO */}
        <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden py-16 md:py-24">
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
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('restaurante')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'restaurante'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  🍽️ Restaurantes
                </button>
                <button
                  onClick={() => setFilter('bar')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'bar'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  🍺 Bares
                </button>
                <button
                  onClick={() => setFilter('cafe')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'cafe'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  ☕ Cafeterías
                </button>
                <button
                  onClick={() => setFilter('hotel')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'hotel'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  🏨 Hoteles
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* POSTS GRID */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay posts disponibles</h3>
                <p className="text-gray-600">Vuelve pronto para ver nuevas guías</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <div className="p-6">
                        {/* Categoría badge */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">{getCategoryEmoji(post.category)}</span>
                          <span className="text-sm font-medium text-indigo-600">
                            {getCategoryLabel(post.category)}
                          </span>
                        </div>

                        {/* Título */}
                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-indigo-600 transition">
                          {post.title}
                        </h2>

                        {/* Meta descripción */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {post.meta_description}
                        </p>

                        {/* Ubicación */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <MapPin className="h-4 w-4" />
                          <span>{post.location}</span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(post.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <TrendingUp className="h-3 w-3" />
                            <span>{post.views_count} vistas</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">¿Quieres explorar más?</h2>
            <p className="text-lg mb-8 text-white/90">
              Usa nuestro mapa interactivo para encontrar lugares cerca de ti
            </p>
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              <MapPin className="h-5 w-5" />
              Explorar en el Mapa
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

