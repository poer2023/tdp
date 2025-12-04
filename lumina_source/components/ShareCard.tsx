
import React from 'react';
import { ShareItem } from '../types';
import { useData, useAuth } from '../store';
import { useNavigate } from 'react-router-dom';
import { Heart, ExternalLink, Link2 } from 'lucide-react';

interface ShareCardProps {
  item: ShareItem;
}

const ShareCard: React.FC<ShareCardProps> = ({ item }) => {
  const { toggleLike } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
        navigate('/login');
        return;
    }
    toggleLike(item.id, 'share');
  };

  return (
    <div className="break-inside-avoid mb-8 group">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
        
        {/* Top: Image (if any) or pattern */}
        {item.imageUrl ? (
           <div className="relative h-32 w-full overflow-hidden">
             <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
             <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1">
                <Link2 size={10} /> {item.domain}
             </div>
           </div>
        ) : (
            <div className="h-24 bg-stone-100 dark:bg-stone-800 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/50 backdrop-blur-md text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1">
                    <Link2 size={10} /> {item.domain}
                 </div>
                 <ExternalLink className="text-stone-300 dark:text-stone-600" size={32} />
            </div>
        )}

        {/* Content */}
        <div className="p-5">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 leading-tight mb-2 group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="before:absolute before:inset-0">
                    {item.title}
                </a>
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-4">
                {item.description}
            </p>

            <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-3 mt-2">
                <div className="flex gap-2 text-[10px] text-stone-400">
                    {item.tags.map(tag => (
                        <span key={tag} className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                </div>
                 <button 
                    onClick={handleLike}
                    className={`relative z-10 flex items-center gap-1 text-xs hover:text-rose-500 transition-colors ${item.likes > 0 ? 'text-rose-500' : 'text-stone-400'}`}
                >
                    <Heart size={12} className={item.likes > 0 ? "fill-current" : ""} />
                    <span>{item.likes}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
