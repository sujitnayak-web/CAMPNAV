import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Heart, ThumbsDown, MessageCircle, Share2, PlusCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CreatePostModal } from './CreatePostModal';
import { CommentModal } from './CommentModal';

interface TwinGramPost {
  id: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  location?: string | null;
  user_profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  likes: number;
  dislikes: number;
  commentsCount: number;
  userReaction: 'like' | 'dislike' | null;
}

interface TwinGramPageProps {
  session: Session | null;
  onOpenAuth: () => void;
}

export const TwinGramPage: React.FC<TwinGramPageProps> = ({ session, onOpenAuth }) => {
  const [posts, setPosts] = useState<TwinGramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<TwinGramPost | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingReaction, setProcessingReaction] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchPosts = async () => {
    // 1. Fetch posts only
    const { data: postsData, error: postsError } = await supabase
      .from('twingram_posts')
      .select('id, content, created_at, user_id, image_url, location')
      .order('created_at', { ascending: false });

    if (postsError) {
      setError('Failed to load posts.');
      setLoading(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Initially show posts with placeholders
    const initialPosts = postsData.map(post => ({
      ...post,
      likes: 0,
      dislikes: 0,
      userReaction: null,
      user_profiles: { full_name: 'Loading...', username: 'loading', avatar_url: '' }
    }));
    setPosts(initialPosts);
    setLoading(false);

    // 2. Fetch enrichment data (profiles, reactions, comments count)
    const userIds = [...new Set(postsData.map(post => post.user_id))];
    
    const [profiles, reactions, comments] = await Promise.all([
      supabase.from('user_profiles').select('id, full_name, username, avatar_url').in('id', userIds),
      supabase.from('twingram_reactions').select('post_id, reaction_type, user_id'),
      supabase.from('twingram_comments').select('post_id')
    ]);
    
    // 3. Update with enriched data
    const profilesMap = new Map((profiles.data || []).map(p => [p.id, p]));
    const reactionsData = reactions.data || [];
    const commentsData = comments.data || [];
    
    console.log('[DEBUG] TwinGram profilesMap size:', profilesMap.size);
    
    setPosts(postsData.map(post => {
      const postReactions = reactionsData.filter(r => r.post_id === post.id);
      const postComments = commentsData.filter(c => c.post_id === post.id);
      const profile = profilesMap.get(post.user_id);
      
      if (!profile) {
          console.warn(`[DEBUG] No profile found for user_id: ${post.user_id} in post ${post.id}`);
      }

      return {
        ...post,
        user_profiles: profile || { full_name: 'Unknown', username: 'unknown', avatar_url: '' },
        likes: postReactions.filter(r => r.reaction_type === 'like').length,
        dislikes: postReactions.filter(r => r.reaction_type === 'dislike').length,
        commentsCount: postComments.length,
        userReaction: session ? postReactions.find(r => r.user_id === session.user.id)?.reaction_type : null
      };
    }) as any);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = () => {
    if (!session) {
      setShowSignInModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
    setSuccessMessage('Post published successfully!');
  };

  const handleReaction = async (postId: string, reactionType: 'like' | 'dislike') => {
    if (!session) {
      setShowSignInModal(true);
      return;
    }

    setProcessingReaction(postId);

    try {
      const existingReaction = posts.find(p => p.id === postId)?.userReaction;

      if (existingReaction === reactionType) {
        // Delete reaction
        const { error } = await supabase
          .from('twingram_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
        if (error) throw error;
      } else {
        // Upsert reaction
        const { error } = await supabase
          .from('twingram_reactions')
          .upsert({
            post_id: postId,
            user_id: session.user.id,
            reaction_type: reactionType
          }, { onConflict: 'post_id, user_id' });
        if (error) throw error;
      }

      await fetchPosts();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update reaction.');
    } finally {
      setProcessingReaction(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {successMessage && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-[60]">
          {successMessage}
        </div>
      )}
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">TwinGram</h1>
        <p className="text-slate-600 font-medium">Share, discover, and improve accessibility across campus.</p>
      </div>

      {/* Create Post Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCreatePost}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Feed */}
      {loading ? (
        <p className="text-center text-slate-500">Loading posts...</p>
      ) : error ? (
        <p className="text-center text-rose-600">{error}</p>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex items-center space-x-3">
                <img src={post.user_profiles.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'} alt={post.user_profiles.username} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{post.user_profiles.full_name}</p>
                  <p className="text-xs text-slate-500">
                    @{post.user_profiles.username} • {new Date(post.created_at).toLocaleDateString()}
                    {post.location && ` • ${post.location}`}
                  </p>
                </div>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">{post.content}</p>
              
              {post.image_url && (
                <img src={post.image_url} alt="Post image" className="w-full rounded-xl object-cover" />
              )}
              
              <div className="flex items-center space-x-6 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleReaction(post.id, 'like')}
                  disabled={processingReaction === post.id}
                  className={`flex items-center space-x-1.5 transition-colors ${
                    post.userReaction === 'like' ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.userReaction === 'like' ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <button
                  onClick={() => handleReaction(post.id, 'dislike')}
                  disabled={processingReaction === post.id}
                  className={`flex items-center space-x-1.5 transition-colors ${
                    post.userReaction === 'dislike' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ThumbsDown className={`w-5 h-5 ${post.userReaction === 'dislike' ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold">{post.dislikes}</span>
                </button>
                <button 
                  onClick={() => setSelectedPostForComments(post)}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs font-bold">{post.commentsCount}</span>
                </button>
                <button className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-900 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showCreateModal && (
        <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onPostCreated={handlePostCreated} />
      )}
      
      {selectedPostForComments && (
        <CommentModal 
          post={selectedPostForComments}
          session={session}
          onClose={() => setSelectedPostForComments(null)}
          onOpenAuth={onOpenAuth}
          onCommentChanged={fetchPosts}
        />
      )}
      
      {showSignInModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Sign in required</h3>
            <p className="text-sm text-slate-600">Sign in to contribute to TwinGram and share your accessibility updates with the community.</p>
            <button
              onClick={() => { setShowSignInModal(false); onOpenAuth(); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2 rounded-xl transition-all cursor-pointer"
            >
              Sign In Now
            </button>
            <button
              onClick={() => setShowSignInModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm py-2 rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
