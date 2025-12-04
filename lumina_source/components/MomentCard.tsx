
import React, { useRef } from 'react';
import { Moment } from '../types';
import { useData, useAuth } from '../store';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { 
    motion, 
    useMotionTemplate, 
    useMotionValue, 
    useSpring,
    useTransform
} from 'framer-motion';

interface MomentCardProps {
  moment: Moment;
  onClick?: () => void;
}

const MomentCard: React.FC<MomentCardProps> = ({ moment, onClick }) => {
  const { toggleLike } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasImages = moment.images && moment.images.length > 0;
  
  // --- Physics & 3D Logic (Desktop) ---
  const ref = useRef<HTMLDivElement>(null);
  
  // Motion values for mouse position (normalized from -0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Use springs for smooth movement buffering (Physics effect)
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const xPct = (clientX - left) / width - 0.5;
    const yPct = (clientY - top) / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Maps mouse position to rotation degrees
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);
  
  // Spotlight effect gradient that follows mouse
  const spotlightBg = useMotionTemplate`radial-gradient(650px circle at ${useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"])} ${useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"])}, rgba(255,255,255,0.15), transparent 80%)`;

  // --- Interaction Logic ---
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
        navigate('/login');
        return;
    }
    toggleLike(moment.id, 'moment');
  };

  // --- Dynamic Styles ---
  const getGradient = (id: string) => {
      const gradients = [
          'from-rose-500/10 via-orange-500/10 to-amber-500/10 border-rose-200/50 dark:border-rose-900/30',
          'from-sage-500/10 via-teal-500/10 to-emerald-500/10 border-sage-200/50 dark:border-sage-900/30',
          'from-indigo-500/10 via-violet-500/10 to-purple-500/10 border-indigo-200/50 dark:border-indigo-900/30',
          'from-blue-500/10 via-sky-500/10 to-cyan-500/10 border-blue-200/50 dark:border-blue-900/30',
      ];
      const index = id.charCodeAt(id.length - 1) % gradients.length;
      return gradients[index];
  };

  const bgStyle = hasImages 
    ? 'bg-stone-900 border-stone-800' 
    : `bg-white dark:bg-stone-900/80 backdrop-blur-xl border ${getGradient(moment.id)}`;

  return (
    <div className="break-inside-avoid mb-8" style={{ perspective: "1000px" }}>
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
            }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            whileTap={{ scale: 0.98 }}
            className={`
                group relative w-full rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-500
                ${bgStyle}
                /* Mobile Ambient Float Animation */
                animate-[float_6s_ease-in-out_infinite] md:animate-none
            `}
        >
            {/* 0. Mobile Only: Shimmer Effect (Simulates light passing through) */}
            <div className="md:hidden absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 -inset-full h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 dark:opacity-10 animate-[shimmer_3s_infinite]" />
            </div>

            {/* 1. Desktop Only: Mouse Spotlight Overlay */}
            <motion.div
                style={{ background: spotlightBg }}
                className="hidden md:block absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />

            {/* 2. Image Layer */}
            {hasImages && (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={moment.images![0]} 
                        alt="Background" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />
                </div>
            )}

            {/* 3. Content Container (Lifted in 3D space) */}
            <div 
                className={`relative z-20 p-6 flex flex-col justify-between h-full ${hasImages ? 'min-h-[360px]' : 'min-h-[220px]'}`}
                style={{ transform: "translateZ(20px)" }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${hasImages ? 'bg-white/10 border-white/20 text-white backdrop-blur-md' : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'}`}>
                            <span className="font-serif font-bold">L</span>
                         </div>
                         <div>
                             <p className={`text-xs font-bold uppercase tracking-wider ${hasImages ? 'text-white/90' : 'text-stone-500 dark:text-stone-400'}`}>
                                 {moment.date}
                             </p>
                             {moment.tags.length > 0 && (
                                 <p className={`text-[10px] ${hasImages ? 'text-sage-300' : 'text-sage-600 dark:text-sage-400'}`}>
                                     #{moment.tags[0]}
                                 </p>
                             )}
                         </div>
                    </div>
                    {/* Visual flair icon */}
                    {hasImages && <Sparkles size={16} className="text-yellow-200 animate-pulse" />}
                </div>

                {/* Main Content */}
                <div className="mt-auto">
                    <p className={`font-serif text-xl md:text-2xl leading-relaxed mb-6 line-clamp-4 ${hasImages ? 'text-white drop-shadow-md' : 'text-stone-800 dark:text-stone-100'}`}>
                        {moment.content}
                    </p>

                    {/* Actions Bar */}
                    <div className={`
                        flex items-center justify-between p-2 rounded-2xl backdrop-blur-md transition-all duration-300
                        ${hasImages 
                            ? 'bg-white/10 border border-white/10 text-white hover:bg-white/20' 
                            : 'bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}
                    `}>
                         <div className="flex gap-1">
                             <button 
                                onClick={handleLike}
                                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-90"
                             >
                                <Heart size={18} className={moment.likes > 0 ? "fill-rose-500 text-rose-500" : ""} />
                            </button>
                            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-90">
                                <MessageCircle size={18} />
                            </button>
                            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-90 md:hidden">
                                <Share2 size={18} />
                            </button>
                        </div>
                        <span className="px-3 text-xs font-medium opacity-80">
                            {moment.likes} likes
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Custom Styles for Mobile Animations */}
            <style>{`
                @keyframes shimmer {
                    100% { left: 125%; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
            `}</style>
        </motion.div>
    </div>
  );
};

export default MomentCard;
