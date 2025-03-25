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

  // Función auxiliar para verificar si un error indica fin de llamada
  const isCallEndError = (error: any): boolean => {
    const errorMsg = error?.errorMsg || error?.message || error?.toString();
    return CALL_END_ERRORS.some(msg => errorMsg.includes(msg));
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
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        console.log(`💬 [VAPI] Nuevo mensaje (${message.role}):`, message.transcript);
        const newMessage = { role: message.role, content: message.transcript || "" };
        setMessages(prev => [...prev, newMessage]);
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

    const onError = (error: Error | any) => {
      console.error('❌ [VAPI] Error:', error);
      
      // Si el error indica fin de llamada, actualizamos el estado
      if (isCallEndError(error)) {
        console.log('🔄 [VAPI] Error de fin de llamada detectado, actualizando estado');
        setCallStatus(CallStatus.FINISHED);
        setIsSpeaking(false);
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
  }, [messages]); // Añadimos messages como dependencia para poder acceder a su valor actualizado en onCallEnd

  // Actualizar el último mensaje cuando cambia la lista de mensajes
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1].content;
      console.log('📜 [VAPI] Último mensaje actualizado:', lastMsg);
      setLastMessage(lastMsg);
    }
  }, [messages]);

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
    lastMessage,
    messages,
    handleCall,
    handleDisconnect
  };
} 