import { NextResponse } from 'next/server';
import { z } from 'zod';

const N8N_WEBHOOK_URL = 'https://n8n-n8n.7ywuv8.easypanel.host/webhook-test/b555ea4f-a203-4ac1-afcb-862f8b659600';

// Schema de validación con validaciones específicas para cada respuesta
const automationSchema = z.object({
  responses: z.tuple([
    z.string().min(1, "El tipo de agente de voz es requerido"),
    z.string().min(1, "Debe especificar los sistemas a integrar"),
    z.string().min(1, "Debe proporcionar nombre y correo electrónico"),
    z.string().min(1, "Debe especificar cuándo desea agendar la llamada")
  ])
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validar los datos con Zod
    const validatedData = automationSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validatedData.error.errors[0].message 
        },
        { status: 400 }
      );
    }
    
    // Formatear los datos para n8n
    const automationData = {
      agentType: validatedData.data.responses[0],
      integrations: validatedData.data.responses[1],
      contactInfo: validatedData.data.responses[2],
      preferredCallTime: validatedData.data.responses[3],
      timestamp: new Date().toISOString(),
      source: "portfolio_voice_demo"
    };

    // Enviar datos a n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(automationData),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook responded with status: ${n8nResponse.status}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead data sent successfully to n8n' 
    });

  } catch (error) {
    console.error('Error processing lead data:', error);
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
  return NextResponse.json({ 
    success: true, 
    message: 'Lead capture API is ready' 
  });
} 