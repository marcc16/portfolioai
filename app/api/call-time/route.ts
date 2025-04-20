import { NextRequest, NextResponse } from 'next/server';
import { getUserId, hasUsedCall, registerCallUsage } from '@/lib/upstash';

export async function GET(request: NextRequest) {
    try {
        const userId = getUserId(request);
        const hasUsed = await hasUsedCall(userId);
        
        return NextResponse.json({
            success: true,
            hasCallAvailable: !hasUsed,
            userId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error checking call availability:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to check call availability' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(request);
        
        // Verificar primero si ya usó su llamada
        const hasUsed = await hasUsedCall(userId);
        if (hasUsed) {
            return NextResponse.json(
                { success: false, message: 'Call already used', hasCallAvailable: false },
                { status: 403 }
            );
        }

        // Intentar registrar el uso
        const success = await registerCallUsage(userId);
        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Failed to register call', hasCallAvailable: true },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            hasCallAvailable: false,
            userId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error registering call:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to register call' },
            { status: 500 }
        );
    }
} 