
import React, { useState } from 'react';
import { useData, useSettings } from '../store';
import { GalleryItem } from '../types';
import { Maximize2, X, Camera, MapPin, Play, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

const Gallery: React.FC = () => {
  const { galleryItems } = useData();
  const { t } = useSettings();
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleOpen = (item: GalleryItem) => {
    setSelectedItem(item);
    setZoomLevel(1);
    document.body.style.overflow = 'hidden';
  };

  const handleClose = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'unset';
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!selectedItem) return;
    const idx = galleryItems.findIndex(i => i.id === selectedItem.id);
    const nextIdx = (idx + 1) % galleryItems.length;
    setSelectedItem(galleryItems[nextIdx]);
    setZoomLevel(1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!selectedItem) return;
    const idx = galleryItems.findIndex(i => i.id === selectedItem.id);
    const prevIdx = (idx - 1 + galleryItems.length) % galleryItems.length;
    setSelectedItem(galleryItems[prevIdx]);
    setZoomLevel(1);
  };

  const toggleZoom = (e: React.MouseEvent) => {
      e.stopPropagation();
      setZoomLevel(prev => prev === 1 ? 2 : 1);
  };

  return (
    <div className="w-full animate-in fade-in duration-700">
        <div className="max-w-6xl mx-auto px-4 py-8 mb-4 text-center">
            <h1 className="font-serif text-4xl text-stone-900 dark:text-stone-100 mb-4">{t('Gallery')}</h1>
            <p className="text-stone-500 dark:text-stone-400 font-light max-w-lg mx-auto">
                A collection of light, shadow, and motion. Capturing the world one frame at a time.
            </p>
        </div>

        {/* Masonry Grid */}
        <div className="max-w-7xl mx-auto px-4 columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {galleryItems.map((item) => (
                <div 
                    key={item.id} 
                    className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
                    onClick={() => handleOpen(item)}
                >
                    <div className="relative">
                        <img 
                            src={item.type === 'video' ? (item.thumbnail || item.url) : item.url} 
                            alt={item.title}
                            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Video Indicator */}
                        {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                            <h3 className="text-white font-serif text-lg font-medium">{item.title}</h3>
                            <span className="text-stone-300 text-xs">{item.date}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Lightbox Modal */}
        {selectedItem && (
            <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col md:flex-row animate-in fade-in duration-200">
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white transition-colors"
                >
                    <X size={32} />
                </button>

                {/* Main Content Area (Image/Video) */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black cursor-grab active:cursor-grabbing" onClick={handleClose}>
                    
                    {/* Navigation Arrows */}
                    <button onClick={handlePrev} className="absolute left-4 p-4 text-white/30 hover:text-white transition-colors z-10 hidden md:block">
                        <ChevronLeft size={48} />
                    </button>
                    <button onClick={handleNext} className="absolute right-4 p-4 text-white/30 hover:text-white transition-colors z-10 hidden md:block">
                        <ChevronRight size={48} />
                    </button>

                    <div 
                        className="relative transition-transform duration-300 ease-out"
                        style={{ transform: `scale(${zoomLevel})` }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                    >
                         {selectedItem.type === 'video' ? (
                            <video 
                                src={selectedItem.url} 
                                controls 
                                autoPlay 
                                loop 
                                className="max-w-full max-h-[85vh] shadow-2xl"
                            />
                         ) : (
                            <img 
                                src={selectedItem.url} 
                                alt={selectedItem.title}
                                className="max-w-full max-h-[90vh] object-contain shadow-2xl select-none"
                            />
                         )}
                    </div>
                    
                    {/* Zoom Controls (Image Only) */}
                    {selectedItem.type === 'image' && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10" onClick={(e) => e.stopPropagation()}>
                            <button onClick={toggleZoom} className="text-white hover:text-sage-300 transition-colors">
                                {zoomLevel === 1 ? <ZoomIn size={20} /> : <ZoomOut size={20} />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Details Panel */}
                <div className="w-full md:w-96 bg-stone-900 border-l border-stone-800 p-8 flex flex-col overflow-y-auto relative z-10 h-[40vh] md:h-full">
                    <div className="mb-auto">
                        <h2 className="font-serif text-3xl text-white mb-2">{selectedItem.title}</h2>
                        {selectedItem.description && (
                            <p className="text-stone-400 leading-relaxed mb-6 font-light">
                                {selectedItem.description}
                            </p>
                        )}
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-stone-300">
                                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-500">
                                    <Maximize2 size={14} />
                                </div>
                                <div className="text-sm">
                                    <span className="block text-stone-500 text-[10px] uppercase tracking-widest">{t('Type')}</span>
                                    {selectedItem.type === 'video' ? t('Video') : 'Photography'}
                                </div>
                            </div>
                            
                            {selectedItem.location && (
                                <div className="flex items-center gap-3 text-stone-300">
                                     <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-500">
                                        <MapPin size={14} />
                                    </div>
                                    <div className="text-sm">
                                        <span className="block text-stone-500 text-[10px] uppercase tracking-widest">{t('Location')}</span>
                                        {selectedItem.location}
                                    </div>
                                </div>
                            )}

                             {selectedItem.exif && (
                                <div className="mt-8 pt-6 border-t border-stone-800">
                                    <h4 className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-widest mb-4">
                                        <Camera size={14} /> EXIF Data
                                    </h4>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                        <div>
                                            <span className="block text-stone-600 text-[10px]">{t('Camera')}</span>
                                            <span className="text-stone-300">{selectedItem.exif.camera}</span>
                                        </div>
                                        <div>
                                            <span className="block text-stone-600 text-[10px]">{t('Lens')}</span>
                                            <span className="text-stone-300">{selectedItem.exif.lens}</span>
                                        </div>
                                        <div>
                                            <span className="block text-stone-600 text-[10px]">{t('Aperture')}</span>
                                            <span className="text-stone-300">{selectedItem.exif.aperture}</span>
                                        </div>
                                        <div>
                                            <span className="block text-stone-600 text-[10px]">{t('ISO')}</span>
                                            <span className="text-stone-300">{selectedItem.exif.iso}</span>
                                        </div>
                                        <div>
                                            <span className="block text-stone-600 text-[10px]">{t('Shutter')}</span>
                                            <span className="text-stone-300">{selectedItem.exif.shutter}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-stone-800 text-stone-600 text-xs flex justify-between">
                        <span>{selectedItem.date}</span>
                        <span>ID: {selectedItem.id}</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Gallery;
