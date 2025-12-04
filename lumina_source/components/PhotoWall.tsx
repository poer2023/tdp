
import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useData, useSettings } from '../store';

const PhotoWall: React.FC = () => {
  const { heroImages } = useData();
  const { t } = useSettings();
  const [images, setImages] = useState(heroImages);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
      setImages(heroImages);
  }, [heroImages]);

  const shuffleImages = () => {
    setIsShuffling(true);
    // Simple Fisher-Yates shuffle
    const shuffled = [...images];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setTimeout(() => {
      setImages(shuffled);
      setIsShuffling(false);
    }, 400); // Match CSS transition
  };

  return (
    <div className="w-full mb-10 relative group">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-serif text-lg text-stone-600 dark:text-stone-300 italic">{t('Recent Snapshots')}</h3>
        <button 
          onClick={shuffleImages}
          className="flex items-center gap-2 text-xs font-medium text-stone-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
        >
          <RefreshCcw size={14} className={isShuffling ? 'animate-spin' : ''} />
          {t('Shuffle')}
        </button>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 h-48 md:h-40">
        {images.slice(0, 6).map((src, index) => (
          <div 
            key={`${src}-${index}`} 
            className={`
              relative overflow-hidden rounded-lg cursor-pointer transition-all duration-500 ease-in-out bg-stone-200 dark:bg-stone-800
              ${isShuffling ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
              hover:shadow-md
            `}
          >
            <img 
              src={src} 
              alt="Gallery" 
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoWall;
