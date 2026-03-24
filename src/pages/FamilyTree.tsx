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

const LINEAGE_COLOR = '#d6d3d1'; 
const PLACEHOLDER_URL = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=400";

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, refreshData } = useFamily();
  const [zoom, setZoom] = useState(0.75);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    try {
      const g = new dagre.graphlib.Graph({ compound: true });
      g.setGraph({ 
        rankdir: 'TB', 
        nodesep: 40, // Very tight horizontal spacing
        ranksep: 80, // Tight vertical spacing
        edgesep: 20,
        marginx: 40, 
        marginy: 40,
        ranker: 'network-simplex'
      });
      g.setDefaultEdgeLabel(() => ({}));

      const validIds = new Set(people.map(p => p.id));

      // 1. Add People Nodes
      people.forEach(p => {
        let displayYear = p.birthYear;
        if (!displayYear && p.birthDate) {
          const match = p.birthDate.match(/\d{4}/);
          if (match) displayYear = match[0];
        }

        g.setNode(p.id, { 
          width: 180, 
          height: 50, 
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

      // 3. Map Children and Create Clusters
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['cousin', 'aunt', 'uncle', 'nephew', 'niece'].includes(type)) return;

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
            g.setEdge(parentId, childId, { type: 'lineage', color: LINEAGE_COLOR, weight: 1 });
          }
        }
      });

      // 4. Add Union Nodes and Marriage Edges with Strict Clustering
      Object.values(unions).forEach(u => {
        const clusterId = `cluster_${u.id}`;
        g.setNode(clusterId, { label: '', style: 'fill: none' });
        
        g.setNode(u.id, { width: 24, height: 24, isUnion: true, color: u.color });
        
        // Force spouses and union node into a cluster
        g.setParent(u.p1, clusterId);
        g.setParent(u.p2, clusterId);
        g.setParent(u.id, clusterId);

        // High weight to keep spouses together
        g.setEdge(u.p1, u.id, { type: 'marriage', color: u.color, weight: 20 });
        g.setEdge(u.p2, u.id, { type: 'marriage', color: u.color, weight: 20 });
        
        u.children.forEach((childId) => {
          g.setEdge(u.id, childId, { type: 'lineage', color: u.color, weight: 5 });
        });
      });

      dagre.layout(g);
      
      const nodes = g.nodes()
        .filter(v => !v.startsWith('cluster_'))
        .map(v => ({ id: v, ...g.node(v) }));
        
      const edges = g.edges().map(e => ({ 
        from: g.node(e.v), 
        to: g.node(e.w),
        ...g.edge(e)
      }));

      const minX = Math.min(...nodes.map(n => n.x - 100));
      const maxX = Math.max(...nodes.map(n => n.x + 100));
      const minY = Math.min(...nodes.map(n => n.y - 50));
      const maxY = Math.max(...nodes.map(n => n.y + 50));

      return {
        nodes,
        edges,
        width: maxX - minX + 200,
        height: maxY - minY + 100,
        offsetX: -minX + 100,
        offsetY: -minY + 50
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
              <Button variant="ghost" size="icon" onClick={() => setZoom(0.75)} className="h-8 w-8 rounded-full hover:bg-white shadow-sm" title="Reset Zoom"><Maximize className="w-4 h-4" /></Button>
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
            {data.edges.map((edge, i) => {
              if (!edge.from || !edge.to) return null;

              const isMarriage = edge.type === 'marriage';
              
              const startX = edge.from.x;
              const startY = edge.from.y + (edge.from.isUnion ? 0 : 25); 
              const endX = edge.to.x;
              const endY = edge.to.y - (edge.to.isUnion ? 12 : 25); 

              // Traditional Orthogonal "Step" Path
              const midY = startY + (endY - startY) * 0.5;
              const path = isMarriage 
                ? `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
                : `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
              
              return (
                <g key={i}>
                  <path
                    d={path}
                    stroke="white"
                    strokeWidth={isMarriage ? "6" : "4"}
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: i * 0.01 }}
                    d={path}
                    stroke={edge.color || LINEAGE_COLOR}
                    strokeWidth={isMarriage ? "2" : "1.5"}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                  transition={{ type: 'spring', damping: 12, delay: 0.3 }}
                  style={{ 
                    left: node.x - 12, 
                    top: node.y - 12,
                    backgroundColor: 'white',
                    borderColor: node.color
                  }}
                  className="absolute w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md z-10 group"
                >
                  <Heart className="w-3 h-3 fill-current transition-transform group-hover:scale-125" style={{ color: node.color }} />
                </motion.div>
              );
            }

            const hasRealPhoto = node.person.photoUrl && node.person.photoUrl !== PLACEHOLDER_URL;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{ 
                  left: node.x - 90, 
                  top: node.y - 25,
                  width: 180,
                  height: 50
                }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className="absolute bg-white rounded-xl border border-stone-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] hover:border-amber-200 transition-all p-1.5 flex items-center gap-2.5 cursor-pointer group z-20"
              >
                <SmartSuggestionHover personId={node.id} />
                
                <div className="h-8 w-8 rounded-full overflow-hidden bg-stone-50 shrink-0 border border-stone-100 group-hover:border-amber-200 transition-all">
                  {hasRealPhoto ? (
                    <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <UserCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0">
                  <p className="text-[11px] font-serif font-bold text-stone-800 truncate group-hover:text-amber-900 transition-colors">{node.person.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] font-bold text-stone-400 uppercase tracking-widest">
                      {node.person.displayYear}
                    </span>
                    {!node.person.isLiving && (
                      <Badge variant="secondary" className="bg-stone-50 text-stone-400 border-none text-[5px] px-1 py-0">
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
        <div className="bg-stone-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300">Lineage</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300">Marriage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;