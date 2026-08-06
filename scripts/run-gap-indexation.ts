/**
 * Indexación de ciudades con huecos de cobertura
 * Ejecutar: npx tsx scripts/run-gap-indexation.ts
 */
import * as dotenv from 'dotenv';

// Cargar env ANTES de importar módulos que leen GOOGLE_MAPS_API_KEY al iniciar
dotenv.config({ path: '.env.local' });

// Ciudades vacías P0 + Ceuta/Melilla (oleada inicial)
const CITIES = [
  'Jerez de la Frontera',
  'Getafe',
  'Algeciras',
  'Alcorcón',
  'Roquetas de Mar',
  'Arona',
  'El Puerto de Santa María',
  'Chiclana de la Frontera',
  'Dos Hermanas',
  'Fuengirola',
  'Torrejón de Ardoz',
  'Parla',
  'Mataró',
  'Getxo',
  'Estepona',
  'Benalmádena',
  'Alcobendas',
  'La Línea de la Concepción',
  'Reus',
  'Telde',
  'Ceuta',
  'Melilla',
  'San Sebastián',
  'El Ejido',
  'Adeje',
  'Sitges',
  'Salou',
  'Cornellà de Llobregat',
  'Irún',
  'Ibiza',
];

const CATEGORIES = ['restaurante', 'bar', 'hotel'];
const MIN_RATING = 4.7;

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const { startFastIndexation } = await import('../lib/indexation/indexer-fast');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!process.env.GOOGLE_MAPS_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    throw new Error('Falta GOOGLE_MAPS_API_KEY en .env.local');
  }

  const resumeJobId = process.env.RESUME_JOB_ID;

  if (resumeJobId) {
    await supabase
      .from('indexation_jobs')
      .update({ status: 'paused', should_continue: true })
      .eq('id', resumeJobId);

    const { data: job, error } = await supabase
      .from('indexation_jobs')
      .select('search_params')
      .eq('id', resumeJobId)
      .single();

    if (error || !job) {
      throw new Error(`No se pudo cargar job ${resumeJobId}: ${error?.message}`);
    }

    console.log(`\n▶️ Reanudando job ${resumeJobId}\n`);
    await startFastIndexation(resumeJobId, job.search_params as {
      provinces: string[];
      categories: string[];
      cities?: string[];
      minRating: number;
    });
    return;
  }

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    perPage: 50,
  });

  if (usersError) {
    throw new Error(`No se pudo listar usuarios: ${usersError.message}`);
  }

  const adminUser =
    usersData.users.find((u) => u.user_metadata?.role === 'admin') || usersData.users[0];

  if (!adminUser) {
    throw new Error('No hay usuarios admin en Supabase');
  }

  console.log(`\n🚀 Iniciando indexación de ${CITIES.length} ciudades`);
  console.log(`👤 Admin: ${adminUser.email}`);
  console.log(`📂 Categorías: ${CATEGORIES.join(', ')}\n`);

  const { data: job, error: jobError } = await supabase
    .from('indexation_jobs')
    .insert({
      admin_user_id: adminUser.id,
      status: 'pending',
      should_continue: true,
      search_params: {
        provinces: [],
        categories: CATEGORIES,
        cities: CITIES,
        minRating: MIN_RATING,
      },
      total_places: 0,
      processed_places: 0,
      successful_places: 0,
      failed_places: 0,
      logs: [],
    })
    .select()
    .single();

  if (jobError || !job) {
    throw new Error(`Error creando job: ${jobError?.message}`);
  }

  console.log(`📋 Job ID: ${job.id}\n`);

  await startFastIndexation(job.id, {
    provinces: [],
    categories: CATEGORIES,
    cities: CITIES,
    minRating: MIN_RATING,
  });

  const { data: finalJob } = await supabase
    .from('indexation_jobs')
    .select('status, successful_places, processed_places, failed_places, total_places')
    .eq('id', job.id)
    .single();

  console.log('\n✅ INDEXACIÓN FINALIZADA');
  console.log(JSON.stringify(finalJob, null, 2));
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
});
