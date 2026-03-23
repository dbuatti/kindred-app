"use client";

import React, { useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Network, 
  User, 
  Link2, 
  Unlink,
  Info,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TreeDiagnostics = () => {
  const { people, relationships, loading, refreshData } = useFamily();

  const stats = useMemo(() => {
    if (loading || !people.length) return null;

    const issues: { type: 'warning' | 'error', message: string, personId?: string }[] = [];
    
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

    // 3. Circular Reference Check (Simple Ancestry Check)
    const checkCircularity = (startId: string, currentId: string, path: Set<string>): boolean => {
      const parents = relationships
        .filter(r => r.person_id === currentId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
        .map(r => r.related_person_id);
      
      for (const parentId of parents) {
        if (parentId === startId) return true;
        if (path.has(parentId)) continue;
        path.add(parentId);
        if (checkCircularity(startId, parentId, path)) return true;
      }
      return false;
    };

    people.forEach(p => {
      if (checkCircularity(p.id, p.id, new Set())) {
        issues.push({ type: 'error', message: `Circular ancestry detected for ${p.name}.`, personId: p.id });
      }
    });

    // 4. Inconsistent Levels Check
    if (components.length > 1) {
      issues.push({ 
        type: 'warning', 
        message: `The family tree is split into ${components.length} separate islands. They won't all connect in the main view.` 
      });
    }

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold text-stone-800">Tree Health Report</h2>
        <Button variant="ghost" size="sm" onClick={() => refreshData()} className="text-stone-400 hover:text-amber-600 gap-2">
          <RefreshCw className="w-4 h-4" /> Re-scan
        </Button>
      </div>

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
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Validation Results
        </h3>
        <div className="space-y-2">
          {stats.issues.length === 0 ? (
            <div className="p-6 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4 text-green-700">
              <CheckCircle2 className="w-6 h-6" />
              <p className="font-medium">No structural issues detected. The tree is healthy!</p>
            </div>
          ) : (
            stats.issues.map((issue, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-xl border flex items-center gap-3",
                issue.type === 'error' ? "bg-red-50 border-red-100 text-red-700" : "bg-amber-50 border-amber-100 text-amber-700"
              )}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">{issue.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Islands Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
          <Network className="w-4 h-4" /> Connection Clusters
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