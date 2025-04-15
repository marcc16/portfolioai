'use client';
import { ParticleCanvas } from "@/hooks/particle";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { FaMicrophone, FaPhoneSlash, FaEnvelope } from "react-icons/fa";
import { useAgent } from "./Agent";

export default function Hero() {
    const {scrollY} = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 100]);
    const [isCallActive, setIsCallActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(120);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [userIP, setUserIP] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
    
    // Usar el hook de agente directamente en el componente
    const agent = useAgent(email);

    // Obtener la IP del usuario y el tiempo restante al cargar el componente
    useEffect(() => {
        const fetchUserIP = async () => {
            try {
                const response = await fetch('/api/user-ip');
                const data = await response.json();
                setUserIP(data.ip);
                
                // Una vez que tenemos la IP, obtenemos el tiempo restante con forzado de actualización
                const timeResponse = await fetch('/api/call-time?force=true');
                const timeData = await timeResponse.json();
                setTimeLeft(timeData.remainingTime);
                
                // Si el tiempo restante es el máximo, probablemente es una IP exenta
                if (timeData.remainingTime === 120) {
                    console.log(`IP ${timeData.ip} parece estar exenta (tiempo máximo disponible)`);
                }
            } catch (err) {
                console.error("Error fetching user IP or remaining time:", err);
                setError("Could not determine your remaining call time. Please try again later.");
            }
        };
        
        fetchUserIP();
    }, []);

    // Actualizar el tiempo usado en el servidor cuando la llamada termina
    const updateTimeUsed = useCallback(async () => {
        if (startTime !== null && userIP) {
            const endTime = Date.now();
            const secondsUsed = Math.ceil((endTime - startTime) / 1000);
            
            try {
                await fetch('/api/call-time', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ secondsUsed }),
                });
                
                // Resetear el tiempo de inicio
                setStartTime(null);
            } catch (err) {
                console.error("Error updating time used:", err);
            }
        }
    }, [startTime, userIP]);

    const handleCallEnd = useCallback(async () => {
        if (!agent) {
            setError("Voice assistant not initialized. Please refresh the page.");
            return;
        }
        
        try {
            setIsCallActive(false);
            setError(null);
            agent.handleDisconnect();
            
            // Actualizar el tiempo usado
            await updateTimeUsed();
            
            // Refrescar el tiempo restante
            const timeResponse = await fetch('/api/call-time');
            const timeData = await timeResponse.json();
            setTimeLeft(timeData.remainingTime);
        } catch (err) {
            console.error("Error ending call:", err);
            setError(err instanceof Error ? err.message : "Failed to end call");
        }
    }, [agent, updateTimeUsed]);

    // Manejar el temporizador y actualizar el tiempo usado
    const handleTimer = useCallback(() => {
        let timer: NodeJS.Timeout;
        
        if (isCallActive && timeLeft > 0) {
            // Guardar el tiempo de inicio si no está establecido
            if (startTime === null) {
                setStartTime(Date.now());
            }
            
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleCallEnd();
        }
        
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isCallActive, timeLeft, startTime, handleCallEnd]);

    useEffect(() => {
        const cleanup = handleTimer();
        return cleanup;
    }, [handleTimer]);

    const handleCallStart = async () => {
        // Si no hay agente, mostrar error
        if (!agent) {
            setError("Voice assistant not initialized. Please refresh the page.");
            return;
        }
        
        // Si no queda tiempo, mostrar error
        if (timeLeft <= 0) {
            setError("You have used all your allocated call time (2 minutes). Thank you for your interest!");
            return;
        }

        // Si no se ha enviado el correo, mostrar error
        if (!isEmailSubmitted) {
            setError("Please submit your email first to start the call.");
            return;
        }
        
        try {
            setIsCallActive(true);
            setError(null);
            await agent.handleCall();
        } catch (err) {
            console.error("Error starting call:", err);
            setError(err instanceof Error ? err.message : "Failed to start call");
            setIsCallActive(false);
            await updateTimeUsed();
            
            // Refrescar el tiempo restante
            const timeResponse = await fetch('/api/call-time');
            const timeData = await timeResponse.json();
            setTimeLeft(timeData.remainingTime);
        }
    };

    // Manejador específico para el botón de colgar
    const handleHangupClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleCallEnd();
    };

    // Manejador para el envío del correo electrónico
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !email.includes('@')) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            // Aquí puedes guardar el email para usarlo más tarde con n8n
            // Por ahora solo marcamos como enviado
            setIsEmailSubmitted(true);
            setError(null);
        } catch (err) {
            console.error("Error submitting email:", err);
            setError("Failed to submit email. Please try again.");
        }
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
                            Specialist in Vapi, Retell, n8n, and cutting-edge workflows that save time and reduce costs.
                        </motion.p>

                        {/* Email Form */}
                        {!isEmailSubmitted && (
                            <motion.form
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1.2 }}
                                onSubmit={handleEmailSubmit}
                                className="mb-8"
                            >
                                <div className="flex gap-4">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email to start"
                                        className="flex-1 px-6 py-3 rounded-full bg-surface/30 
                                        backdrop-blur-sm border border-white/10 text-white
                                        placeholder:text-white/50 focus:outline-none focus:border-primary/50"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-full bg-primary/20 
                                        backdrop-blur-sm border border-primary/30 text-primary
                                        hover:bg-primary/30 transition-colors flex items-center gap-2"
                                    >
                                        <FaEnvelope className="w-4 h-4" />
                                        <span>Submit</span>
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {/* Control de tiempo restante */}
                        {!isCallActive && isEmailSubmitted && (
                            <div className="mb-8">
                                
                                
                            </div>
                        )}

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                                >
                                    <p className="text-red-500 text-sm">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.3 }}
                            className="flex gap-4"
                        >
                            
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={handleCallStart}
                            disabled={isCallActive || timeLeft <= 0 || !isEmailSubmitted}
                            className="relative overflow-hidden px-8 py-4 rounded-full bg-surface/30 
                            backdrop-blur-sm border border-white/10 hover:border-primary/30 
                            transition-all group flex items-center gap-3 disabled:opacity-50
                            disabled:cursor-not-allowed"
                        >
                            <FaMicrophone className="text-primary w-5 h-5" />
                            <span className="text-content group-hover:text-primary transition-colors">
                                {isCallActive 
                                    ? "Call in Progress..." 
                                    : !isEmailSubmitted
                                    ? "Submit Email First"
                                    : timeLeft <= 0 
                                        ? "Time Limit Reached" 
                                        : "Talk to My AI Assistant"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r 
                            from-primary/10 to-tertiary/10 opacity-0
                            group-hover:opacity-100 transition-opacity"/>
                        </motion.button>
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
                                animate={isCallActive ? 
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
                                {isCallActive && (
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
                                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
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
                                {isCallActive && (
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