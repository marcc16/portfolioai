'use client';
import { motion } from "framer-motion";
import { FaRobot, FaServer, FaCogs, FaGlobe } from "react-icons/fa";
import { useRef } from "react";

// Flujos de trabajo n8n
// Workflow 1: AI Lead Qualification
const workflow1 = '{"nodes":[{"parameters":{"triggerTimes":{"item":[{"mode":"everyMinute"}]}},"name":"Schedule Trigger","type":"n8n-nodes-base.scheduleTrigger","typeVersion":1,"position":[250,300]},{"parameters":{"operation":"select","database":{"__rl":true,"value":"database-id","mode":"id"},"returnAll":true,"additionalOptions":{}},"name":"Get Leads","type":"n8n-nodes-base.notion","typeVersion":1,"position":[450,300]},{"parameters":{"batchSize":1,"options":{}},"name":"OpenAI","type":"n8n-nodes-base.openAi","typeVersion":1,"position":[650,300]},{"parameters":{"conditions":{"string":[{"value1":"={{ $json.analysis.score }}","operation":"larger","value2":7}]}},"name":"High Quality?","type":"n8n-nodes-base.if","typeVersion":1,"position":[850,300]},{"parameters":{"chatId":"group-id","text":"=🔥 **Nuevo lead de alta calidad:** {{ $json.properties.Name.title[0].plain_text }}\\n\\n**Correo:** {{ $json.properties.Email.email }}\\n\\n**Teléfono:** {{ $json.properties.Phone.phone_number }}\\n\\n**Puntuación IA:** {{ $json.analysis.score }}/10\\n\\n**Razón:** {{ $json.analysis.reason }}","additionalFields":{}},"name":"Notify Sales","type":"n8n-nodes-base.telegram","typeVersion":1,"position":[1050,200]},{"parameters":{"resource":"database","operation":"update","databaseId":{"__rl":true,"value":"database-id","mode":"id"},"simple":true,"propertiesUi":{"propertyValues":[{"key":"Status","value":"=Qualified"},{"key":"Score","value":"={{ $json.analysis.score }}"}]}},"name":"Update as Qualified","type":"n8n-nodes-base.notion","typeVersion":1,"position":[1050,400]},{"parameters":{"resource":"database","operation":"update","databaseId":{"__rl":true,"value":"database-id","mode":"id"},"simple":true,"propertiesUi":{"propertyValues":[{"key":"Status","value":"=Nurturing"},{"key":"Score","value":"={{ $json.analysis.score }}"}]}},"name":"Update as Nurturing","type":"n8n-nodes-base.notion","typeVersion":1,"position":[1050,600]}],"connections":{"Schedule Trigger":{"main":[[{"node":"Get Leads","type":"main","index":0}]]},"Get Leads":{"main":[[{"node":"OpenAI","type":"main","index":0}]]},"OpenAI":{"main":[[{"node":"High Quality?","type":"main","index":0}]]},"High Quality?":{"main":[[{"node":"Notify Sales","type":"main","index":0},{"node":"Update as Qualified","type":"main","index":0}],[{"node":"Update as Nurturing","type":"main","index":0}]]}}}';

// Workflow 2: AI Voice Agent Call Scheduler
const workflow2 = '{"nodes":[{"parameters":{"httpMethod":"POST","path":"new-appointment","responseMode":"responseNode","options":{}},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"phoneNumber":"={{ $json.body.phone }}","message":"=Hola {{ $json.body.name }}, le confirmamos su cita para el {{ $json.body.appointmentDate }} a las {{ $json.body.appointmentTime }}. Un agente virtual le llamará para preparar la reunión."},"name":"Send SMS","type":"n8n-nodes-base.twilio","typeVersion":1,"position":[450,200]},{"parameters":{"workflowId":"=workflow-id","additionalFields":{"calleeNumber":"={{ $json.body.phone }}","schedulingDateTime":"={{ $json.body.callDateTime }}"}},"name":"Schedule VAPI Call","type":"n8n-nodes-base.vapi","typeVersion":1,"position":[450,400]},{"parameters":{"resource":"lead","operation":"create","additionalFields":{"firstName":"={{ $json.body.name.split(\' \')[0] }}","lastName":"={{ $json.body.name.split(\' \')[1] }}","email":"={{ $json.body.email }}","phone":"={{ $json.body.phone }}","leadSource":"Website","status":"New","description":"=Auto-programada una llamada de pre-calificación con agente virtual para: {{ $json.body.callDateTime }}"}},"name":"Create CRM Record","type":"n8n-nodes-base.salesforce","typeVersion":1,"position":[650,300]},{"parameters":{"options":{}},"name":"Respond","type":"n8n-nodes-base.respondToWebhook","typeVersion":1,"position":[850,300]}],"connections":{"Webhook":{"main":[[{"node":"Send SMS","type":"main","index":0},{"node":"Schedule VAPI Call","type":"main","index":0}]]},"Send SMS":{"main":[[{"node":"Create CRM Record","type":"main","index":0}]]},"Schedule VAPI Call":{"main":[[{"node":"Create CRM Record","type":"main","index":0}]]},"Create CRM Record":{"main":[[{"node":"Respond","type":"main","index":0}]]}}}';

