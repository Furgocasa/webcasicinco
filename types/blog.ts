export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  category: 'restaurante' | 'bar' | 'hotel';
  location: string;
  location_type: 'city' | 'province' | 'community';
  intro_text: string;
  conclusion_text?: string;
  keywords: string[];
  featured_image_url?: string;
  first_place_photo?: string | null; // Photo reference o URL del primer lugar del Top 10
  first_place_photo_is_url?: boolean; // True si es URL completa, false si es photo_reference
  published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostWithPlaces extends BlogPost {
  places: any[]; // Array de lugares filtrados
}

/** Marcador para artículo HTML completo (vs intro legacy en texto plano) */
export const BLOG_FULL_HTML_MARKER = '<!-- FULL_HTML -->';

export function isBlogFullHtml(content: string | null | undefined): boolean {
  return Boolean(content?.startsWith(BLOG_FULL_HTML_MARKER));
}

export function extractBlogHtml(content: string): string {
  return content.replace(BLOG_FULL_HTML_MARKER, '').trim();
}

/**
 * Parte el HTML SEO en intro (antes del primer h2) y cuerpo posterior.
 * El cuerpo se limpia de fichas de lugares (h2/h3 con nombre del Top 10)
 * para no duplicar el bloque visual de cards.
 */
export function splitBlogArticleHtml(
  html: string,
  placeNames: string[] = []
): { introHtml: string; restHtml: string } {
  const cleaned = html.trim();
  if (!cleaned) return { introHtml: '', restHtml: '' };

  const firstHeading = cleaned.search(/<h[23][\s>]/i);
  if (firstHeading === -1) {
    return { introHtml: cleaned, restHtml: '' };
  }

  const introHtml = cleaned.slice(0, firstHeading).trim();
  let restHtml = cleaned.slice(firstHeading).trim();

  if (placeNames.length > 0) {
    const normalized = placeNames
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);

    // Quita bloques h2/h3…hasta el siguiente h2/h3 si el título coincide con un lugar
    restHtml = restHtml.replace(
      /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[23]\b|$)/gi,
      (full, _level, _attrs, inner) => {
        const headingText = String(inner)
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/^\s*\d+[\.\):-]\s*/, '')
          .replace(/^#?\d+\s*/, '')
          .trim()
          .toLowerCase();

        const isPlace = normalized.some(
          (name) =>
            headingText === name ||
            headingText.includes(name) ||
            name.includes(headingText)
        );

        return isPlace ? '' : full;
      }
    );

    restHtml = restHtml.replace(/\n{3,}/g, '\n\n').trim();
  }

  return { introHtml, restHtml };
}

const BLOG_CATEGORY_TITLES: Record<BlogPost['category'], string> = {
  restaurante: 'Restaurantes',
  bar: 'Bares',
  hotel: 'Hoteles',
};

/** Preposición natural: "de Valencia", "de la Costa del Sol", "del País Vasco" */
export function blogLocationPhrase(location: string): string {
  const loc = location.trim();
  if (/^costa del/i.test(loc)) return `de la ${loc}`;
  if (loc === 'País Vasco') return 'del País Vasco';
  return `de ${loc}`;
}

/**
 * Título editorial estándar Casi Cinco — criterio por valoración (+4.7★), no opinión subjetiva.
 * Ej: "Los 10 Restaurantes Mejor Valorados de Valencia (2026)"
 */
export function buildBlogPostTitle(
  category: BlogPost['category'],
  location: string,
  year: number = new Date().getFullYear()
): string {
  return `Los 10 ${BLOG_CATEGORY_TITLES[category]} Mejor Valorados ${blogLocationPhrase(location)} (${year})`;
}

// ================================================================
// AUDITORÍA SEO/UX — validación programática del HTML del blog
// ================================================================

export type BlogArticleIssueSeverity = 'critical' | 'warning' | 'suggestion';
export type BlogArticleIssueCategory = 'seo' | 'ux' | 'content' | 'format';

export interface BlogArticleAuditIssue {
  severity: BlogArticleIssueSeverity;
  category: BlogArticleIssueCategory;
  message: string;
  fixHint?: string;
}

