"use client";

import React, { useState, useMemo } from 'react';
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
  Heart
} from 'lucide-react';
import { buildTree } from '@/lib/tree-utils';
import { OutlineLayout } from '@/components/tree/OutlineLayout';
import { TraditionalLayout } from '@/components/tree/TraditionalLayout';
import { ModernHorizontalLayout } from '@/components/tree/ModernHorizontalLayout';
import { CompactVerticalLayout } from '@/components/tree/CompactVerticalLayout';
import { FlowLayout } from '@/components/tree/FlowLayout';
import { SimpleTreeLayout } from '@/components/tree/SimpleTreeLayout';
import { motion } from 'framer-motion';

type LayoutType = 'outline' | 'traditional' | 'modern' | 'compact' | 'flow' | 'simple';

const TreeDebug = () => {
  const navigate = useNavigate();
  const { people, loading, relationships } = useFamily();
  const [layout, setLayout] = useState<LayoutType>('simple');
  const [zoom, setZoom] = useState(0.8);
  
  const roots = useMemo(() => {
    if (loading) return [];
    return buildTree(people, relationships);
  }, [people, relationships, loading]);

  if (loading) return <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center text-stone-400 font-serif italic text-2xl">Opening the archive...</div>;

  return (
    <div className="fixed inset-0 bg-[#FDFCF9] overflow-hidden flex flex-col text-stone-900">
      {/* Elegant Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-100 p-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')} 
            className="rounded-full text-stone-400 hover:text-stone-800 h-12 w-12"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-600 fill-current" />
              Family Lineage
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Visual Archive</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-[1.5rem] border border-stone-100">
          <Button 
            size="sm" 
            variant={layout === 'simple' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('simple')}
            className="rounded-xl gap-2 text-xs font-bold uppercase tracking-widest h-10 px-4"
          >
            <Layout className="w-4 h-4" /> Simple
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'flow' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('flow')}
            className="rounded-xl gap-2 text-xs font-bold uppercase tracking-widest h-10 px-4"
          >
            <GitBranch className="w-4 h-4" /> Flow
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'compact' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('compact')}
            className="rounded-xl gap-2 text-xs font-bold uppercase tracking-widest h-10 px-4"
          >
            <AlignVerticalSpaceAround className="w-4 h-4" /> Compact
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'outline' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('outline')}
            className="rounded-xl gap-2 text-xs font-bold uppercase tracking-widest h-10 px-4"
          >
            <List className="w-4 h-4" /> List
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-stone-50 rounded-full px-2 py-1 border border-stone-100">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <span className="text-[10px] font-bold w-10 text-center text-stone-400">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setZoom(z => Math.min(z + 0.1, 3))}><ZoomIn className="w-4 h-4" /></Button>
          </div>
          <Button size="icon" variant="outline" className="h-10 w-10 rounded-full border-stone-200" onClick={() => setZoom(0.8)}><Maximize className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-auto custom-scrollbar">
        <motion.div 
          animate={{ scale: zoom }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="origin-center inline-block min-w-full min-h-full"
        >
          <div className="p-[800px]"> {/* Massive padding for panning */}
            {layout === 'outline' && <OutlineLayout roots={roots} />}
            {layout === 'traditional' && <TraditionalLayout roots={roots} />}
            {layout === 'modern' && <ModernHorizontalLayout roots={roots} />}
            {layout === 'compact' && <CompactVerticalLayout roots={roots} />}
            {layout === 'flow' && <FlowLayout roots={roots} />}
            {layout === 'simple' && <SimpleTreeLayout roots={roots} />}
          </div>
        </motion.div>
      </div>

      <div className="bg-white border-t border-stone-100 px-6 py-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300" /> {people.length} Members</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300" /> {relationships.length} Connections</span>
        </div>
        <div className="text-amber-600 italic font-serif normal-case tracking-normal text-sm">
          Viewing {layout} layout
        </div>
      </div>
    </div>
  );
};

export default TreeDebug;