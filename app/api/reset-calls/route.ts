import { NextRequest, NextResponse } from 'next/server';
import { redis, getUserId } from '@/lib/upstash';

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(request);
        
        // Solo permitir reset para usuarios admin
        if (userId !== 'admin-unlimited') {
            return NextResponse.json(
                { success: false, message: 'Unauthorized - Only admin users can reset calls' },
                { status: 403 }
            );
        }

        // Obtener el userId a resetear (si no se proporciona, se usa el del admin)
        const { targetUserId } = await request.json().catch(() => ({ targetUserId: null }));
        const keyToReset = `portfolio:calls:${targetUserId || userId}`;
        
        // Eliminar el registro de llamadas del usuario
        await redis.del(keyToReset);
        
        return NextResponse.json({
            success: true,
            message: 'Calls reset successfully',
            resetKey: keyToReset
        });
    } catch (error) {
        console.error('Error resetting calls:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to reset calls' },
            { status: 500 }
        );
    }
} 