// Workflow 3: AI Content Generation & Distribution
const workflow3 = '{"nodes":[{"parameters":{"triggerTimes":{"item":[{"mode":"everyWeek","dayOfWeek":1,"hour":9}]}},"name":"Schedule Trigger","type":"n8n-nodes-base.scheduleTrigger","typeVersion":1,"position":[250,300]},{"parameters":{"operation":"executeQuery","query":"SELECT * FROM content_calendar WHERE publish_date = CURRENT_DATE"},"name":"Get Content Plan","type":"n8n-nodes-base.postgres","typeVersion":1,"position":[450,300]},{"parameters":{"prompt":"=Create a detailed article about {{ $json.topic }}. Include the following keywords: {{ $json.keywords }}. The tone should be {{ $json.tone }} and target audience is {{ $json.target_audience }}. The article should be around {{ $json.word_count }} words.","model":"gpt-4-turbo","options":{"temperature":0.7}},"name":"Generate Content","type":"n8n-nodes-base.openAi","typeVersion":1,"position":[650,300]},{"parameters":{"text":"={{ $json.content }}","additionalFields":{}},"name":"Post to LinkedIn","type":"n8n-nodes-base.linkedIn","typeVersion":1,"position":[850,200]},{"parameters":{"text":"={{ $json.content }}","additionalFields":{}},"name":"Post to Twitter","type":"n8n-nodes-base.twitter","typeVersion":1,"position":[850,400]},{"parameters":{"title":"={{ $json.title }}","content":"={{ $json.content }}","status":"publish","additionalFields":{}},"name":"Post to WordPress","type":"n8n-nodes-base.wordpress","typeVersion":1,"position":[850,600]}],"connections":{"Schedule Trigger":{"main":[[{"node":"Get Content Plan","type":"main","index":0}]]},"Get Content Plan":{"main":[[{"node":"Generate Content","type":"main","index":0}]]},"Generate Content":{"main":[[{"node":"Post to LinkedIn","type":"main","index":0},{"node":"Post to Twitter","type":"main","index":0},{"node":"Post to WordPress","type":"main","index":0}]]}}}';

export const n8nWorkflows = [
    {
        title: "AI Lead Qualification",
        description: "Automatización que califica leads entrantes utilizando IA, prioriza oportunidades y las distribuye al equipo adecuado",
        workflow: workflow1
    },
    {
        title: "AI Voice Agent Call Scheduler",
        description: "Automatización que programa llamadas con agentes virtuales de voz, captura información clave y la sincroniza con tu CRM",
        workflow: workflow2
    },
    {
        title: "AI Content Generation & Distribution",
        description: "Crea contenido optimizado con IA, lo formatea para diferentes plataformas y lo programa automáticamente",
        workflow: workflow3
    },
];

// Servicios específicos
const services = [
    {
        title: "Custom AI Agents",
        description: "Intelligent agents that handle customer service, lead qualification, and appointment scheduling with human-like conversation",
        icon: FaRobot,
        color: "#8A2BE2"
    },
    {
        title: "Voice Automation",
        description: "Implement voice-enabled AI agents with Vapi and Retell to handle calls, voicemails, and phone outreach",
        icon: FaGlobe,
        color: "#FF6B6B"
    },
    {
        title: "Workflow Automation",
        description: "Create seamless data flows between your tools using n8n, Zapier, and Make to eliminate manual tasks",
        icon: FaCogs,
        color: "#FF4A00"
    },
    {
        title: "System Integration",
        description: "Connect your existing systems with custom APIs and data pipelines that work flawlessly",
        icon: FaServer,
        color: "#00A1FF"
    }
]

