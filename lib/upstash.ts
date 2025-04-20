import { Redis } from '@upstash/redis';

// Validar que las credenciales de Upstash estén presentes
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Missing Upstash Redis credentials in environment variables');
  }
}

// Configuración de Upstash Redis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Constantes para el rate limiting
export const CALL_DURATION = 60; // 1 minuto en segundos
export const RATE_LIMITING_ENABLED = process.env.ENABLE_RATE_LIMITING === 'true';

// Función para verificar si el usuario ya ha usado su intento
export async function hasUsedCall(userId: string): Promise<boolean> {
  if (!RATE_LIMITING_ENABLED) return false;
  
  try {
    const hasUsed = await redis.get<boolean>(`call:${userId}`);
    return hasUsed === true;
  } catch (error) {
    console.error('Error checking call usage:', error);
    return true; // Por seguridad, asumimos que ya usó su intento si hay error
  }
}

// Función para registrar el uso del intento
export async function registerCallUsage(userId: string): Promise<boolean> {
  if (!RATE_LIMITING_ENABLED) return true;
  
  try {
    const hasUsed = await hasUsedCall(userId);
    if (hasUsed) {
      return false;
    }
    
    // Marcar como usado con TTL de 24 horas
    await redis.set(`call:${userId}`, true, { ex: 24 * 60 * 60 });
    return true;
  } catch (error) {
    console.error('Error registering call usage:', error);
    return false;
  }
}

// Función para resetear el uso (solo en desarrollo)
export async function resetCallUsage(userId: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  try {
    await redis.del(`call:${userId}`);
    return true;
  } catch (error) {
    console.error('Error resetting call usage:', error);
    return false;
  }
}

// Función para obtener un identificador único del usuario
export function getUserId(req: Request): string {
  const headers = new Headers(req.headers);
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const userAgent = headers.get('user-agent') || '';
  
  const ip = forwarded?.split(',')[0] || realIp || headers.get('x-client-ip') || '127.0.0.1';
  return `${ip}:${userAgent}`;
} 