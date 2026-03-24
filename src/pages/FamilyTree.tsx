"use client";

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  UserCircle,
  Heart,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Maximize,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import dagre from 'dagre';
import AddPersonDialog from '../components/AddPersonDialog';
import SmartSuggestionHover from '../components/SmartSuggestionHover';
import TreeSmartInbox from '../components/TreeSmartInbox';

const BRANCH_COLORS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
];

const LINEAGE_COLOR = '#d6d3d1'; // stone-300 for subtle lineage
const PLACEHOLDER_URL = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=400";

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, refreshData } = useFamily();
  const [zoom, setZoom] = useState(0.7);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    try {
      const g = new dagre.graphlib.Graph({ compound: true });
      g.setGraph({ 
        rankdir: 'TB', 
        nodesep: 180, // More horizontal space
        ranksep: 220, // More vertical space
        marginx: 150, 
        marginy: 150,
      });
      g.setDefaultEdgeLabel(() => ({}));

      const validIds = new Set(people.map(p => p.id));

      // 1. Add all people as nodes
      people.forEach(p => {
        let displayYear = p.birthYear;
        if (!displayYear && p.birthDate) {
          const match = p.birthDate.match(/\d{4}/);
          if (match) displayYear = match[0];
        }

        g.setNode(p.id, { 
          width: 240, 
          height: 80, 
          person: { ...p, displayYear: displayYear || 'Year Unknown' } 
        });
      });

      // 2. Identify Unions (Marriages)
      const unions: Record<string, { id: string, p1: string, p2: string, children: string[], color: string }> = {};
      let colorIdx = 0;

      relationships.forEach(r => {
        if (r.relationship_type.toLowerCase() === 'spouse') {
          if (validIds.has(r.person_id) && validIds.has(r.related_person_id)) {
            const pairId = [r.person_id, r.related_person_id].sort().join('_');
            if (!unions[pairId]) {
              unions[pairId] = { 
                id: `union_${pairId}`, 
                p1: r.person_id, 
                p2: r.related_person_id, 
                children: [],
                color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length]
              };
              colorIdx++;
            }
          }
        }
      });

      // 3. Map Children to Unions or Parents
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        let parentId = '';
        let childId = '';

        if (['mother', 'father', 'parent'].includes(type)) {
          parentId = r.person_id;
          childId = r.related_person_id;
        } else if (['son', 'daughter', 'child'].includes(type)) {
          childId = r.person_id;
          parentId = r.related_person_id;
        }

        if (parentId && childId && validIds.has(parentId) && validIds.has(childId)) {
          const union = Object.values(unions).find(u => u.p1 === parentId || u.p2 === parentId);
          if (union) {
            if (!union.children.includes(childId)) union.children.push(childId);
          } else {
            // Direct lineage if no union found - high weight to keep them aligned
            g.setEdge(parentId, childId, { type: 'lineage', color: LINEAGE_COLOR, weight: 2 });
          }
        }
      });

      // 4. Create Clusters and add Union nodes
      Object.values(unions).forEach(u => {
        const clusterId = `cluster_${u.id}`;
        g.setNode(clusterId, { label: '', style: 'fill: none; stroke: none;' });
        
        // Add union node and parents to cluster
        g.setNode(u.id, { width: 60, height: 60, isUnion: true, color: u.color });
        g.setParent(u.id, clusterId);
        g.setParent(u.p1, clusterId);
        g.setParent(u.p2, clusterId);

        // EXTREMELY high weight to keep spouses and their union node together
        g.setEdge(u.p1, u.id, { type: 'marriage', color: u.color, weight: 100 });
        g.setEdge(u.p2, u.id, { type: 'marriage', color: u.color, weight: 100 });
        
        // Add children to cluster and connect them
        u.children.forEach((childId) => {
          g.setParent(childId, clusterId);
          g.setEdge(u.id, childId, { type: 'lineage', color: u.color, weight: 50 });
        });
      });

      // 5. Add Sibling edges (invisible) to help layout engine group branches
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['brother', 'sister', 'sibling'].includes(type)) {
          if (validIds.has(r.person_id) && validIds.has(r.related_person_id)) {
            g.setEdge(r.person_id, r.related_person_id, { type: 'sibling', color: 'transparent', weight: 10 });
          }
        }
      });

      dagre.layout(g);
      
      const nodes = g.nodes()
        .filter(v => !v.startsWith('cluster_'))
        .map(v => ({ id: v, ...g.node(v) }));
        
      const edges = g.edges().map(e => ({ 
        from: g.node(e.v), 
        to: g.node(e.w),
        ...g.edge(e)
      })).filter(e => e.color !== 'transparent');

      const minX = Math.min(...nodes.map(n => n.x - 200));
      const maxX = Math.max(...nodes.map(n => n.x + 200));
      const minY = Math.min(...nodes.map(n => n.y - 150));
      const maxY = Math.max(...nodes.map(n => n.y + 150));

      return {
        nodes,
        edges,
        width: maxX - minX + 400,
        height: maxY - minY + 400,
        offsetX: -minX + 200,
        offsetY: -minY + 200
      };
    } catch (err) {
      console.error("[FamilyTree] Layout error:", err);
      return { error: true };
    }
  }, [people, relationships, loading]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the lineage...</div>;

  if (!treeData || (treeData as any).error) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-10">
        <div className="max-w-md text-center space-y-6">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-serif text-stone-800">Tree Layout Error</h2>
          <p className="text-stone-500 leading-relaxed">
            We encountered a conflict in the family relationships. This usually happens if there are circular links.
          </p>
          <Button onClick={() => refreshData()} className="rounded-full bg-amber-600 hover:bg-amber-700 gap-2">
            <RefreshCw className="w-4 h-4" /> Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const data = treeData as { nodes: any[], edges: any[], width: number, height: number, offsetX: number, offsetY: number };

  return (
    <div className="min-h-screen bg-[#FDFCF9] overflow-hidden flex flex-col">
      <header className="bg-white/90 backdrop-blur-xl border-b-4 border-stone-100 px-6 py-6 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500 hover:bg-stone-100">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">Family Tree</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Live Archive</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <TreeSmartInbox />
            <AddPersonDialog 
              trigger={
                <Button variant="outline" className="hidden md:flex rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all h-11 px-6">
                  <UserPlus className="w-4 h-4" /> Add to Family
                </Button>
              }
            />
            <div className="flex items-center gap-2 bg-stone-100/50 p-1.5 rounded-full border border-stone-200/50">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomOut className="w-4 h-4" /></Button>
              <span className="text-[10px] font-bold w-12 text-center text-stone-600">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomIn className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(0.7)} className="h-8 w-8 rounded-full hover:bg-white shadow-sm" title="Reset Zoom"><Maximize className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-auto p-10 cursor-grab active:cursor-grabbing bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:60px_60px]">
        <motion.div 
          style={{ 
            scale: zoom, 
            transformOrigin: 'center top',
            width: data.width,
            height: data.height
          }}
          className="relative mx-auto"
        >
          <svg 
            width={data.width} 
            height={data.height} 
            className="absolute inset-0 pointer-events-none overflow-visible z-0"
          >
            <defs>
              <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {data.edges.map((edge, i) => {
              if (!edge.from || !edge.to) return null;

              const isMarriage = edge.type === 'marriage';
              
              const startX = edge.from.x;
              const startY = edge.from.y + (edge.from.isUnion ? 0 : 40); 
              const endX = edge.to.x;
              const endY = edge.to.y - (edge.to.isUnion ? 30 : 40); 

              // Smooth Bezier Curve
              const midY = startY + (endY - startY) * 0.5;
              const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
              
              return (
                <g key={i}>
                  <path
                    d={path}
                    stroke="white"
                    strokeWidth={isMarriage ? "6" : "4"}
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: i * 0.01 }}
                    d={path}
                    stroke={edge.color || LINEAGE_COLOR}
                    strokeWidth={isMarriage ? "3" : "2"}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: isMarriage ? 'url(#line-glow)' : 'none' }}
                  />
                </g>
              );
            })}
          </svg>

          {data.nodes.map((node: any) => {
            if (node.isUnion) {
              return (
                <motion.div 
                  key={node.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.5 }}
                  style={{ 
                    left: node.x - 25, 
                    top: node.y - 25,
                    backgroundColor: 'white',
                    borderColor: node.color
                  }}
                  className="absolute w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg z-10 group"
                >
                  <Heart className="w-6 h-6 fill-current transition-transform group-hover:scale-125" style={{ color: node.color }} />
                </motion.div>
              );
            }

            const hasRealPhoto = node.person.photoUrl && node.person.photoUrl !== PLACEHOLDER_URL;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{ 
                  left: node.x - 120, 
                  top: node.y - 40,
                  width: 240,
                  height: 80
                }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className="absolute bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] hover:border-amber-200 transition-all p-3 flex items-center gap-4 cursor-pointer group z-20"
              >
                <SmartSuggestionHover personId={node.id} />
                
                <div className="h-14 w-14 rounded-full overflow-hidden bg-stone-50 shrink-0 border-2 border-white shadow-sm ring-1 ring-stone-100 group-hover:ring-amber-200 transition-all">
                  {hasRealPhoto ? (
                    <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <UserCircle className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-serif font-bold text-stone-800 truncate group-hover:text-amber-900 transition-colors">{node.person.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {node.person.displayYear}
                    </span>
                    {!node.person.isLiving && (
                      <Badge variant="secondary" className="bg-stone-100 text-stone-400 border-none text-[8px] px-2 py-0">
                        In Memory
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-stone-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Lineage</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-amber-400 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Marriage Branch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;