import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Get unique user identifier from request
export function getUserId(request: NextRequest): string {
  // Get user IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'
  
  // Get user agent
  const userAgent = request.headers.get('user-agent') || ''
  
  // Combine IP and user agent for a more unique identifier
  return `${ip}:${userAgent}`
}

// Maximum allowed calls per user
const MAX_CALLS = 1

// Get remaining calls for a user
export async function getRemainingCalls(userId: string): Promise<number> {
  // Check if rate limiting is enabled
  if (process.env.ENABLE_RATE_LIMITING !== 'true') {
    return MAX_CALLS
  }

  const key = `calls:${userId}`
  const usedCalls = await redis.get<number>(key) || 0
  return Math.max(0, MAX_CALLS - usedCalls)
}

// Register a new call for a user
export async function registerCall(userId: string): Promise<boolean> {
  // Check if rate limiting is enabled
  if (process.env.ENABLE_RATE_LIMITING !== 'true') {
    return true
  }

  const key = `calls:${userId}`
  const usedCalls = await redis.get<number>(key) || 0
  
  // Check if user has remaining calls
  if (usedCalls >= MAX_CALLS) {
    return false
  }
  
  // Register the call permanently (no expiration)
  await redis.set(key, usedCalls + 1)
  return true
} 