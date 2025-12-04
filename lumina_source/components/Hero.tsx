
import React, { useState, useEffect, useRef } from 'react';
import { useData, useSettings } from '../store';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Aperture, Cpu } from 'lucide-react';

const Hero: React.FC = () => {
  const { t } = useSettings();

  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Content Column */}
        <div className="flex-1 flex flex-col space-y-10 text-center lg:text-left order-2 lg:order-1 max-w-2xl lg:max-w-none">
            <div className="space-y-6">
                {/* Decorative Label */}
                <div className="flex items-center justify-center lg:justify-start gap-3">
                     <span className="w-8 h-[2px] bg-sage-500 rounded-full opacity-60"></span>
                     <span className="inline-block text-sm font-bold tracking-[0.2em] uppercase text-sage-600 dark:text-sage-400">
                        {t('Better every day')}
                    </span>
                </div>
                
                {/* Main Headline */}
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-stone-900 dark:text-stone-100 leading-[1.05] font-medium tracking-tight">
                    {t("Let's change")} <br className="hidden md:block"/> 
                    <span className="font-serif italic font-light text-stone-400 dark:text-stone-500 relative inline-block">
                        {t("it up a bit")}
                        {/* Subtle underline decoration */}
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-sage-300 dark:text-sage-800 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </span>
                </h1>
                
                {/* Description */}
                <p className="text-lg md:text-xl text-stone-500 dark:text-stone-400 leading-relaxed font-light max-w-lg mx-auto lg:mx-0">
                    {t("Welcome to my digital garden...")}
                </p>
            </div>
            
            {/* New Info Grid (Replaces CTAs) */}
            <div className="pt-6 border-t border-stone-200 dark:border-stone-800 max-w-md mx-auto lg:mx-0 w-full">
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={<Briefcase size={16} />} label={t('Product Manager')} />
                    <InfoItem icon={<Aperture size={16} />} label={t('Photographer')} />
                    <InfoItem icon={<Cpu size={16} />} label={t('Tech Enthusiast')} />
                    <InfoItem icon={<MapPin size={16} />} label="Shanghai, CN" />
                </div>
            </div>
        </div>

        {/* Shuffle Grid Column */}
        <div className="w-full lg:w-1/2 order-1 lg:order-2">
            <ShuffleGrid />
        </div>

      </div>
    </section>
  );
};

// Subcomponent for Info Grid Items
const InfoItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 group cursor-default">
        <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 group-hover:text-sage-600 dark:group-hover:text-sage-400 group-hover:bg-sage-50 dark:group-hover:bg-sage-900/20 transition-colors">
            {icon}
        </div>
        <span className="text-sm font-medium tracking-wide">{label}</span>
    </div>
);

// --- Shuffle Animation Components ---

const shuffle = (array: any[]) => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const ShuffleGrid = () => {
  const { heroImages } = useData();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const initialSquares = React.useMemo(() => {
     const needed = 16;
     const result = [];
     for(let i = 0; i < needed; i++) {
         result.push({
             id: i,
             src: heroImages[i % heroImages.length]
         });
     }
     return result;
  }, [heroImages]);

  const [squares, setSquares] = useState(initialSquares);

  useEffect(() => {
    shuffleSquares();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const shuffleSquares = () => {
    setSquares((prev) => {
        const newSquares = [...prev];
        return shuffle(newSquares);
    });

    timeoutRef.current = setTimeout(shuffleSquares, 3000);
  };

  return (
    <div className="grid grid-cols-4 grid-rows-4 h-[400px] sm:h-[450px] gap-2">
      {squares.map((sq) => (
        <motion.div
            key={sq.id}
            layout
            transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
            className="w-full h-full rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 shadow-sm"
        >
             <img 
                src={sq.src} 
                alt="" 
                className="w-full h-full object-cover"
                loading="lazy"
             />
             <div className="absolute inset-0 bg-stone-900/0 hover:bg-stone-900/10 transition-colors duration-300" />
        </motion.div>
      ))}
    </div>
  );
};

export default Hero;
