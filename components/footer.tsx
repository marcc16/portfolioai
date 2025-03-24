'use client';
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const socialLinks = [
    { icon: FaGithub, url: "https://github.com", color: "#6e5494" },
    { icon: FaLinkedin, url: "https://linkedin.com", color: "#0077b5" },
    { icon: FaTwitter, url: "https://twitter.com", color: "#1da1f2" },
];

export default function Footer() {
    return (
        <footer className="relative bg-black overflow-hidden">
            {/* Gradiente de fondo animado */}
            <motion.div 
                className="absolute inset-0 opacity-10"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, #5e72eb 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 50%, #ff599e 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, #c061ff 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, #5e72eb 0%, transparent 50%)',
                    ],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center"
                >
                    {/* Logo o nombre */}
                    <motion.h3 
                        className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent mb-6"
                        whileHover={{ scale: 1.05 }}
                    >
                        Marc Bau
                    </motion.h3>

                    {/* Enlaces sociales */}
                    <div className="flex gap-6 mb-8">
                        {socialLinks.map((social, index) => (
                            <motion.a
                                key={index}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-content/60 hover:text-content transition-colors"
                                whileHover={{ 
                                    scale: 1.2,
                                    color: social.color 
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ 
                                    duration: 0.4,
                                    delay: index * 0.1 
                                }}
                            >
                                <social.icon className="w-6 h-6" />
                            </motion.a>
                        ))}
                    </div>

                    {/* Línea decorativa */}
                    <motion.div 
                        className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full mb-6"
                        initial={{ width: 0 }}
                        whileInView={{ width: 96 }}
                        transition={{ duration: 0.8 }}
                    />

                    {/* Copyright */}
                    <motion.p 
                        className="text-content/60 text-sm text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        © {new Date().getFullYear()} Marc Bau. All rights reserved.
                    </motion.p>
                </motion.div>
            </div>
        </footer>
    );
}