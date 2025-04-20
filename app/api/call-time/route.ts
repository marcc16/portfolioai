import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getRemainingCalls, registerCall } from '@/lib/upstash';

export async function GET(request: NextRequest) {
    try {
        console.log('📥 GET /api/call-time - Verificando llamadas disponibles');
        const userId = getUserId(request);
        console.log('👤 User ID:', userId);
        
        const remainingCalls = await getRemainingCalls(userId);
        console.log('📊 Llamadas restantes:', remainingCalls);
        
        return NextResponse.json({
            success: true,
            remainingCalls,
            hasCallAvailable: remainingCalls > 0,
            userId,
            isAdmin: userId === 'admin-unlimited',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting remaining calls:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to get remaining calls',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('📥 POST /api/call-time - Registrando nueva llamada');
        const userId = getUserId(request);
        console.log('👤 User ID:', userId);
        
        // Verificar primero si hay llamadas disponibles
        const remainingCalls = await getRemainingCalls(userId);
        console.log('📊 Llamadas restantes antes del registro:', remainingCalls);
        
        if (remainingCalls <= 0) {
            console.log('❌ No hay llamadas disponibles');
            return NextResponse.json({
                success: false,
                message: 'No calls available',
                remainingCalls: 0,
                hasCallAvailable: false,
                isAdmin: userId === 'admin-unlimited'
            });
        }

        // Registrar la llamada
        console.log('📝 Registrando llamada...');
        const success = await registerCall(userId);
        
        if (!success) {
            console.error('❌ Error al registrar la llamada');
            return NextResponse.json({
                success: false,
                message: 'Failed to register call',
                remainingCalls,
                hasCallAvailable: true,
                isAdmin: userId === 'admin-unlimited'
            }, { status: 500 });
        }

        // Obtener el número actualizado de llamadas restantes
        const updatedRemainingCalls = await getRemainingCalls(userId);
        console.log('📊 Llamadas restantes después del registro:', updatedRemainingCalls);

        return NextResponse.json({
            success: true,
            remainingCalls: updatedRemainingCalls,
            hasCallAvailable: updatedRemainingCalls > 0,
            userId,
            isAdmin: userId === 'admin-unlimited',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error registering call:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to register call',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 