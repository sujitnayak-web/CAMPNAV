import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Camera, Heart, MessageCircle, Share2, PlusCircle, AlertCircle } from 'lucide-react';

interface TwinGramPost {
  id: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  location: string;
  description: string;
  imageUrl?: string;
  likes: number;
  comments: number;
}

const demoPosts: TwinGramPost[] = [
  {
    id: '1',
    userName: 'Sujit Nayak',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sujit',
    timestamp: '2h ago',
    location: 'SOA ITER Academic Block C',
    description: 'Great news! The new ramp at the main entrance is finally open and very smooth. Makes navigating much easier for wheelchair users.',
    imageUrl: 'https://images.unsplash.com/photo-1549488344-c77cb8776004?auto=format&fit=crop&q=80&w=800',
    likes: 12,
    comments: 3,
  },
  {
    id: '2',
    userName: 'Priya Sharma',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    timestamp: '5h ago',
    location: 'Central Library',
    description: 'Blocked route notice: The elevator on the 2nd floor is out of service for maintenance today. Please use the ramp on the south side.',
    likes: 8,
    comments: 1,
  },
];

interface TwinGramPageProps {
  session: Session | null;
  onOpenAuth: () => void;
}

export const TwinGramPage: React.FC<TwinGramPageProps> = ({ session, onOpenAuth }) => {
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleCreatePost = () => {
    if (!session) {
      setShowSignInModal(true);
    } else {
      // Proceed with contribution
      alert('Contribution feature coming soon!');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
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
      <div className="space-y-6">
        {demoPosts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-bold text-slate-900 text-sm">{post.userName}</p>
                <p className="text-xs text-slate-500">{post.timestamp} • {post.location}</p>
              </div>
            </div>
            <p className="text-slate-800 text-sm leading-relaxed">{post.description}</p>
            {post.imageUrl && (
              <img src={post.imageUrl} alt="Accessibility feature" className="w-full h-64 object-cover rounded-xl" />
            )}
            <div className="flex items-center space-x-6 pt-2 border-t border-slate-100">
              <button className="flex items-center space-x-1.5 text-slate-500 hover:text-rose-500 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-bold">{post.likes}</span>
              </button>
              <button className="flex items-center space-x-1.5 text-slate-500 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold">{post.comments}</span>
              </button>
              <button className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
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
