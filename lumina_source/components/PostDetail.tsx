
import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { useData, useAuth, useSettings } from '../store';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, Share2, ArrowLeft, Calendar } from 'lucide-react';

interface PostDetailProps {
  post: BlogPost;
  onClose: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onClose }) => {
  const { toggleLike, addComment } = useData();
  const { user } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  
  // Simulated paragraphs since we don't have a real backend content field
  const simulatedContent = [
    post.excerpt,
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet."
  ];

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
        onClose();
        navigate('/login');
        return;
    }
    toggleLike(post.id, 'article');
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
        onClose();
        navigate('/login');
        return;
    }
    addComment(post.id, 'article', commentText, user.username);
    setCommentText('');
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-stone-950 overflow-y-auto animate-in fade-in duration-300">
      
      {/* Navbar / Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 h-16 flex items-center justify-between max-w-4xl mx-auto w-full">
         <button onClick={onClose} className="p-2 -ml-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-600 dark:text-stone-300">
             <ArrowLeft size={24} />
         </button>
         <div className="flex gap-2">
             <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-600 dark:text-stone-300">
                 <Share2 size={20} />
             </button>
         </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header Section */}
        <header className="mb-10 text-center">
             <div className="flex items-center justify-center gap-2 mb-6">
                 <span className="text-xs font-bold tracking-widest uppercase text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-sage-900/30 px-3 py-1 rounded-full">
                     {post.category}
                 </span>
             </div>
             
             <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 mb-6 leading-tight">
                 {post.title}
             </h1>

             <div className="flex items-center justify-center gap-6 text-sm text-stone-500 dark:text-stone-400 font-sans border-b border-stone-100 dark:border-stone-800 pb-8 mx-auto max-w-lg">
                 <div className="flex items-center gap-2">
                     <Calendar size={14} />
                     <span>{post.date}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <Clock size={14} />
                     <span>{post.readTime}</span>
                 </div>
             </div>
        </header>

        {/* Hero Image */}
        {post.imageUrl && (
            <div className="w-full aspect-video rounded-lg overflow-hidden mb-12 shadow-sm">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
        )}

        {/* Content Body */}
        <div className="prose prose-stone dark:prose-invert prose-lg mx-auto mb-16 font-serif">
            <p className="lead text-xl md:text-2xl text-stone-600 dark:text-stone-300 italic mb-8 border-l-4 border-sage-500 pl-6">
                {simulatedContent[0]}
            </p>
            {simulatedContent.slice(1).map((paragraph, idx) => (
                <p key={idx} className="mb-6 leading-loose text-stone-800 dark:text-stone-200">
                    {paragraph}
                </p>
            ))}
            
            <div className="flex gap-2 mt-8 not-prose">
                {post.tags.map(tag => (
                    <span key={tag} className="text-sm text-stone-500 dark:text-stone-400">#{tag}</span>
                ))}
            </div>
        </div>

        {/* Interactive Footer */}
        <div className="max-w-2xl mx-auto border-t border-stone-200 dark:border-stone-800 pt-8 mb-12">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={handleLike}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${
                        post.likes > 0 
                        ? 'border-rose-200 bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:border-rose-800' 
                        : 'border-stone-200 hover:border-stone-400 text-stone-600 dark:border-stone-700 dark:text-stone-400'
                    }`}
                >
                    <Heart size={20} className={post.likes > 0 ? "fill-current" : ""} />
                    <span className="font-medium">{post.likes} Likes</span>
                </button>
                <div className="text-stone-400 text-sm">
                    {post.comments.length} Comments
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 md:p-8">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 mb-6">{t('Discussion')}</h3>
                
                {/* Input */}
                <form onSubmit={handleCommentSubmit} className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-sage-200"
                            placeholder={user ? t("Add to the discussion...") : t("Log in to comment...")}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={!user}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!commentText.trim() || !user}
                        className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg disabled:opacity-50 font-medium hover:opacity-90 transition-opacity"
                    >
                        {t('Post')}
                    </button>
                </form>

                {/* List */}
                <div className="space-y-6">
                    {post.comments.length > 0 ? (
                        post.comments.map(c => (
                            <div key={c.id} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">{c.username}</div>
                                        <div className="text-stone-400 text-xs">{c.date}</div>
                                    </div>
                                </div>
                                <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">{c.content}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-stone-400 italic text-sm text-center py-4">{t('No comments yet.')}</p>
                    )}
                </div>
            </div>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;
