/**
 * Agente revisor de respuestas del Tío Viajero (Casi Cinco).
 * Molde: auditor de Andrea (Furgocasa). Hilo + fichas reales de places + data_gap.
 *
 * Uso (Windows: no uses npm run si hay flags):
 *   npx tsx scripts/review-chatbot-messages.ts
 *   npx tsx scripts/review-chatbot-messages.ts --all
 *   npx tsx scripts/review-chatbot-messages.ts --limit=50
 *   npx tsx scripts/review-chatbot-messages.ts --id=<uuid>
 *   npx tsx scripts/review-chatbot-messages.ts --dry-run
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import {
  evaluateConversation,
  fetchPlacesForReview,
  formatPriorContext,
  type DataGap,
} from '@/lib/ai/evaluation-agent';

const REPORT_PATH = resolve(process.cwd(), 'scripts/INFORME-REVISION-MENSAJES.md');
const PENDIENTES_PATH = resolve(process.cwd(), 'scripts/INCIDENCIAS-PENDIENTES.csv');

type ReviewResult = {
  id: string;
  user_question: string;
  assistant_answer: string;
  quality: 'correcta' | 'mejorable' | 'incorrecta';
  notes: string;
  suggested_fix?: string | null;
  data_gap: DataGap;
  data_title?: string;
  data_body?: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    all: args.includes('--all'),
    limit: Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0') || undefined,
    id: args.find((a) => a.startsWith('--id='))?.split('=')[1]?.trim() || undefined,
  };
}

function csvCell(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

function writePendientes(results: ReviewResult[]) {
  const existing: Array<[string, string]> = [];
  if (existsSync(PENDIENTES_PATH)) {
    for (const line of readFileSync(PENDIENTES_PATH, 'utf8').split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue;
      const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/);
      if (!m) continue;
      const title = m[1].replace(/""/g, '"').trim();
      const body = m[2].replace(/""/g, '"').trim();
      if (title && body) existing.push([title, body]);
    }
  }
  const seen = new Set(
    existing.map(([t]) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
  );
  let added = 0;
  for (const r of results) {
    if ((r.data_gap !== 'missing' && r.data_gap !== 'not_retrieved') || !r.data_title || !r.data_body) continue;
    const key = r.data_title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (seen.has(key)) continue;
    existing.push([r.data_title, r.data_body]);
    seen.add(key);
    added += 1;
  }
  writeFileSync(
    PENDIENTES_PATH,
    `${['titulo,contenido', ...existing.map(([t, b]) => `${csvCell(t)},${csvCell(b)}`)].join('\n')}\n`,
    'utf8'
  );
  if (added) console.log(`Huecos: ${added} propuestas en scripts/INCIDENCIAS-PENDIENTES.csv`);
}

function buildReport(results: ReviewResult[], dryRun: boolean) {
  const counts = { correcta: 0, mejorable: 0, incorrecta: 0 };
  for (const r of results) counts[r.quality]++;
  const lines = [
    '# Informe de revisión automática del Tío Viajero (Casi Cinco)',
    '',
    `Generado: ${new Date().toISOString()}`,
    dryRun ? 'Modo: **dry-run** (sin escribir en Supabase)' : 'Modo: **aplicado** (clasificaciones guardadas)',
    '',
    '## Resumen',
    '',
    `- Correctas: ${counts.correcta}`,
    `- Mejorables: ${counts.mejorable}`,
    `- Incorrectas: ${counts.incorrecta}`,
    `- Total revisadas: ${results.length}`,
    '',
  ];
  const problematic = results.filter((r) => r.quality !== 'correcta');
  if (problematic.length) {
    lines.push('## Respuestas a mejorar o incorrectas', '');
    for (const r of problematic) {
      lines.push(`### ${r.quality.toUpperCase()} — ${r.id.slice(0, 8)}…`, '');
      lines.push(`**Pregunta:** ${r.user_question || '—'}`, '');
      lines.push(`**Respuesta:** ${r.assistant_answer.slice(0, 500)}${r.assistant_answer.length > 500 ? '…' : ''}`, '');
      lines.push(`**Notas:** ${r.notes}`);
      if (r.suggested_fix) lines.push(`**Sugerencia:** ${r.suggested_fix}`);
      if (r.data_gap !== 'none') lines.push(`**Hueco:** ${r.data_gap}${r.data_title ? ` · ${r.data_title}` : ''}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.OPENAI_API_KEY) {
    console.error('Faltan credenciales en .env.local');
    process.exit(1);
  }

  const { dryRun, all, limit, id } = parseArgs();
  const supabase = createClient(url, key);

  let query = supabase
    .from('chatbot_analytics')
    .select('id, user_message, bot_response, detected_intent, places_found, conversation_context, quality_assessment')
    .order('created_at', { ascending: true });

  if (id) query = query.eq('id', id);
  else if (!all) query = query.is('quality_assessment', null);
  if (!id && limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error('Error leyendo chatbot_analytics:', error.message);
    process.exit(1);
  }

  const rows = data || [];
  console.log(
    `Revisión Tío Casi Cinco — ${rows.length} respuestas${all ? ' (todas)' : ' (sin evaluar)'}${dryRun ? ' (dry-run)' : ''}`
  );
  if (!rows.length) {
    console.log('Nada que revisar.');
    return;
  }

  const results: ReviewResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const conv = rows[i];
    process.stdout.write(`[${i + 1}/${rows.length}] ${String(conv.user_message || '').slice(0, 40)}… `);
    try {
      const extras = await fetchPlacesForReview(supabase, conv.detected_intent, conv.bot_response || '');
      const analysis = await evaluateConversation(
        conv.user_message || '',
        conv.bot_response || '',
        conv.detected_intent,
        conv.places_found || 0,
        undefined,
        {
          priorContext: formatPriorContext(conv.conversation_context),
          placesReales: extras.placesReales,
          citedMissing: extras.citedMissing,
        }
      );
      results.push({
        id: conv.id,
        user_question: conv.user_message || '',
        assistant_answer: conv.bot_response || '',
        quality: analysis.quality,
        notes: analysis.reasoning,
        suggested_fix: analysis.improvements,
        data_gap: analysis.data_gap,
        data_title: analysis.data_title,
        data_body: analysis.data_body,
      });
      console.log(analysis.quality);

      if (!dryRun) {
        const note = analysis.improvements
          ? `${analysis.improvements}${analysis.data_gap !== 'none' ? ` | hueco: ${analysis.data_gap}` : ''}`
          : analysis.data_gap !== 'none'
            ? `hueco: ${analysis.data_gap}`
            : null;
        const { error: upErr } = await supabase
          .from('chatbot_analytics')
          .update({
            ai_summary: analysis.summary,
            quality_assessment: analysis.quality,
            quality_reasoning: analysis.reasoning,
            suggested_improvements: note,
            analyzed_at: new Date().toISOString(),
          })
          .eq('id', conv.id);
        if (upErr) console.error('  Error guardando:', upErr.message);
      }
    } catch (err) {
      console.log('error');
      console.error(err);
    }
  }

  mkdirSync(resolve(process.cwd(), 'scripts'), { recursive: true });
  writeFileSync(REPORT_PATH, buildReport(results, dryRun), 'utf8');
  if (!dryRun) writePendientes(results);
  console.log(`\nInforme: ${REPORT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
