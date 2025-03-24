'use client';
import { ParticleCanvas } from "@/hooks/particle";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { FaMicrophone, FaPhoneSlash } from "react-icons/fa";
//import { Wave } from '@foobar404/wave';

export default function Hero() {
    const {scrollY} = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 100]);
    const [isCallActive, setIsCallActive] = useState(false);

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
                            AI-Powered
                            <br />
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="bg-gradient-to-r from-primary via-secondary
                                to-tertiary bg-clip-text text-transparent"
                            >
                                Developer
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.1 }}
                            className="text-xl text-content/80 mb-8"
                        >
                            Talk to my AI assistant to learn more about my work and expertise
                            in React, Node.js, and AI integration.
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setIsCallActive(true)}
                            className="relative overflow-hidden px-8 py-4 rounded-full bg-surface/30 
                            backdrop-blur-sm border border-white/10 hover:border-primary/30 
                            transition-all group flex items-center gap-3"
                        >
                            <FaMicrophone className="text-primary w-5 h-5" />
                            <span className="text-content group-hover:text-primary transition-colors">
                                Talk to My AI Assistant
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
                            {/* Ondas de voz animadas */}
                            <AnimatePresence>
                                {isCallActive && (
                                    <>
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="absolute inset-0 rounded-full"
                                        >
                                            {[...Array(3)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                        opacity: [0.3, 0.1, 0.3],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        delay: i * 0.3,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Sombra degradada */}
                            <div className="absolute inset-0 rounded-full blur-2xl bg-gradient-to-r 
                            from-primary/30 via-secondary/30 to-tertiary/30 opacity-70" />
                            
                            {/* Avatar Container */}
                            <motion.div
                                animate={isCallActive ? 
                                    { scale: [1, 1.02, 1], transition: { duration: 2, repeat: Infinity }} : 
                                    { y: [0, -20, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                }
                                className="relative w-full aspect-square rounded-full overflow-hidden
                                border border-white/10 bg-surface/30 backdrop-blur-sm"
                            >
                                <Image 
                                    src="/portfolio.jpg"
                                    alt="AI Assistant Avatar"
                                    fill
                                    className="object-cover scale-110 group-hover:scale-100
                                    transition-transform duration-500"
                                />
                                
                                {/* Botón de colgar - Ajustado con rotación */}
                                <AnimatePresence>
                                    {isCallActive && (
                                        <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        onClick={() => setIsCallActive(false)}
                                        className="absolute bottom-8 left-0 right-0 mx-auto
                                        bg-red-500/80 hover:bg-red-500 p-4 rounded-full
                                        transition-colors w-14 h-14 flex items-center justify-center
                                        rotate-45"
                                      >
                                        <FaPhoneSlash className="w-6 h-6" />
                                      </motion.button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}