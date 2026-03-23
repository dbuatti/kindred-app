"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  List, 
  Layout, 
  Columns, 
  Terminal,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlignVerticalSpaceAround,
  GitBranch,
  Share2
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
  const [zoom, setZoom] = useState(1.0);
  
  const roots = useMemo(() => {
    if (loading) return [];
    return buildTree(people, relationships);
  }, [people, relationships, loading]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-stone-500 font-mono">LOADING_ARCHIVE...</div>;

  return (
    <div className="fixed inset-0 bg-[#0c0a09] overflow-hidden flex flex-col text-white">
      <div className="bg-stone-900/90 backdrop-blur-md border-b border-stone-800 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')} 
            className="rounded-full text-stone-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1 bg-stone-800 rounded-lg border border-stone-700">
            <Terminal className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">Tree_Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl border border-stone-700">
          <Button 
            size="sm" 
            variant={layout === 'simple' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('simple')}
            className="rounded-lg gap-2 text-xs"
          >
            <Layout className="w-4 h-4" /> Simple
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'flow' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('flow')}
            className="rounded-lg gap-2 text-xs"
          >
            <GitBranch className="w-4 h-4" /> Flow
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'compact' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('compact')}
            className="rounded-lg gap-2 text-xs"
          >
            <AlignVerticalSpaceAround className="w-4 h-4" /> Compact
          </Button>
          <Button 
            size="sm" 
            variant={layout === 'outline' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('outline')}
            className="rounded-lg gap-2 text-xs"
          >
            <List className="w-4 h-4" /> List
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))}><ZoomOut className="w-4 h-4" /></Button>
          <span className="text-[10px] font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}><ZoomIn className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setZoom(1.0)}><Maximize className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-auto bg-stone-950 custom-scrollbar">
        <motion.div 
          animate={{ scale: zoom }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="origin-top-left"
        >
          {layout === 'outline' && <OutlineLayout roots={roots} />}
          {layout === 'traditional' && <TraditionalLayout roots={roots} />}
          {layout === 'modern' && <ModernHorizontalLayout roots={roots} />}
          {layout === 'compact' && <CompactVerticalLayout roots={roots} />}
          {layout === 'flow' && <FlowLayout roots={roots} />}
          {layout === 'simple' && <SimpleTreeLayout roots={roots} />}
        </motion.div>
      </div>

      <div className="bg-stone-900 border-t border-stone-800 px-4 py-2 flex items-center justify-between text-[9px] font-mono text-stone-500">
        <div className="flex gap-4">
          <span>NODES: {people.length}</span>
          <span>RELATIONSHIPS: {relationships.length}</span>
        </div>
        <div className="text-amber-500/50">RENDER_MODE: {layout.toUpperCase()}</div>
      </div>
    </div>
  );
};

export default TreeDebug;