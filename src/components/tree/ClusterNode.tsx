"use client";

import React, { useMemo } from 'react';
import { Heart, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PersonNode from './PersonNode';

interface ClusterNodeProps {
  members: any[];
  level: number;
  people: any[];
  relationships: any[];
  personLevels: Record<string, number>;
  lineageIds: Set<string>;
  highlightedId: string | null;
  selectedPersonId: string | null;
  me: any;
  onSelect: (id: string) => void;
  getPeerCluster: (id: string, level: number, processed: Set<string>) => any[];
  globalProcessed?: Set<string>;
  isFirstInRow?: boolean;
  settings?: any;
}

const ClusterNode = ({ 
  members, 
  level, 
  people, 
  relationships, 
  personLevels, 
  lineageIds, 
  highlightedId, 
  selectedPersonId, 
  me, 
  onSelect, 
  getPeerCluster,
  globalProcessed = new Set(),
  isFirstInRow = false,
  settings
}: ClusterNodeProps) => {
  
  const uniqueMembers = members.filter(m => !globalProcessed.has(m.id));
  uniqueMembers.forEach(m => globalProcessed.add(m.id));

  const partnerUnits = useMemo(() => {
    const units: { parents: any[], children: any[], isTerminated: boolean }[] = [];
    const processedInThisCluster = new Set<string>();

    uniqueMembers.forEach(m => {
      if (processedInThisCluster.has(m.id)) return;

      const spouseRel = relationships.find(r => 
        (r.person_id === m.id || r.related_person_id === m.id) &&
        ['spouse', 'wife', 'husband', 'ex-spouse', 'ex-wife', 'ex-husband'].includes(r.relationship_type.toLowerCase())
      );
      
      const spouseId = spouseRel ? (spouseRel.person_id === m.id ? spouseRel.related_person_id : spouseRel.person_id) : null;
      const spouse = spouseId ? uniqueMembers.find(p => p.id === spouseId) : null;
      const isTerminated = spouseRel?.relationship_type.toLowerCase().includes('ex-') || false;

      const unitParents = spouse ? [m, spouse] : [m];
      unitParents.forEach(p => processedInThisCluster.add(p.id));

      const childIds = new Set<string>();
      unitParents.forEach(p => {
        relationships.forEach(r => {
          const type = r.relationship_type.toLowerCase();
          if (['son', 'daughter', 'child'].includes(type) && r.person_id === p.id) childIds.add(r.related_person_id);
          if (['mother', 'father', 'parent'].includes(type) && r.related_person_id === p.id) childIds.add(r.person_id);
        });
      });

      units.push({ 
        parents: unitParents, 
        children: Array.from(childIds).map(id => people.find(p => p.id === id)).filter(Boolean),
        isTerminated
      });
    });
    return units;
  }, [uniqueMembers, relationships, people]);

  if (uniqueMembers.length === 0) return null;

  return (
    <div className="flex flex-col items-center relative">
      {/* Generational Label */}
      {isFirstInRow && (
        <div className="absolute -left-32 top-0 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest vertical-text">
            GEN {level}
          </span>
          <div className="h-32 w-px bg-stone-300" />
        </div>
      )}

      {/* Parent Row */}
      <div className="flex items-center gap-20 p-8 border-2 border-stone-200 bg-stone-50/50 relative z-10">
        {partnerUnits.map((unit, uIdx) => (
          <div key={uIdx} className="flex items-center gap-8 relative">
            {unit.parents.map((person, pIdx) => {
              const isLast = pIdx === unit.parents.length - 1;
              return (
                <React.Fragment key={person.id}>
                  <div className="relative flex flex-col items-center">
                    {/* Vertical line UP to ancestors */}
                    {relationships.some(r => 
                      (r.person_id === person.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) || 
                      (r.related_person_id === person.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
                    ) && (
                      <div className={cn(
                        "absolute -top-24 w-0.5 h-24",
                        lineageIds.has(person.id) ? "bg-amber-500" : "bg-stone-300"
                      )} />
                    )}
                    
                    <PersonNode 
                      person={person} 
                      me={me}
                      relationships={relationships}
                      isHighlighted={person.id === highlightedId} 
                      isInLineage={lineageIds.has(person.id)}
                      isSelected={person.id === selectedPersonId}
                      onSelect={onSelect}
                      settings={settings}
                    />
                  </div>

                  {/* Spouse Connection */}
                  {!isLast && (
                    <div className="flex flex-col items-center gap-1 px-2 relative">
                      <div className={cn(
                        "h-0.5 w-12", 
                        unit.isTerminated ? "border-t-2 border-dashed border-stone-400" : (lineageIds.has(person.id) && lineageIds.has(unit.parents[pIdx+1].id) ? "bg-amber-500" : "bg-stone-800")
                      )} />
                      <Heart className={cn("w-4 h-4", unit.isTerminated ? "text-stone-300" : "text-stone-800 fill-current")} />
                      
                      {/* Vertical line DOWN to children */}
                      {unit.children.length > 0 && (
                        <div className={cn(
                          "absolute top-10 w-0.5 h-32",
                          lineageIds.has(person.id) ? "bg-amber-500" : "bg-stone-800"
                        )} />
                      )}
                    </div>
                  )}

                  {/* Single Parent vertical line DOWN */}
                  {isLast && unit.parents.length === 1 && unit.children.length > 0 && (
                    <div className={cn(
                      "absolute top-24 w-0.5 h-24",
                      lineageIds.has(person.id) ? "bg-amber-500" : "bg-stone-800"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>

      {/* Children Row */}
      <div className="flex gap-32 mt-32 relative">
        {partnerUnits.map((unit, uIdx) => {
          if (unit.children.length === 0) return null;

          const childClusters: any[][] = [];
          const localProcessed = new Set<string>();
          
          unit.children.forEach(c => {
            if (!globalProcessed.has(c.id) && !localProcessed.has(c.id)) {
              const cluster = getPeerCluster(c.id, level + 1, localProcessed);
              if (cluster.length > 0) childClusters.push(cluster);
            }
          });

          if (childClusters.length === 0) return null;

          const isUnitInLineage = unit.parents.some(p => lineageIds.has(p.id));

          return (
            <div key={uIdx} className="flex flex-col items-center relative">
              {/* Horizontal connector for multiple children */}
              {childClusters.length > 1 && (
                <div className={cn(
                  "absolute top-0 h-0.5",
                  isUnitInLineage ? "bg-amber-500" : "bg-stone-800"
                )} style={{ 
                  width: 'calc(100% - 224px)', // Width of one PersonNode
                  left: '112px'
                }} />
              )}

              <div className="flex gap-20">
                {childClusters.map((cc, ccIdx) => (
                  <ClusterNode 
                    key={ccIdx} 
                    members={cc} 
                    level={level + 1} 
                    people={people}
                    relationships={relationships}
                    personLevels={personLevels}
                    lineageIds={lineageIds}
                    highlightedId={highlightedId}
                    selectedPersonId={selectedPersonId}
                    me={me}
                    onSelect={onSelect}
                    getPeerCluster={getPeerCluster}
                    globalProcessed={globalProcessed} 
                    settings={settings}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClusterNode;