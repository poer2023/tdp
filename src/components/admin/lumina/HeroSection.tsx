"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from './store';
import { SectionContainer } from './AdminComponents';

export const HeroSection: React.FC = () => {
    const { heroImages, addHeroImage, deleteHeroImage } = useData();
    const [newHeroImage, setNewHeroImage] = useState('');

    const handleAddHeroImage = async () => {
        if (newHeroImage) {
            await addHeroImage({
                url: newHeroImage,
                sortOrder: heroImages.length,
                active: true
            });
            setNewHeroImage('');
        }
    };

    const handleRemoveHeroImage = async (id: string) => {
        await deleteHeroImage(id);
    };

    return (
        <SectionContainer title="Hero Shuffle Grid" onAdd={() => { }}>
            <div className="mb-6 flex gap-2">
                <input
                    className="flex-1 p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                    placeholder="Paste image URL here..."
                    value={newHeroImage}
                    onChange={e => setNewHeroImage(e.target.value)}
                />
                <button onClick={handleAddHeroImage} className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 rounded-lg font-bold">Add</button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {heroImages.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square bg-stone-200 dark:bg-stone-800">
                        <img src={img.url} className="w-full h-full object-cover" />
                        <button onClick={() => handleRemoveHeroImage(img.id)} className="absolute top-2 right-2 p-1 bg-rose-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </SectionContainer>
    );
};

export default HeroSection;
