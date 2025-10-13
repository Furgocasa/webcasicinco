'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2,
  Clock,
  Plus,
  Star,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Award,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';

interface DashboardStats {
  totalPlaces: number;
  published: number;
  pending: number;
  provinces: number;
  communities: number;
  cities: number;
  avgRating: number;
  totalCost: number;
  withAI: number;
  withoutAI: number;
  totalReviews: number;
  avgReviews: number;
}

interface TierStats {
  tier: string;
  name: string;
  count: number;
  percentage: number;
  icon: string;
  color: string;
}

interface ProvinceStats {
  province: string;
  count: number;
  avgRating: number;
  published: number;
}

interface CategoryStats {
  category: string;
  name: string;
  count: number;
  percentage: number;
  avgRating: number;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPlaces: 0,
    published: 0,
    pending: 0,
    provinces: 0,
    communities: 0,
    cities: 0,
    avgRating: 0,
    totalCost: 0,
    withAI: 0,
    withoutAI: 0,
    totalReviews: 0,
    avgReviews: 0,
  });

  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);
  const [provinceStats, setProvinceStats] = useState<ProvinceStats[]>([]);
  const [cityStats, setCityStats] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any[]>([]);
  const [topPlaces, setTopPlaces] = useState<any[]>([]);
  const [allPlaces, setAllPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros dinámicos para tops
  const [selectedCategoryForTop, setSelectedCategoryForTop] = useState<string>('all');

  // Calcular top 10 lugares filtrados por categoría dinámicamente
  const filteredTopPlaces = useMemo(() => {
    let placesToSort = allPlaces;
    
    if (selectedCategoryForTop !== 'all') {
      placesToSort = allPlaces.filter((p: any) => p.category === selectedCategoryForTop);
    }
    
    return [...placesToSort]
      .sort((a: any, b: any) => {
        if (b.review_count !== a.review_count) {
          return b.review_count - a.review_count;
        }
        return b.rating - a.rating;
      })
      .slice(0, 10);
  }, [allPlaces, selectedCategoryForTop]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Cargando datos del dashboard...');
      
      // Cargar TODOS los lugares en lotes progresivos
      let allPlaces: any[] = [];
      let page = 1;
      const maxPages = 40; // Máximo 4000 lugares (40 páginas × 100)
      
      while (page <= maxPages) {
        console.log(`📥 Solicitando página ${page}...`);
        const placesResponse = await fetch(`/api/admin/places?page=${page}&limit=100`);
        
        console.log(`   Status: ${placesResponse.status} ${placesResponse.statusText}`);
        
        if (!placesResponse.ok) {
          const errorText = await placesResponse.text();
          console.error(`❌ Error HTTP ${placesResponse.status} en página ${page}:`, errorText);
          break;
        }
        
        const placesData = await placesResponse.json();
        console.log(`   Respuesta:`, {
          success: placesData.success,
          places: placesData.places?.length || 0,
          total: placesData.total,
        });
        
        if (placesData.success && placesData.places && placesData.places.length > 0) {
          allPlaces = [...allPlaces, ...placesData.places];
          console.log(`📊 Dashboard: Página ${page} - Total acumulado: ${allPlaces.length}`);
          page++;
          
          // Si recibimos menos de 100, no hay más páginas
          if (placesData.places.length < 100) {
            console.log(`ℹ️  Última página alcanzada (${placesData.places.length} lugares)`);
            break;
          }
        } else {
          console.log(`⚠️  Sin más datos en página ${page}`);
          break;
        }
      }
      
      console.log(`✅ Dashboard: Cargados ${allPlaces.length} lugares total`);
      
      if (allPlaces.length > 0) {
        const places = allPlaces;
        
        // === ESTADÍSTICAS GENERALES ===
        const published = places.filter((p: any) => p.published).length;
        const pending = places.filter((p: any) => !p.published).length;
        const uniqueProvinces = new Set(places.map((p: any) => p.province)).size;
        const uniqueCommunities = new Set(places.map((p: any) => p.region)).size;
        const uniqueCities = new Set(places.map((p: any) => p.city)).size;
        const avgRating = places.length > 0 
          ? places.reduce((sum: number, p: any) => sum + p.rating, 0) / places.length 
          : 0;
        const withAI = places.filter((p: any) => p.ai_description).length;
        const withoutAI = places.filter((p: any) => !p.ai_description).length;
        const totalReviews = places.reduce((sum: number, p: any) => sum + (p.review_count || 0), 0);
        const avgReviews = places.length > 0 ? Math.round(totalReviews / places.length) : 0;

        setStats({
          totalPlaces: places.length,
          published,
          pending,
          provinces: uniqueProvinces,
          communities: uniqueCommunities,
          cities: uniqueCities,
          avgRating: Math.round(avgRating * 100) / 100,
          totalCost: 0,
          withAI,
          withoutAI,
          totalReviews,
          avgReviews,
        });

        // === DISTRIBUCIÓN POR CATEGORÍA ===
        const categoryMap: Record<string, {count: number, totalRating: number}> = {};
        places.forEach((p: any) => {
          if (!categoryMap[p.category]) {
            categoryMap[p.category] = { count: 0, totalRating: 0 };
          }
          categoryMap[p.category].count++;
          categoryMap[p.category].totalRating += p.rating;
        });

        const categoryNames: Record<string, string> = {
          restaurante: 'Restaurantes',
          hotel: 'Hoteles',
          spa: 'Spas',
          bar: 'Bares',
          experiencia: 'Experiencias',
          monumento: 'Monumentos',
          cafe: 'Cafeterías',
        };

        const catStats: CategoryStats[] = Object.entries(categoryMap).map(([cat, data]) => ({
          category: cat,
          name: categoryNames[cat] || cat,
          count: data.count,
          percentage: Math.round((data.count / places.length) * 100),
          avgRating: Math.round((data.totalRating / data.count) * 100) / 100,
          color: cat === 'restaurante' ? 'from-orange-400 to-orange-600' :
                 cat === 'hotel' ? 'from-blue-400 to-blue-600' :
                 cat === 'spa' ? 'from-purple-400 to-purple-600' :
                 cat === 'bar' ? 'from-amber-400 to-amber-600' :
                 cat === 'cafe' ? 'from-yellow-400 to-yellow-600' :
                 cat === 'experiencia' ? 'from-green-400 to-green-600' :
                 'from-gray-400 to-gray-600'
        })).sort((a, b) => b.count - a.count);

        setCategoryStats(catStats);

        // === DISTRIBUCIÓN POR TIERS ===
        const tierMap: Record<string, number> = {};
        places.forEach((p: any) => {
          const tier = calculateQualityTier(p.rating, p.review_count || 0);
          tierMap[tier] = (tierMap[tier] || 0) + 1;
        });

        const tStats: TierStats[] = Object.entries(tierMap).map(([tier, count]) => {
          const tierInfo = getTierInfo(tier as any);
          return {
            tier,
            name: tierInfo.name,
            count,
            percentage: Math.round((count / places.length) * 100),
            icon: tierInfo.icon,
            color: tierInfo.color,
          };
        }).sort((a, b) => b.count - a.count);

        setTierStats(tStats);

        // === TOP 10 PROVINCIAS ===
        const provinceMap: Record<string, {count: number, totalRating: number, published: number}> = {};
        places.forEach((p: any) => {
          if (!provinceMap[p.province]) {
            provinceMap[p.province] = { count: 0, totalRating: 0, published: 0 };
          }
          provinceMap[p.province].count++;
          provinceMap[p.province].totalRating += p.rating;
          if (p.published) provinceMap[p.province].published++;
        });

        const pStats: ProvinceStats[] = Object.entries(provinceMap).map(([prov, data]) => ({
          province: prov,
          count: data.count,
          avgRating: Math.round((data.totalRating / data.count) * 100) / 100,
          published: data.published,
        })).sort((a, b) => b.count - a.count).slice(0, 10);

        setProvinceStats(pStats);

        // === TOP 10 CIUDADES ===
        const cityMap: Record<string, {count: number, avgRating: number, published: number}> = {};
        places.forEach((p: any) => {
          if (!cityMap[p.city]) {
            cityMap[p.city] = { count: 0, avgRating: 0, published: 0 };
          }
          cityMap[p.city].count++;
          cityMap[p.city].avgRating += p.rating;
          if (p.published) cityMap[p.city].published++;
        });

        const cStats = Object.entries(cityMap).map(([city, data]) => ({
          city,
          count: data.count,
          avgRating: Math.round((data.avgRating / data.count) * 100) / 100,
          published: data.published,
        })).sort((a, b) => b.count - a.count).slice(0, 10);

        setCityStats(cStats);

        // === TOP 10 COMUNIDADES AUTÓNOMAS ===
        const communityMap: Record<string, {count: number, avgRating: number, published: number}> = {};
        places.forEach((p: any) => {
          if (!communityMap[p.region]) {
            communityMap[p.region] = { count: 0, avgRating: 0, published: 0 };
          }
          communityMap[p.region].count++;
          communityMap[p.region].avgRating += p.rating;
          if (p.published) communityMap[p.region].published++;
        });

        const comStats = Object.entries(communityMap).map(([community, data]) => ({
          community,
          count: data.count,
          avgRating: Math.round((data.avgRating / data.count) * 100) / 100,
          published: data.published,
        })).sort((a, b) => b.count - a.count).slice(0, 10);

        setCommunityStats(comStats);

        // === TOP 10 LUGARES (TODOS) ===
        const top = [...places]
          .sort((a: any, b: any) => {
            // Ordenar por review_count primero, luego rating
            if (b.review_count !== a.review_count) {
              return b.review_count - a.review_count;
            }
            return b.rating - a.rating;
          })
          .slice(0, 10);

        setTopPlaces(top);

        // Guardar todos los lugares para filtros dinámicos
        setAllPlaces(places);
        console.log('✅ Datos cargados:', {
          totalPlaces: places.length,
          categories: Array.from(new Set(places.map((p: any) => p.category))),
        });
      }

      // Cargar trabajos recientes
      const jobsResponse = await fetch('/api/admin/jobs');
      const jobsData = await jobsResponse.json();
      
      if (jobsData.success) {
        setRecentJobs(jobsData.jobs?.slice(0, 5) || []);
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            📊 Dashboard Analytics
            <Badge className="hidden md:inline-flex bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs">
              Power BI
            </Badge>
          </h1>
          <p className="mt-1 text-sm md:text-base text-gray-600">
            {stats.totalPlaces === 0 
              ? "Empieza indexando lugares"
              : `${stats.totalPlaces.toLocaleString()} lugares`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm" className="flex-1 md:flex-none">
            🔄 <span className="hidden md:inline ml-1">Actualizar</span>
          </Button>
          <Link href="/admin/indexar" className="flex-1 md:flex-none">
            <Button size="sm" className="w-full md:w-auto">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nueva indexación</span>
              <span className="md:hidden">Nuevo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {stats.totalPlaces === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Bienvenido a Casi Cinco!
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Tu plataforma está lista para empezar. Indexa lugares de calidad para crear la mejor base de datos de España.
          </p>
          <Link href="/admin/indexar">
            <Button size="lg" className="text-lg px-8 py-3">
              <Plus className="mr-2 h-6 w-6" />
              Empezar a Indexar
            </Button>
          </Link>
        </div>
      )}

      {/* KPIs Grid - 6 tarjetas principales */}
      {stats.totalPlaces > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:overflow-x-visible scrollbar-hide">
          {/* Total Lugares */}
          <Card className="min-w-[280px] md:min-w-0 snap-start bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-indigo-100">Total Lugares</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.totalPlaces.toLocaleString()}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          {/* Publicados */}
          <Card className="min-w-[280px] md:min-w-0 snap-start bg-gradient-to-br from-green-500 to-green-600 text-white flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-100">Publicados</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.published}
                  </p>
                  <p className="text-[10px] text-green-100 mt-0.5">
                    {Math.round((stats.published / stats.totalPlaces) * 100)}%
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Pendientes */}
          <Card className="min-w-[280px] md:min-w-0 snap-start bg-gradient-to-br from-orange-500 to-orange-600 text-white flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-100">Borradores</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.pending}
                  </p>
                  <p className="text-[10px] text-orange-100 mt-0.5">
                    {Math.round((stats.pending / stats.totalPlaces) * 100)}%
                  </p>
                </div>
                <EyeOff className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          {/* Rating Promedio */}
          <Card className="min-w-[280px] md:min-w-0 snap-start bg-gradient-to-br from-yellow-500 to-yellow-600 text-white flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-100">Rating Promedio</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.avgRating.toFixed(2)}★
                  </p>
                  <p className="text-[10px] text-yellow-100 mt-0.5">
                    {stats.avgReviews.toLocaleString()} reseñas/lugar
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          {/* Con IA */}
          <Card className="min-w-[280px] md:min-w-0 snap-start bg-gradient-to-br from-purple-500 to-purple-600 text-white flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-100">Con IA</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.withAI}
                  </p>
                  <p className="text-[10px] text-purple-100 mt-0.5">
                    {Math.round((stats.withAI / stats.totalPlaces) * 100)}% enriquecidos
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          {/* Cobertura Geográfica */}
          <Card className="min-w-[280px] md:min-w-0 snap-start bg-gradient-to-br from-cyan-500 to-cyan-600 text-white flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-cyan-100">Cobertura</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.provinces}
                  </p>
                  <p className="text-[10px] text-cyan-100 mt-0.5">
                    {stats.communities} CC.AA · {stats.cities} ciudades
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-cyan-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid de 3 columnas para gráficos principales - Mobile: Stack vertical */}
      {stats.totalPlaces > 0 && (
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          {/* DISTRIBUCIÓN POR TIERS */}
          <Card className="border-2 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💎 Distribución por Tiers
              </CardTitle>
              <CardDescription>Calidad de los lugares según rating y reseñas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tierStats.map((tier) => (
                  <div key={tier.tier} className="relative">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tier.icon}</span>
                        <span className="font-semibold text-gray-900">{tier.name}</span>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {tier.count} ({tier.percentage}%)
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full bg-gradient-to-r ${tier.color} transition-all duration-500`}
                        style={{ width: `${tier.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DISTRIBUCIÓN POR CATEGORÍAS */}
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏷️ Distribución por Categorías
              </CardTitle>
              <CardDescription>Tipos de lugares en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryStats.map((cat) => (
                  <div key={cat.category} className="relative">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-900">{cat.name}</span>
                      <div className="text-right">
                        <span className="text-gray-600 font-medium">
                          {cat.count} ({cat.percentage}%)
                        </span>
                        <div className="text-[10px] text-gray-500">
                          ⭐ {cat.avgRating}
                        </div>
                      </div>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* TOP 10 PROVINCIAS */}
          <Card className="border-2 border-cyan-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📍 Top 10 Provincias
              </CardTitle>
              <CardDescription>Provincias con más lugares indexados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {provinceStats.map((prov, index) => (
                  <div key={prov.province} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-sm text-gray-900 truncate">{prov.province}</span>
                        <span className="text-xs text-gray-600 ml-2">{prov.count}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>⭐ {prov.avgRating}</span>
                        <span>·</span>
                        <span className="text-green-600">{prov.published} públicos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid 2 columnas - Ciudades y Comunidades */}
      {stats.totalPlaces > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* TOP 10 CIUDADES */}
          <Card className="border-2 border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏙️ Top 10 Ciudades
              </CardTitle>
              <CardDescription>Ciudades con más lugares de calidad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cityStats.map((city, index) => (
                  <div key={city.city} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-pink-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-sm text-gray-900 truncate">{city.city}</span>
                        <span className="text-xs text-gray-600 ml-2">{city.count}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>⭐ {city.avgRating}</span>
                        <span>·</span>
                        <span className="text-green-600">{city.published} públicos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* TOP 10 COMUNIDADES AUTÓNOMAS */}
          <Card className="border-2 border-teal-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗺️ Top 10 Comunidades Autónomas
              </CardTitle>
              <CardDescription>CC.AA con mejor cobertura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {communityStats.map((com, index) => (
                  <div key={com.community} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-teal-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-sm text-gray-900 truncate">{com.community}</span>
                        <span className="text-xs text-gray-600 ml-2">{com.count}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>⭐ {com.avgRating}</span>
                        <span>·</span>
                        <span className="text-green-600">{com.published} públicos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TOP 10 LUGARES CON SELECTOR DE CATEGORÍA */}
      {stats.totalPlaces > 0 && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  🏆 Top 10 Lugares
                </CardTitle>
                <CardDescription>Los lugares mejor valorados con más reseñas</CardDescription>
              </div>
              <select
                value={selectedCategoryForTop}
                onChange={(e) => setSelectedCategoryForTop(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todas las categorías</option>
                <option value="restaurante">🍽️ Restaurantes</option>
                <option value="hotel">🏨 Hoteles</option>
                <option value="bar">🍺 Bares</option>
                <option value="spa">💆 Spas</option>
                <option value="cafe">☕ Cafeterías</option>
                <option value="experiencia">🎭 Experiencias</option>
                <option value="monumento">🏛️ Monumentos</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">⏳</div>
                <p>Cargando datos...</p>
              </div>
            ) : filteredTopPlaces.length > 0 ? (
              <div className="space-y-2">
                {filteredTopPlaces.map((place, index) => {
                  const tier = calculateQualityTier(place.rating, place.review_count || 0);
                  const tierInfo = getTierInfo(tier);
                  
                  return (
                    <div key={place.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:shadow-md transition">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'bg-green-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{tierInfo.icon}</span>
                          <h4 className="font-semibold text-sm text-gray-900 truncate flex-1">
                            {place.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold">{place.rating}</span>
                          </div>
                          <span>·</span>
                          <span className="font-medium">{place.review_count?.toLocaleString()} reseñas</span>
                          <span>·</span>
                          <span>{place.city}</span>
                        </div>
                      </div>
                      {place.published ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No hay lugares en esta categoría</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {stats.totalPlaces > 0 && (
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Link href="/admin/indexar">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6 hover:border-indigo-500 hover:bg-indigo-50 transition">
                  <Plus className="h-8 w-8 text-indigo-600" />
                  <span className="font-semibold">Nueva Indexación</span>
                </Button>
              </Link>

              <Link href="/admin/lugares?filter=pending">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6 hover:border-orange-500 hover:bg-orange-50 transition">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <span className="font-semibold">Ver Borradores</span>
                  <Badge className="bg-orange-500 text-white">{stats.pending}</Badge>
                </Button>
              </Link>

              <Link href="/admin/lugares">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-6 hover:border-cyan-500 hover:bg-cyan-50 transition">
                  <MapPin className="h-8 w-8 text-cyan-600" />
                  <span className="font-semibold">Gestionar Lugares</span>
                  <Badge className="bg-cyan-500 text-white">{stats.totalPlaces}</Badge>
                </Button>
              </Link>

              <div className="flex flex-col gap-2">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-3 hover:border-purple-500 hover:bg-purple-50 transition">
                  <Award className="h-6 w-6 text-purple-600" />
                  <span className="font-semibold text-xs">Enriquecer con IA</span>
                  <Badge className="bg-purple-500 text-white text-[10px]">{stats.withoutAI} pendientes</Badge>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
