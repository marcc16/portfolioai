'use client';
import { useState, useEffect, useRef } from "react";
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

interface VapiError {
  errorMsg?: string;
  message?: string;
  toString?: () => string;
  action?: string;
  callClientId?: string;
  error?: {
    type?: string;
    msg?: string;
    details?: unknown;
  };
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
  const [email, setEmail] = useState<string>("");
  const [showEmailForm, setShowEmailForm] = useState<boolean>(true);
  const messagesRef = useRef<SavedMessage[]>([]);
  const callStartTimeRef = useRef<number | null>(null);

  // Actualizar la ref cuando cambian los mensajes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Función para actualizar el tiempo de llamada
  const updateCallTime = async () => {
    if (!callStartTimeRef.current) return;

    const secondsUsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
    try {
      const response = await fetch('/api/call-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secondsUsed }),
      });

      if (!response.ok) {
        console.error('Error updating call time:', await response.text());
      }
    } catch (error) {
      console.error('Error updating call time:', error);
    }
  };

  // Función auxiliar para verificar si un error indica fin de llamada
  const isCallEndError = (error: VapiError): boolean => {
    const errorMsg = error?.errorMsg || error?.message || error?.toString?.() || '';
    return CALL_END_ERRORS.some(msg => errorMsg.includes(msg));
  };

  // Función para finalizar la llamada
  const handleDisconnect = async () => {
    if (!vapi) {
      console.error("❌ [VAPI] Voice assistant not initialized");
      return;
    }

    console.log('🔄 [VAPI] Finalizando llamada...');
    await updateCallTime();
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
    console.log('✅ [VAPI] Llamada finalizada manualmente');
  };

  // Configurar los listeners de Vapi
  useEffect(() => {
    const vapiInstance = vapi;
    if (!vapiInstance) return;

    const onCallStart = () => {
      console.log('🟢 [VAPI] Llamada iniciada');
      callStartTimeRef.current = Date.now();
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = async () => {
      console.log('🔴 [VAPI] Llamada finalizada');
      console.log('📝 [VAPI] Mensajes acumulados:', messagesRef.current);
      await updateCallTime();
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
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

    const onError = async (error: VapiError) => {
      console.error('❌ [VAPI] Error:', error);
      
      // Si el error indica fin de llamada, actualizamos el estado
      if (isCallEndError(error)) {
        console.log('🔄 [VAPI] Error de fin de llamada detectado, actualizando estado');
        await updateCallTime();
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
  }, []); // Removemos messages de las dependencias

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

    if (!email) {
      console.error("❌ [VAPI] Email is required");
      return;
    }

    try {
      console.log('🔄 [VAPI] Iniciando llamada...');
      setCallStatus(CallStatus.CONNECTING);
      setShowEmailForm(false);

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

  // Función para manejar el envío del email
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      handleCall();
    }
  };

  // Devolver las propiedades y métodos necesarios
  return {
    callStatus,
    isSpeaking,
    lastMessage,
    messages,
    email,
    setEmail,
    showEmailForm,
    handleEmailSubmit,
    handleDisconnect
  };
}

// Componente de visualización de la transcripción
export function TranscriptView({ messages, lastMessage }: { messages: SavedMessage[], lastMessage: string }) {
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Transcripción en tiempo real</h3>
        
        {/* Historial de mensajes */}
        <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg ${
                message.role === "assistant" ? "bg-blue-50" : "bg-gray-50"
              }`}
            >
              <span className="font-medium text-sm text-gray-500">
                {message.role === "assistant" ? "Asistente" : "Usuario"}:
              </span>
              <p className="mt-1">{message.content}</p>
            </div>
          ))}
        </div>

        {/* Último mensaje con animación */}
        {lastMessage && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p
              key={lastMessage}
              className="transition-opacity duration-500  animate-fadeIn opacity-100"
            >
              {lastMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal del agente
export default function Agent() {
  const {
    callStatus,
    lastMessage,
    messages,
    email,
    setEmail,
    showEmailForm,
    handleEmailSubmit,
    handleDisconnect
  } = useAgent();

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Controles de llamada */}
      <div className="flex flex-col items-center gap-4 mb-6">
        {showEmailForm ? (
          <form onSubmit={handleEmailSubmit} className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Antes de comenzar</h3>
              <p className="text-gray-600 mb-4">
                Por favor, introduce tu correo electrónico para recibir la confirmación de la reunión:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Iniciar llamada
                </button>
              </div>
            </div>
          </form>
        ) : callStatus !== "ACTIVE" ? (
          <button
            className={`px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors relative ${
              callStatus === "CONNECTING" ? "animate-pulse" : ""
            }`}
            onClick={handleEmailSubmit}
          >
            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Iniciar llamada"
                : "Conectando..."}
            </span>
          </button>
        ) : (
          <button
            className="px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            onClick={handleDisconnect}
          >
            Finalizar llamada
          </button>
        )}
      </div>

      {/* Visualización de la transcripción */}
      <TranscriptView messages={messages} lastMessage={lastMessage} />
    </div>
  );
} 