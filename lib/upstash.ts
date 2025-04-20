import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Key prefix for Redis to avoid conflicts
const KEY_PREFIX = 'portfolio:calls:'

// Lista de IPs exentas (se cargará desde Redis)
let exemptIPs: string[] = ['127.0.0.1'];

// Cargar IPs exentas desde Redis
async function loadExemptIPs() {
  try {
    const ips = await redis.get<string[]>('portfolio:exempt_ips');
    if (ips) {
      exemptIPs = ips;
    }
  } catch (error) {
    console.error('Error loading exempt IPs:', error);
  }
}

// Recargar IPs exentas cada 5 minutos
setInterval(loadExemptIPs, 5 * 60 * 1000);
loadExemptIPs(); // Cargar al inicio

// Get unique user identifier from request
export function getUserId(request: NextRequest): string {
  // Get all possible identifiers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const ip = forwardedFor?.split(',')[0] || cfConnectingIp || realIp || '127.0.0.1'
  
  // Check if IP is exempt
  if (exemptIPs.includes(ip)) {
    return 'admin-unlimited';
  }
  
  // Get user agent and other browser fingerprinting data
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  
  // Create a more unique identifier combining multiple factors
  const identifier = `${ip}:${userAgent}:${acceptLanguage}`
  
  // Hash the identifier to make it consistent length and remove special chars
  return Buffer.from(identifier).toString('base64')
}

// Maximum allowed calls per user
const MAX_CALLS = 1

// Get remaining calls for a user
export async function getRemainingCalls(userId: string): Promise<number> {
  try {
    // Always check rate limiting in production
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_RATE_LIMITING !== 'true') {
      return MAX_CALLS
    }

    // Admin users always have calls available
    if (userId === 'admin-unlimited') {
      return MAX_CALLS;
    }

    const key = `${KEY_PREFIX}${userId}`
    const usedCalls = await redis.get<number>(key) || 0
    return Math.max(0, MAX_CALLS - usedCalls)
  } catch (error) {
    console.error('Error getting remaining calls:', error)
    // En caso de error, asumimos que no hay llamadas disponibles por seguridad
    return 0
  }
}

// Register a new call for a user
export async function registerCall(userId: string): Promise<boolean> {
  try {
    // Always check rate limiting in production
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_RATE_LIMITING !== 'true') {
      return true
    }

    const key = `${KEY_PREFIX}${userId}`
    
    // Usar una transacción de Redis para evitar condiciones de carrera
    return await redis.multi()
      .get(key)
      .set(key, (curr: number) => (curr || 0) + 1)
      .exec()
      .then(() => true)
      .catch(() => false)
  } catch (error) {
    console.error('Error registering call:', error)
    return false
  }
} 