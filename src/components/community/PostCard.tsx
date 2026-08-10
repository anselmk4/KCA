"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Share2,
  Bookmark,
  ExternalLink,
  Trash2,
  Edit2,
  Check,
  CornerDownRight,
  Send,
  MoreVertical,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  X,
  Clock,
  ThumbsUp,
  Flame,
  Lightbulb,
  Heart,
  Rocket,
} from "lucide-react";
import { ReactionPicker, ReactionType, font_REACTIONS, REACTION_LIST } from "./ReactionPicker";

export interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
  author_role?: string;
  parent_id?: string | null;
  replies?: CommentItem[];
}

export interface PostItem {
  id: string;
  user_id: string;
  category: "REFLECTIONS" | "ANALYSIS" | "RESOURCES" | "ANNOUNCEMENTS";
  title?: string | null;
  content: string;
  resource_url?: string | null;
  media_urls?: string[] | null;
  reactions_count?: Record<ReactionType, number>;
  user_reaction?: ReactionType | null;
  likes_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
  author_role?: string;
  comments?: CommentItem[];
  showComments?: boolean;
}

interface PostCardProps {
  post: PostItem;
  currentUserId?: string;
  onReact: (postId: string, reactionType: ReactionType) => void;
  onAddComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, newContent: string) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
}

/** Render formatted content text with auto-linkified URLs and highlighted hashtags */
function formatPostText(text: string) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-0.5"
        >
          {part}
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      );
    }
    if (part.startsWith("#") && part.length > 1) {
      return (
        <span key={index} className="text-teal-600 dark:text-teal-400 font-extrabold bg-teal-500/10 px-1.5 py-0.5 rounded-md">
          {part}
        </span>
      );
    }
    return part;
  });
}

