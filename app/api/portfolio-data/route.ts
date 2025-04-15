import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://n8n-n8n.7ywuv8.easypanel.host/webhook/b555ea4f-a203-4ac1-afcb-862f8b659600';

<<<<<<< HEAD
// Schema de validación con validaciones específicas para cada respuesta
const automationSchema = z.object({
  responses: z.tuple([
    z.string().min(1, "El tipo de agente de voz es requerido"),
    z.string().min(1, "Debe especificar los sistemas a integrar"),
    z.string().min(1, "Debe especificar cuándo desea agendar la llamada")
  ]),
  email: z.string().email("Debe proporcionar un correo electrónico válido")
});

=======
>>>>>>> funciona-sin-email
export async function POST(request: Request) {
  console.log('🔵 [API] POST /api/portfolio-data - Recibida nueva solicitud');
  
  try {
    const data = await request.json();
    console.log('📥 [API] Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Extraer email y respuestas
    const { email, responses } = data;
    
    // Formatear los datos para n8n
    const automationData = {
<<<<<<< HEAD
      agentType: validatedData.data.responses[0],
      integrations: validatedData.data.responses[1],
      contactInfo: validatedData.data.email,
      preferredCallTime: validatedData.data.responses[2],
=======
      email,
      agentType: responses[0] || "",
      integrations: responses[1] || "",
      contactInfo: responses[2] || "",
      preferredCallTime: responses[3] || "",
>>>>>>> funciona-sin-email
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