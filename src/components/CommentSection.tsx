"use client";

import React, { useState } from 'react';
import { Comment } from '../types';
import { useFamily } from '../context/FamilyContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  memoryId: string;
  comments: Comment[];
}

const CommentSection = ({ memoryId, comments }: CommentSectionProps) => {
  const { addComment, user } = useFamily();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(memoryId, newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
        <MessageCircle className="w-3 h-3" />
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </div>

      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-400 shrink-0">
                {comment.authorName?.[0] || 'F'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700">{comment.authorName}</span>
                  <span className="text-[10px] text-stone-300">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed bg-stone-50/50 p-3 rounded-2xl rounded-tl-none border border-stone-100/50">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <div className="relative flex-1">
          <Input 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add to the story..."
            className="h-12 bg-stone-50 border-none rounded-2xl text-sm pl-4 pr-12 focus-visible:ring-amber-500/20"
          />
          <Button 
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl text-amber-600 hover:bg-amber-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;