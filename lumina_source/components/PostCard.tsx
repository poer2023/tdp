
import React from 'react';
import { BlogPost } from '../types';
import { useData, useAuth } from '../store';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

interface PostCardProps {
  post: BlogPost;
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const { toggleLike } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
          navigate('/login');
          return;
      }
      toggleLike(post.id, 'article');
  };

  return (
    <div className="break-inside-avoid mb-8 group cursor-pointer" onClick={onClick}>
        <article className="bg-white dark:bg-stone-900 border-b-2 border-stone-100 dark:border-stone-800 pb-6 hover:border-stone-300 dark:hover:border-stone-600 transition-colors duration-300">
            {/* Image - Plain and sharp, full color */}
            {post.imageUrl && (
                <div className="w-full aspect-video overflow-hidden mb-5 rounded-sm relative">
                    <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-white dark:bg-stone-900 px-3 py-1 text-[10px] font-bold tracking-widest uppercase border border-stone-200 dark:border-stone-700">
                        {post.category}
                    </div>
                </div>
            )}

            <div className="px-1">
                {!post.imageUrl && (
                     <div className="mb-3 text-[10px] font-bold tracking-widest uppercase text-stone-400">
                        {post.category}
                    </div>
                )}
                
                <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-3 leading-tight group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                    {post.title}
                </h3>
                
                <p className="text-stone-600 dark:text-stone-400 font-serif text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs font-sans text-stone-400">
                    <div className="flex items-center gap-3">
                        <span>{post.date}</span>
                        <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                        <span>{post.readTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <button 
                            onClick={handleLike}
                            className={`flex items-center gap-1 hover:text-rose-500 transition-colors ${post.likes > 0 ? 'text-rose-500' : ''}`}
                        >
                            <Heart size={14} className={post.likes > 0 ? "fill-current" : ""} />
                            <span>{post.likes}</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    </div>
  );
};

export default PostCard;
