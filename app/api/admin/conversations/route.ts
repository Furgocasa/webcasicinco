import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const PAGE_SIZE = 25;
const QUALITY_SCORE: Record<string, number> = { correcta: 10, mejorable: 5, incorrecta: 0 };
const GAP_SESION_MS = 60 * 60 * 1000;
const GAP_HUERFANOS_MS = 20 * 60 * 1000;

function adminSb() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.user_metadata?.role !== 'admin') return null;
  return user;
}

function textoUbicacion(intent: any): { ciudad: string | null; pais: string | null; ubicacion: string } {
  const city = String(intent?.city || '').trim() || null;
  const province = String(intent?.province || '').trim() || null;
  const region = String(intent?.region || '').trim() || null;
  const lat = Number(intent?.userCoords?.lat);
  const lng = Number(intent?.userCoords?.lng);
  const ciudad = city || province || region;
  if (city && province && city.toLowerCase() !== province.toLowerCase()) {
    return { ciudad: city, pais: province, ubicacion: `${city}, ${province}` };
  }
  if (ciudad) return { ciudad, pais: province, ubicacion: ciudad };
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { ciudad: null, pais: null, ubicacion: `GPS ${lat.toFixed(2)}, ${lng.toFixed(2)}` };
  }
  if (intent?.usesLocation) return { ciudad: null, pais: null, ubicacion: 'GPS (sin ciudad)' };
  return { ciudad: null, pais: null, ubicacion: 'Ubicación desconocida' };
}

function claveAgrupacion(row: any): string {
  if (row.user_id) return `user:${row.user_id}`;
  if (row.user_email) return `email:${row.user_email}`;
  if (row.session_id) return `sid:${row.session_id}`;
  return 'huerfano';
}

function agruparEnSesiones(rows: any[]): Array<{ id: string; logs: any[] }> {
  const ordenados = [...rows].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const porClave = new Map<string, any[]>();
  for (const row of ordenados) {
    const clave = claveAgrupacion(row);
    const arr = porClave.get(clave) || [];
    arr.push(row);
    porClave.set(clave, arr);
  }

  const grupos: Array<{ id: string; logs: any[] }> = [];
  for (const [clave, lista] of porClave) {
    const gap = clave === 'huerfano' ? GAP_HUERFANOS_MS : GAP_SESION_MS;
    let cubo: any[] = [];
    let inicio = '';
    let ultimo = 0;
    for (const log of lista) {
      const t = new Date(log.created_at).getTime();
      if (cubo.length && Number.isFinite(t) && t - ultimo > gap) {
        grupos.push({ id: `grupo:${clave}:${inicio}`, logs: cubo });
        cubo = [];
      }
      if (!cubo.length) inicio = log.created_at;
      cubo.push(log);
      ultimo = t;
    }
    if (cubo.length) grupos.push({ id: `grupo:${clave}:${inicio}`, logs: cubo });
  }
  return grupos;
}

function notaInteraccion(logs: any[]) {
  let scoreSum = 0;
  let classified = 0;
  let unclassified = 0;
  let correcta = 0;
  let mejorable = 0;
  let incorrecta = 0;
  for (const log of logs) {
    if (!log.quality_assessment) unclassified++;
    else if (log.quality_assessment in QUALITY_SCORE) {
      classified++;
      scoreSum += QUALITY_SCORE[log.quality_assessment];
      if (log.quality_assessment === 'correcta') correcta++;
      else if (log.quality_assessment === 'mejorable') mejorable++;
      else incorrecta++;
    }
  }
  const quality_score = classified > 0 ? Math.round((scoreSum / classified) * 10) / 10 : null;
  const interaccion =
    classified === 0 ? 'sin_valorar'
      : incorrecta > 0 ? 'con_errores'
        : mejorable > 0 ? 'mejorable'
          : 'correcta';
  return {
    correcta,
    mejorable,
    incorrecta,
    sin_evaluar: unclassified,
    quality_score,
    interaccion,
    pct_correctas: classified > 0 ? Math.round((correcta / classified) * 100) : null,
  };
}

