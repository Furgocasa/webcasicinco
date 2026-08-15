'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Calendar,
  MapPin,
  Tag,
  FileText,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { buildBlogPostTitle } from '@/types/blog';
import { toast } from 'sonner';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const isNew = postId === 'nuevo';
  
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [lastReview, setLastReview] = useState<{
    approved: boolean;
    score: number;
    seoScore: number;
    uxScore: number;
    summary: string;
    issues: Array<{ severity: string; message: string }>;
  } | null>(null);

  // Form data
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [category, setCategory] = useState<'restaurante' | 'bar' | 'hotel'>('restaurante');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<'city' | 'province' | 'community'>('city');
  const [introText, setIntroText] = useState('');
  const [conclusionText, setConclusionText] = useState('');
  const [keywords, setKeywords] = useState('');
  const [published, setPublished] = useState(true);
  const [createdAt, setCreatedAt] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin && !isNew) {
      fetchPost();
    } else if (isNew) {
      // Valores por defecto para nuevo post
      const now = new Date();
      setCreatedAt(now.toISOString().slice(0, 16));
    }
  }, [user, isAdmin, isNew, postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/admin/blog/${postId}`);
      const data = await response.json();
      
      if (data.success && data.post) {
        const post = data.post;
        setTitle(post.title);
        setSlug(post.slug);
        setMetaDescription(post.meta_description);
        // Solo 3 categorías permitidas; cafe legacy → bar
        const rawCategory = post.category === 'cafe' ? 'bar' : post.category;
        setCategory(rawCategory as 'restaurante' | 'bar' | 'hotel');
        setLocation(post.location);
        setLocationType(post.location_type);
        setIntroText(post.intro_text);
        setConclusionText(post.conclusion_text || '');
        setKeywords(post.keywords?.join(', ') || '');
        setPublished(post.published);
        setCreatedAt(new Date(post.created_at).toISOString().slice(0, 16));
      }
    } catch (error) {
      toast.error('Error cargando post');
      router.push('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (isNew && !slug) {
      setSlug(generateSlugFromTitle(newTitle));
    }
  };

  const suggestTitleFromMeta = () => {
    if (!location || !category) return;
    setTitle(buildBlogPostTitle(category, location, new Date().getFullYear()));
  };

  const isFullHtmlArticle = introText.startsWith('<!-- FULL_HTML -->');

  const generateIntroWithAI = async () => {
    if (!location || !category) {
      toast.error('Necesitas rellenar ubicación y categoría primero');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/blog/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'intro', category, location, locationType })
      });

      const data = await response.json();
      
      if (data.success) {
        setIntroText(data.intro);
        toast.success('Intro generada con IA');
      } else {
        toast.error(data.error || 'Error generando intro');
      }
    } catch (error) {
      toast.error('Error generando intro');
    } finally {
      setGenerating(false);
    }
  };

  const generateFullArticleWithAI = async () => {
    if (!location || !category || !title) {
      toast.error('Necesitas título, ubicación y categoría primero');
      return;
    }

    if (!confirm('Generar artículo (intro + cierre SEO, ~700 palabras). Las cards Top 10 salen de la BD. ¿Continuar?')) {
      return;
    }

    setGeneratingArticle(true);
    try {
      const response = await fetch('/api/admin/blog/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'article',
          title,
          category,
          location,
          locationType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIntroText(data.html);
        setLastReview(
          data.review
            ? {
                approved: Boolean(data.approved),
                score: data.review.score,
                seoScore: data.review.seoScore,
                uxScore: data.review.uxScore,
                summary: data.review.summary,
                issues: data.review.issues?.slice(0, 5) || [],
              }
            : null
        );
        const reviewMsg = data.review
          ? ` | Revisor: ${data.review.score}/100 (${data.iterations} pasadas)`
          : '';
        toast.success(`Artículo SEO generado (${data.placesCount} lugares)${reviewMsg}`);
      } else {
        toast.error(data.error || 'Error generando artículo');
      }
    } catch (error) {
      toast.error('Error generando artículo SEO');
    } finally {
      setGeneratingArticle(false);
    }
  };

  const reviewArticleWithAI = async () => {
    if (!location || !category || !title || !introText) {
      toast.error('Necesitas título, ubicación, categoría y contenido');
      return;
    }

    setReviewing(true);
    try {
      const response = await fetch('/api/admin/blog/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'review',
          title,
          category,
          location,
          locationType,
          htmlContent: introText,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLastReview({
          approved: Boolean(data.approved),
          score: data.review.score,
          seoScore: data.review.seoScore,
          uxScore: data.review.uxScore,
          summary: data.review.summary,
          issues: data.review.issues?.slice(0, 8) || [],
        });
        toast[data.approved ? 'success' : 'warning'](
          data.approved
            ? `✅ Artículo aprobado (${data.review.score}/100)`
            : `⚠️ Requiere mejoras (${data.review.score}/100)`
        );
      } else {
        toast.error(data.error || 'Error en revisión');
      }
    } catch {
      toast.error('Error revisando artículo');
    } finally {
      setReviewing(false);
    }
  };

  const regenerateArticleWithAI = async () => {
    if (!location || !category || !title) {
      toast.error('Necesitas título, ubicación y categoría');
      return;
    }

    if (
      !confirm(
        'El agente revisor analizará el artículo y lo corregirá/regenerará hasta cumplir SEO y UX. Puede tardar varios minutos. ¿Continuar?'
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await fetch('/api/admin/blog/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'regenerate',
          title,
          category,
          location,
          locationType,
          htmlContent: introText || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIntroText(data.html);
        setLastReview({
          approved: Boolean(data.approved),
          score: data.review.score,
          seoScore: data.review.seoScore,
          uxScore: data.review.uxScore,
          summary: data.review.summary,
          issues: data.review.issues?.slice(0, 8) || [],
        });
        toast[data.approved ? 'success' : 'warning'](
          `Regenerado (${data.iterations} pasadas) — ${data.review.score}/100 · ${data.wordCount} palabras`
        );
      } else {
        toast.error(data.error || 'Error regenerando');
      }
    } catch {
      toast.error('Error regenerando artículo');
    } finally {
      setRegenerating(false);
    }
  };

  const generateMetadataWithAI = async () => {
    if (!title || !introText) {
      toast.error('Necesitas título y contenido primero');
      return;
    }

    setGeneratingMeta(true);
    try {
      const htmlForMeta = isFullHtmlArticle
        ? introText.replace('<!-- FULL_HTML -->', '').trim()
        : introText;

      const response = await fetch('/api/admin/blog/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'metadata',
          title,
          htmlContent: htmlForMeta,
        }),
      });

      const data = await response.json();

      if (data.success && data.metadata) {
        if (data.metadata.meta_description) {
          setMetaDescription(data.metadata.meta_description);
        }
        if (data.metadata.meta_keywords?.length) {
          setKeywords(data.metadata.meta_keywords.join(', '));
        }
        toast.success(`Metadatos SEO generados (~${data.metadata.reading_time} min lectura)`);
      } else {
        toast.error(data.error || 'Error generando metadatos');
      }
    } catch (error) {
      toast.error('Error generando metadatos SEO');
    } finally {
      setGeneratingMeta(false);
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (!title || !slug || !location || !introText) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        title,
        slug,
        meta_description: metaDescription,
        category,
        location,
        location_type: locationType,
        intro_text: introText,
        conclusion_text: conclusionText,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        published,
        created_at: new Date(createdAt).toISOString()
      };

      const url = isNew ? '/api/admin/blog' : `/api/admin/blog`;
      const method = isNew ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? postData : { id: postId, ...postData })
      });

      if (response.ok) {
        toast.success(isNew ? 'Post creado' : 'Post actualizado');
        router.push('/admin/blog');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error guardando');
      }
    } catch (error) {
      toast.error('Error guardando post');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/admin/blog')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Button>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'Crear Nuevo Post' : 'Editar Post'}
            </h1>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="md:col-span-2 space-y-6">
            {/* Título y Slug */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Información Básica</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Post *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Los 10 Restaurantes Mejor Valorados de Madrid (2026)"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {isNew && location && category && (
                      <Button type="button" variant="outline" size="sm" onClick={suggestTitleFromMeta}>
                        Sugerir título
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mejores-restaurantes-madrid"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: /blog/{slug || 'slug-del-post'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Descripción (SEO)
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Descubre los mejores restaurantes de Madrid con más de 4.7 estrellas..."
                    rows={2}
                    maxLength={160}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {metaDescription.length}/160 caracteres
                  </p>
                </div>
              </div>
            </Card>

            {/* Contenido */}
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-semibold">Contenido</h2>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={generateIntroWithAI}
                    variant="outline"
                    size="sm"
                    disabled={generating || generatingArticle || !location || !category}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? 'Generando...' : 'Intro corta'}
                  </Button>
                  <Button
                    onClick={generateFullArticleWithAI}
                    variant="outline"
                    size="sm"
                    disabled={generating || generatingArticle || !location || !category || !title}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generatingArticle ? 'Generando artículo...' : 'Artículo SEO completo'}
                  </Button>
                  <Button
                    onClick={generateMetadataWithAI}
                    variant="ghost"
                    size="sm"
                    disabled={generatingMeta || !introText || !title}
                  >
                    {generatingMeta ? 'Generando...' : 'Metadatos SEO'}
                  </Button>
                  {isFullHtmlArticle && (
                    <>
                      <Button
                        onClick={reviewArticleWithAI}
                        variant="outline"
                        size="sm"
                        disabled={reviewing || regenerating || !introText}
                      >
                        {reviewing ? 'Revisando...' : 'Revisar SEO/UX'}
                      </Button>
                      <Button
                        onClick={regenerateArticleWithAI}
                        variant="outline"
                        size="sm"
                        disabled={regenerating || reviewing || !title}
                      >
                        {regenerating ? 'Corrigiendo...' : 'Corregir con revisor'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isFullHtmlArticle && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                  Modo artículo HTML completo. La página pública muestra intro + banner + <strong>cards Top 10</strong> + guía SEO. El revisor penaliza fichas h2/h3 duplicadas por lugar.
                </div>
              )}

              {lastReview && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm border ${
                    lastReview.approved
                      ? 'bg-green-50 border-green-200 text-green-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <p className="font-semibold">
                    Agente revisor: {lastReview.score}/100 · SEO {lastReview.seoScore} · UX {lastReview.uxScore}
                    {lastReview.approved ? ' · ✅ Aprobado' : ' · ⚠️ Pendiente de mejoras'}
                  </p>
                  {lastReview.summary && <p className="mt-1">{lastReview.summary}</p>}
                  {lastReview.issues.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {lastReview.issues.map((issue, idx) => (
                        <li key={idx}>
                          [{issue.severity}] {issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isFullHtmlArticle ? 'Artículo HTML *' : 'Introducción * (300-400 palabras)'}
                  </label>
                  <textarea
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    rows={isFullHtmlArticle ? 24 : 12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    placeholder={isFullHtmlArticle
                      ? 'HTML del cuerpo del artículo (<p>, <h2>, <h3>, enlaces)...'
                      : 'Texto de introducción del artículo...'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {introText.length} caracteres | {introText.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w).length} palabras
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conclusión (opcional)
                  </label>
                  <textarea
                    value={conclusionText}
                    onChange={(e) => setConclusionText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Texto de conclusión (opcional)..."
                  />
                </div>
              </div>
            </Card>

            {/* Keywords */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">SEO Keywords</h2>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="mejores restaurantes madrid, donde comer madrid, restaurantes 5 estrellas madrid"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separadas por comas
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publicación */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Publicación
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={published ? 'true' : 'false'}
                    onChange={(e) => setPublished(e.target.value === 'true')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="true">Publicado</option>
                    <option value="false">Oculto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Publicación
                  </label>
                  <input
                    type="datetime-local"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(createdAt) > new Date() 
                      ? '📅 Programado para el futuro'
                      : '✅ Visible ahora'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Categoría y Ubicación */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Clasificación
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'restaurante' | 'bar' | 'hotel')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="restaurante">🍽️ Restaurantes</option>
                    <option value="bar">🍺 Bares</option>
                    <option value="hotel">🏨 Hoteles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Madrid"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Ubicación *
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="city">Ciudad</option>
                    <option value="province">Provincia</option>
                    <option value="community">Comunidad Autónoma</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Vista previa */}
            {!isNew && (
              <Button
                onClick={() => window.open(`/blog/${slug}`, '_blank')}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Post Público
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

