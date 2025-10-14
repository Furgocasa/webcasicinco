/**
 * SISTEMA DE LOGS EN TIEMPO REAL PARA INDEXACIÓN
 * 
 * Permite registrar logs durante el proceso de indexación que se:
 * - Muestran en consola del servidor
 * - Guardan en la BD para mostrar en tiempo real
 * - Se mantienen en el historial de trabajos
 */

import { createAdminClient } from '@/lib/supabase/server';

export interface IndexationLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class IndexationLogger {
  private jobId: string;
  private logs: IndexationLog[] = [];
  private supabase = createAdminClient();
  private flushThreshold = 1; // 🔥 Guardar CADA log inmediatamente para ver en tiempo real

  constructor(jobId: string) {
    this.jobId = jobId;
  }

  /**
   * Registra un log y lo guarda en BD
   */
  private async log(level: IndexationLog['level'], message: string, details?: any) {
    const logEntry: IndexationLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    };

    this.logs.push(logEntry);

    // Mostrar en consola del servidor con colores
    const prefix = `[${level.toUpperCase()}]`;
    const timestamp = new Date().toLocaleTimeString('es-ES');
    console.log(`${timestamp} ${prefix} ${message}`, details || '');

    // Guardar en BD cada N logs o en eventos críticos
    if (this.logs.length >= this.flushThreshold || level === 'error') {
      await this.flush();
    }
  }

  /**
   * Guarda los logs pendientes en la base de datos
   */
  async flush() {
    if (this.logs.length === 0) return;

    try {
      // Obtener logs actuales de la BD
      const { data: job } = await this.supabase
        .from('indexation_jobs')
        .select('logs')
        .eq('id', this.jobId)
        .single();

      const currentLogs = (job?.logs as IndexationLog[]) || [];
      const updatedLogs = [...currentLogs, ...this.logs];

      // Mantener solo los últimos 500 logs para no saturar
      const logsToSave = updatedLogs.slice(-500);

      // Guardar en BD
      await this.supabase
        .from('indexation_jobs')
        .update({ logs: logsToSave })
        .eq('id', this.jobId);

      this.logs = []; // Limpiar buffer local
    } catch (error) {
      console.error('Error guardando logs:', error);
      // No lanzar error para no interrumpir la indexación
    }
  }

  /**
   * Registra un mensaje informativo
   */
  async info(message: string, details?: any) {
    await this.log('info', message, details);
  }

  /**
   * Registra un mensaje de éxito
   */
  async success(message: string, details?: any) {
    await this.log('success', message, details);
  }

  /**
   * Registra una advertencia
   */
  async warning(message: string, details?: any) {
    await this.log('warning', message, details);
  }

  /**
   * Registra un error
   */
  async error(message: string, details?: any) {
    await this.log('error', message, details);
  }

  /**
   * Guarda logs finales y cierra el logger
   */
  async close() {
    await this.flush();
  }
}

