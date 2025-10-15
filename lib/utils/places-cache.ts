/**
 * Sistema de caché de lugares con IndexedDB
 * 
 * Ventajas:
 * - Sin límite de tamaño (puede guardar 3600+ lugares)
 * - Más rápido que localStorage
 * - Asíncrono (no bloquea UI)
 * - Cache de 24 horas automático
 */

const DB_NAME = 'CasiCincoDB';
const STORE_NAME = 'places';
const CACHE_VERSION = 2; // Incrementar para invalidar cache antiguo tras cambios admin
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

interface CacheEntry {
  data: any[];
  timestamp: number;
  version: number;
}

/**
 * Inicializar IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, CACHE_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      // Crear object store si no existe
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Guardar lugares en cache
 */
export async function savePlacesToCache(places: any[]): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cacheEntry: CacheEntry = {
      data: places,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    store.put(cacheEntry, 'allPlaces');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`✅ ${places.length} lugares guardados en cache IndexedDB`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error guardando en cache:', error);
  }
}

/**
 * Obtener lugares desde cache
 * Retorna null si no hay cache o está expirado
 */
export async function getPlacesFromCache(): Promise<any[] | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('allPlaces');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cacheEntry: CacheEntry | undefined = request.result;

        if (!cacheEntry) {
          console.log('📭 No hay cache de lugares');
          resolve(null);
          return;
        }

        // Verificar versión
        if (cacheEntry.version !== CACHE_VERSION) {
          console.log('🔄 Cache desactualizado (versión diferente)');
          resolve(null);
          return;
        }

        // Verificar expiración (24 horas)
        const age = Date.now() - cacheEntry.timestamp;
        if (age > CACHE_DURATION) {
          console.log(`⏰ Cache expirado (${Math.round(age / 1000 / 60 / 60)} horas)`);
          resolve(null);
          return;
        }

        const hoursOld = Math.round(age / 1000 / 60 / 60 * 10) / 10;
        console.log(`✅ Cache válido (${hoursOld}h de antigüedad, ${cacheEntry.data.length} lugares)`);
        resolve(cacheEntry.data);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error leyendo cache:', error);
    return null;
  }
}

/**
 * Limpiar cache (útil para testing o actualizaciones)
 */
export async function clearPlacesCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete('allPlaces');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('🗑️ Cache de lugares limpiado');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error limpiando cache:', error);
  }
}

/**
 * Verificar si hay cache válido (sin cargar los datos)
 */
export async function hasFreshCache(): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('allPlaces');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const cacheEntry: CacheEntry | undefined = request.result;

        if (!cacheEntry || cacheEntry.version !== CACHE_VERSION) {
          resolve(false);
          return;
        }

        const age = Date.now() - cacheEntry.timestamp;
        resolve(age <= CACHE_DURATION);
      };

      request.onerror = () => resolve(false);
    });
  } catch (error) {
    return false;
  }
}

/**
 * Obtener edad del cache en horas
 */
export async function getCacheAge(): Promise<number> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('allPlaces');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const cacheEntry: CacheEntry | undefined = request.result;

        if (!cacheEntry) {
          resolve(-1);
          return;
        }

        const age = Date.now() - cacheEntry.timestamp;
        resolve(age / 1000 / 60 / 60); // horas
      };

      request.onerror = () => resolve(-1);
    });
  } catch (error) {
    return -1;
  }
}

/**
 * Pre-cargar lugares en background (llamar al login o al cargar la app)
 */
export async function preloadPlaces(): Promise<void> {
  try {
    // Verificar si ya hay cache fresco
    const hasFresh = await hasFreshCache();
    if (hasFresh) {
      console.log('✅ Cache fresco disponible, no es necesario precargar');
      return;
    }

    console.log('🔄 Precargando lugares en background...');

    // Cargar en lotes
    const batchSize = 1000;
    let offset = 0;
    let allPlaces: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`/api/places?limit=${batchSize}&offset=${offset}`);
      const data = await response.json();

      if (data.success && data.places && data.places.length > 0) {
        allPlaces = [...allPlaces, ...data.places];
        offset += batchSize;

        if (data.places.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    // Guardar en cache
    if (allPlaces.length > 0) {
      await savePlacesToCache(allPlaces);
      console.log(`✅ Precarga completada: ${allPlaces.length} lugares en cache`);
    }
  } catch (error) {
    console.error('Error precargando lugares:', error);
  }
}

