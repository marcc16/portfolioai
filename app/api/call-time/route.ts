import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for user time tracking
const userTimeUsed: { [key: string]: number } = {};
const MAX_TIME_PER_USER = 3600; // 1 hour in seconds

// Get remaining time for a user
async function getUserRemainingTime(ip: string): Promise<number> {
  const timeUsed = userTimeUsed[ip] || 0;
  return Math.max(0, MAX_TIME_PER_USER - timeUsed);
}

// Update time used by a user
async function updateUserTimeUsed(ip: string, secondsUsed: number): Promise<void> {
  const currentTimeUsed = userTimeUsed[ip] || 0;
  userTimeUsed[ip] = Math.min(MAX_TIME_PER_USER, currentTimeUsed + secondsUsed);
}

export async function GET(request: NextRequest) {
  // Obtener la IP del usuario
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

  // Obtener tiempo restante
  const remainingTime = await getUserRemainingTime(ip);

  return NextResponse.json({ 
    remainingTime,
    ip, // Devolvemos la IP para debug
    timestamp: new Date().toISOString() 
  });
}

export async function POST(request: NextRequest) {
  try {
    const { secondsUsed } = await request.json();
    
    // Obtener la IP del usuario
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

    // Actualizar el tiempo usado
    await updateUserTimeUsed(ip, secondsUsed);

    // Obtener el nuevo tiempo restante
    const remainingTime = await getUserRemainingTime(ip);

    return NextResponse.json({ 
      success: true, 
      remainingTime, 
      ip, // Devolvemos la IP para debug
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error updating call time:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update call time' },
      { status: 500 }
    );
  }
} 