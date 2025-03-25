'use client';
import Vapi from "@vapi-ai/web";

// Inicializar Vapi solo cuando estemos en el cliente
const getVapi = () => {
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
        console.error("Vapi public key not found");
        return null;
    }

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
    
    // Configurar el manejador de errores
    vapi.on("error", (error: Error) => {
        // Suprimir el error específico del procesador de audio
        if (error.message?.includes("browser- or platform-unsupported input processor(s): audio")) {
            return;
        }
        console.error("Vapi error:", error);
    });

    return vapi;
};

export const vapi = typeof window !== 'undefined' ? getVapi() : null;