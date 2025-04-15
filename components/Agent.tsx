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

  // Función auxiliar para verificar si un error indica fin de llamada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isCallEndError = (error: any): boolean => {
    const errorMsg = error?.errorMsg || error?.message || error?.toString();
    return CALL_END_ERRORS.some(msg => errorMsg.includes(msg));
  };

  // Función para procesar las respuestas y enviarlas al endpoint
  const processAndSendResponses = async (email: string) => {
    // Guardar el email para usarlo en el onCallEnd y onError
    setUserEmail(email);
    
    // Obtener las respuestas del usuario en orden
    const userMessages = messages.filter(msg => msg.role === "user");

    try {
      const response = await fetch('/api/portfolio-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: [
            userMessages[0]?.content || "",
            userMessages[1]?.content || ""
          ],
          email: email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send responses to server');
      }

      console.log('✅ [Agent] Respuestas enviadas exitosamente');
    } catch (error) {
      console.error('❌ [Agent] Error enviando respuestas:', error);
    }
  };

  // Configurar los listeners de Vapi
  useEffect(() => {
    const vapiInstance = vapi;
    if (!vapiInstance) return;

    const onCallStart = () => {
      console.log('🟢 [VAPI] Llamada iniciada');
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      console.log('🔴 [VAPI] Llamada finalizada');
      console.log('📝 [VAPI] Mensajes acumulados:', messages);
      setCallStatus(CallStatus.FINISHED);
      
      // Procesar y enviar respuestas cuando VAPI termina la llamada
      if (userEmail) {
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
        
        // Procesar y enviar respuestas cuando VAPI termina con error esperado
        if (userEmail) {
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
  }, [messages, userEmail]);

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
    } catch (error) {
      console.error("❌ [VAPI] Error iniciando llamada:", error);
      setCallStatus(CallStatus.INACTIVE);
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
    processAndSendResponses
  };
} 