function timeAgo(dateString: string) {
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "À l'instant";
  if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 604800) return `Il y a ${Math.floor(diffSec / 86400)} j`;
  return new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function PostCard({
  post,
  currentUserId,
  onReact,
  onAddComment,
  onDeleteComment,
  onEditComment,
  onDeletePost,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  // Compute reaction metrics
  const reactionsCount = post.reactions_count || {
    LIKE: post.likes_count || 0,
    BRAVO: 0,
    INTERESTING: 0,
    GENIUS: 0,
    LOVE: 0,
  };

  const totalReactions = Object.values(reactionsCount).reduce((a, b) => a + b, 0);
  const activeReaction = post.user_reaction ? font_REACTIONS[post.user_reaction] : null;

  // Active top reactions emojis
  const topReactions = (Object.keys(reactionsCount) as ReactionType[])
    .filter((k) => reactionsCount[k] > 0)
    .sort((a, b) => reactionsCount[b] - reactionsCount[a])
    .slice(0, 3);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/community#post-${post.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await onAddComment(post.id, commentText.trim(), replyToCommentId || undefined);
      setCommentText("");
      setReplyToCommentId(null);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEditedComment = async (commentId: string) => {
    if (!editingText.trim() || !onEditComment) return;
    await onEditComment(commentId, editingText.trim());
    setEditingCommentId(null);
    setEditingText("");
  };

  const isInstructor = post.author_role === "INSTRUCTOR";
  const isAdmin = post.author_role === "ADMIN" || post.author_role === "SUPER_ADMIN";

  return (
    <div id={`post-${post.id}`} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      
      {/* 1. Header Author Section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={post.author_name || "User"} className="w-11 h-11 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                {(post.author_name || "A").charAt(0).toUpperCase()}
              </div>
            )}
            {isInstructor && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full ring-2 ring-white dark:ring-zinc-900" title="Formateur Certifié">
                <Sparkles className="w-3 h-3" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                {post.author_name || "Membre Ansella"}
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isAdmin
                  ? "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                  : isInstructor
                  ? "bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}>
                {isAdmin ? "Admin" : isInstructor ? "Formateur" : "Étudiant"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium mt-0.5">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Delete button if current user is author */}
        {currentUserId && currentUserId === post.user_id && onDeletePost && (
          <button
            onClick={() => onDeletePost(post.id)}
            className="p-2 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
            title="Supprimer la publication"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Post Title & Text Content */}
      <div className="space-y-2">
        {post.title && (
          <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white leading-snug">
            {post.title}
          </h3>
        )}

        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal whitespace-pre-wrap">
          {formatPostText(post.content)}
        </p>
      </div>

      {/* 3. External Resource Link Box */}
      {post.resource_url && (
        <a
          href={post.resource_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-teal-600 dark:text-teal-400 transition-all group"
        >
          <span className="truncate max-w-md">{post.resource_url}</span>
          <ExternalLink className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-teal-500 transition-colors" />
        </a>
      )}

      {/* 4. Adaptive Responsive Image Gallery */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div
          className={`grid gap-2 rounded-2xl overflow-hidden pt-1 ${
            post.media_urls.length === 1
              ? "grid-cols-1"
              : post.media_urls.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {post.media_urls.map((url, i) => (
            <div
              key={i}
              onClick={() => setSelectedLightboxImage(url)}
              className={`relative overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-800 rounded-xl group ${
                post.media_urls!.length === 1 ? "max-h-[420px]" : "h-48"
              }`}
            >
              <img
                src={url}
                alt={`Media ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      {/* 5. Reaction Summary Header */}
      {totalReactions > 0 && (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center -space-x-1">
              {topReactions.map((rType) => (
                <span
                  key={rType}
                  className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-white dark:border-zinc-900 flex items-center justify-center text-xs shadow-sm"
                >
                  {font_REACTIONS[rType].emoji}
                </span>
              ))}
            </div>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              {totalReactions} réaction{totalReactions > 1 ? "s" : ""}
            </span>
          </div>

          <span className="font-semibold text-zinc-400">
            {post.comments?.length || 0} commentaire(s)
          </span>
        </div>
      )}

      {/* 6. Main Action Bar (Reactions, Comments, Share) */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 relative">
        {/* Reaction Button & Picker */}
        <div className="relative">
          <ReactionPicker
            isOpen={showPicker}
            onClose={() => setShowPicker(false)}
            onSelect={(type) => onReact(post.id, type)}
          />

          <button
            type="button"
            onClick={() => {
              if (activeReaction) {
                onReact(post.id, activeReaction.type);
              } else {
                onReact(post.id, "LIKE");
              }
            }}
            onMouseEnter={() => setShowPicker(true)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeReaction
                ? `${activeReaction.bgColor} ${activeReaction.color} shadow-sm`
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {activeReaction ? (
              <>
                <span>{activeReaction.emoji}</span>
                <span>{activeReaction.label}</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 text-teal-500" />
                <span>Réagir</span>
              </>
            )}
          </button>
        </div>

        {/* Comment Toggle Button */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-indigo-500" />
          <span>Commenter</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-purple-500" />
          <span>{copiedLink ? "Lien Copié !" : "Partager"}</span>
        </button>
      </div>

      {/* 7. Threaded Comment Section */}
      {showComments && (
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4 animate-in fade-in duration-200">
          
          {/* New Comment Form */}
          <form onSubmit={handleSendComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                replyToCommentId
                  ? "Répondre au commentaire..."
                  : "Écrire un commentaire..."
              }
              className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-zinc-900 dark:text-white"
            />
            {replyToCommentId && (
              <button
                type="button"
                onClick={() => setReplyToCommentId(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                          {comment.author_name || "Membre"}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>

                      {/* Edit / Delete actions if author */}
                      {currentUserId && currentUserId === comment.user_id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingText(comment.content);
                            }}
                            className="p-1 text-zinc-400 hover:text-teal-500"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {onDeleteComment && (
                            <button
                              onClick={() => onDeleteComment(comment.id)}
                              className="p-1 text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border rounded-xl text-xs"
                        />
                        <button
                          onClick={() => handleSaveEditedComment(comment.id)}
                          className="p-1.5 bg-teal-500 text-white rounded-xl text-xs font-bold"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        {comment.content}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setReplyToCommentId(comment.id)}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Répondre</span>
                    </button>
                  </div>

                  {/* Threaded Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-6 space-y-2 border-l-2 border-teal-500/20">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="p-3 bg-zinc-50/60 dark:bg-zinc-800/40 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-white">{reply.author_name}</span>
                            <span className="text-[10px] text-zinc-400">{timeAgo(reply.created_at)}</span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic text-center py-2">
                Soyez le premier à commenter cette publication !
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {selectedLightboxImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLightboxImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedLightboxImage} alt="Enlarged preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-4 -right-4 p-2 bg-white text-black rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
