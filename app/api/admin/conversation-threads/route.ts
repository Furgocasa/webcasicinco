import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SCORE: Record<string, number> = { correcta: 10, mejorable: 5, incorrecta: 0 };

type ThreadGroup = {
  key: string;
  label: string;
  last_at: string;
  first_user_message: string;
  assistant_count: number;
  unclassified: number;
  classified: number;
  scoreSum: number;
  ids: string[];
};

async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.user_metadata?.role !== 'admin') return null;
  return user;
}

function adminSb() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/**
 * GET — hilos agrupados (user_email o session_id) con nota media de respuestas únicas.
 */
export async function GET() {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await adminSb()
    .from('chatbot_analytics')
    .select('id, user_email, session_id, user_message, bot_response, quality_assessment, created_at')
    .order('created_at', { ascending: true })
    .limit(4000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const groups = new Map<string, ThreadGroup>();

  for (const row of data || []) {
    const key = String(row.user_email || row.session_id || row.id);
    let entry = groups.get(key);
    if (!entry) {
      entry = {
        key,
        label: row.user_email || `Sesión ${String(row.session_id || row.id).slice(0, 8)}`,
        last_at: String(row.created_at),
        first_user_message: '',
        assistant_count: 0,
        unclassified: 0,
        classified: 0,
        scoreSum: 0,
        ids: [],
      };
    }
    if (!entry.first_user_message) entry.first_user_message = row.user_message || '';
    entry.assistant_count++;
    entry.ids.push(String(row.id));
    entry.last_at = String(row.created_at);
    const q = row.quality_assessment as string | null;
    if (!q) entry.unclassified++;
    else if (q in SCORE) {
      entry.classified++;
      entry.scoreSum += SCORE[q];
    }
    groups.set(key, entry);
  }

  const threads = Array.from(groups.values())
    .map((g) => ({
      id: g.key,
      label: g.label,
      last_message_at: g.last_at,
      first_user_message: g.first_user_message,
      assistant_count: g.assistant_count,
      unclassified_responses: g.unclassified,
      classified_responses: g.classified,
      quality_score: g.classified > 0 ? Math.round((g.scoreSum / g.classified) * 10) / 10 : null,
      response_ids: g.ids,
    }))
    .sort((a, b) => (a.last_message_at < b.last_message_at ? 1 : -1));

  return NextResponse.json({ success: true, threads });
}
