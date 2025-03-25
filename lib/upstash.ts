import { Redis } from '@upstash/redis';

// Inicializar el cliente de Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Tiempo máximo en segundos que cada usuario puede utilizar
const TOTAL_TIME_PER_USER = 120;

// Clave para almacenar las IPs exentas
const EXEMPT_IPS_KEY = 'exempt_ips';

// Para caché en memoria
let cachedExemptIPs: string[] | null = null;
let lastExemptIPsRefresh = 0;
const CACHE_TTL = 15000; // 15 segundos

// Clave para almacenar el tiempo usado por un usuario
const getUserKey = (ip: string) => `user:${ip}:call_time_used`;

// Obtener las IPs exentas con soporte para caché
async function getExemptIPs(forceRefresh: boolean = false): Promise<string[]> {
  // Si tenemos caché y no se requiere refresco, usarla
  const now = Date.now();
  if (!forceRefresh && cachedExemptIPs && (now - lastExemptIPsRefresh < CACHE_TTL)) {
    return cachedExemptIPs;
  }

  try {
    const ips = await redis.get<string[]>(EXEMPT_IPS_KEY);
    // Actualizar caché
    cachedExemptIPs = ips || ['127.0.0.1'];
    lastExemptIPsRefresh = now;
    return cachedExemptIPs;
  } catch (error) {
    console.error('Error getting exempt IPs:', error);
    // Si hay error, usar caché previa o valor por defecto
    return cachedExemptIPs || ['127.0.0.1'];
  }
}

// Comprobar si una IP está exenta con opción para forzar refresco
async function isExemptIP(ip: string, forceRefresh: boolean = false): Promise<boolean> {
  const exemptIPs = await getExemptIPs(forceRefresh);
  return exemptIPs.includes(ip);
}

// Funciones para gestionar el tiempo de llamada por IP
export async function getUserRemainingTime(ip: string, forceRefresh: boolean = false): Promise<number> {
  try {
    // Si la IP está exenta, siempre devolver el tiempo máximo
    if (await isExemptIP(ip, forceRefresh)) {
      console.log(`IP ${ip} está exenta del límite de tiempo`);
      return TOTAL_TIME_PER_USER;
    }
    
    // Obtener el tiempo ya usado
    const timeUsed = await redis.get<number>(getUserKey(ip)) || 0;
    
    // Calcular tiempo restante
    const remainingTime = Math.max(0, TOTAL_TIME_PER_USER - timeUsed);
    return remainingTime;
  } catch (error) {
    console.error('Error getting user remaining time:', error);
    // En caso de error, permitir un tiempo predeterminado
    return 10; // 10 segundos como valor de fallback
  }
}

export async function updateUserTimeUsed(ip: string, secondsUsed: number): Promise<void> {
  try {
    // Si la IP está exenta, no actualizar el tiempo usado
    if (await isExemptIP(ip, true)) {
      return;
    }
    
    // Obtener el tiempo ya usado
    const currentTimeUsed = await redis.get<number>(getUserKey(ip)) || 0;
    
    // Actualizar el tiempo total usado
    const newTimeUsed = Math.min(TOTAL_TIME_PER_USER, currentTimeUsed + secondsUsed);
    
    // Guardar en Redis (sin expiración, queremos que sea permanente)
    await redis.set(getUserKey(ip), newTimeUsed);
  } catch (error) {
    console.error('Error updating user time used:', error);
  }
}

export async function resetUserTime(ip: string): Promise<void> {
  try {
    await redis.set(getUserKey(ip), 0);
  } catch (error) {
    console.error('Error resetting user time:', error);
  }
}

// Función para resetear la caché de IPs exentas
export function resetExemptIPsCache(): void {
  console.log('Resetting exempt IPs cache');
  cachedExemptIPs = null;
  lastExemptIPsRefresh = 0;
} 