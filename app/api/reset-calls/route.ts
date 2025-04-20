import { NextRequest, NextResponse } from 'next/server';
import { redis, getUserId } from '@/lib/upstash';

export async function POST(request: NextRequest) {
    try {
        console.log('📥 Recibida solicitud de reset');
        const userId = getUserId(request);
        console.log('👤 User ID:', userId);
        
        // Solo permitir reset para usuarios admin
        if (userId !== 'admin-unlimited') {
            console.log('❌ Usuario no autorizado:', userId);
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Unauthorized - Only admin users can reset calls',
                    debug: {
                        userId,
                        isAdmin: userId === 'admin-unlimited'
                    }
                },
                { status: 403 }
            );
        }

        // Obtener el userId a resetear (si no se proporciona, se usa el del admin)
        const { targetUserId } = await request.json().catch(() => ({ targetUserId: null }));
        const keyToReset = `portfolio:calls:${targetUserId || userId}`;
        
        console.log('🔑 Reseteando key:', keyToReset);
        
        try {
            // Eliminar el registro de llamadas del usuario
            await redis.del(keyToReset);
            console.log('✅ Reset exitoso');
            
            return NextResponse.json({
                success: true,
                message: 'Calls reset successfully',
                resetKey: keyToReset
            });
        } catch (redisError) {
            console.error('❌ Error en Redis:', redisError);
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Failed to reset calls in Redis',
                    error: redisError instanceof Error ? redisError.message : String(redisError)
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('❌ Error general:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to reset calls',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 