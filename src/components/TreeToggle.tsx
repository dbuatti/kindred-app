"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { GitBranch, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const TreeToggle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isElk = location.pathname === '/tree-v2';

  return (
    <div className="flex items-center bg-stone-100/80 backdrop-blur-sm p-1 rounded-full border border-stone-200 shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/tree')}
        className={cn(
          "rounded-full px-4 h-8 text-[10px] font-bold uppercase tracking-widest transition-all",
          !isElk ? "bg-white text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
        )}
      >
        <GitBranch className="w-3 h-3 mr-2" />
        Classic
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/tree-v2')}
        className={cn(
          "rounded-full px-4 h-8 text-[10px] font-bold uppercase tracking-widest transition-all",
          isElk ? "bg-white text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
        )}
      >
        <Layers className="w-3 h-3 mr-2" />
        Modern (ELK)
      </Button>
    </div>
  );
};

export default TreeToggle;