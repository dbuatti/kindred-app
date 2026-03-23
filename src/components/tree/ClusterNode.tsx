"use client";

import React, { useMemo } from 'react';
import { Heart, Users2, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import PersonAvatar from './PersonAvatar';

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
  debugMode?: boolean;
  onSelect: (id: string) => void;
  getPeerCluster: (id: string, level: number, processed: Set<string>) => any[];
  globalProcessed?: Set<string>;
  isFirstInRow?: boolean;
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
  debugMode,
  onSelect, 
  getPeerCluster,
  globalProcessed = new Set(),
  isFirstInRow = false
}: ClusterNodeProps) => {
  
  const uniqueMembers = members.filter(m => !globalProcessed.has(m.id));
  uniqueMembers.forEach(m => globalProcessed.add(m.id));

  const partnerUnits = useMemo(() => {
    const units: { parents: any[], children: any[] }[] = [];
    const processedInThisCluster = new Set<string>();

    uniqueMembers.forEach(m => {
      if (processedInThisCluster.has(m.id)) return;

      const spouseRel = relationships.find(r => 
        (r.person_id === m.id || r.related_person_id === m.id) &&
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );
      
      const spouseId = spouseRel ? (spouseRel.person_id === m.id ? spouseRel.related_person_id : spouseRel.person_id) : null;
      const spouse = spouseId ? uniqueMembers.find(p => p.id === spouseId) : null;

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
        children: Array.from(childIds).map(id => people.find(p => p.id === id)).filter(Boolean) 
      });
    });
    return units;
  }, [uniqueMembers, relationships, people]);

  if (uniqueMembers.length === 0) return null;

  const isClusterHighlighted = uniqueMembers.some(m => lineageIds.has(m.id));

  return (
    <div className="flex flex-col items-center relative">
      {/* Generational Label - Anchored to the first node of each row */}
      {isFirstInRow && (
        <div className="absolute -left-48 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2 opacity-30">
          <div className="h-px w-12 bg-stone-400" />
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-[0.5em] vertical-text">
            {level === 0 ? "Elders" : level === 1 ? "Parents" : "Children"}
          </span>
        </div>
      )}

      {/* The Generation Row */}
      <div className={cn(
        "flex items-center gap-16 p-10 rounded-[5rem] bg-white/40 backdrop-blur-sm border-2 border-stone-50 shadow-sm relative z-10 transition-all duration-700",
        isClusterHighlighted ? "border-amber-400 bg-amber-50/30 shadow-amber-100" : "",
        highlightedId && !isClusterHighlighted ? "opacity-40 grayscale-[0.5]" : ""
      )}>
        {partnerUnits.map((unit, uIdx) => (
          <div key={uIdx} className="flex items-center gap-6 relative">
            {unit.parents.map((person, pIdx) => {
              const isLast = pIdx === unit.parents.length - 1;
              return (
                <React.Fragment key={person.id}>
                  <div className="relative flex flex-col items-center">
                    {/* Vertical line UP to parents */}
                    {relationships.some(r => 
                      (r.person_id === person.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) || 
                      (r.related_person_id === person.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
                    ) && (
                      <div className={cn(
                        "absolute -top-32 w-px h-32 transition-colors duration-500",
                        lineageIds.has(person.id) ? "bg-amber-400 w-0.5" : "bg-stone-200"
                      )} />
                    )}
                    <PersonAvatar 
                      person={person} 
                      me={me}
                      relationships={relationships}
                      isHighlighted={person.id === highlightedId} 
                      isInLineage={lineageIds.has(person.id)}
                      isSelected={person.id === selectedPersonId}
                      debugMode={debugMode}
                      level={level}
                      onSelect={onSelect}
                    />
                  </div>
                  {!isLast && (
                    <div className="flex flex-col items-center gap-1 px-2 relative">
                      <div className={cn("h-px w-8 transition-colors", lineageIds.has(person.id) && lineageIds.has(unit.parents[pIdx+1].id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                      <Heart className="w-4 h-4 text-red-400 fill-current" />
                      <div className={cn("h-px w-8 transition-colors", lineageIds.has(person.id) && lineageIds.has(unit.parents[pIdx+1].id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                      
                      {/* Marriage Trunk - The line that drops down to children */}
                      {unit.children.length > 0 && (
                        <div className={cn(
                          "absolute top-10 w-px h-32 transition-colors duration-500",
                          lineageIds.has(person.id) ? "bg-amber-400 w-0.5" : "bg-stone-200"
                        )} />
                      )}
                    </div>
                  )}
                  {/* Single Parent Trunk */}
                  {isLast && unit.parents.length === 1 && unit.children.length > 0 && (
                    <div className={cn(
                      "absolute top-24 w-px h-24 transition-colors duration-500",
                      lineageIds.has(person.id) ? "bg-amber-400 w-0.5" : "bg-stone-200"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
            {/* Sibling link between units */}
            {uIdx < partnerUnits.length - 1 && (
              <div className="flex flex-col items-center gap-1 px-4">
                <div className="h-px w-16 bg-stone-100" />
                <Users2 className="w-4 h-4 text-stone-200" />
                <div className="h-px w-16 bg-stone-100" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* The Children Branches */}
      <div className="flex gap-24 mt-32 relative">
        {partnerUnits.map((unit, uIdx) => {
          if (unit.children.length === 0) return null;

          const childClusters: any[][] = [];
          const localProcessed = new Set<string>();
          
          unit.children.forEach(c => {
            if (!globalProcessed.has(c.id) && !localProcessed.has(c.id)) {
              const cluster = getPeerCluster(c.id, level + 1, localProcessed);
              if (cluster.length > 0) {
                childClusters.push(cluster);
              }
            }
          });

          if (childClusters.length === 0) return null;

          const isUnitInLineage = unit.parents.some(p => lineageIds.has(p.id));

          return (
            <div key={uIdx} className="flex flex-col items-center relative">
              {/* Horizontal connector for multiple child branches */}
              {childClusters.length > 1 && (
                <div className={cn(
                  "absolute top-0 h-px bg-stone-200 transition-colors",
                  isUnitInLineage ? "bg-amber-400 h-0.5" : "bg-stone-200"
                )} style={{ 
                  width: 'calc(100% - 100px)',
                  left: '50px'
                }} />
              )}

              <div className="flex gap-16">
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
                    debugMode={debugMode}
                    onSelect={onSelect}
                    getPeerCluster={getPeerCluster}
                    globalProcessed={globalProcessed} 
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