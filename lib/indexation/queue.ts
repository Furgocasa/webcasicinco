/**
 * Sistema de colas para gestionar trabajos de indexación
 */

import { createAdminClient } from '../supabase/server';
import type { IndexationJob, JobStatus } from '@/types/indexation';

/**
 * Crea un nuevo trabajo de indexación
 */
export async function createIndexationJob(
  adminUserId: string,
  searchParams: any,
  estimatedCost: number,
  totalPlaces: number
): Promise<string> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('indexation_jobs')
    .insert({
      admin_user_id: adminUserId,
      status: 'pending',
      search_params: searchParams,
      total_places: totalPlaces,
      processed_places: 0,
      successful_places: 0,
      failed_places: 0,
      estimated_cost: estimatedCost,
      actual_cost: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create indexation job: ${error.message}`);
  }

  return data.id;
}

/**
 * Actualiza el estado de un trabajo
 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  updates: Partial<{
    processed_places: number;
    successful_places: number;
    failed_places: number;
    actual_cost: number;
    started_at: string;
    completed_at: string;
    error_log: any;
  }>
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('indexation_jobs')
    .update({
      status,
      ...updates,
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }
}

/**
 * Obtiene un trabajo por su ID
 */
export async function getJob(jobId: string): Promise<IndexationJob | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('indexation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }

  return data as IndexationJob;
}

/**
 * Obtiene todos los trabajos de un usuario
 */
export async function getUserJobs(userId: string): Promise<IndexationJob[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('indexation_jobs')
    .select('*')
    .eq('admin_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user jobs:', error);
    return [];
  }

  return data as IndexationJob[];
}

/**
 * Obtiene los trabajos recientes (últimos 10)
 */
export async function getRecentJobs(limit: number = 10): Promise<IndexationJob[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('indexation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent jobs:', error);
    return [];
  }

  return data as IndexationJob[];
}

/**
 * Pausa un trabajo en ejecución
 */
export async function pauseJob(jobId: string): Promise<void> {
  await updateJobStatus(jobId, 'paused', {});
}

/**
 * Reanuda un trabajo pausado
 */
export async function resumeJob(jobId: string): Promise<void> {
  await updateJobStatus(jobId, 'running', {});
}

/**
 * Marca un trabajo como completado
 */
export async function completeJob(
  jobId: string,
  successful: number,
  failed: number,
  totalCost: number
): Promise<void> {
  await updateJobStatus(jobId, 'completed', {
    successful_places: successful,
    failed_places: failed,
    actual_cost: totalCost,
    completed_at: new Date().toISOString(),
  });
}

/**
 * Marca un trabajo como fallido
 */
export async function failJob(jobId: string, errorLog: any): Promise<void> {
  await updateJobStatus(jobId, 'failed', {
    error_log: errorLog,
    completed_at: new Date().toISOString(),
  });
}

/**
 * Actualiza el progreso de un trabajo en ejecución
 */
export async function updateJobProgress(
  jobId: string,
  processed: number,
  successful: number,
  failed: number,
  cost: number
): Promise<void> {
  await updateJobStatus(jobId, 'running', {
    processed_places: processed,
    successful_places: successful,
    failed_places: failed,
    actual_cost: cost,
  });
}

/**
 * Calcula estadísticas de todos los trabajos
 */
export async function getJobStatistics(): Promise<{
  total_jobs: number;
  total_places_indexed: number;
  total_cost: number;
  success_rate: number;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('indexation_jobs')
    .select('successful_places, failed_places, actual_cost');

  if (error || !data) {
    return {
      total_jobs: 0,
      total_places_indexed: 0,
      total_cost: 0,
      success_rate: 0,
    };
  }

  const total_jobs = data.length;
  const total_successful = data.reduce((sum, job) => sum + (job.successful_places || 0), 0);
  const total_failed = data.reduce((sum, job) => sum + (job.failed_places || 0), 0);
  const total_places_indexed = total_successful + total_failed;
  const total_cost = data.reduce((sum, job) => sum + (job.actual_cost || 0), 0);
  const success_rate = total_places_indexed > 0 
    ? (total_successful / total_places_indexed) * 100 
    : 0;

  return {
    total_jobs,
    total_places_indexed: total_successful,
    total_cost,
    success_rate,
  };
}
