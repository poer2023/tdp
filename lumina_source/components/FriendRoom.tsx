

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, useAuth } from '../store';
import { Friend } from '../types';
import { Lock, UserCheck, ShieldCheck, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const FriendRoom: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { friends } = useData();
  const { user, friendCode } = useAuth();
  const navigate = useNavigate();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Simulate network lookup
    const timer = setTimeout(() => {
        const found = friends.find(f => f.accessCode === code);
        
        // Authorization Logic
        const isAdmin = user?.role === 'admin';
        const isOwner = friendCode === code;
        
        if (found) {
            setFriend(found);
            if (isAdmin || isOwner) {
                setAuthorized(true);
            } else {
                setAuthorized(false);
            }
        } else {
            setFriend(null);
        }
        
        setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [code, friends, user, friendCode]);

  if (loading) {
      return (
          <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center text-stone-400">
              <Loader2 size={32} className="animate-spin mb-4 text-sage-500" />
              <p className="text-xs uppercase tracking-widest font-bold">Verifying Access Code...</p>
          </div>
      );
  }

  // Case 1: Friend Code doesn't exist at all
  if (!friend) {
      return (
          <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-500 mb-6">
                  <Loader2 size={32} />
              </div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">Signal Lost</h1>
              <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-sm">
                  This frequency ({code}) does not correspond to any known entity.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="text-stone-900 dark:text-stone-100 underline hover:text-sage-500"
              >
                  Return to safety
              </button>
          </div>
      );
  }

  // Case 2: Friend exists, but user is not authorized (not admin, not owner)
  if (!authorized) {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mb-6 animate-pulse">
                <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">Restricted Area</h1>
            <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-sm">
                You do not have the clearance to view <strong>{friend.name}'s</strong> private room.
            </p>
            <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/connect')}
                  className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-bold text-sm"
                >
                    Identify Yourself
                </button>
                <button 
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg font-bold text-sm"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
  }

  // Case 3: Authorized
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 transition-colors">
        {/* Navigation */}
        <div className="fixed top-0 left-0 p-6 z-20">
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-sm font-medium"
            >
                <ArrowLeft size={16} /> Home
            </button>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-50 dark:bg-sage-900/20 text-sage-600 dark:text-sage-400 text-xs font-bold uppercase tracking-widest mb-6 border border-sage-100 dark:border-sage-800">
                    <ShieldCheck size={12} /> Authorized Personnel
                </div>
                <h1 className="font-serif text-5xl md:text-7xl font-medium text-stone-900 dark:text-stone-100 mb-6">
                    Hello, {friend.name}.
                </h1>
                <p className="text-xl text-stone-500 dark:text-stone-400 font-light max-w-2xl mx-auto">
                    Welcome to your private corner in my digital garden. 
                    <br className="hidden md:block" />
                    Here is where I share things just for us.
                </p>
            </motion.div>

            {/* Access Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="max-w-md mx-auto bg-stone-50 dark:bg-stone-900 p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl relative overflow-hidden group"
            >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sage-200 to-transparent dark:from-sage-900/20 opacity-50 rounded-bl-full pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-stone-800 dark:text-stone-200">
                        <UserCheck size={24} />
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Access Level</div>
                        <div className="text-sage-600 dark:text-sage-400 font-bold">Friend Tier 1</div>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-1">Identity</label>
                        <div className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100">{friend.name}</div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-1">Passkey (Bookmark This)</label>
                        <div className="font-mono bg-stone-200 dark:bg-black p-3 rounded-lg text-center tracking-[0.2em] text-stone-600 dark:text-stone-300 select-all">
                            {friend.accessCode}
                        </div>
                    </div>
                    {friend.note && (
                        <div>
                             <label className="block text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-1">Connection Note</label>
                             <div className="text-sm text-stone-500 italic">"{friend.note}"</div>
                        </div>
                    )}
                </div>

                <div className="text-center pt-6 border-t border-stone-200 dark:border-stone-800">
                    <p className="text-xs text-stone-400">
                        This page is under construction. <br/>
                        More exclusive content coming soon.
                    </p>
                </div>
            </motion.div>
        </div>
    </div>
  );
};

export default FriendRoom;