export interface BlogArticleAuditResult {
  passed: boolean;
  wordCount: number;
  introWordCount: number;
  placeHeadingCount: number;
  issues: BlogArticleAuditIssue[];
}

/** Cuenta palabras visibles del HTML (sin tags) */
export function countBlogArticleWords(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Normaliza texto de heading para comparar con nombres de lugares */
function normalizeHeadingText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/^\s*\d+[\.\):-]\s*/, '')
    .replace(/^#?\d+\s*/, '')
    .trim()
    .toLowerCase();
}

/** Detecta cuántos h2/h3 repiten nombres del Top 10 (duplican las cards visuales) */
export function countPlaceHeadingsInHtml(html: string, placeNames: string[] = []): number {
  if (!placeNames.length) return 0;

  const normalized = placeNames
    .map((n) =>
      n
        .trim()
        .toLowerCase()
        // Quita comillas tipográficas y ruido frecuente
        .replace(/[“”"']/g, '')
        .replace(/\s+/g, ' ')
    )
    .filter((n) => n.length >= 4);

  let count = 0;
  const headingRegex = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    const headingText = normalizeHeadingText(match[3])
      .replace(/[“”"']/g, '')
      .replace(/\s+/g, ' ');

    // Coincide si el heading es el nombre, lo contiene, o empieza por el nombre (+ ciudad/coma)
    const isPlace = normalized.some((name) => {
      if (headingText === name) return true;
      if (headingText.startsWith(name)) return true;
      // Nombre largo dentro del heading (evita falsos positivos cortos)
      if (name.length >= 8 && headingText.includes(name)) return true;
      // Primeros 4 tokens del nombre (ej. "Caravana - Cocina Viajera")
      const short = name.split(/[\s|,]+/).slice(0, 4).join(' ');
      if (short.length >= 10 && headingText.startsWith(short)) return true;
      return false;
    });
    if (isPlace) count++;
  }

  return count;
}

/**
 * Auditoría determinista SEO + UX antes/después del agente revisor LLM.
 * UX clave: la página ya renderiza cards Top 10; fichas h2/h3 por lugar se eliminan al publicar.
 */
export function auditBlogArticleHtml(
  html: string,
  options: {
    title?: string;
    placeNames?: string[];
    minWords?: number;
    maxWords?: number;
  } = {}
): BlogArticleAuditResult {
  const minWords = options.minWords ?? 600;
  const maxWords = options.maxWords ?? 1100;
  const issues: BlogArticleAuditIssue[] = [];
  const cleaned = html.trim();
  const wordCount = countBlogArticleWords(cleaned);
  const placeHeadingCount = countPlaceHeadingsInHtml(cleaned, options.placeNames);

  const firstHeadingIdx = cleaned.search(/<h[23][\s>]/i);
  const introHtml = firstHeadingIdx === -1 ? cleaned : cleaned.slice(0, firstHeadingIdx);
  const introWordCount = countBlogArticleWords(introHtml);

  // --- Formato ---
  if (/<h1[\s>]/i.test(cleaned)) {
    issues.push({
      severity: 'critical',
      category: 'format',
      message: 'Contiene <h1>; la página ya muestra el título.',
      fixHint: 'Elimina h1 y empieza con párrafos <p>.',
    });
  }

  if (!/^<p[\s>]/i.test(cleaned)) {
    issues.push({
      severity: 'critical',
      category: 'format',
      message: 'No empieza con un párrafo <p>.',
      fixHint: 'Añade 2-3 párrafos introductorios antes del primer h2.',
    });
  }

  if (firstHeadingIdx === -1) {
    issues.push({
      severity: 'critical',
      category: 'format',
      message: 'Falta el cierre SEO: no hay ningún <h2> después de la intro.',
      fixHint: 'Tras la intro, añade h2 de consejos/zonas/FAQ/CTA (las cards Top 10 van entre intro y cierre).',
    });
  }

  if (options.title) {
    const titleNorm = options.title.trim().toLowerCase();
    const firstH2 = cleaned.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (firstH2) {
      const h2Text = normalizeHeadingText(firstH2[1]);
      if (h2Text === titleNorm || h2Text.includes(titleNorm.slice(0, 40))) {
        issues.push({
          severity: 'critical',
          category: 'format',
          message: 'El primer h2 repite el título del artículo.',
          fixHint: 'Sustituye ese h2 por una sección útil (ej. "Cómo elegir bien").',
        });
      }
    }
  }

  // --- Contenido / longitud (modelo intro + cards + cierre) ---
  if (wordCount < 450) {
    issues.push({
      severity: 'critical',
      category: 'content',
      message: `Texto demasiado corto (${wordCount} palabras).`,
      fixHint: `Objetivo 600–900 palabras: intro 150–250 + cierre SEO 450–650.`,
    });
  } else if (wordCount < minWords) {
    issues.push({
      severity: 'warning',
      category: 'content',
      message: `Por debajo del objetivo (${wordCount}/${minWords} palabras).`,
      fixHint: 'Amplía un poco el cierre (consejos, zonas o FAQ).',
    });
  } else if (wordCount > maxWords) {
    issues.push({
      severity: 'warning',
      category: 'content',
      message: `Demasiado largo (${wordCount} palabras). Las cards ya llevan el Top 10.`,
      fixHint: 'Recorta a 600–900 palabras: intro breve + cierre SEO sin fichas por lugar.',
    });
  }

  if (introWordCount < 100) {
    issues.push({
      severity: 'warning',
      category: 'ux',
      message: `Introducción breve (${introWordCount} palabras antes del primer h2).`,
      fixHint: 'Escribe 150–250 palabras de contexto + criterio +4.7★ antes de las cards.',
    });
  } else if (introWordCount > 320) {
    issues.push({
      severity: 'suggestion',
      category: 'ux',
      message: `Intro larga (${introWordCount} palabras).`,
      fixHint: 'Deja la intro en 150–250 palabras; el detalle va al cierre tras las cards.',
    });
  }

  // --- UX: duplicación con cards Top 10 ---
  if (placeHeadingCount >= 3) {
    issues.push({
      severity: 'critical',
      category: 'ux',
      message: `${placeHeadingCount} secciones h2/h3 repiten nombres del Top 10 (duplican las cards visuales).`,
      fixHint:
        'NO escribas fichas individuales. La web ya muestra cards. Usa intro + cierre SEO (elegir, zonas, FAQ).',
    });
  } else if (placeHeadingCount >= 1) {
    issues.push({
      severity: 'warning',
      category: 'ux',
      message: `${placeHeadingCount} heading(s) con nombre de lugar del Top 10.`,
      fixHint: 'Evita bloques por establecimiento; menciona lugares solo inline con enlace.',
    });
  }

  // --- SEO ---
  if (!/casicinco\.com/i.test(cleaned)) {
    issues.push({
      severity: 'critical',
      category: 'seo',
      message: 'Sin enlaces internos a casicinco.com.',
      fixHint: 'Añade enlaces a mapa, pricing o fichas verificadas.',
    });
  }

  if (!/\/ruta|planificar ruta/i.test(cleaned)) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: 'Sin CTA o enlace al planificador de rutas.',
      fixHint: 'Menciona https://www.casicinco.com/ruta de forma natural.',
    });
  }

  if (!/\/pricing|prueba gratis|30 d[ií]as/i.test(cleaned)) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: 'Sin mención a prueba gratuita o pricing.',
      fixHint: 'Incluye CTA a https://www.casicinco.com/pricing.',
    });
  }

  if (!/4\.7|4,7|\+4\.7|cuatro con siete/i.test(cleaned)) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: 'No menciona el filtro +4.7★ de Casi Cinco.',
      fixHint: 'Refuerza el criterio +4.7★ en la intro.',
    });
  }

  const passed = !issues.some((i) => i.severity === 'critical');

  return {
    passed,
    wordCount,
    introWordCount,
    placeHeadingCount,
    issues,
  };
}

