'use client';
import { useState, useEffect } from "react";
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

// Hook personalizado para la gestión del agente de voz
export function useAgent() {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [hasProcessedResponses, setHasProcessedResponses] = useState(false);
  const [isProcessingResponses, setIsProcessingResponses] = useState(false);
  const [remainingCalls, setRemainingCalls] = useState<number>(1);

  // Función para verificar llamadas restantes
  const checkRemainingCalls = async () => {
    try {
      const response = await fetch('/api/call-time');
      const data = await response.json();
      setRemainingCalls(data.remainingCalls);
      return data.remainingCalls > 0;
    } catch (error: unknown) {
      console.error('Error checking remaining calls:', error);
      return false;
    }
  };

  // Cargar llamadas restantes al inicio
  useEffect(() => {
    checkRemainingCalls();
  }, []);

  // Función auxiliar para verificar si un error indica fin de llamada
  const isCallEndError = (error: unknown): boolean => {
    const errorMsg = (error as { errorMsg?: string, message?: string })?.errorMsg || 
                    (error as Error)?.message || 
                    String(error);
    return CALL_END_ERRORS.some(msg => errorMsg.includes(msg));
  };

  // Función para procesar las respuestas y enviarlas al endpoint
  const processAndSendResponses = async (email: string) => {
    // Evitar procesamiento duplicado y procesamiento simultáneo
    if (hasProcessedResponses || isProcessingResponses) {
      console.log('🚫 [Agent] Respuestas ya procesadas o en proceso, ignorando llamada');
      return;
    }

    try {
      setIsProcessingResponses(true);
      
      // Guardar el email para usarlo en el onCallEnd y onError
      setUserEmail(email);
      
      // Obtener las respuestas del usuario en orden
      const userMessages = messages.filter(msg => msg.role === "user");
      
      // Ignorar la primera respuesta ("Sí, dime") y tomar las siguientes dos
      const relevantResponses = userMessages.slice(1, 3);

      // Enviar las respuestas
      const response = await fetch('/api/portfolio-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: [
            relevantResponses[0]?.content || "",
            relevantResponses[1]?.content || ""
          ],
          email: email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send responses to server');
      }

      console.log('✅ [Agent] Respuestas enviadas exitosamente');
      setHasProcessedResponses(true);
    } catch (error) {
      console.error('❌ [Agent] Error enviando respuestas:', error);
    } finally {
      setIsProcessingResponses(false);
    }
  };

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

  // Función para iniciar la llamada
  const handleCall = async () => {
    if (!vapi) {
      console.error("❌ [VAPI] Voice assistant not initialized");
      return;
    }

    try {
      console.log('🔄 [VAPI] Iniciando llamada...');
      setCallStatus(CallStatus.CONNECTING);

      if (!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
        throw new Error("Workflow ID not configured");
      }

      console.log('🔗 [VAPI] Usando workflow ID:', process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID);
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID);
      console.log('✅ [VAPI] Llamada iniciada exitosamente');
    } catch (error: unknown) {
      console.error("❌ [VAPI] Error iniciando llamada:", error);
      setCallStatus(CallStatus.INACTIVE);
      throw error; // Propagar el error para que Hero pueda manejarlo
    }
  };

  // Función para finalizar la llamada
  const handleDisconnect = () => {
    if (!vapi) {
      console.error("❌ [VAPI] Voice assistant not initialized");
      return;
    }

    console.log('🔄 [VAPI] Finalizando llamada...');
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
    console.log('✅ [VAPI] Llamada finalizada manualmente');
  };

  // Devolver las propiedades y métodos necesarios
  return {
    callStatus,
    isSpeaking,
    messages,
    lastMessage,
    handleCall,
    handleDisconnect,
    processAndSendResponses,
    remainingCalls
  };
} 