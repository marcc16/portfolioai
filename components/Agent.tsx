'use client';
import { useState, useEffect, useCallback } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  IDLE = "IDLE",
  ERROR = "ERROR"
}

interface Message {
  type: string;
  role: "user" | "system" | "assistant";
  transcript?: string;
  transcriptType?: string;
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

// Lista de errores esperados que no deben mostrarse en la consola
const EXPECTED_ERRORS = [
  "Meeting has ended",
  "Meeting ended in error: Meeting has ended",
  "browser- or platform-unsupported input processor(s): audio"
];

// Hook personalizado para la gestión del agente de voz
export function useAgent() {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Función auxiliar para determinar si un error es esperado y no debe mostrarse
  const isExpectedError = useCallback((errorMessage: string) => {
    return EXPECTED_ERRORS.some(expected => errorMessage.includes(expected));
  }, []);

  // Configurar los listeners de Vapi
  useEffect(() => {
    if (!vapi) return;

    const handleCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      setMessages([]);
      setError(null);
    };

    const handleCallEnd = () => {
      setCallStatus(CallStatus.IDLE);
      setMessages([]);
      setError(null);
    };

    const handleMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const savedMessage: SavedMessage = {
          role: message.role,
          content: message.transcript || ""
        };
        setMessages(prev => [...prev, savedMessage]);
        setLastMessage(savedMessage.content);
      }
    };

    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);

    const handleError = (error: Error) => {
      console.error('Vapi error:', error);
      if (!isExpectedError(error.message)) {
        setError(error.message);
      }
    };

    // Guardar la referencia a vapi para la limpieza
    const vapiInstance = vapi;

    vapiInstance.on("call-start", handleCallStart);
    vapiInstance.on("call-end", handleCallEnd);
    vapiInstance.on("message", handleMessage);
    vapiInstance.on("speech-start", handleSpeechStart);
    vapiInstance.on("speech-end", handleSpeechEnd);
    vapiInstance.on("error", handleError);

    return () => {
      if (vapiInstance) {
        vapiInstance.off("call-start", handleCallStart);
        vapiInstance.off("call-end", handleCallEnd);
        vapiInstance.off("message", handleMessage);
        vapiInstance.off("speech-start", handleSpeechStart);
        vapiInstance.off("speech-end", handleSpeechEnd);
        vapiInstance.off("error", handleError);
      }
    };
  }, [isExpectedError]);

  // Actualizar el último mensaje cuando cambia la lista de mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  // Función para iniciar la llamada
  const handleCall = async () => {
    if (!vapi) {
      console.error("No se puede iniciar la llamada: Vapi no está inicializado");
      setError("Voice assistant not initialized");
      return;
    }

    try {
      console.log("Iniciando llamada...");
      setCallStatus(CallStatus.CONNECTING);
      setError(null);
      
      if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
        throw new Error("Voice assistant token not configured");
      }

      console.log("Configuración del asistente:", interviewer);
      await vapi.start(interviewer);
      console.log("Llamada iniciada exitosamente");
    } catch (err) {
      if (err instanceof Error && !isExpectedError(err.message)) {
        console.error("Error iniciando llamada:", err.message);
        setError(err.message);
        setCallStatus(CallStatus.ERROR);
      }
    }
  };

  // Función para finalizar la llamada
  const handleDisconnect = () => {
    if (!vapi) {
      console.error("No se puede finalizar la llamada: Vapi no está inicializado");
      setError("Voice assistant not initialized");
      return;
    }

    try {
      console.log("Finalizando llamada...");
      setCallStatus(CallStatus.FINISHED);
      vapi.stop();
      console.log("Llamada finalizada exitosamente");
    } catch (err) {
      if (err instanceof Error && !isExpectedError(err.message)) {
        console.error("Error finalizando llamada:", err.message);
        setError(err.message);
      }
    }
  };

  // Devolver las propiedades y métodos necesarios
  return {
    callStatus,
    isSpeaking,
    lastMessage,
    error,
    handleCall,
    handleDisconnect
  };
} 