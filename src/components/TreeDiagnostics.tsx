"use client";

import React, { useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Network, 
  User, 
  Link2, 
  Unlink,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TreeDiagnostics = () => {
  const { people, relationships, loading } = useFamily();

  const stats = useMemo(() => {
    if (loading || !people.length) return null;

    // 1. Find Disconnected Components (Islands)
    const visited = new Set<string>();
    const components: string[][] = [];

    const getConnections = (id: string) => {
      return relationships
        .filter(r => r.person_id === id || r.related_person_id === id)
        .map(r => r.person_id === id ? r.related_person_id : r.person_id);
    };

    people.forEach(p => {
      if (!visited.has(p.id)) {
        const component: string[] = [];
        const queue = [p.id];
        visited.add(p.id);

        while (queue.length > 0) {
          const currId = queue.shift()!;
          component.push(currId);
          
          getConnections(currId).forEach(neighborId => {
            if (!visited.has(neighborId)) {
              visited.add(neighborId);
              queue.push(neighborId);
            }
          });
        }
        components.push(component);
      }
    });

    // 2. Identify Orphans (No relationships at all)
    const orphans = people.filter(p => {
      return !relationships.some(r => r.person_id === p.id || r.related_person_id === p.id);
    });

    // 3. Check for potential data issues
    const issues: { type: 'warning' | 'error', message: string, personId?: string }[] = [];
    
    if (components.length > 1) {
      issues.push({ 
        type: 'warning', 
        message: `The family tree is split into ${components.length} separate islands. They won't all connect in the main view.` 
      });
    }

    people.forEach(p => {
      const rels = relationships.filter(r => r.person_id === p.id || r.related_person_id === p.id);
      if (rels.length > 10) {
        issues.push({ type: 'warning', message: `${p.name} has a very high number of connections (${rels.length}).`, personId: p.id });
      }
    });

    return {
      totalPeople: people.length,
      totalRelationships: relationships.length,
      componentCount: components.length,
      components,
      orphans,
      issues
    };
  }, [people, relationships, loading]);

  if (loading) return <div className="p-12 text-center animate-pulse">Analyzing archive structure...</div>;
  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-stone-100 flex flex-col items-center text-center gap-2">
          <User className="w-5 h-5 text-stone-400" />
          <p className="text-2xl font-serif font-bold">{stats.totalPeople}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Total People</p>
        </Card>
        <Card className="p-4 bg-white border-stone-100 flex flex-col items-center text-center gap-2">
          <Link2 className="w-5 h-5 text-stone-400" />
          <p className="text-2xl font-serif font-bold">{stats.totalRelationships}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Connections</p>
        </Card>
        <Card className="p-4 bg-white border-stone-100 flex flex-col items-center text-center gap-2">
          <Network className="w-5 h-5 text-amber-600" />
          <p className="text-2xl font-serif font-bold">{stats.componentCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Islands</p>
        </Card>
        <Card className="p-4 bg-white border-stone-100 flex flex-col items-center text-center gap-2">
          <Unlink className="w-5 h-5 text-red-400" />
          <p className="text-2xl font-serif font-bold">{stats.orphans.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Orphans</p>
        </Card>
      </div>

      {/* Issues Section */}
      {stats.issues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Potential Issues
          </h3>
          <div className="space-y-2">
            {stats.issues.map((issue, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-xl border flex items-center gap-3",
                issue.type === 'error' ? "bg-red-50 border-red-100 text-red-700" : "bg-amber-50 border-amber-100 text-amber-700"
              )}>
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Islands Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
          <Network className="w-4 h-4" /> Family Islands
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {stats.components.map((comp, idx) => (
            <Card key={idx} className="p-6 bg-white border-stone-100 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="rounded-full px-3 py-1 bg-stone-50 text-stone-500 border-stone-200">
                  Island #{idx + 1} — {comp.length} members
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {comp.map(id => {
                  const p = people.find(person => person.id === id);
                  return (
                    <div key={id} className="px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-100 text-xs font-medium text-stone-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {p?.name}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Orphan List */}
      {stats.orphans.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
            <Unlink className="w-4 h-4" /> Orphaned Members (No Connections)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.orphans.map(p => (
              <div key={p.id} className="p-4 bg-red-50/30 border border-red-100 rounded-xl flex items-center justify-between">
                <span className="font-medium text-stone-800">{p.name}</span>
                <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none">Disconnected</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-stone-100 text-center">
        <p className="text-xs text-stone-400 italic">
          Diagnostics help identify why some people might not be appearing in the tree view. 
          Ensure everyone is connected to at least one other person.
        </p>
      </div>
    </div>
  );
};

export default TreeDiagnostics;