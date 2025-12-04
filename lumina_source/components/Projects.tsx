import React, { useRef, useState } from 'react';
import { useData, useSettings } from '../store';
import { Github, ExternalLink, MousePointer2, CheckCircle2, Smartphone, Zap, Layers } from 'lucide-react';
import { motion, useInView, useSpring, useTransform, Variants } from 'framer-motion';

const ProjectSlide: React.FC<{ project: any; index: number; total: number }> = ({ project, index, total }) => {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.3, once: false });
    const { t } = useSettings();

    // Mouse Parallax Logic
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        setMouseX((clientX / innerWidth) - 0.5);
        setMouseY((clientY / innerHeight) - 0.5);
    };

    const springConfig = { damping: 25, stiffness: 150 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);
    
    // Parallax transforms for different layers
    const moveLayer1 = { x: useTransform(x, value => value * -20), y: useTransform(y, value => value * -20) };
    const moveLayer2 = { x: useTransform(x, value => value * 30), y: useTransform(y, value => value * 30) };
    const moveLayer3 = { x: useTransform(x, value => value * 10), y: useTransform(y, value => value * 10) };

    // Animation variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section 
            ref={ref}
            onMouseMove={handleMouseMove}
            className="w-full min-h-[100dvh] snap-start relative overflow-hidden bg-stone-50 dark:bg-stone-950 flex items-center"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col lg:flex-row gap-12 lg:gap-20 py-20 lg:py-0">
                
                {/* Left: Content Side */}
                <motion.div 
                    className={`flex-1 flex flex-col justify-center order-2 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {/* Header Meta */}
                    <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6 text-xs font-bold uppercase tracking-widest">
                        <span className="text-stone-400">{project.year}</span>
                        <span className="w-1 h-1 bg-stone-300 rounded-full" />
                        <span className="text-sage-600 dark:text-sage-400">{project.role}</span>
                    </motion.div>

                    {/* Title */}
                    <motion.h2 variants={itemVariants} className="font-serif text-4xl md:text-6xl text-stone-900 dark:text-stone-100 mb-6 leading-tight">
                        {project.title}
                    </motion.h2>

                    {/* Description */}
                    <motion.p variants={itemVariants} className="text-stone-600 dark:text-stone-400 text-lg leading-relaxed mb-8 max-w-lg">
                        {project.description}
                    </motion.p>

                    {/* Features Grid (Bento Mini) */}
                    {project.features && (
                        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            {project.features.map((feature: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-stone-900/50 rounded-lg border border-stone-100 dark:border-stone-800 shadow-sm">
                                    <CheckCircle2 size={16} className="text-sage-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-stone-700 dark:text-stone-300 font-medium">{feature}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Tech Stack */}
                    <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mb-10">
                        {project.technologies.map((tech: string) => (
                            <span key={tech} className="px-3 py-1.5 bg-stone-200/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 text-xs font-medium rounded border border-stone-200 dark:border-stone-800">
                                {tech}
                            </span>
                        ))}
                    </motion.div>

                    {/* Actions */}
                    <motion.div variants={itemVariants} className="flex gap-4">
                        {project.demoUrl && (
                            <a href={project.demoUrl} className="px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
                                {t('Live Demo')} <ExternalLink size={16} />
                            </a>
                        )}
                        {project.repoUrl && (
                            <a href={project.repoUrl} className="px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-full font-medium flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                                {t('Source Code')} <Github size={16} />
                            </a>
                        )}
                    </motion.div>
                </motion.div>

                {/* Right: Visual Composition Side */}
                <div className={`flex-1 relative flex items-center justify-center order-1 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    
                    {/* Abstract Backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-stone-200/30 to-sage-200/30 dark:from-stone-800/30 dark:to-sage-900/10 rounded-[3rem] blur-3xl transform scale-75" />

                    <div className="relative w-full max-w-xl aspect-[4/3]">
                        {/* Layer 1: Main Desktop Screenshot */}
                        <motion.div 
                            style={moveLayer1}
                            className="absolute top-0 left-0 w-[90%] aspect-video bg-white dark:bg-stone-800 rounded-lg shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-700 z-10"
                        >
                             {/* Fake Browser UI */}
                            <div className="h-6 bg-stone-100 dark:bg-stone-900 flex items-center gap-1.5 px-3 border-b border-stone-200 dark:border-stone-800">
                                <div className="w-2 h-2 rounded-full bg-rose-400/50" />
                                <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                                <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
                            </div>
                            <img src={project.imageUrl} alt="Desktop" className="w-full h-full object-cover" />
                        </motion.div>

                        {/* Layer 2: Mobile/Detail Floating Shot */}
                        <motion.div 
                            style={moveLayer2}
                            className="absolute -bottom-8 right-4 w-[35%] aspect-[9/19] bg-stone-900 rounded-[2rem] shadow-2xl border-[4px] border-stone-800 overflow-hidden z-20 ring-1 ring-white/10"
                        >
                            {/* Mobile Notion/Phone header */}
                            <div className="absolute top-0 inset-x-0 h-6 bg-black/20 z-10 flex justify-center">
                                <div className="w-16 h-4 bg-black rounded-b-lg" />
                            </div>
                            <img src={project.imageUrl} alt="Mobile" className="w-full h-full object-cover scale-[2]" />
                        </motion.div>

                        {/* Layer 3: Floating Stat Card / Decoration */}
                        {project.stats && project.stats[0] && (
                            <motion.div 
                                style={moveLayer3}
                                className="absolute top-12 -right-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 dark:border-stone-700 z-30 flex items-center gap-3"
                            >
                                <div className="p-2 bg-sage-100 dark:bg-sage-900/30 rounded-lg text-sage-600 dark:text-sage-400">
                                    <Zap size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <div className="text-xs text-stone-500 dark:text-stone-400 font-bold uppercase">{project.stats[0].label}</div>
                                    <div className="text-xl font-bold text-stone-900 dark:text-stone-100">{project.stats[0].value}</div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Projects: React.FC = () => {
  const { projects } = useData();

  return (
    <div className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar bg-stone-50 dark:bg-stone-950">
       <style>{`
         .no-scrollbar::-webkit-scrollbar {
           display: none;
         }
         .no-scrollbar {
           -ms-overflow-style: none;
           scrollbar-width: none;
         }
       `}</style>
       
       {projects.map((project, index) => (
           <ProjectSlide 
               key={project.id} 
               project={project} 
               index={index} 
               total={projects.length}
           />
       ))}

       {/* Scroll Hint */}
       <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 2, duration: 2, repeat: Infinity }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 text-stone-400 dark:text-stone-500 flex flex-col items-center gap-2 pointer-events-none mix-blend-difference"
       >
          <span className="text-[10px] uppercase tracking-widest font-bold">Scroll</span>
          <MousePointer2 size={16} />
       </motion.div>

        {/* Side Pagination */}
       <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden lg:flex">
            {projects.map((_, idx) => (
                <div 
                    key={idx} 
                    className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 transition-colors" 
                />
            ))}
       </div>
    </div>
  );
};

export default Projects;