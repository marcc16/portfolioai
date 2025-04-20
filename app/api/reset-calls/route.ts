import { NextRequest, NextResponse } from 'next/server';
import { redis, getUserId } from '@/lib/upstash';

export async function POST(request: NextRequest) {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { success: false, message: 'Reset only available in development mode' },
            { status: 403 }
        );
    }

    try {
        const userId = getUserId(request);
        const key = `calls:${userId}`;
        
        // Eliminar el registro de llamadas del usuario
        await redis.del(key);
        
        return NextResponse.json({
            success: true,
            message: 'Calls reset successfully'
        });
    } catch (error) {
        console.error('Error resetting calls:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to reset calls' },
            { status: 500 }
        );
    }
} 