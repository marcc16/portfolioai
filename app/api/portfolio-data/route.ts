import { NextResponse } from 'next/server';
import { z } from 'zod';

const N8N_WEBHOOK_URL = 'https://n8n-n8n.7ywuv8.easypanel.host/webhook/b555ea4f-a203-4ac1-afcb-862f8b659600';

// Schema de validación con validaciones específicas para cada respuesta
const automationSchema = z.object({
  responses: z.tuple([
    z.string().min(1, "El tipo de agente de voz es requerido"),
    z.string().min(1, "Debe especificar los sistemas a integrar"),
    z.string().min(1, "Debe especificar cuándo desea agendar la llamada")
  ]),
  email: z.string().email("Debe proporcionar un correo electrónico válido")
});

export async function POST(request: Request) {
  console.log('🔵 [API] POST /api/portfolio-data - Recibida nueva solicitud');
  
  try {
    const data = await request.json();
    console.log('📥 [API] Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar los datos con Zod
    console.log('🔍 [API] Validando datos con Zod');
    const validatedData = automationSchema.safeParse(data);

    if (!validatedData.success) {
      console.error('❌ [API] Error de validación:', validatedData.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: validatedData.error.errors[0].message 
        },
        { status: 400 }
      );
    }
    
    console.log('✅ [API] Datos validados correctamente');
    
    // Formatear los datos para n8n
    const automationData = {
      agentType: validatedData.data.responses[0],
      integrations: validatedData.data.responses[1],
      contactInfo: validatedData.data.email,
      preferredCallTime: validatedData.data.responses[2],
      timestamp: new Date().toISOString(),
      source: "portfolio_voice_demo"
    };
    
    console.log('📤 [API] Enviando datos a n8n:', JSON.stringify(automationData, null, 2));
    console.log('🔗 [API] URL del webhook:', N8N_WEBHOOK_URL);

    // Enviar datos a n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(automationData),
    });

    console.log('📡 [API] Respuesta de n8n - Status:', n8nResponse.status);
    const responseText = await n8nResponse.text();
    console.log('📡 [API] Respuesta de n8n - Body:', responseText);

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook responded with status: ${n8nResponse.status}, body: ${responseText}`);
    }

    console.log('✅ [API] Datos enviados exitosamente a n8n');
    return NextResponse.json({ 
      success: true, 
      message: 'Lead data sent successfully to n8n' 
    });

  } catch (error) {
    console.error('❌ [API] Error procesando datos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process lead data' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🔵 [API] GET /api/portfolio-data - Verificando estado');
  return NextResponse.json({ 
    success: true, 
    message: 'Lead capture API is ready' 
  });
} 