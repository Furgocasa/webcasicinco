/**
 * Enriquecimiento Fase 2 (sin fotos Google por defecto)
 * Ejecutar: npx tsx scripts/run-enrichment-batch.ts
 * Lote grande: BATCH_SIZE=100 BATCHES=15 npx tsx scripts/run-enrichment-batch.ts
 * Con fotos Google: SKIP_GOOGLE_PHOTOS=false BATCH_SIZE=50 BATCHES=30 npx tsx scripts/run-enrichment-batch.ts
 */
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10);
const BATCHES = parseInt(process.env.BATCHES || '1', 10);
const SKIP_GOOGLE_PHOTOS = process.env.SKIP_GOOGLE_PHOTOS !== 'false';

async function main() {
  const { enrichPendingPlaces, queueEmptyPlacesForEnrichment } = await import('../lib/indexation/enricher-batch');
  const { createAdminClient } = await import('../lib/supabase/server');

  console.log(`\n🎨 Fase 2 — ${BATCHES} lote(s) de ${BATCH_SIZE} lugares`);
  console.log(`📷 Fotos Google: ${SKIP_GOOGLE_PHOTOS ? 'NO (0€ fotos)' : 'SÍ (coste)'}\n`);

  // Encolar fichas vacías publicadas por error (solo una vez al inicio)
  const supabase = createAdminClient();
  const queued = await queueEmptyPlacesForEnrichment(supabase);
  if (queued > 0) {
    console.log(`📥 ${queued} fichas vacías encoladas y despublicadas\n`);
  }

  let totalSuccessful = 0;
  let totalFailed = 0;

  for (let i = 1; i <= BATCHES; i++) {
    console.log(`\n--- LOTE ${i}/${BATCHES} ---\n`);
    const result = await enrichPendingPlaces(BATCH_SIZE, undefined, {
      skipGooglePhotos: SKIP_GOOGLE_PHOTOS,
      queueLegacy: false, // ya encolado arriba
    });

    totalSuccessful += result.successful;
    totalFailed += result.failed;

    console.log(`\n📊 Lote ${i}: ${result.successful} OK, ${result.failed} fallos`);

    if (result.totalPending === 0) {
      console.log('\n✅ No quedan pendientes');
      break;
    }
  }

  console.log(`\n🏁 TOTAL: ${totalSuccessful} enriquecidos, ${totalFailed} fallos`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