export default function Main() {
    const serviceRefs = {
        'agents': useRef<HTMLDivElement>(null),
        'automation': useRef<HTMLDivElement>(null),
        'tools': useRef<HTMLDivElement>(null),
        'n8n': useRef<HTMLDivElement>(null),
    };

    const scrollToRef = (refName: keyof typeof serviceRefs) => {
        serviceRefs[refName]?.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <main className="bg-black">
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
                            AI Automation Solutions
                        </h2>
                        <motion.div 
                            className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: 96 }}
                            transition={{ duration: 0.8 }}
                        />
                        <p className="mt-6 text-center text-content/80 max-w-3xl mx-auto">
                            Transform your business operations with custom AI agents and automated workflows that reduce manual tasks, 
                            improve customer interactions, and drive efficiency across your entire organization.
                        </p>
                    </motion.div>

                    {/* Services Navigation */}
                    <div className="text-center mb-14 mt-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                            Services
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button 
                                onClick={() => scrollToRef('agents')} 
                                className="px-4 py-2 bg-surface/30 text-white rounded-full hover:bg-white/10 transition duration-200"
                            >
                                AI Agents
                            </button>
                            <button 
                                onClick={() => scrollToRef('automation')} 
                                className="px-4 py-2 bg-surface/30 text-white rounded-full hover:bg-white/10 transition duration-200"
                            >
                                Automation
                            </button>
                            <button 
                                onClick={() => scrollToRef('tools')} 
                                className="px-4 py-2 bg-surface/30 text-white rounded-full hover:bg-white/10 transition duration-200"
                            >
                                Tools
                            </button>
                            <button 
                                onClick={() => scrollToRef('n8n')} 
                                className="px-4 py-2 bg-surface/30 text-white rounded-full hover:bg-white/10 transition duration-200"
                            >
                                n8n Workflows
                            </button>
                        </div>
                    </div>

                    {/* Services Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                        {services.map((service, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="p-6 bg-surface/30 backdrop-blur-sm rounded-xl border border-white/10 hover:border-primary/30 transition-all group flex items-start gap-5"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <service.icon style={{ color: service.color }} className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-white mb-2 group-hover:text-primary transition-colors">
                                        {service.title}
                                    </h3>
                                    <p className="text-content/80">
                                        {service.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* n8n Workflow Section */}
                    <div ref={serviceRefs.n8n} className="mb-24 scroll-mt-24">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent mb-4 text-center">
                                Automation Workflows
                            </h2>
                            <motion.div 
                                className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary rounded-full"
                                initial={{ width: 0 }}
                                whileInView={{ width: 96 }}
                                transition={{ duration: 0.8 }}
                            />
                            <p className="mt-6 text-center text-content/80 max-w-3xl mx-auto mb-12">
                                Explore interactive examples of n8n workflows that power our automation solutions. 
                                These visual representations showcase how we connect various systems and leverage AI.
                            </p>
                        </motion.div>

                        {/* N8N Workflow Examples */}
                        <div className="space-y-24 mb-24">
                            {n8nWorkflows.map((workflow, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="workflow-example"
                                >
                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent mb-3">
                                            {workflow.title}
                                        </h3>
                                        <p className="text-content/80 max-w-3xl">
                                            {workflow.description}
                                        </p>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-white/10">
                                        {/* @ts-expect-error n8n-demo is a web component */}
                                        <n8n-demo 
                                            workflow={workflow.workflow} 
                                            frame="true" 
                                            clicktointeract="true"
                                            disableinteractivity="false"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mt-24 p-10 rounded-3xl bg-surface/30 backdrop-blur-sm border border-white/10 text-center"
                    >
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Ready to automate your business?
                        </h3>
                        <p className="text-content/80 max-w-2xl mx-auto mb-8">
                            Let&apos;s discuss how custom AI agents and automation can reduce your operational costs, 
                            improve customer service, and give you a competitive edge.
                        </p>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            className="relative px-8 py-3 rounded-full bg-surface/30 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-all group"
                        >
                            <span className="text-content transition-colors relative z-[1] group-hover:text-primary">
                                Schedule a Consultation
                            </span>
                            <motion.div 
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-tertiary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                whileHover={{ scale: 1.1 }}
                            />
                        </motion.button>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}