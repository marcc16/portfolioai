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
    const ips = await redis.get<string[]>(EXEMPT_IPS_KEY);
    return ips || ['127.0.0.1'];
  } catch (error) {
    console.error('Error getting exempt IPs:', error);
    return ['127.0.0.1'];
  }
}

// Guardar las IPs exentas en Redis
async function saveExemptIPs(ips: string[]): Promise<void> {
  try {
    await redis.set(EXEMPT_IPS_KEY, ips);
  } catch (error) {
    console.error('Error saving exempt IPs:', error);
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
    
    // Comprobar si la IP ya está exenta
    if (exemptIPs.includes(ip)) {
      return NextResponse.json({
        message: 'IP is already exempt',
        exemptIPs
      });
    }
    
    // Añadir la nueva IP
    exemptIPs.push(ip);
    await saveExemptIPs(exemptIPs);
    
    return NextResponse.json({
      message: 'IP added to exempt list',
      exemptIPs
    });
  } catch (error) {
    console.error('Error adding exempt IP:', error);
    return NextResponse.json(
      { error: 'Failed to add IP to exempt list' },
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