function mapLog(row: any) {
  const ubi = textoUbicacion(row.detected_intent);
  return {
    id: row.id,
    created_at: row.created_at,
    conversacion_id: null as string | null,
    user_id: row.user_id,
    usuario: row.user_email ? { nombre: null, email: row.user_email } : null,
    locale: 'es',
    pregunta: row.user_message,
    respuesta: row.bot_response,
    funciones: row.detected_intent ? [{ name: 'intent', args: row.detected_intent }] : null,
    areas_ids: null,
    tokens: null,
    modelo: null,
    duracion_ms: row.query_time_ms,
    revisado: Boolean(row.quality_assessment),
    nota_revision: row.quality_reasoning,
    valoracion_ia: row.quality_assessment,
    motivo_ia: row.quality_reasoning,
    sugerencia_ia: row.suggested_improvements,
    evaluado_at: row.analyzed_at,
    voto_usuario: row.voto_usuario || null,
    votado_at: row.votado_at || null,
    places_found: row.places_found,
    ...ubi,
  };
}

async function statsLogs(admin: ReturnType<typeof adminSb>) {
  const countCat = async (extra?: (q: any) => any) => {
    let q = admin.from('chatbot_analytics').select('id', { count: 'exact', head: true });
    if (extra) q = extra(q);
    const { count: n } = await q;
    return n || 0;
  };
  const [correcta, mejorable, incorrecta, sin_evaluar, total, voto_up, voto_down, sin_voto] = await Promise.all([
    countCat((q) => q.eq('quality_assessment', 'correcta')),
    countCat((q) => q.eq('quality_assessment', 'mejorable')),
    countCat((q) => q.eq('quality_assessment', 'incorrecta')),
    countCat((q) => q.is('quality_assessment', null)),
    countCat(),
    countCat((q) => q.eq('voto_usuario', 'up')),
    countCat((q) => q.eq('voto_usuario', 'down')),
    countCat((q) => q.is('voto_usuario', null)),
  ]);
  return {
    correcta,
    mejorable,
    incorrecta,
    sin_evaluar,
    total,
    voto_up,
    voto_down,
    sin_voto,
  };
}

async function cargarHilo(admin: ReturnType<typeof adminSb>, id: string) {
  const { data: todos } = await admin
    .from('chatbot_analytics')
    .select('*')
    .order('created_at', { ascending: true });

  const grupos = agruparEnSesiones(todos || []);
  const grupo = grupos.find((g) => g.id === id)
    || grupos.find((g) => g.logs.some((l) => l.id === id));
  const logs = grupo?.logs || [];
  const first = logs[0];
  const last = logs[logs.length - 1];
  const ubi = textoUbicacion(last?.detected_intent || first?.detected_intent);
  const nota = notaInteraccion(logs);
  const hilo = logs.flatMap((log: any) => [
    { role: 'user' as const, content: log.user_message, created_at: log.created_at },
    { role: 'assistant' as const, content: log.bot_response, created_at: log.created_at, log: mapLog(log) },
  ]);

  return {
    conversacion: {
      id,
      created_at: first?.created_at || null,
      ultimo_mensaje_at: last?.created_at || null,
      titulo: first?.user_message || 'Conversación',
      user_id: last?.user_id || first?.user_id || null,
      usuario: (last?.user_email || first?.user_email)
        ? { nombre: null, email: last?.user_email || first?.user_email }
        : null,
      locale: 'es',
      respuestas: logs.length,
      first_user_message: first?.user_message || '',
      ...nota,
      ...ubi,
    },
    hilo,
  };
}

function pasaFiltroVoto(log: any, filtroVoto: string) {
  if (filtroVoto === 'sin_voto' && log.voto_usuario) return false;
  if ((filtroVoto === 'up' || filtroVoto === 'down') && log.voto_usuario !== filtroVoto) return false;
  return true;
}

