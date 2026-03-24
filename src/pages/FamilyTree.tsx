"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useFamily } from "../context/FamilyContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  UserCircle,
  Heart,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Maximize2,
  Search,
  X,
  Crosshair,
  Ghost,
  Compass,
  Trees,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPersonUrl } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import dagre from "dagre";
import AddPersonDialog from "../components/AddPersonDialog";
import SmartSuggestionHover from "../components/SmartSuggestionHover";
import TreeSmartInbox from "../components/TreeSmartInbox";

// ─── Constants ───────────────────────────────────────────────────────────────

const BRANCH_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const LINEAGE_COLOR = "#cbd5e1";

const NODE_W = 220;
const NODE_H = 72;

// ─── Types ───────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isUnion?: boolean;
  color?: string;
  person?: any;
}

interface TreeEdge {
  from: TreeNode;
  to: TreeNode;
  type: string;
  color?: string;
}

interface TreeData {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a smooth cubic-bezier SVG path between two points */
function cubicPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const midY = startY + (endY - startY) * 0.5;
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
}

/** Extract a 4-digit year from a date string or year field */
function extractYear(person: any): string {
  if (person.birthYear) return String(person.birthYear);
  if (person.birthDate) {
    const m = String(person.birthDate).match(/\d{4}/);
    if (m) return m[0];
  }
  return "Unknown";
}

// ─── PersonCard ──────────────────────────────────────────────────────────────

interface PersonCardProps {
  node: TreeNode;
  isHighlighted: boolean;
  isMe: boolean;
  onClick: () => void;
}

