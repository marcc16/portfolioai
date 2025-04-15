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
export function useAgent(userEmail: string) {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [responses, setResponses] = useState({
    agentType: "",
    integrations: "",
    preferredCallTime: ""
  });

  // Función auxiliar para verificar si un error indica fin de llamada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isCallEndError = (error: any): boolean => {
    const errorMsg = error?.errorMsg || error?.message || error?.toString();
    return CALL_END_ERRORS.some(msg => errorMsg.includes(msg));
  };

  // Función para procesar las respuestas y enviarlas al endpoint
  const processAndSendResponses = async () => {
    // Obtener las respuestas del usuario en orden
    const userMessages = messages.filter(msg => msg.role === "user");
    
    // Actualizar las respuestas en orden
    setResponses({
      agentType: userMessages[0]?.content || "",
      integrations: userMessages[1]?.content || "",
      preferredCallTime: userMessages[2]?.content || ""
    });

    try {
      const response = await fetch('/api/portfolio-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: [
            userMessages[0]?.content || "",
            userMessages[1]?.content || "",
            userMessages[2]?.content || ""
          ],
          email: userEmail
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
      // Procesar y enviar respuestas cuando termina la llamada
      processAndSendResponses();
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

    const onError = (error: Error | unknown) => {
      console.error('❌ [VAPI] Error:', error);
      
      // Si el error indica fin de llamada, actualizamos el estado
      if (isCallEndError(error)) {
        console.log('🔄 [VAPI] Error de fin de llamada detectado, actualizando estado');
        setCallStatus(CallStatus.FINISHED);
        setIsSpeaking(false);
        // También procesamos las respuestas en caso de error de fin de llamada
        processAndSendResponses();
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
    messages,
    lastMessage,
    responses,
    handleCall,
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

// Componente principal que utiliza el hook
export default function Agent({ userEmail }: { userEmail: string }) {
  const {
    callStatus,
    isSpeaking,
    messages,
    lastMessage,
    responses,
    handleCall,
    handleDisconnect
  } = useAgent(userEmail);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Estado de la llamada */}
      <div className="text-center mb-6">
        <p className="text-lg font-medium">
          Estado: {" "}
          <span className={`${
            callStatus === "ACTIVE" ? "text-green-600" :
            callStatus === "CONNECTING" ? "text-yellow-600" :
            callStatus === "FINISHED" ? "text-red-600" :
            "text-gray-600"
          }`}>
            {callStatus === "ACTIVE" ? "En llamada" :
             callStatus === "CONNECTING" ? "Conectando..." :
             callStatus === "FINISHED" ? "Llamada finalizada" :
             "Listo para llamar"}
          </span>
          {isSpeaking && callStatus === "ACTIVE" && (
            <span className="ml-2 inline-block animate-pulse">🎤</span>
          )}
        </p>
      </div>

      {/* Controles de llamada */}
      <div className="flex flex-col items-center gap-4 mb-6">
        {callStatus !== "ACTIVE" ? (
          <button
            className={`px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors relative ${
              callStatus === "CONNECTING" ? "animate-pulse" : ""
            }`}
            onClick={handleCall}
          >
            <span className="relative">
              {callStatus === "CONNECTING" ? "Conectando..." : "Iniciar llamada"}
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

      {/* Transcripción en tiempo real */}
      <div className="bg-gray-50 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Transcripción en tiempo real</h3>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === "assistant"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {message.role === "assistant" ? "Asistente" : "Tú"}:
              </p>
              <p>{message.content}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              La transcripción aparecerá aquí durante la llamada...
            </p>
          )}
        </div>

        {/* Último mensaje con animación */}
        {lastMessage && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p
              key={lastMessage}
              className="transition-opacity duration-500 animate-fadeIn opacity-100"
            >
              {lastMessage}
            </p>
          </div>
        )}

        {/* Resumen de respuestas cuando la llamada finaliza */}
        {callStatus === CallStatus.FINISHED && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-3">Resumen de la conversación:</h4>
            <div className="space-y-2">
              <p><strong>Tipo de agente:</strong> {responses.agentType}</p>
              <p><strong>Integraciones:</strong> {responses.integrations}</p>
              <p><strong>Horario preferido:</strong> {responses.preferredCallTime}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 