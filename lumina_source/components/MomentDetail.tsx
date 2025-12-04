
import React, { useState } from 'react';
import { Moment } from '../types';
import { useData, useAuth, useSettings } from '../store';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, X, Calendar, User } from 'lucide-react';

interface MomentDetailProps {
  moment: Moment;
  onClose: () => void;
}

const MomentDetail: React.FC<MomentDetailProps> = ({ moment, onClose }) => {
  const { toggleLike, addComment } = useData();
  const { user } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');

  const hasImages = moment.images && moment.images.length > 0;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
        onClose();
        navigate('/login');
        return;
    }
    toggleLike(moment.id, 'moment');
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
        onClose();
        navigate('/login');
        return;
    }
    addComment(moment.id, 'moment', commentText, user.username);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
            className={`
                relative w-full max-h-[90vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300
                ${hasImages ? 'max-w-4xl' : 'max-w-xl'} 
            `}
        >
            
            {/* Close button for Mobile (Absolute) */}
            <button 
                onClick={onClose}
                className="absolute top-3 right-3 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors md:hidden"
            >
                <X size={20} />
            </button>

            {/* Left Side: Images (Scrollable if multiple) */}
            {hasImages && (
                <div className="w-full md:w-3/5 bg-black flex items-center justify-center overflow-y-auto max-h-[40vh] md:max-h-full bg-stone-950">
                     <div className="flex flex-col gap-1 w-full p-0">
                        {moment.images!.map((img, idx) => (
                            <img 
                                key={idx} 
                                src={img} 
                                alt={`Detail ${idx}`} 
                                className="w-full h-auto object-contain max-h-[80vh]"
                            />
                        ))}
                     </div>
                </div>
            )}

            {/* Right Side: Content & Comments */}
            <div className={`flex flex-col h-full ${hasImages ? 'w-full md:w-2/5' : 'w-full'}`}>
                
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-900 sticky top-0 z-10">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-100 to-stone-200 dark:from-stone-800 dark:to-stone-700 flex items-center justify-center font-serif font-bold text-stone-600 dark:text-stone-300">
                            L
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-800 dark:text-stone-100 text-sm">Lumina</h3>
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                                <Calendar size={10} /> {moment.date}
                            </span>
                        </div>
                     </div>
                     <button onClick={onClose} className="hidden md:block text-stone-400 hover:text-stone-800 dark:hover:text-stone-200">
                         <X size={24} />
                     </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-50/50 dark:bg-stone-950/50">
                    <p className={`text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed font-serif ${hasImages ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}>
                        {moment.content}
                    </p>
                    
                    {moment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {moment.tags.map(tag => (
                            <span key={tag} className="text-xs font-medium text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-sage-900/20 px-2 py-1 rounded">
                                #{tag}
                            </span>
                            ))}
                        </div>
                    )}

                    <div className="my-6 border-t border-stone-200 dark:border-stone-800"></div>

                    {/* Comments List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t('Comments')}</h4>
                        {moment.comments.length > 0 ? (
                            moment.comments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                                        <User size={14} className="text-stone-500" />
                                    </div>
                                    <div className="bg-white dark:bg-stone-900 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-stone-100 dark:border-stone-800 shadow-sm text-sm flex-1">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-semibold text-stone-700 dark:text-stone-200 text-xs">{c.username}</span>
                                            <span className="text-stone-300 dark:text-stone-600 text-[10px]">{c.date}</span>
                                        </div>
                                        <p className="text-stone-600 dark:text-stone-400">{c.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-stone-400 italic text-center py-4">{t('No comments yet. Be the first.')}</p>
                        )}
                    </div>
                </div>

                {/* Footer Input */}
                <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-4 mb-3">
                        <button 
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${moment.likes > 0 ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'}`}
                        >
                            <Heart size={20} className={moment.likes > 0 ? "fill-current" : ""} />
                            <span>{moment.likes || 0}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-stone-400">
                            <MessageCircle size={20} />
                            <span>{moment.comments.length || 0}</span>
                        </div>
                    </div>

                    <form onSubmit={handleCommentSubmit} className="relative">
                        <input 
                            type="text" 
                            className="w-full pl-4 pr-12 py-3 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-200 transition-all text-sm"
                            placeholder={user ? t("Write a reply...") : t("Log in to reply...")}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={!user}
                        />
                        <button 
                            type="submit" 
                            disabled={!commentText.trim() || !user}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-stone-900 dark:bg-sage-600 text-white rounded-full disabled:opacity-30 disabled:bg-stone-400 hover:scale-105 transition-all"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    </div>
  );
};

export default MomentDetail;