const PersonCard = React.memo(
  ({ node, isHighlighted, isMe, onClick }: PersonCardProps) => {
    const { person } = node;

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.04, y: -3 }}
        style={{
          left: node.x - NODE_W / 2,
          top: node.y - NODE_H / 2,
          width: NODE_W,
          height: NODE_H,
        }}
        onClick={onClick}
        className={cn(
          "absolute rounded-2xl border transition-all duration-200",
          "p-3 flex items-center gap-3 cursor-pointer group z-20",
          "backdrop-blur-sm",
          isHighlighted
            ? "ring-[3px] ring-amber-500 border-amber-400 shadow-2xl shadow-amber-100 z-50 bg-amber-50"
            : isMe
            ? "border-amber-300 shadow-lg bg-gradient-to-br from-amber-50 to-white"
            : "border-stone-100/80 bg-white/95 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.07)]",
          "hover:shadow-[0_20px_48px_-12px_rgba(0,0,0,0.14)] hover:border-amber-200"
        )}
      >
        {/* Smart suggestion hover (pass-through) */}
        <SmartSuggestionHover personId={node.id} />

        {/* Avatar */}
        <div
          className={cn(
            "h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 shadow-sm transition-all duration-300",
            isHighlighted || isMe ? "border-amber-300" : "border-white/80",
            "group-hover:border-amber-200"
          )}
        >
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              className="w-full h-full object-cover grayscale-[0.15] group-hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center">
              <UserCircle className="w-7 h-7 text-stone-300" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[13px] font-semibold text-stone-800 truncate leading-tight tracking-tight group-hover:text-amber-900 transition-colors font-serif">
            {person.name}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.18em]">
              {person.displayYear}
            </span>

            {!person.isLiving && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 rounded-full">
                <Ghost className="w-2.5 h-2.5 text-stone-400" />
                <span className="text-[7px] font-bold text-stone-500 uppercase tracking-tight">
                  In Memory
                </span>
              </span>
            )}

            {isMe && (
              <Badge className="bg-amber-500 text-white border-none text-[7px] px-1.5 py-0 h-4 rounded-full font-bold">
                You
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);
PersonCard.displayName = "PersonCard";

// ─── UnionNode ────────────────────────────────────────────────────────────────

const UnionNode = React.memo(({ node }: { node: TreeNode }) => (
  <motion.div
    key={node.id}
    initial={{ scale: 0, rotate: -90 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.25 }}
    style={{
      left: node.x - 18,
      top: node.y - 18,
      borderColor: node.color,
      boxShadow: `0 0 0 4px ${node.color}22, 0 8px 20px -4px ${node.color}44`,
    }}
    className="absolute w-9 h-9 rounded-full border-[3px] bg-white flex items-center justify-center z-10 group cursor-default"
  >
    <Heart
      className="w-4 h-4 fill-current transition-transform group-hover:scale-125 duration-200"
      style={{ color: node.color }}
    />
  </motion.div>
));
UnionNode.displayName = "UnionNode";

// ─── MiniMap ──────────────────────────────────────────────────────────────────

interface MiniMapProps {
  scrollPos: { x: number; y: number };
  viewRatio: { w: number; h: number };
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const MiniMap = ({ scrollPos, viewRatio, onClick }: MiniMapProps) => (
  <div className="fixed bottom-28 right-6 z-40 hidden md:block">
    <div className="bg-white/90 backdrop-blur-xl p-3.5 rounded-2xl border border-stone-200 shadow-xl space-y-2.5">
      <div className="flex items-center gap-2 text-stone-400">
        <Compass className="w-3.5 h-3.5" />
        <span className="text-[9px] font-black uppercase tracking-[0.22em]">
          Navigator
        </span>
      </div>
      <div
        onClick={onClick}
        className="h-20 w-28 bg-stone-50 rounded-lg border border-stone-100 relative overflow-hidden cursor-crosshair select-none"
        title="Click to navigate"
      >
        {/* Decorative dots */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "6px 6px",
          }}
        />
        {/* Viewport indicator */}
        <div
          className="absolute bg-amber-500/25 border border-amber-500/60 rounded transition-all duration-100"
          style={{
            width: `${Math.max(8, viewRatio.w * 100)}%`,
            height: `${Math.max(8, viewRatio.h * 100)}%`,
            left: `${Math.min(92, scrollPos.x * 100)}%`,
            top: `${Math.min(92, scrollPos.y * 100)}%`,
          }}
        />
      </div>
    </div>
  </div>
);

// ─── ZoomControl ─────────────────────────────────────────────────────────────

interface ZoomControlProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ZoomControl = ({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlProps) => (
  <div className="flex items-center gap-1.5 bg-stone-100/70 px-2 py-1.5 rounded-full border border-stone-200/60 backdrop-blur-sm">
    <button
      onClick={onZoomOut}
      className="h-7 w-7 rounded-full hover:bg-white transition-colors flex items-center justify-center text-stone-600 hover:shadow-sm"
      aria-label="Zoom out"
    >
      <ZoomOut className="w-3.5 h-3.5" />
    </button>
    <button
      onClick={onReset}
      className="text-[10px] font-black w-11 text-center text-stone-600 hover:text-amber-700 transition-colors tabular-nums"
      title="Reset zoom"
    >
      {Math.round(zoom * 100)}%
    </button>
    <button
      onClick={onZoomIn}
      className="h-7 w-7 rounded-full hover:bg-white transition-colors flex items-center justify-center text-stone-600 hover:shadow-sm"
      aria-label="Zoom in"
    >
      <ZoomIn className="w-3.5 h-3.5" />
    </button>
    <div className="h-4 w-px bg-stone-300 mx-0.5" />
    <button
      onClick={onReset}
      className="h-7 w-7 rounded-full hover:bg-white transition-colors flex items-center justify-center text-stone-500 hover:shadow-sm"
      aria-label="Fit to screen"
    >
      <Maximize2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ─── FamilyTree ───────────────────────────────────────────────────────────────

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, refreshData, user } = useFamily();

  const [zoom, setZoom] = useState(0.75);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const treeContainerRef = useRef<HTMLDivElement>(null);

  // ── Navigator state ────────────────────────────────────────────────────────

  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const [viewRatio, setViewRatio] = useState({ w: 0.3, h: 0.3 });

  const handleScroll = useCallback(() => {
    const c = treeContainerRef.current;
    if (!c) return;
    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = c;
    setScrollPos({
      x: scrollLeft / (scrollWidth || 1),
      y: scrollTop / (scrollHeight || 1),
    });
    setViewRatio({
      w: clientWidth / (scrollWidth || 1),
      h: clientHeight / (scrollHeight || 1),
    });
  }, []);

  useEffect(() => {
    const c = treeContainerRef.current;
    if (!c) return;
    c.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => c.removeEventListener("scroll", handleScroll);
  }, [handleScroll, loading, zoom]);

  // ── Tree layout ────────────────────────────────────────────────────────────

  const treeData = useMemo<TreeData | { error: true } | null>(() => {
    if (loading || people.length === 0) return null;

    try {
      const g = new dagre.graphlib.Graph();
      g.setGraph({
        rankdir: "TB",
        nodesep: 44,
        ranksep: 88,
        marginx: 60,
        marginy: 60,
        ranker: "network-simplex",
      });
      g.setDefaultEdgeLabel(() => ({}));

      const validIds = new Set(people.map((p) => p.id));

      // Add person nodes
      people.forEach((p) => {
        g.setNode(p.id, {
          width: NODE_W,
          height: NODE_H,
          person: { ...p, displayYear: extractYear(p) },
        });
      });

      const unions: Record<
        string,
        { id: string; p1: string; p2: string; children: string[]; color: string }
      > = {};
      let colorIdx = 0;

      // Identify spouse/union pairs
      relationships.forEach((r) => {
        const t = r.relationship_type.toLowerCase();
        const isSpouse =
          t.includes("spouse") ||
          t.includes("wife") ||
          t.includes("husband") ||
          t.includes("married");
        if (
          isSpouse &&
          validIds.has(r.person_id) &&
          validIds.has(r.related_person_id)
        ) {
          const pairId = [r.person_id, r.related_person_id].sort().join("_");
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
        }
      });

      // Map children to unions or direct parents
      relationships.forEach((r) => {
        const t = r.relationship_type.toLowerCase();
        const isParental =
          t.includes("parent") ||
          t.includes("father") ||
          t.includes("mother") ||
          t.includes("papa") ||
          t.includes("mama");
        const isChild =
          t.includes("child") ||
          t.includes("son") ||
          t.includes("daughter");

        let parentId = "";
        let childId = "";
        if (isParental) {
          parentId = r.person_id;
          childId = r.related_person_id;
        } else if (isChild) {
          childId = r.person_id;
          parentId = r.related_person_id;
        }

        if (
          parentId &&
          childId &&
          parentId !== childId &&
          validIds.has(parentId) &&
          validIds.has(childId)
        ) {
          const union = Object.values(unions).find(
            (u) => u.p1 === parentId || u.p2 === parentId
          );
          if (union) {
            if (!union.children.includes(childId)) union.children.push(childId);
          } else {
            g.setEdge(parentId, childId, {
              type: "lineage",
              color: LINEAGE_COLOR,
              weight: 2,
            });
          }
        }
      });

      // Sibling proximity hints (invisible layout-only edges)
      relationships.forEach((r) => {
        const t = r.relationship_type.toLowerCase();
        if (
          (t.includes("sister") || t.includes("brother") || t.includes("sibling")) &&
          r.person_id !== r.related_person_id &&
          validIds.has(r.person_id) &&
          validIds.has(r.related_person_id)
        ) {
          g.setEdge(r.person_id, r.related_person_id, {
            type: "sibling-constraint",
            weight: 1,
            minlen: 1,
          });
        }
      });

      // Finalise union nodes
      Object.values(unions).forEach((u) => {
        g.setNode(u.id, { width: 36, height: 36, isUnion: true, color: u.color });
        g.setEdge(u.p1, u.id, { type: "marriage", color: u.color, weight: 10, minlen: 1 });
        g.setEdge(u.p2, u.id, { type: "marriage", color: u.color, weight: 10, minlen: 1 });
        u.children.forEach((childId) => {
          g.setEdge(u.id, childId, { type: "lineage", color: u.color, weight: 5, minlen: 1 });
        });
      });

      dagre.layout(g);

      const nodes: TreeNode[] = g.nodes().map((v) => ({ id: v, ...g.node(v) }));
      const edges: TreeEdge[] = g.edges().map((e) => ({
        from: g.node(e.v),
        to: g.node(e.w),
        ...g.edge(e),
      }));

      const xs = nodes.map((n) => n.x);
      const ys = nodes.map((n) => n.y);
      const minX = Math.min(...xs) - 160;
      const maxX = Math.max(...xs) + 160;
      const minY = Math.min(...ys) - 110;
      const maxY = Math.max(...ys) + 110;

      return {
        nodes,
        edges,
        width: maxX - minX,
        height: maxY - minY,
        offsetX: -minX,
        offsetY: -minY,
      };
    } catch (err) {
      console.error("[FamilyTree] Layout error:", err);
      return { error: true };
    }
  }, [people, relationships, loading]);

  // ── Search ─────────────────────────────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return people.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery, people]);

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const jumpToPerson = useCallback(
    (id: string) => {
      if (!treeData || "error" in treeData) return;
      const node = treeData.nodes.find((n) => n.id === id);
      const c = treeContainerRef.current;
      if (!node || !c) return;

      setHighlightedId(id);
      setZoom(1);
      setSearchQuery("");

      // Defer scroll so zoom re-render completes first
      requestAnimationFrame(() => {
        const scrollX =
          (node.x + treeData.offsetX) * 1 - c.clientWidth / 2;
        const scrollY =
          (node.y + treeData.offsetY) * 1 - c.clientHeight / 2;
        c.scrollTo({ left: scrollX, top: scrollY, behavior: "smooth" });
      });

      const timer = setTimeout(() => setHighlightedId(null), 3000);
      return () => clearTimeout(timer);
    },
    [treeData]
  );

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const c = treeContainerRef.current;
      if (!c) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratioX = (e.clientX - rect.left) / rect.width;
      const ratioY = (e.clientY - rect.top) / rect.height;
      c.scrollTo({
        left: ratioX * c.scrollWidth - c.clientWidth / 2,
        top: ratioY * c.scrollHeight - c.clientHeight / 2,
        behavior: "smooth",
      });
    },
    []
  );

  const centerOnMe = useCallback(() => {
    const me = people.find((p) => p.userId === user?.id);
    if (me) jumpToPerson(me.id);
  }, [people, user, jumpToPerson]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.2, +(z - 0.1).toFixed(2))), []);
  const zoomReset = useCallback(() => setZoom(0.75), []);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Trees className="w-10 h-10 text-amber-400" />
        </motion.div>
        <p className="text-stone-500 text-sm font-serif tracking-wide animate-pulse">
          Mapping the lineage…
        </p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (!treeData || "error" in treeData) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-10">
        <div className="max-w-md text-center space-y-6">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-serif text-stone-800">
            Tree Layout Error
          </h2>
          <p className="text-stone-500 leading-relaxed text-sm">
            A conflict was found in the family relationships — usually caused by
            circular links. Refresh to try again.
          </p>
          <Button
            onClick={() => refreshData()}
            className="rounded-full bg-amber-600 hover:bg-amber-700 gap-2 h-11 px-6"
          >
            <RefreshCw className="w-4 h-4" /> Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const data = treeData as TreeData;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDFCF9] overflow-hidden flex flex-col">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-stone-100 px-5 py-4 z-30 shadow-[0_1px_12px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full text-stone-500 hover:bg-stone-100 h-9 w-9"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight leading-none">
                Family Tree
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-stone-400 text-[9px] font-black uppercase tracking-[0.22em]">
                  Live Archive
                </p>
              </div>
            </div>
          </div>

          {/* Centre: Search */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <Input
              placeholder="Find someone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-stone-100 border-none rounded-full text-sm focus-visible:ring-2 focus-visible:ring-amber-500/30 placeholder:text-stone-400"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Dropdown results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50"
                >
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => jumpToPerson(p.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors text-left border-b border-stone-50 last:border-none group"
                    >
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle className="w-full h-full text-stone-300" />
                        )}
                      </div>
                      <span className="font-medium text-stone-800 text-sm group-hover:text-amber-900 transition-colors">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 ml-auto shrink-0">
            <TreeSmartInbox />

            <Button
              variant="outline"
              onClick={centerOnMe}
              className="rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-stone-50 hidden md:flex h-9 px-4 text-sm"
            >
              <Crosshair className="w-4 h-4" />
              Find Me
            </Button>

            <div className="hidden lg:flex">
              <AddPersonDialog
                trigger={
                  <Button className="rounded-full bg-stone-900 hover:bg-stone-800 text-white gap-2 h-9 px-5 text-sm shadow-md transition-all hover:scale-105 font-medium">
                    <UserPlus className="w-4 h-4" /> Add to Family
                  </Button>
                }
              />
            </div>

            <ZoomControl
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onReset={zoomReset}
            />
          </div>
        </div>
      </header>

      {/* ── Canvas ────────────────────────────────────────────────────────── */}
      <main
        ref={treeContainerRef}
        className={cn(
          "flex-1 relative overflow-auto select-none",
          "cursor-grab active:cursor-grabbing",
          // Subtle dot-grid background
          "bg-[#FDFCF9]",
          "[background-image:radial-gradient(#d4d4d0_1.2px,transparent_1.2px)]",
          "[background-size:28px_28px]"
        )}
      >
        <motion.div
          style={{
            scale: zoom,
            transformOrigin: "center top",
            width: data.width,
            height: data.height,
            minWidth: "100%",
          }}
          className="relative mx-auto"
          // Allow pinch-to-zoom on touch devices via CSS
        >
          {/* SVG edges */}
          <svg
            width={data.width}
            height={data.height}
            className="absolute inset-0 pointer-events-none overflow-visible z-0"
            aria-hidden="true"
          >
            <defs>
              {/* Soft drop-shadow for edges */}
              <filter id="edge-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                <feOffset dx="0" dy="1" in="blur" result="offset" />
                <feComponentTransfer in="offset" result="shadow">
                  <feFuncA type="linear" slope="0.15" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {data.edges.map((edge, i) => {
              if (!edge.from || !edge.to || edge.type === "sibling-constraint")
                return null;

              const isMarriage = edge.type === "marriage";

              const startX = edge.from.x + data.offsetX;
              const startY =
                edge.from.y + data.offsetY + (edge.from.isUnion ? 0 : NODE_H / 2);
              const endX = edge.to.x + data.offsetX;
              const endY =
                edge.to.y + data.offsetY - (edge.to.isUnion ? 18 : NODE_H / 2);

              const path = cubicPath(startX, startY, endX, endY);

              return (
                <g key={i} filter="url(#edge-shadow)">
                  {/* White halo */}
                  <path
                    d={path}
                    stroke="white"
                    strokeWidth={isMarriage ? 9 : 7}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.5}
                  />
                  {/* Coloured line — animated draw-in */}
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      duration: 1.2,
                      ease: "easeInOut",
                      delay: Math.min(i * 0.008, 1.0),
                    }}
                    d={path}
                    stroke={edge.color ?? LINEAGE_COLOR}
                    strokeWidth={isMarriage ? 3.5 : 2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {data.nodes.map((node) => {
            const posX = node.x + data.offsetX;
            const posY = node.y + data.offsetY;
            const resolvedNode = { ...node, x: posX, y: posY };

            if (node.isUnion) {
              return <UnionNode key={node.id} node={resolvedNode} />;
            }

            return (
              <PersonCard
                key={node.id}
                node={resolvedNode}
                isHighlighted={highlightedId === node.id}
                isMe={node.person?.userId === user?.id}
                onClick={() => navigate(getPersonUrl(node.id, node.person?.name))}
              />
            );
          })}
        </motion.div>
      </main>

      {/* ── Mini-map navigator ─────────────────────────────────────────────── */}
      <MiniMap
        scrollPos={scrollPos}
        viewRatio={viewRatio}
        onClick={handleNavClick}
      />

      {/* ── Legend bar ────────────────────────────────────────────────────── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="bg-stone-900/85 backdrop-blur-xl text-white px-7 py-3.5 rounded-full shadow-2xl flex items-center gap-6 border border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <svg width="24" height="12" aria-hidden="true">
              <line
                x1="0"
                y1="6"
                x2="24"
                y2="6"
                stroke={LINEAGE_COLOR}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-300">
              Lineage
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2.5">
            <Heart className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-300">
              Marriage
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
              {people.length} people
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;