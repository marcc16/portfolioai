'use client';
import { ParticleCanvas } from "@/hooks/particle";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { FaMicrophone, FaPhoneSlash } from "react-icons/fa";
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
    const [isEmailValid, setIsEmailValid] = useState(false);
    
    // Usar el hook de agente sin email
    const agent = useAgent();

    // Validar el formato del email
    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Manejar cambios en el email
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        setIsEmailValid(validateEmail(newEmail));
    };

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

    // Efecto para actualizar isCallActive basado en el estado del agente
    useEffect(() => {
        if (agent.callStatus === "FINISHED" || agent.callStatus === "INACTIVE") {
            setIsCallActive(false);
            // También detener el temporizador
            if (startTime !== null) {
                updateTimeUsed();
                setStartTime(null);
            }
        } else if (agent.callStatus === "ACTIVE" || agent.callStatus === "CONNECTING") {
            setIsCallActive(true);
        }
    }, [agent.callStatus, startTime, updateTimeUsed]);

    const handleCallEnd = useCallback(async () => {
        if (!agent) {
            setError("Voice assistant not initialized. Please refresh the page.");
            return;
        }
        
        try {
            agent.handleDisconnect();
            setError(null);
            
            // Procesar y enviar respuestas con el email
            await agent.processAndSendResponses(email);
            
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
    }, [agent, updateTimeUsed, email]);

    // Manejar el temporizador y actualizar el tiempo usado
    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        if (isCallActive && timeLeft > 0 && agent.callStatus === "ACTIVE") {
            // Guardar el tiempo de inicio si no está establecido
            if (startTime === null) {
                setStartTime(Date.now());
            }
            
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 || agent.callStatus === "FINISHED") {
            handleCallEnd();
        }
        
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isCallActive, timeLeft, startTime, agent.callStatus, handleCallEnd]);

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

    const handleCallStart = async () => {
        // Validar email antes de iniciar la llamada
        if (!isEmailValid) {
            setError("Please enter a valid email address before starting the call.");
            return;
        }

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
                                onChange={handleEmailChange}
                                placeholder="Enter your email to start"
                                className={`w-full px-4 py-3 rounded-lg bg-white/10 text-white border ${
                                    email && !isEmailValid ? 'border-red-500' : 'border-white/20'
                                } focus:outline-none focus:border-primary transition-colors`}
                            />
                            {email && !isEmailValid && (
                                <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>
                            )}
                        </motion.div>

                        {/* Call controls */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.7 }}
                            className="flex items-center gap-4"
                        >
                            {!isCallActive ? (
                                <button
                                    onClick={handleCallStart}
                                    disabled={!isEmailValid}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full ${
                                        isEmailValid
                                            ? 'bg-primary hover:bg-primary/80'
                                            : 'bg-gray-500 cursor-not-allowed'
                                    } text-white font-medium transition-colors`}
                                >
                                    <FaMicrophone className="text-lg" />
                                    Start Call
                                </button>
                            ) : (
                                <button
                                    onClick={handleHangupClick}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                                >
                                    <FaPhoneSlash className="text-lg" />
                                    End Call
                                </button>
                            )}
                            
                            {/* Timer display */}
                            <span className="text-white/80">
                                Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </span>
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

                    {/* Image/Animation content */}
                    <motion.div
                        style={{ y }}
                        className="lg:w-1/2"
                    >
                        <Image
                            src="/hero-image.png"
                            alt="AI Voice Agents"
                            width={600}
                            height={600}
                            className="w-full h-auto"
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}