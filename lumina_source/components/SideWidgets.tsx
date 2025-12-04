
import React from 'react';
import { useSettings } from '../store';
import { Film, Gamepad2, Mail, Github, Twitter, MessageCircle, Compass, Zap } from 'lucide-react';

export const ProfileWidget: React.FC = () => {
    const { t } = useSettings();
    return (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-6 text-center shadow-sm relative overflow-hidden group">
             {/* Decor */}
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-stone-100 to-transparent dark:from-stone-800/50 pointer-events-none" />

            <div className="relative w-24 h-24 mx-auto bg-stone-200 dark:bg-stone-800 rounded-full mb-4 overflow-hidden border-4 border-white dark:border-stone-900 shadow-xl group-hover:scale-105 transition-transform duration-500">
                <img 
                    src="https://aistudiocdn.com/72b5f4228e1b81681e679509282e412406e613940be14c87e7544f4d02e95506.jpg" 
                    alt="BaoZhi" 
                    className="w-full h-full object-cover"
                />
            </div>
            <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">BaoZhi</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
                 <span className="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse" />
                 <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">{t('Product Manager')}</p>
            </div>
            
            <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-6 font-serif max-w-[240px] mx-auto">
                Turning chaos into roadmaps. Obsessed with UX, data, and the perfect cup of coffee.
            </p>

            {/* Social Dock */}
            <div className="flex justify-center gap-3 mb-6">
                 <SocialBtn icon={<Github size={18} />} label="Github" />
                 <SocialBtn icon={<MessageCircle size={18} />} label="WeChat" color="hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" />
                 <SocialBtn icon={<Twitter size={18} />} label="X" />
                 <SocialBtn icon={<Compass size={18} />} label="RedNote" color="hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" />
                 <SocialBtn icon={<Mail size={18} />} label="Email" />
            </div>
        </div>
    );
};

const SocialBtn: React.FC<{ icon: React.ReactNode, label: string, color?: string }> = ({ icon, label, color }) => (
    <button 
        className={`p-2.5 rounded-xl text-stone-400 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 transition-all active:scale-95 ${color || 'hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
        title={label}
    >
        {icon}
    </button>
)

export const CompactStatusWidget: React.FC = () => {
  const { t } = useSettings();
  
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            {t('At a Glance')}
        </h4>

        <div className="space-y-4">
            {/* Focus */}
            <StatusRow 
                label="Focusing on"
                value="Product Strategy"
                icon={<Zap size={16} className="text-amber-500" />}
            />
             {/* Watching */}
             <StatusRow 
                label="Watching"
                value="Oppenheimer"
                icon={<Film size={16} className="text-rose-500" />}
            />
             {/* Playing */}
             <StatusRow 
                label="Playing"
                value="Black Myth: Wukong"
                icon={<Gamepad2 size={16} className="text-indigo-500" />}
            />
        </div>
        
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center text-[10px] text-stone-400 font-mono">
            <span>UPDATED</span>
            <span>2 HRS AGO</span>
        </div>
    </div>
  );
};

const StatusRow: React.FC<{ label: string, value: string, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-50 dark:bg-stone-800 flex items-center justify-center border border-stone-100 dark:border-stone-700 text-stone-400 group-hover:bg-white dark:group-hover:bg-stone-700 transition-colors">
                {icon}
            </div>
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</span>
        </div>
        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 text-right truncate max-w-[120px]">
            {value}
        </span>
    </div>
);
