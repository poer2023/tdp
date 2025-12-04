
import React, { useState, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useData, useSettings } from '../store';
import { Camera, Footprints, Activity, Clock, Film, Gamepad2, Maximize } from 'lucide-react';

// Custom Animated Counter
const AnimatedCounter: React.FC<{ end: number; duration?: number; trigger: number }> = ({ end, duration = 2000, trigger }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Cyberpunk-ish random number shuffling effect before settling
      if (progress < 1) {
         setCount(Math.floor(Math.random() * end * 1.5));
      } else {
         setCount(end);
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    
    setCount(0);
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration, trigger]);

  return <span>{count.toLocaleString()}</span>;
};

// Custom Bar Shape that looks like realistic stacked photos
const PhotoStackBar = (props: any) => {
    const { fill, x, y, width, height, index, animationKey } = props;
    
    // Safety check
    if (!height || height <= 0) return null;

    // Config for the photo look
    const photoPhysicalHeight = 10; // The height of the white rect
    const overlap = 6;              // How much they overlap vertically
    const step = photoPhysicalHeight - overlap; // Effective height gain per photo
    
    // Determine number of slices based on height
    // Visual logic: height = (n-1)*step + photoPhysicalHeight
    // n ≈ height / step
    const rawSlices = Math.floor(height / step);
    // Limit to prevent rendering too many DOM nodes on huge bars
    const numSlices = Math.min(Math.max(rawSlices, 1), 25);

    return (
      <g>
        {Array.from({ length: numSlices }).map((_, i) => {
            // Render from bottom (visually lower on screen, higher Y value) up
            // i=0 is the bottom-most card
            const yPos = (y + height) - photoPhysicalHeight - (i * step);
            
            // Pseudo-random seed based on column index and stack index
            // This ensures the randomness is consistent (deterministic) across renders
            const seed = (index * 1337) + (i * 42);
            
            // Random rotation (-5 to 5 degrees)
            const rotation = Math.sin(seed) * 5; 
            
            // Random X offset (-2 to 2 px) to make the stack look messy
            const xOffset = Math.cos(seed) * 2;
            
            // Stagger animation: bottom cards appear first, then stack up
            const delay = (index * 0.15) + (i * 0.05); 
            
            // The top card gets the highlight color (Cyan), others are "developed photos" (Dark/Grayscale)
            const isTop = i === numSlices - 1;
            const contentColor = isTop ? fill : '#292524'; // stone-800 for content

            return (
                <g
                    key={i}
                    className="photo-slice"
                    style={{
                        '--target-rot': `${rotation}deg`,
                        '--target-x': `${xOffset}px`,
                        animation: `photoDrop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
                        animationDelay: `${delay}s`,
                        opacity: 0,
                        transformOrigin: `${x + width/2}px ${yPos + photoPhysicalHeight/2}px` // Pivot around center of the card
                    } as React.CSSProperties}
                >
                    {/* 1. Photo Paper (White Border) with Shadow */}
                    <rect
                        x={x}
                        y={yPos}
                        width={width}
                        height={photoPhysicalHeight}
                        fill="#fafaf9" // stone-50 paper color
                        stroke="#e7e5e4" // stone-200 faint border
                        strokeWidth={1}
                        rx={1}
                        // Drop shadow simulated via CSS class below
                    />
                    
                    {/* 2. Photo Content (Inner Rect) */}
                    <rect
                        x={x + 2} // 2px margin for border
                        y={yPos + 2}
                        width={Math.max(width - 4, 0)}
                        height={Math.max(photoPhysicalHeight - 4, 0)}
                        fill={contentColor}
                        rx={0.5}
                        fillOpacity={isTop ? 1 : 0.8}
                    />
                </g>
            );
        })}
      </g>
    );
};

const StatsDashboard: React.FC = () => {
  const { photoStats, routineData, stepsData, skillData, movieData } = useData();
  const { t } = useSettings();
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const recentMovieData = movieData.slice(-4);
  const totalPhotos = photoStats.reduce((acc, curr) => acc + curr.count, 0);

  const handleShutterClick = () => {
      // 1. Flash Effect
      setIsFlashing(true);
      
      // 2. Reset Animation slightly after flash starts
      setTimeout(() => {
          setAnimationTrigger(prev => prev + 1);
      }, 100);

      // 3. Remove Flash
      setTimeout(() => {
          setIsFlashing(false);
      }, 300);
  };

  return (
    <div className="w-full animate-in fade-in duration-700 pb-16">
        
        {/* CSS Animations */}
        <style>{`
          /* Photo Drop / Fly In Animation */
          @keyframes photoDrop {
            0% { 
              transform: translateY(-40px) rotate(15deg) scale(1.1); 
              opacity: 0; 
            }
            60% {
               opacity: 1;
            }
            100% { 
              transform: translateY(0) translateX(var(--target-x)) rotate(var(--target-rot)) scale(1); 
              opacity: 1; 
            }
          }

          /* Shadow for the photo cards */
          .photo-slice rect:first-child {
             filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
          }

          @keyframes flash {
            0% { opacity: 0; }
            10% { opacity: 1; }
            100% { opacity: 0; }
          }
          .flash-overlay {
            animation: flash 0.3s ease-out;
            pointer-events: none;
          }
        `}</style>

        {/* Header */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 pt-12 pb-16 px-4 mb-8">
            <div className="max-w-5xl mx-auto text-center">
                <span className="inline-block p-3 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 mb-6">
                    <Activity size={24} strokeWidth={1.5} />
                </span>
                <h3 className="font-serif text-4xl md:text-5xl text-stone-900 dark:text-stone-100 mb-4">{t('Life Log')}</h3>
                <p className="text-stone-500 dark:text-stone-400 font-light max-w-lg mx-auto text-lg">
                    {t('Quantifying the hobbies that keep me sane.')}
                </p>
            </div>
        </div>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: INTERACTIVE Shutter Count */}
        <div className="col-span-1 md:col-span-2 bg-stone-950 text-white p-6 rounded-2xl border border-stone-800 shadow-2xl relative overflow-hidden group select-none">
          
          {/* Flash Overlay */}
          {isFlashing && <div className="absolute inset-0 bg-white z-50 flash-overlay"></div>}

          {/* Background Texture */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 0)', backgroundSize: '10px 10px' }}>
          </div>

          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-cyan-500/50"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-cyan-500/50"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-cyan-500/50"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-cyan-500/50"></div>
          
          {/* AF Focus Box Center */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-yellow-500/50 w-16 h-12 transition-all duration-100 ${isFlashing ? 'scale-90 border-green-500 w-14 h-10' : 'scale-100'}`}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-yellow-500/50"></div>
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between mb-6 relative z-20">
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 font-mono text-xs font-bold transition-colors ${isFlashing ? 'text-red-500' : 'text-stone-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${isFlashing ? 'bg-red-500' : 'bg-stone-500'}`}></div>
                    REC
                </div>
                <div className="px-2 py-0.5 bg-stone-900 rounded border border-stone-700 text-[10px] font-mono text-stone-400">
                    1/8000s
                </div>
            </div>
            
            {/* Shutter Button */}
            <button 
                onClick={handleShutterClick}
                className="group/btn relative flex items-center justify-center"
                title="Capture Frame"
            >
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-stone-700 to-stone-800 border-2 border-stone-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                    <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800"></div>
                </div>
                <div className="absolute -right-16 opacity-0 group-hover/btn:opacity-100 transition-opacity text-[10px] font-mono text-cyan-400 pointer-events-none">
                    PRESS SHUTTER
                </div>
            </button>
          </div>
          
          {/* Main Content Area */}
          <div className="flex flex-col md:flex-row h-64 w-full relative z-10 gap-6">
             
             {/* Left: Stats */}
             <div className="w-full md:w-1/3 flex flex-col justify-end pb-4 border-r border-stone-800/50 pr-4">
                 <div className="flex items-center gap-2 text-cyan-500/80 mb-1">
                    <Camera size={16} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Shutter Count</span>
                 </div>
                 <div className="text-6xl font-mono font-bold text-white tracking-tighter tabular-nums leading-none">
                    <AnimatedCounter end={totalPhotos} trigger={animationTrigger} duration={1000} />
                 </div>
                 <div className="mt-4 text-[10px] font-mono text-stone-500 space-y-1">
                    <div className="flex justify-between">
                        <span>BUFFER</span>
                        <span className="text-cyan-500">
                             {isFlashing ? 'BUSY' : 'READY'}
                        </span>
                    </div>
                 </div>
             </div>

             {/* Right: The Photo Stack Chart */}
             <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    key={animationTrigger} // Force re-render on trigger
                    data={photoStats} 
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                    barCategoryGap="20%" // Wider bars to look like photos
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#333', fontSize: 9, fontFamily: 'monospace' }} 
                    />
                    <Tooltip 
                        cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                            return (
                                <div className="bg-stone-900/90 border border-stone-700 p-2 rounded text-xs font-mono shadow-xl backdrop-blur-md">
                                    <div className="text-white font-bold mb-1 flex justify-between items-center gap-4">
                                        <span>{label}</span>
                                        <span className="text-cyan-400">JPG</span>
                                    </div>
                                    <div className="text-stone-400">
                                        Frames: <span className="text-white font-bold">{payload[0].value}</span>
                                    </div>
                                </div>
                            );
                            }
                            return null;
                        }}
                    />
                    <Bar 
                        dataKey="count" 
                        fill="#22d3ee" // Cyan highlight for the top photo
                        shape={<PhotoStackBar animationKey={animationTrigger} />}
                        isAnimationActive={false} // We handle animation in the shape
                    />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-stone-800 flex justify-between items-center text-[10px] font-mono text-stone-600">
               <div className="flex gap-4">
                  <span>RAW uncompressed</span>
                  <span>Color Space: sRGB</span>
              </div>
              <div className="flex items-center gap-2">
                  <Maximize size={12} />
                  <span>FULL FRAME</span>
              </div>
          </div>
        </div>

        {/* Card 2: Weekly Routine */}
        <div className="col-span-1 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl text-indigo-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20 transition-colors">
              <Clock size={20} strokeWidth={1.5} />
            </div>
            <div>
                 <h4 className="font-serif text-lg text-stone-800 dark:text-stone-100">{t('The Balance')}</h4>
                 <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">{t('Weekly Routine')}</p>
            </div>
          </div>
          <div className="h-40 w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={routineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {routineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-stone-400 font-serif italic text-sm">24h</span>
            </div>
          </div>
        </div>

        {/* Card 3: Media Diet */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Movies Section */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/10 rounded-xl text-rose-500">
                             <Film size={18} />
                        </div>
                        <h4 className="font-serif text-md text-stone-800 dark:text-stone-100">{t('Movies')}</h4>
                     </div>
                     <span className="text-2xl font-bold text-stone-800 dark:text-stone-200">24</span>
                </div>
                <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={recentMovieData}>
                            <Bar dataKey="movies" fill="#fb7185" radius={[2, 2, 0, 0]} />
                             <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#a8a29e' }} />
                             <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                             />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Games Section */}
            <div className="flex-1 p-6 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors group">
                 <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl text-emerald-500">
                             <Gamepad2 size={18} />
                        </div>
                        <h4 className="font-serif text-md text-stone-800 dark:text-stone-100">{t('Games')}</h4>
                     </div>
                     <div className="text-right">
                         <span className="block text-xs text-stone-400">Now Playing</span>
                         <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Baldur's Gate 3</span>
                     </div>
                </div>
                 <div className="mt-2">
                     <div className="flex justify-between text-xs text-stone-500 mb-1">
                         <span>Progress</span>
                         <span>75%</span>
                     </div>
                     <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                         <div className="bg-emerald-500 w-3/4 h-full rounded-full"></div>
                     </div>
                 </div>
                 <div className="mt-4 flex gap-2">
                     {['RPG', 'Strategy'].map(tag => (
                         <span key={tag} className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-1 rounded border border-stone-200 dark:border-stone-700">{tag}</span>
                     ))}
                 </div>
            </div>
        </div>

        {/* Card 4: Daily Steps */}
        <div className="col-span-1 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-sage-50 dark:bg-sage-900/10 rounded-xl text-sage-600 dark:text-sage-400 group-hover:bg-sage-100 dark:group-hover:bg-sage-900/20 transition-colors">
                <Footprints size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h4 className="font-serif text-lg text-stone-800 dark:text-stone-100">{t('The Journey')}</h4>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">{t('Daily Steps')}</p>
                </div>
            </div>
            <div className="text-right">
                <span className="block text-xl font-bold text-stone-800 dark:text-stone-100">8,571</span>
                <span className="text-[10px] text-sage-600 dark:text-sage-400">Avg. Steps</span>
            </div>
          </div>
          <div className="h-24 w-full">
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={stepsData}>
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#fff', color: '#333' }}
                    />
                    <Bar 
                        dataKey="steps" 
                        fill="#5c9c6d" 
                        radius={[4, 4, 4, 4]} 
                        barSize={8} 
                    />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Card 5: Skills */}
        <div className="col-span-1 md:col-span-3 bg-stone-200 dark:bg-stone-900 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Activity size={120} />
            </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-white dark:bg-stone-800 rounded-xl text-stone-500 dark:text-stone-300">
              <Activity size={20} strokeWidth={1.5} />
            </div>
            <div>
                 <h4 className="font-serif text-lg text-stone-900 dark:text-white">{t('The Output')}</h4>
                 <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">{t('Current Focus Areas')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
             {skillData.map((skill) => (
                 <div key={skill.name}>
                     <div className="flex justify-between mb-2">
                         <span className="text-xs font-medium text-stone-700 dark:text-stone-300">{skill.name}</span>
                         <span className="text-xs text-stone-500">{skill.level}%</span>
                     </div>
                     <div className="w-full bg-stone-300 dark:bg-stone-800 rounded-full h-1">
                         <div 
                            className="bg-stone-600 dark:bg-stone-400 h-1 rounded-full transition-all duration-1000 ease-out group-hover:bg-stone-900 dark:group-hover:bg-white"
                            style={{ width: `${skill.level}%` }}
                         ></div>
                     </div>
                 </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsDashboard;
