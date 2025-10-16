'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, TrendingUp, Award, Users, ArrowRight } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';

export default function HotelPage() {
  const [topPlaces, setTopPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopHotels = async () => {
      try {
        const response = await fetch('/api/places?category=hotel&sort=rating&limit=10');
        const data = await response.json();
        if (data.success && data.places) {
          setTopPlaces(data.places);
        }
      } catch (error) {
        console.error('Error cargando hoteles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopHotels();
  }, []);

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* HERO */}
        <section className="relative bg-[#002196] text-white overflow-hidden py-24 md:py-32">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          
          <div className="relative container mx-auto px-4 z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Star className="h-4 w-4 fill-[#ffd935] text-[#ffd935]" />
                <span className="text-sm font-medium">Top 10 Hoteles</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Los Mejores
                <br />
                <span className="text-[#ffd935]">
                  Hoteles de España
                </span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed mb-8">
                Solo hoteles con <strong>mínimo 4.7★</strong> y validación de miles de huéspedes.
                <br />Ordenados por nuestro algoritmo de calidad objetiva.
              </p>

              <div className="relative z-10">
                <Link href="/mapa?category=hotel">
                  <Button className="bg-[#ffd935] text-[#002196] hover:bg-[#ffd935]/90 font-bold px-8 py-6 text-lg">
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
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="text-lg text-gray-600">Cargando los mejores hoteles...</div>
                </div>
              ) : topPlaces.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-600">No hay hoteles disponibles en este momento.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {topPlaces.map((place, index) => {
                    const photoUrl = getPlacePhotoUrl(place, 0, 800);
                    const isTopThree = index < 3;

                    return (
                      <Card 
                        key={place.id}
                        className={`overflow-hidden hover:shadow-2xl transition-all ${
                          isTopThree ? 'border-2 border-[#ffd935]' : ''
                        }`}
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
                              <div className="w-full h-full bg-gradient-to-br from-[#002196] to-[#0039e6] flex items-center justify-center">
                                <span className="text-6xl">🏨</span>
                              </div>
                            )}
                            {/* Ranking Badge */}
                            <div className={`absolute top-4 left-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-gray-300 text-gray-800' :
                              index === 2 ? 'bg-orange-400 text-orange-900' :
                              'bg-[#002196] text-white'
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
                              <div className="flex items-center gap-2 bg-[#ffd935] px-4 py-2 rounded-full">
                                <Star className="h-5 w-5 fill-[#002196] text-[#002196]" />
                                <span className="font-bold text-[#002196]">{place.rating}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users className="h-5 w-5" />
                                <span className="font-semibold">{place.review_count?.toLocaleString()} reseñas</span>
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

                            <Link href={`/hotel/${place.province}/${place.slug}`}>
                              <Button className="bg-[#002196] text-white hover:bg-[#001570]">
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
              )}

              {/* CTA para ver más */}
              <div className="mt-12 text-center">
                <Card className="p-8 bg-[#002196] text-white">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-[#ffd935]" />
                  <h3 className="text-2xl font-bold mb-4">¿Quieres ver más hoteles excepcionales?</h3>
                  <p className="text-white/90 mb-6">
                    Explora todos los hoteles 4.7★+ de España en nuestro mapa interactivo
                  </p>
                  <Link href="/mapa?category=hotel">
                    <Button className="bg-[#ffd935] text-[#002196] hover:bg-[#ffd935]/90 font-bold px-8">
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

