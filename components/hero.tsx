'use client';
import { ParticleCanvas } from "@/hooks/particle";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { FaMicrophone, FaPhoneSlash } from "react-icons/fa";
import { useAgent } from "./Agent";

export default function Hero() {
    const {scrollY} = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 100]);

    // Validar el formato del email
    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = re.test(email);
        console.log('🔍 Validando email:', email, 'Resultado:', isValid);
        return isValid;
    };

    const [isCallActive, setIsCallActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [hasCallAvailable, setHasCallAvailable] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(false);
    
    // Usar el hook de agente sin email
    const agent = useAgent();

    // Cargar email del localStorage al montar el componente
    useEffect(() => {
        const savedEmail = localStorage.getItem('userEmail') || '';
        if (savedEmail) {
            setEmail(savedEmail);
            setIsEmailValid(validateEmail(savedEmail));
        }
    }, []);

    // Función para verificar disponibilidad de llamada
    const checkCallAvailability = useCallback(async () => {
        try {
            const response = await fetch('/api/call-time');
            const data = await response.json();
            
            if (!data.success) {
                console.error('Error checking call availability:', data.message);
                setError('Error checking call availability');
                return;
            }
            
            console.log('📞 Estado de disponibilidad:', data);
            setHasCallAvailable(data.hasCallAvailable);
        } catch (err) {
            console.error("❌ Error checking call availability:", err);
            setHasCallAvailable(false);
            setError('Error checking call availability');
        }
    }, []);

    // Verificar disponibilidad al cargar y después de cada llamada
    useEffect(() => {
        checkCallAvailability();
    }, [checkCallAvailability]);

    const handleCallStart = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        
        try {
            // Verificamos disponibilidad
            const checkResponse = await fetch('/api/check-call-availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const { available } = await checkResponse.json();
            
            if (!available) {
                console.log('❌ No hay llamadas disponibles');
                setIsLoading(false);
                return;
            }

            // Iniciamos la llamada
            const startResponse = await fetch('/api/start-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await startResponse.json();
            
            if (data.error?.includes('workflow')) {
                console.error('Error en la configuración del workflow:', data.error);
                setIsLoading(false);
                return;
            }

            console.log('✅ Llamada iniciada:', data);
            
            // Actualizamos el estado después de iniciar la llamada
            checkCallAvailability();
        } catch (error) {
            console.error('Error starting call:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCallEnd = useCallback(async () => {
        if (!agent) {
            setError("Voice assistant not initialized. Please refresh the page.");
            return;
        }
        
        try {
            console.log('📞 Finalizando llamada...');
            agent.handleDisconnect();
            setError(null);
            setIsCallActive(false);
            
            // Procesar y enviar respuestas con el email
            await agent.processAndSendResponses(email);
            
            // Verificar disponibilidad después de terminar la llamada
            await checkCallAvailability();
        } catch (err) {
            console.error("❌ Error ending call:", err);
            setError(err instanceof Error ? err.message : "Failed to end call");
            // Verificar disponibilidad incluso si hay error
            await checkCallAvailability();
        }
    }, [agent, email, checkCallAvailability]);

    // Manejador para el botón de reset
    const resetCall = async () => {
        if (process.env.NODE_ENV !== 'development') {
            console.log('❌ Reset solo disponible en desarrollo');
            return;
        }
        
        try {
            console.log('🔄 Reseteando llamada...');
            const response = await fetch('/api/reset-calls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            console.log('✅ Llamada reseteada:', data);
            
            // Actualizamos el estado después del reset
            checkCallAvailability();
        } catch (error) {
            console.error('Error resetting call:', error);
        }
    };

    // Manejador específico para el botón de colgar
    const handleHangupClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleCallEnd();
    };

    return (
        <section className="min-h-screen relative overflow-hidden bg-black">
            <ParticleCanvas/>
            
            <div className="max-w-7xl mx-auto px-6 pt-32">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Text content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="relative group lg:w-1/2"
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="text-6xl md:text-8xl font-bold bg-gradient-to-r
                            from-primary via-secondary to-tertiary 
                            bg-clip-text text-transparent mb-6"
                        >
                            AI Voice Agents &
                            <br />
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="bg-gradient-to-r from-primary via-secondary
                                to-tertiary bg-clip-text text-transparent"
                            >
                                Automation
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.1 }}
                            className="text-lg text-white/80 mb-8"
                        >
                            Experience firsthand how AI voice agents can transform your business. 
                            Talk to my demo agent and receive a personalized automation proposal 
                            showcasing Vapi, NextJS, n8n, and cutting-edge integrations that can save you 
                            time and reduce costs.
                        </motion.p>

                        {/* Email input */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.4 }}
                            className="mb-6"
                        >
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    const newEmail = e.target.value;
                                    console.log('�� Cambio en el email:', newEmail);
                                    setEmail(newEmail);
                                    const isValid = validateEmail(newEmail);
                                    console.log('✅ Email válido:', isValid);
                                    setIsEmailValid(isValid);
                                    if (isValid) {
                                        // Guardar email válido en localStorage
                                        localStorage.setItem('userEmail', newEmail);
                                        console.log('💾 Email guardado en localStorage');
                                    }
                                }}
                                placeholder="Enter your email to start"
                                className={`w-full px-4 py-3 rounded-lg bg-white/10 text-white border ${
                                    email && !isEmailValid ? 'border-red-500' : 'border-white/20'
                                } focus:outline-none focus:border-primary transition-colors`}
                            />
                            {email && !isEmailValid && (
                                <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>
                            )}
                            <p className="text-white/60 text-sm mt-2">
                                Enter your real email to receive a personalized AI automation proposal
                            </p>
                        </motion.div>

                        {/* Call controls and info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.7 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-4">
                                {!isCallActive && agent.callStatus !== "FINISHED" ? (
                                    <button
                                        onClick={handleCallStart}
                                        disabled={!isEmailValid || !hasCallAvailable || isLoading}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-full ${
                                            isEmailValid && hasCallAvailable && !isLoading
                                                ? 'bg-primary hover:bg-primary/80'
                                                : 'bg-gray-500 cursor-not-allowed'
                                        } text-white font-medium transition-colors`}
                                    >
                                        <FaMicrophone className="text-lg" />
                                        {isLoading 
                                            ? 'Starting...'
                                            : !isEmailValid 
                                                ? 'Enter valid email'
                                                : !hasCallAvailable 
                                                    ? 'No Calls Available' 
                                                    : 'Start Call'}
                                    </button>
                                ) : isCallActive ? (
                                    <button
                                        onClick={handleHangupClick}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                                    >
                                        <FaPhoneSlash className="text-lg" />
                                        End Call
                                    </button>
                                ) : null}
                            </div>

                            {/* Remaining calls info */}
                            <div className="text-white/60 text-sm flex items-center gap-2">
                                <span>{hasCallAvailable ? "You have 1 call available" : "No calls available"}</span>
                                <span className="text-xs">•</span>
                                <span>Each call is limited to 1 minute</span>
                                {/* Reset button - solo en desarrollo */}
                                {process.env.NODE_ENV === 'development' && (
                                    <button
                                        onClick={resetCall}
                                        disabled={isLoading}
                                        className={`ml-4 px-2 py-1 text-xs ${
                                            isLoading 
                                                ? 'bg-gray-500 cursor-not-allowed'
                                                : 'bg-yellow-500 hover:bg-yellow-600'
                                        } text-black rounded transition-colors`}
                                    >
                                        {isLoading ? 'Resetting...' : 'Reset Call (Dev)'}
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        {/* Error message */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-500 mt-4"
                            >
                                {error}
                            </motion.p>
                        )}
                    </motion.div>

                    {/* AI Assistant Avatar */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        className="lg:w-1/2 relative"
                        style={{y}}
                    >
                        <div className="relative w-full aspect-square group">
                            {/* Avatar Container */}
                            <motion.div
                                animate={isCallActive && agent.callStatus === "ACTIVE" ? 
                                    { scale: [1, 1.02, 1], transition: { duration: 2, repeat: Infinity }} : 
                                    { y: [0, -20, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                }
                                className="relative w-full aspect-square rounded-full overflow-hidden
                                border border-white/10 bg-surface/30 backdrop-blur-sm"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src="/portfolio.jpg"
                                        alt="Portfolio"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            </motion.div>

                            {/* Overlay para elementos de la llamada */}
                            <AnimatePresence>
                                {isCallActive && agent.callStatus === "ACTIVE" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex flex-col justify-between p-8"
                                    >
                                        {/* Timer */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="mx-auto bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full
                                            text-white text-lg font-medium border border-white/20"
                                        >
                                            1:00
                                        </motion.div>
                                        
                                        {/* Botón de colgar */}
                                        <motion.button
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            onClick={handleHangupClick}
                                            className="mx-auto bg-red-500 hover:bg-red-600 p-4 rounded-full
                                            transition-colors w-16 h-16 flex items-center justify-center
                                            rotate-[135deg] shadow-lg hover:shadow-red-500/20 cursor-pointer
                                            z-50"
                                        >
                                            <FaPhoneSlash className="w-8 h-8 text-white" />
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Ondas de voz animadas */}
                            <AnimatePresence>
                                {isCallActive && agent.callStatus === "ACTIVE" && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="absolute inset-0 rounded-full"
                                    >
                                        {[...Array(3)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className={`absolute inset-0 rounded-full border-2 ${
                                                    i % 3 === 0 
                                                        ? "border-primary/70" 
                                                        : i % 3 === 1 
                                                            ? "border-secondary/70" 
                                                            : "border-tertiary/70"
                                                }`}
                                                style={{
                                                    boxShadow: i % 3 === 0 
                                                        ? "0 0 8px rgba(94, 114, 235, 0.3)" 
                                                        : i % 3 === 1 
                                                            ? "0 0 8px rgba(255, 89, 158, 0.3)" 
                                                            : "0 0 8px rgba(192, 97, 255, 0.3)"
                                                }}
                                                animate={{
                                                    scale: [1, 1.1 + (i * 0.08), 1],
                                                    opacity: [0.6, 0.3, 0.6],
                                                }}
                                                transition={{
                                                    duration: 1.8 - (i * 0.2),
                                                    delay: i * 0.25,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Sombra degradada */}
                            <div className="absolute inset-0 rounded-full blur-2xl bg-gradient-to-r 
                            from-primary/30 via-secondary/30 to-tertiary/30 opacity-70" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}