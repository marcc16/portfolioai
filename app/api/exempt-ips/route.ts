import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/upstash';

const EXEMPT_IPS_KEY = 'portfolio:exempt_ips';

// Obtener la contraseña de administrador desde las variables de entorno
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('⚠️ ADMIN_PASSWORD environment variable is not set');
}

// Obtener las IPs exentas de Redis
async function getExemptIPs(): Promise<string[]> {
  try {
    console.log('🔍 Obteniendo IPs exentas de Redis');
    const ips = await redis.get<string[]>(EXEMPT_IPS_KEY);
    console.log('📋 IPs obtenidas de Redis:', ips);
    
    if (!ips) {
      console.log('ℹ️ No hay IPs guardadas, usando valor por defecto');
      return ['127.0.0.1'];
    }
    
    if (!Array.isArray(ips)) {
      console.error('❌ El valor en Redis no es un array:', ips);
      return ['127.0.0.1'];
    }
    
    return ips;
  } catch (error) {
    console.error('❌ Error getting exempt IPs:', error);
    return ['127.0.0.1'];
  }
}

// Guardar las IPs exentas en Redis
async function saveExemptIPs(ips: string[]): Promise<void> {
  try {
    console.log('📝 Guardando IPs exentas en Redis:', ips);
    const result = await redis.set(EXEMPT_IPS_KEY, ips);
    console.log('✅ IPs guardadas en Redis:', result);
    
    // Verificar que se guardaron correctamente
    const savedIPs = await redis.get<string[]>(EXEMPT_IPS_KEY);
    console.log('🔍 IPs recuperadas de Redis:', savedIPs);
    
    if (!savedIPs || !Array.isArray(savedIPs)) {
      throw new Error('Failed to verify saved IPs');
    }
  } catch (error) {
    console.error('❌ Error saving exempt IPs:', error);
    throw error; // Re-throw para manejar el error en el endpoint
  }
}

// GET: Obtener la lista de IPs exentas
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  
  // Verificar que la contraseña está configurada
  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Admin password not configured on server' },
      { status: 500 }
    );
  }
  
  // Verificar la contraseña
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const exemptIPs = await getExemptIPs();
  return NextResponse.json({ exemptIPs });
}

// POST: Añadir una IP a la lista de exentas
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Nueva solicitud POST para añadir IP exenta');
    const password = request.headers.get('x-admin-password');
    
    // Verificar que la contraseña está configurada
    if (!ADMIN_PASSWORD) {
      console.error('❌ ADMIN_PASSWORD no está configurada en el servidor');
      return NextResponse.json(
        { error: 'Admin password not configured on server' },
        { status: 500 }
      );
    }
    
    // Verificar la contraseña
    if (password !== ADMIN_PASSWORD) {
      console.error('❌ Contraseña incorrecta');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    console.log('📋 Datos recibidos:', body);
    const { ip } = body;
    
    // Validar la IP
    if (!ip || typeof ip !== 'string') {
      console.error('❌ IP inválida:', ip);
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400 }
      );
    }
    
    // Obtener IPs actuales
    console.log('🔍 Obteniendo lista actual de IPs exentas');
    const exemptIPs = await getExemptIPs();
    
    // Comprobar si la IP ya está exenta
    if (exemptIPs.includes(ip)) {
      console.log('ℹ️ La IP ya está en la lista:', ip);
      return NextResponse.json({
        message: 'IP is already exempt',
        exemptIPs
      });
    }
    
    // Añadir la nueva IP
    console.log('➕ Añadiendo nueva IP a la lista:', ip);
    exemptIPs.push(ip);
    await saveExemptIPs(exemptIPs);
    
    console.log('✅ IP añadida exitosamente');
    return NextResponse.json({
      message: 'IP added to exempt list',
      exemptIPs
    });
  } catch (error) {
    console.error('❌ Error adding exempt IP:', error);
    return NextResponse.json(
      { error: 'Failed to add IP to exempt list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una IP de la lista de exentas
export async function DELETE(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    
    // Verificar que la contraseña está configurada
    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Admin password not configured on server' },
        { status: 500 }
      );
    }
    
    // Verificar la contraseña
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { ip } = await request.json();
    
    // Validar la IP
    if (!ip || typeof ip !== 'string') {
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400 }
      );
    }
    
    // Obtener IPs actuales
    const exemptIPs = await getExemptIPs();
    
    // Filtrar la IP a eliminar
    const updatedIPs = exemptIPs.filter(exemptIP => exemptIP !== ip);
    
    // Guardar la lista actualizada
    await saveExemptIPs(updatedIPs);
    
    return NextResponse.json({
      message: 'IP removed from exempt list',
      exemptIPs: updatedIPs
    });
  } catch (error) {
    console.error('Error removing exempt IP:', error);
    return NextResponse.json(
      { error: 'Failed to remove IP from exempt list' },
      { status: 500 }
    );
  }
} 