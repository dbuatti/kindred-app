"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  List, 
  Layout, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  AlignVerticalSpaceAround,
  GitBranch,
  Heart,
  Focus,
  Bug,
  Square,
  Sparkles
} from 'lucide-react';
import { buildTree } from '@/lib/tree-utils';
import { OutlineLayout } from '@/components/tree/OutlineLayout';
import { TraditionalLayout } from '@/components/tree/TraditionalLayout';
import { ModernHorizontalLayout } from '@/components/tree/ModernHorizontalLayout';
import { CompactVerticalLayout } from '@/components/tree/CompactVerticalLayout';
import { FlowLayout } from '@/components/tree/FlowLayout';
import { MinimalistLayout } from '@/components/tree/MinimalistLayout';
import { ConstellationLayout } from '@/components/tree/ConstellationLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type LayoutType = 'constellation' | 'minimalist' | 'outline' | 'traditional' | 'modern' | 'compact' | 'flow';

const TreeDebug = () => {
  const navigate = useNavigate();
  const { people, loading, relationships } = useFamily();
  const [layout, setLayout] = useState<LayoutType>('constellation');
  const [zoom, setZoom] = useState(0.8);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const roots = useMemo(() => {
    if (loading) return [];
    return buildTree(people, relationships);
  }, [people, relationships, loading]);

  const centerView = () => {
    if (scrollContainerRef.current && contentRef.current) {
      const container = scrollContainerRef.current;
      const content = contentRef.current;
      
      const scrollLeft = (content.scrollWidth - container.clientWidth) / 2;
      const scrollTop = (content.scrollHeight - container.clientHeight) / 2;
      
      container.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!loading && roots.length > 0) {
      const timer = setTimeout(centerView, 100);
      return () => clearTimeout(timer);
    }
  }, [layout, loading, roots.length]);

  if (loading) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400 font-serif italic text-2xl">Opening the archive...</div>;

  return (
    <div className="fixed inset-0 bg-stone-950 overflow-hidden flex flex-col text-white">
      <div className="bg-stone-900/80 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')} 
            className="rounded-full text-stone-400 hover:text-white h-12 w-12"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Family Constellation
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Archive Map</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10">
          <Button 
            size="sm" 
            variant={layout === 'constellation' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('constellation')}
            className="rounded-xl gap-2 text-xs font-bold uppercase tracking-widest h-10 px-4"
          >
            <Sparkles className="w-4 h-4" /> Constellation
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'minimalist' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('minimalist')}
            className="rounded-xl gap-2 text-xs font-bold uppercase tracking-widest h-10 px-4"
          >
            <Square className="w-4 h-4" /> Minimal
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'flow' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('flow')}
            className="rounded-xl gap-2 text-xs font-bold uppercase tracking-widest h-10 px-4"
          >
            <GitBranch className="w-4 h-4" /> Flow
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={centerView}
            className="rounded-full border-white/10 text-stone-400 hover:text-amber-400 gap-2 h-10 px-4"
          >
            <Focus className="w-4 h-4" /> Center
          </Button>
          <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/10">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <span className="text-[10px] font-bold w-10 text-center text-stone-500">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setZoom(z => Math.min(z + 0.1, 3))}><ZoomIn className="w-4 h-4" /></Button>
          </div>
          <Button size="icon" variant="outline" className="h-10 w-10 rounded-full border-white/10" onClick={() => setZoom(1.0)}><Maximize className="w-4 h-4" /></Button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 relative overflow-auto custom-scrollbar bg-stone-950"
      >
        <motion.div 
          ref={contentRef}
          animate={{ scale: zoom }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="origin-center inline-block min-w-full min-h-full"
        >
          <div className="p-[1000px]">
            {layout === 'constellation' && <ConstellationLayout roots={roots} />}
            {layout === 'minimalist' && <MinimalistLayout roots={roots} />}
            {layout === 'outline' && <OutlineLayout roots={roots} />}
            {layout === 'traditional' && <TraditionalLayout roots={roots} />}
            {layout === 'modern' && <ModernHorizontalLayout roots={roots} />}
            {layout === 'compact' && <CompactVerticalLayout roots={roots} />}
            {layout === 'flow' && <FlowLayout roots={roots} />}
          </div>
        </motion.div>
      </div>

      <div className="bg-stone-900 border-t border-white/10 px-6 py-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-700" /> {people.length} Members</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-700" /> {relationships.length} Connections</span>
        </div>
        <div className="text-amber-400 italic font-serif normal-case tracking-normal text-sm">
          Viewing {layout} layout
        </div>
      </div>
    </div>
  );
};

export default TreeDebug;