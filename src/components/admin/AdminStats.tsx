"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, MessageSquare, Sparkles } from 'lucide-react';

interface AdminStatsProps {
  totalPeople: number;
  totalMemories: number;
  pendingSuggestions: number;
}

const AdminStats = ({ totalPeople, totalMemories, pendingSuggestions }: AdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 bg-white border-stone-100 shadow-sm rounded-[2rem] space-y-2">
        <div className="h-10 w-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400">
          <Users className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-serif font-medium text-stone-800">{totalPeople}</p>
          <p className="text-stone-400 text-xs uppercase tracking-widest">Total People</p>
        </div>
      </Card>
      <Card className="p-6 bg-white border-stone-100 shadow-sm rounded-[2rem] space-y-2">
        <div className="h-10 w-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-serif font-medium text-stone-800">{totalMemories}</p>
          <p className="text-stone-400 text-xs uppercase tracking-widest">Stories Shared</p>
        </div>
      </Card>
      <Card className="p-6 bg-amber-50/50 border-amber-100 shadow-sm rounded-[2rem] space-y-2">
        <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-serif font-medium text-amber-900">{pendingSuggestions}</p>
          <p className="text-amber-700/60 text-xs uppercase tracking-widest">Pending Edits</p>
        </div>
      </Card>
    </div>
  );
};

export default AdminStats;