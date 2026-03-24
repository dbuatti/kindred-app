"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import dagre from 'dagre';

import AddPersonDialog from '../components/AddPersonDialog';
import SmartSuggestionHover from '../components/SmartSuggestionHover';
import TreeSmartInbox from '../components/TreeSmartInbox';

const BRANCH_COLORS = [
  '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899',
];

const LINEAGE_COLOR = '#e2e8f0';

interface NodeData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  person?: any;
  isUnion?: boolean;
  color?: string;
}

interface EdgeData {
  from: NodeData;
  to: NodeData;
  type: 'marriage' | 'lineage';
  color: string;
}

interface TreeLayout {
  nodes: NodeData[];
  edges: EdgeData[];
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, refreshData } = useFamily();

  const [zoom, setZoom] = useState(0.75);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ==================== TREE LAYOUT ====================
  const treeData = useMemo<TreeLayout | { error: true } | null>(() => {
    if (loading || people.length === 0) return null;

    try {
      const g = new dagre.graphlib.Graph({ compound: true });
      g.setGraph({
        rankdir: 'TB',
        nodesep: 80,
        ranksep: 120,
        marginx: 60,
        marginy: 60,
        ranker: 'network-simplex',
      });
      g.setDefaultEdgeLabel(() => ({}));

      const validIds = new Set(people.map((p) => p.id));

      // Add person nodes
      people.forEach((p) => {
        let displayYear = p.birthYear;
        if (!displayYear && p.birthDate) {
          const match = p.birthDate.match(/\d{4}/);
          if (match) displayYear = match[0];
        }

        g.setNode(p.id, {
          width: 200,
          height: 68,
          person: { ...p, displayYear: displayYear || '—' },
        });
      });

      // Build unions (marriages)
      const unions: Record<string, {
        id: string;
        p1: string;
        p2: string;
        children: string[];
        color: string;
      }> = {};

      let colorIdx = 0;

      relationships.forEach((r) => {
        if (r.relationship_type.toLowerCase() !== 'spouse') return;
        if (!validIds.has(r.person_id) || !validIds.has(r.related_person_id)) return;

        const pairId = [r.person_id, r.related_person_id].sort().join('_');
        if (!unions[pairId]) {
          unions[pairId] = {
            id: `union_${pairId}`,
            p1: r.person_id,
            p2: r.related_person_id,
            children: [],
            color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length],
          };
          colorIdx++;
        }
      });

      // Add parent → child edges
      relationships.forEach((r) => {
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

        if (!parentId || !childId || !validIds.has(parentId) || !validIds.has(childId)) return;

        const union = Object.values(unions).find(
          (u) => u.p1 === parentId || u.p2 === parentId
        );

        if (union) {
          if (!union.children.includes(childId)) union.children.push(childId);
        } else {
          g.setEdge(parentId, childId, { type: 'lineage', color: LINEAGE_COLOR, weight: 1 });
        }
      });

      // Add union nodes + marriage/lineage edges
      Object.values(unions).forEach((u) => {
        g.setNode(u.id, { width: 32, height: 32, isUnion: true, color: u.color });
        g.setEdge(u.p1, u.id, { type: 'marriage', color: u.color, weight: 10 });
        g.setEdge(u.p2, u.id, { type: 'marriage', color: u.color, weight: 10 });

        u.children.forEach((childId) => {
          g.setEdge(u.id, childId, { type: 'lineage', color: u.color, weight: 5 });
        });
      });

      dagre.layout(g);

      const nodes: NodeData[] = g.nodes().map((v) => ({ id: v, ...g.node(v) }));
      const edges: EdgeData[] = g.edges().map((e) => ({
        from: g.node(e.v),
        to: g.node(e.w),
        ...g.edge(e),
      }));

      // Calculate bounding box
      const minX = Math.min(...nodes.map((n) => n.x - 110));
      const maxX = Math.max(...nodes.map((n) => n.x + 110));
      const minY = Math.min(...nodes.map((n) => n.y - 60));
      const maxY = Math.max(...nodes.map((n) => n.y + 60));

      return {
        nodes,
        edges,
        width: maxX - minX + 220,
        height: maxY - minY + 120,
        offsetX: -minX + 110,
        offsetY: -minY + 60,
      };
    } catch (err) {
      console.error('[FamilyTree] Layout error:', err);
      return { error: true };
    }
  }, [people, relationships, loading]);

  // ==================== SEARCH ====================
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return people
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 6);
  }, [searchQuery, people]);

  const jumpToPerson = useCallback((id: string) => {
    if (!treeData || 'error' in treeData) return;

    const node = treeData.nodes.find((n) => n.id === id);
    if (!node || !treeContainerRef.current) return;

    setHighlightedId(id);
    setZoom(1);

    const container = treeContainerRef.current;
    const targetX = node.x * zoom - container.clientWidth / 2;
    const targetY = node.y * zoom - container.clientHeight / 2;

    container.scrollTo({
      left: targetX,
      top: targetY,
      behavior: 'smooth',
    });

    setSearchQuery('');
    setTimeout(() => setHighlightedId(null), 2800);
  }, [treeData, zoom]);

  // Keyboard zoom support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '=') setZoom((z) => Math.min(2, z + 0.1));
        if (e.key === '-') setZoom((z) => Math.max(0.2, z - 0.1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-serif mb-4">🌳</div>
          <p className="text-2xl font-serif text-stone-700">Mapping the lineage...</p>
        </div>
      </div>
    );
  }

  if (!treeData || 'error' in treeData) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-10">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-serif text-stone-800">Tree Layout Error</h2>
          <p className="text-stone-500">
            There appears to be a circular relationship or conflicting data preventing layout.
          </p>
          <Button onClick={() => refreshData()} className="rounded-full bg-amber-600 hover:bg-amber-700">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const data = treeData as TreeLayout;

  return (
    <div className="min-h-screen bg-[#FDFCF9] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b-4 border-stone-100 px-6 py-6 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-800">Family Tree</h1>
              <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                LIVE ARCHIVE
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Find someone in the tree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-stone-100 border-none rounded-full focus-visible:ring-amber-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50"
                >
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => jumpToPerson(p.id)}
                      className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-amber-50 text-left border-b border-stone-100 last:border-none"
                    >
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-stone-100 shrink-0">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-full h-full text-stone-300" />
                        )}
                      </div>
                      <span className="font-medium text-stone-800">{p.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <TreeSmartInbox />

            <AddPersonDialog
              trigger={
                <Button className="rounded-full bg-stone-800 hover:bg-stone-900 text-white gap-2 h-11 px-6 shadow-md">
                  <UserPlus className="w-4 h-4" /> Add Family Member
                </Button>
              }
            />

            {/* Zoom Controls */}
            <div className="flex items-center bg-stone-100/70 border border-stone-200 rounded-full p-1">
              <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} className="h-9 w-9">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="w-14 text-center text-xs font-mono text-stone-600">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))} className="h-9 w-9">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(0.75)} className="h-9 w-9" title="Reset view">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tree Canvas */}
      <main
        ref={treeContainerRef}
        className="flex-1 relative overflow-auto p-8 cursor-grab active:cursor-grabbing bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px]"
        style={{ overscrollBehavior: 'none' }}
      >
        <motion.div
          style={{
            width: data.width,
            height: data.height,
            scale: zoom,
            transformOrigin: 'top left',
          }}
          className="relative mx-auto"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Edges */}
          <svg
            ref={svgRef}
            width={data.width}
            height={data.height}
            className="absolute inset-0 pointer-events-none z-0 overflow-visible"
          >
            {data.edges.map((edge, i) => {
              if (!edge.from || !edge.to) return null;

              const isMarriage = edge.type === 'marriage';
              const startY = edge.from.y + (edge.from.isUnion ? 0 : 34);
              const endY = edge.to.y - (edge.to.isUnion ? 16 : 34);
              const midY = startY + (endY - startY) * 0.5;

              const path = `M ${edge.from.x} ${startY} C ${edge.from.x} ${midY}, ${edge.to.x} ${midY}, ${edge.to.x} ${endY}`;

              return (
                <g key={i}>
                  <path
                    d={path}
                    stroke="#fff"
                    strokeWidth={isMarriage ? 7 : 5}
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <motion.path
                    d={path}
                    stroke={edge.color}
                    strokeWidth={isMarriage ? 3 : 2}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: i * 0.008 }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {data.nodes.map((node) => {
            if (node.isUnion) {
              return (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="absolute flex items-center justify-center z-10"
                  style={{
                    left: node.x - 16,
                    top: node.y - 16,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center"
                    style={{ backgroundColor: node.color }}
                  >
                    <Heart className="w-4 h-4 text-white fill-current" />
                  </div>
                </motion.div>
              );
            }

            const isHighlighted = highlightedId === node.id;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.04, y: -3 }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className={cn(
                  "absolute bg-white rounded-2xl border p-3 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-xl transition-all z-20",
                  isHighlighted
                    ? "ring-4 ring-amber-400 border-amber-400 shadow-2xl scale-110"
                    : "border-stone-100 hover:border-amber-200"
                )}
                style={{
                  left: node.x - 100,
                  top: node.y - 34,
                  width: 200,
                }}
              >
                <SmartSuggestionHover personId={node.id} />

                <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                  {node.person.photoUrl ? (
                    <img
                      src={node.person.photoUrl}
                      alt={node.person.name}
                      className="w-full h-full object-cover grayscale-[0.15] hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <UserCircle className="w-7 h-7" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-serif font-semibold text-stone-800 truncate pr-2">
                    {node.person.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-stone-400 tracking-widest uppercase">
                      {node.person.displayYear}
                    </span>
                    {!node.person.isLiving && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-stone-100 text-stone-500">
                        †
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      {/* Legend */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-2 h-px bg-white/60" />
          <span className="uppercase tracking-[0.125em]">Lineage</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span className="uppercase tracking-[0.125em]">Marriage</span>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;