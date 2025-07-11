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
  
  // Log all headers for debugging
  console.log('🔍 Headers for IP detection:', {
    'x-forwarded-for': forwardedFor,
    'x-real-ip': realIp,
    'cf-connecting-ip': cfConnectingIp
  });

  // Get the real IP address
  let ip = '127.0.0.1';
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one (client IP)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    ip = ips[0];
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  }

  console.log('🌐 Detected IP:', ip);
  
  // Check if IP is exempt
  if (exemptIPs.includes(ip)) {
    console.log('✨ IP is exempt, returning admin identifier');
    return 'admin-unlimited';
  }
  
  // Get user agent and other browser fingerprinting data
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  
  // Create a more unique identifier combining multiple factors
  const identifier = `${ip}:${userAgent}:${acceptLanguage}`
  
  // Hash the identifier to make it consistent length and remove special chars
  const hashedId = Buffer.from(identifier).toString('base64');
  console.log('🎯 Generated user ID:', hashedId);
  
  return hashedId;
}

// Maximum allowed calls per user
const MAX_CALLS = 10; // No-op change to force redeploy

// Get remaining calls for a user
// DEBUG: Desactivar rate limiting temporalmente para evitar el error de 'No calls available'
export async function getRemainingCalls(userId: string): Promise<number> {
  return MAX_CALLS;
}

// Register a new call for a user
export async function registerCall(userId: string): Promise<boolean> {
  return true;
} 