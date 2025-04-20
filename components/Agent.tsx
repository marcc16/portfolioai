'use client';
import { useState, useEffect, useCallback } from "react";
import { vapi } from "@/lib/vapi.sdk";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED"
}

interface Message {
  type: string;
  role: "user" | "system" | "assistant";
  transcript?: string;
  transcriptType?: string;
  action?: string;
  errorMsg?: string;
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

// Lista de errores esperados que indican fin de llamada
const CALL_END_ERRORS = [
  "Meeting has ended",
  "Meeting ended in error: Meeting has ended",
  "Exiting meeting because room was deleted"
];

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

// Hook personalizado para la gestión del agente de voz
export function useAgent() {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [hasProcessedResponses, setHasProcessedResponses] = useState(false);
  const [isProcessingResponses, setIsProcessingResponses] = useState(false);

  // Función para iniciar la llamada
  const handleCall = useCallback(async () => {
    try {
      console.log('🔄 [VAPI] Iniciando llamada...');
      const workflowId = process.env.NEXT_PUBLIC_N8N_WORKFLOW_ID;
      
      if (!workflowId) {
        throw new Error('Workflow ID not configured');
      }

      if (!N8N_WEBHOOK_URL) {
        throw new Error('Webhook URL not configured');
      }

      console.log('🔗 [VAPI] Usando workflow ID:', workflowId);
      
      // Iniciar la llamada sin verificar llamadas disponibles
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          action: 'start'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start call');
      }

      console.log('✅ [VAPI] Llamada iniciada exitosamente');
      setCallStatus(CallStatus.ACTIVE);
      console.log('🟢 [VAPI] Llamada iniciada');
    } catch (error) {
      console.error('❌ [VAPI] Error iniciando llamada:', error);
      setCallStatus(CallStatus.INACTIVE);
      throw error;
    }
  }, []);

  // Función auxiliar para verificar si un error indica fin de llamada
  const isCallEndError = (error: unknown): boolean => {
    const errorMsg = (error as { errorMsg?: string, message?: string })?.errorMsg || 
                    (error as Error)?.message || 
                    String(error);
    return CALL_END_ERRORS.some(msg => errorMsg.includes(msg));
  };

  // Función para procesar y enviar respuestas
  const processAndSendResponses = useCallback(async (email: string) => {
    try {
      // Enviar respuestas al servidor
      const response = await fetch('/api/portfolio-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send responses to server');
      }

      // Limpiar mensajes después de enviarlos
      setMessages([]);
    } catch (error) {
      console.error('❌ [Agent] Error enviando respuestas:', error);
      throw error;
    }
  }, [messages]);

  // Configurar los listeners de Vapi
  useEffect(() => {
    const vapiInstance = vapi;
    if (!vapiInstance) return;

    const onCallStart = () => {
      console.log('🟢 [VAPI] Llamada iniciada');
      setCallStatus(CallStatus.ACTIVE);
      setHasProcessedResponses(false);
      setIsProcessingResponses(false);
    };

    const onCallEnd = () => {
      console.log('🔴 [VAPI] Llamada finalizada');
      console.log('📝 [VAPI] Mensajes acumulados:', messages);
      setCallStatus(CallStatus.FINISHED);
      
      // Procesar y enviar respuestas solo cuando VAPI termina la llamada normalmente
      if (userEmail && !hasProcessedResponses && !isProcessingResponses) {
        processAndSendResponses(userEmail);
      }
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        console.log(`💬 [VAPI] Nuevo mensaje (${message.role}):`, message.transcript);
        const newMessage = { role: message.role, content: message.transcript || "" };
        setMessages(prev => [...prev, newMessage]);
        setLastMessage(message.transcript || "");
      }
    };

    const onSpeechStart = () => {
      console.log("🎤 [VAPI] Inicio de habla");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("🎤 [VAPI] Fin de habla");
      setIsSpeaking(false);
    };

    const onError = (error: Error | unknown) => {
      console.error('❌ [VAPI] Error:', error);
      
      // Si el error indica fin de llamada, actualizamos el estado y procesamos respuestas
      if (isCallEndError(error)) {
        console.log('🔄 [VAPI] Error de fin de llamada detectado, actualizando estado');
        setCallStatus(CallStatus.FINISHED);
        setIsSpeaking(false);
        
        // Procesar y enviar respuestas solo cuando la llamada termina por error esperado
        if (userEmail && !hasProcessedResponses && !isProcessingResponses) {
          processAndSendResponses(userEmail);
        }
      }
    };

    console.log('🔄 [VAPI] Configurando listeners');
    
    // Configurar los listeners
    vapiInstance.on("call-start", onCallStart);
    vapiInstance.on("call-end", onCallEnd);
    vapiInstance.on("message", onMessage);
    vapiInstance.on("speech-start", onSpeechStart);
    vapiInstance.on("speech-end", onSpeechEnd);
    vapiInstance.on("error", onError);

    return () => {
      console.log('🧹 [VAPI] Limpiando listeners');
      vapiInstance.off("call-start", onCallStart);
      vapiInstance.off("call-end", onCallEnd);
      vapiInstance.off("message", onMessage);
      vapiInstance.off("speech-start", onSpeechStart);
      vapiInstance.off("speech-end", onSpeechEnd);
      vapiInstance.off("error", onError);
    };
  }, [messages, userEmail, hasProcessedResponses, isProcessingResponses, processAndSendResponses]);

  // Función para finalizar la llamada
  const handleDisconnect = useCallback(() => {
    try {
      console.log('🔄 [VAPI] Finalizando llamada...');
      // Aquí iría la lógica para finalizar la llamada con n8n
      console.log('✅ [VAPI] Llamada finalizada manualmente');
      setCallStatus(CallStatus.FINISHED);
      console.log('🔴 [VAPI] Llamada finalizada');
      console.log('📝 [VAPI] Mensajes acumulados:', messages);
    } catch (error) {
      console.error('❌ [VAPI] Error finalizando llamada:', error);
      throw error;
    }
  }, [messages]);

  // Devolver las propiedades y métodos necesarios
  return {
    callStatus,
    isSpeaking,
    messages,
    lastMessage,
    handleCall,
    handleDisconnect,
    processAndSendResponses
  };
} 