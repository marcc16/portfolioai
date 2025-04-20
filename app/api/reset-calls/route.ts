import { NextRequest, NextResponse } from 'next/server';
import { getUserId, resetCallUsage } from '@/lib/upstash';

export async function POST(request: NextRequest) {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
    }

    try {
        const userId = getUserId(request);
        const success = await resetCallUsage(userId);

        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Failed to reset call' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Call reset successfully',
            userId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error resetting call:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to reset call' },
            { status: 500 }
        );
    }
} 