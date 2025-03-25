import { NextRequest, NextResponse } from 'next/server';
import { getUserRemainingTime, updateUserTimeUsed } from '@/lib/upstash';

export async function GET(request: NextRequest) {
  // Obtener la IP del usuario
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

  // Forzar una verificación actualizada desde Redis
  const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';

  // Obtener tiempo restante con caché invalidada si se solicita
  const remainingTime = await getUserRemainingTime(ip, forceRefresh);

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
    const remainingTime = await getUserRemainingTime(ip, true);

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