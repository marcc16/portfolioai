'use client';
import { motion } from "framer-motion";
import { FaNode, FaReact } from "react-icons/fa";
import { SiD3Dotjs, SiFirebase, SiGraphql, SiNextdotjs, SiTailwindcss, SiTypescript } from "react-icons/si";
import Image from "next/image";
import { ArrowUpRightIcon } from "@heroicons/react/16/solid";


const projects = [
    {
        title: "E-commerce Platform",
        description: "Modern shopping experinece with Next.js and Typescript",
        tech: [
            { name: "React", icon: FaReact, color: "#61DAFB" },
            { name: "Next.js", icon: SiNextdotjs, color: "#000000" },
            { name: "Tailwind", icon: SiTailwindcss, color: "#06B6D4" },

        ],
        image: '/projects/ecommerce.png'
    },
    {
        title: "Analytics Dashboard",
        description: "Real-time data visualization platform",
        tech: [
            { name: "TypeScript", icon: SiTypescript, color: "#3178C6" },
            { name: "D3.js", icon: SiD3Dotjs, color: "#F9A03C" },
            { name: "Node.js", icon: FaNode, color: "#339933" }
        ],
        image: '/projects/analytics.jpg'
    },
    {
        title: "Mobile Application",
        description: "Cross-platform mobile app for health tracking",
        tech: [
            { name: "React Native", icon: FaReact, color: "#61DAFB" },
            { name: "Firebase", icon: SiFirebase, color: "#FFCA28" },
            { name: "GraphQL", icon: SiGraphql, color: "#E535AB" }
        ],
        image: '/projects/mobile.jpg'
    },
]


export default function Main() {
    return (
        <section className="py-32 relative bg-black">
            {/* Fondo con gradiente animado */}
            <motion.div 
                className="absolute inset-0 opacity-10"
                animate={{
                    background: [
                        'radial-gradient(circle at 0% 0%, #5e72eb 0%, transparent 50%)',
                        'radial-gradient(circle at 100% 0%, #ff599e 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 100%, #c061ff 0%, transparent 50%)',
                        'radial-gradient(circle at 0% 0%, #5e72eb 0%, transparent 50%)',
                    ],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent mb-4 text-center">
                        Selected Work
                    </h2>
                    <motion.div 
                        className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: 96 }}
                        transition={{ duration: 0.8 }}
                    />
                </motion.div>

                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {projects.map((project, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            whileHover={{
                                y: -10,
                                transition: { duration: 0.2 }
                            }}
                            className="group relative h-[500px] rounded-3xl overflow-hidden bg-surface/30 backdrop-blur-sm border border-white/10 cursor-pointer"
                        >
                            {/* Efecto de brillo en hover */}
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(94, 114, 235, 0.15) 0%, transparent 50%)'
                                }}
                            />

                            {/* Image Section */}
                            <motion.div
                                className="h-[250px] relative overflow-hidden"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition-transform duration-500"
                                />
                                {/* Overlay gradiente */}
                                <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                            </motion.div>

                            {/* Content Section */}
                            <motion.div className="p-6 bg-surface/30 backdrop-blur-sm">
                                <div className="flex justify-between items-start mb-4 group/title">
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
                                        {project.title}
                                    </h3>
                                    <motion.div
                                        whileHover={{ scale: 1.2, rotate: 45 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ArrowUpRightIcon className="h-6 w-6 text-primary transition-colors duration-300"/>
                                    </motion.div>
                                </div>
                                <p className="text-content/80 mb-4">{project.description}</p>

                                <div className="flex flex-wrap gap-2">
                                    {project.tech.map((tech, j) => (
                                        <motion.span
                                            key={j}
                                            whileHover={{ scale: 1.05 }}
                                            className="px-3 py-1 rounded-full bg-white/5 text-content/80 text-sm border border-white/5 hover:border-primary/30 transition-colors flex items-center gap-1.5 group/tech"
                                        >
                                            <tech.icon
                                                style={{ color: tech.color }}
                                                className="w-4 h-4 transition-colors"
                                            />
                                            <span className="group-hover/tech:text-primary transition-colors">
                                                {tech.name}
                                            </span>
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* View More Button */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center mt-20 relative z-[5]"
                >
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        className="relative px-8 py-3 rounded-full bg-surface/30 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-all group"
                    >
                        <span className="text-content transition-colors relative z-[1] group-hover:text-primary">
                            View All Projects
                        </span>
                        <motion.div 
                            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-tertiary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.1 }}
                        />
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}