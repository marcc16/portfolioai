import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://n8n-n4kv.onrender.com/webhook/portfolio';

export async function POST(request: Request) {
  console.log('🔵 [API] POST /api/portfolio-data - Recibida nueva solicitud');
  
  try {
    const data = await request.json();
    console.log('📥 [API] Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Extraer email y respuestas
    const { email, responses } = data;
    
    // Formatear los datos para n8n
    const automationData = {
      email,
      agentType: responses[0] || "",  // Primera respuesta después del "Sí, dime"
      integrations: responses[1] || "", // Segunda respuesta
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