async function cargarConversaciones(
  admin: ReturnType<typeof adminSb>,
  opts: { filtroIA: string; filtroVoto: string; pagina: number }
) {
  const { filtroIA, filtroVoto, pagina } = opts;
  const [{ data: logsAll }, stats] = await Promise.all([
    admin.from('chatbot_analytics').select('*').order('created_at', { ascending: true }),
    statsLogs(admin),
  ]);

  const logsFiltrados = (logsAll || []).filter((log: any) => {
    if (filtroIA === 'sin_evaluar' && log.quality_assessment) return false;
    if (filtroIA !== 'todas' && filtroIA !== 'sin_evaluar' && log.quality_assessment !== filtroIA) return false;
    if (!pasaFiltroVoto(log, filtroVoto)) return false;
    return true;
  });

  const hayFiltroFino = filtroIA !== 'todas' || filtroVoto !== 'todas';
  const idsConFiltro = new Set(logsFiltrados.map((l: any) => l.id));
  const grupos = agruparEnSesiones(logsAll || []).filter((g) =>
    hayFiltroFino ? g.logs.some((l: any) => idsConFiltro.has(l.id)) : true
  );

  const rows = grupos.map((g) => {
    const logs: any[] = g.logs;
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const userId = lastLog?.user_id || firstLog?.user_id || null;
    const email = lastLog?.user_email || firstLog?.user_email || null;
    const ubi = textoUbicacion(lastLog?.detected_intent || firstLog?.detected_intent);
    const nota = notaInteraccion(logs);
    const agrupacion = userId ? 'cuenta' : email ? 'huella' : firstLog?.session_id ? 'hilo' : 'rato';
    return {
      id: g.id,
      created_at: firstLog?.created_at || null,
      ultimo_mensaje_at: lastLog?.created_at || null,
      titulo: firstLog?.user_message || 'Conversación',
      user_id: userId,
      agrupacion,
      usuario: email ? { nombre: null, email } : null,
      locale: 'es',
      respuestas: logs.length,
      mensajes: logs.length * 2,
      first_user_message: firstLog?.user_message || '',
      last_message: lastLog?.bot_response || lastLog?.user_message || '',
      ...nota,
      ...ubi,
    };
  });

  rows.sort((a, b) => String(b.ultimo_mensaje_at || '').localeCompare(String(a.ultimo_mensaje_at || '')));
  const total = rows.length;
  const page = rows.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE);
  return { data: page, total, stats, totalConversaciones: total };
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = request.nextUrl;
    const filtroIA = searchParams.get('filtroIA') || 'todas';
    const filtroVoto = searchParams.get('filtroVoto') || 'todas';
    const pagina = Math.max(0, parseInt(searchParams.get('pagina') || '0', 10) || 0);
    const vista = searchParams.get('vista') || 'respuestas';
    const hiloId = searchParams.get('id');
    const admin = adminSb();

    if (vista === 'hilo' && hiloId) {
      return NextResponse.json(await cargarHilo(admin, hiloId));
    }
    if (vista === 'conversaciones') {
      return NextResponse.json(await cargarConversaciones(admin, { filtroIA, filtroVoto, pagina }));
    }

    let query = admin
      .from('chatbot_analytics')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE - 1);

    if (filtroIA === 'sin_evaluar') query = query.is('quality_assessment', null);
    else if (filtroIA !== 'todas') query = query.eq('quality_assessment', filtroIA);
    if (filtroVoto === 'sin_voto') query = query.is('voto_usuario', null);
    else if (filtroVoto === 'up' || filtroVoto === 'down') query = query.eq('voto_usuario', filtroVoto);

    const [{ data, error, count }, stats, keysRes] = await Promise.all([
      query,
      statsLogs(admin),
      admin.from('chatbot_analytics').select('id, user_id, user_email, session_id, created_at').order('created_at', { ascending: true }),
    ]);
    if (error) {
      return NextResponse.json({ error: 'Error cargando respuestas', details: error.message }, { status: 500 });
    }

    const logToGrupo = new Map<string, string>();
    for (const g of agruparEnSesiones(keysRes.data || [])) {
      for (const l of g.logs) logToGrupo.set(l.id, g.id);
    }

    return NextResponse.json({
      data: (data || []).map((row: any) => ({
        ...mapLog(row),
        conversacion_id: logToGrupo.get(row.id) || null,
      })),
      total: count || 0,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error cargando respuestas' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const { error } = await adminSb().from('chatbot_analytics').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Conversación eliminada' });
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const id = String(body.id || '');
  const quality = body.quality_assessment;
  if (!id || (quality !== null && !['correcta', 'mejorable', 'incorrecta'].includes(quality))) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { data, error } = await adminSb()
    .from('chatbot_analytics')
    .update({
      quality_assessment: quality,
      quality_reasoning: typeof body.quality_reasoning === 'string' ? body.quality_reasoning : undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, conversation: data });
}
