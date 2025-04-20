import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getRemainingCalls, registerCall } from '@/lib/upstash';

export async function GET(request: NextRequest) {
    try {
        const userId = getUserId(request);
        const remainingCalls = await getRemainingCalls(userId);
        
        return NextResponse.json({
            success: true,
            remainingCalls,
            hasCallAvailable: remainingCalls > 0,
            userId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting remaining calls:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to get remaining calls' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(request);
        
        // Verificar primero si hay llamadas disponibles
        const remainingCalls = await getRemainingCalls(userId);
        if (remainingCalls <= 0) {
            return NextResponse.json({
                success: false,
                message: 'No calls available',
                remainingCalls: 0,
                hasCallAvailable: false
            });
        }

        // Registrar la llamada
        const success = await registerCall(userId);
        if (!success) {
            return NextResponse.json({
                success: false,
                message: 'Failed to register call',
                remainingCalls,
                hasCallAvailable: true
            });
        }

        // Obtener el número actualizado de llamadas restantes
        const updatedRemainingCalls = await getRemainingCalls(userId);

        return NextResponse.json({
            success: true,
            remainingCalls: updatedRemainingCalls,
            hasCallAvailable: updatedRemainingCalls > 0,
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