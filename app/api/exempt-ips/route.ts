import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for exempt IPs
let exemptIPs: string[] = ['127.0.0.1'];

// Contraseña para administrar las IPs exentas (¡cámbiala!)
const ADMIN_PASSWORD = 'tu-contraseña-secreta';

// Obtener las IPs exentas
async function getExemptIPs(): Promise<string[]> {
  return exemptIPs;
}

// Guardar las IPs exentas
async function saveExemptIPs(ips: string[]): Promise<void> {
  exemptIPs = ips;
}

// GET: Obtener la lista de IPs exentas
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  
  // Verificar la contraseña
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return NextResponse.json({ exemptIPs });
}

// POST: Añadir una IP a la lista de exentas
export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    
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