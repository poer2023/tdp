

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, useAuth } from '../store';
import { Fingerprint, ArrowRight, Sparkles } from 'lucide-react';
import { Friend } from '../types';

const FriendConnect: React.FC = () => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addFriend } = useData();
  const { friendCode, loginAsFriend } = useAuth();
  const navigate = useNavigate();

  // If already identified, skip the matrix and go to room
  useEffect(() => {
    if (friendCode) {
        navigate(`/friends/${friendCode}`);
    }
  }, [friendCode, navigate]);

  const generateAccessCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0 to avoid confusion
      let result = '';
      for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    
    // Simulate "processing" for effect
    await new Promise(resolve => setTimeout(resolve, 1500));

    const code = generateAccessCode();
    const newFriend: Friend = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        note,
        accessCode: code,
        tags: ['New Connection'],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
    };

    addFriend(newFriend);
    
    // Persist Identity locally so they can re-enter later
    loginAsFriend(code);
    
    navigate(`/friends/${code}`);
  };

  return (
    <div className="min-h-screen bg-black text-stone-300 flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono selection:bg-emerald-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-900/10 rounded-full blur-[80px]"></div>
          {/* Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="mb-12 text-center space-y-4">
             <div className="w-16 h-16 mx-auto bg-stone-900 border border-stone-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Fingerprint className="text-emerald-500" size={32} />
             </div>
             <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter">
                Identify Yourself
             </h1>
             <p className="text-stone-500 text-sm">
                You have found the hidden entrance.<br/>Establish your connection to the grid.
             </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group relative">
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-900/50 border-b border-stone-800 focus:border-emerald-500 px-4 py-4 outline-none transition-colors text-white placeholder-stone-600"
                    placeholder="Who are you?"
                />
                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-700 group-focus-within:text-emerald-500 transition-colors" size={16} />
            </div>

            <div className="group relative">
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-stone-900/50 border-b border-stone-800 focus:border-emerald-500 px-4 py-4 outline-none transition-colors text-white placeholder-stone-600"
                    placeholder="How do we know each other?"
                />
            </div>

            <div className="pt-8">
                <button
                    type="submit"
                    disabled={isSubmitting || !name}
                    className="w-full bg-white text-black font-bold py-4 rounded hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isSubmitting ? (
                        <span className="animate-pulse">Establish Uplink...</span>
                    ) : (
                        <>
                            Enter the Void <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </form>

        <div className="mt-12 text-center">
            <p className="text-[10px] text-stone-700 uppercase tracking-[0.2em]">
                Secure Channel • Encrypted
            </p>
        </div>
      </div>
    </div>
  );
};

export default FriendConnect;
