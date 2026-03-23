"use client";

import React, { useMemo } from 'react';
import { Heart, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  onSelect: (id: string) => void;
  getPeerCluster: (id: string, level: number, processed: Set<string>) => any[];
  parentProcessed?: Set<string>;
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
  parentProcessed = new Set() 
}: ClusterNodeProps) => {
  
  const parentUnits = useMemo(() => {
    const units: { parents: any[], children: any[] }[] = [];
    const processedInCluster = new Set<string>();

    members.forEach(m => {
      if (processedInCluster.has(m.id)) return;

      const spouseRel = relationships.find(r => 
        (r.person_id === m.id || r.related_person_id === m.id) &&
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );
      const spouse = spouseRel ? members.find(p => p.id === (spouseRel.person_id === m.id ? spouseRel.related_person_id : spouseRel.person_id)) : null;

      const unitParents = spouse ? [m, spouse] : [m];
      unitParents.forEach(p => processedInCluster.add(p.id));

      const childIds = new Set<string>();
      unitParents.forEach(p => {
        relationships.forEach(r => {
          const type = r.relationship_type.toLowerCase();
          if (['son', 'daughter', 'child'].includes(type) && r.person_id === p.id) childIds.add(r.related_person_id);
          if (['mother', 'father', 'parent'].includes(type) && r.related_person_id === p.id) childIds.add(r.person_id);
        });
      });

      if (childIds.size > 0) {
        units.push({ 
          parents: unitParents, 
          children: Array.from(childIds).map(id => people.find(p => p.id === id)).filter(Boolean) 
        });
      }
    });
    return units;
  }, [members, relationships, people]);

  const isClusterHighlighted = members.some(m => lineageIds.has(m.id));

  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "flex items-center gap-4 p-6 rounded-[3.5rem] bg-white/60 backdrop-blur-sm border-2 border-stone-50 shadow-sm relative z-10 transition-all duration-700",
        isClusterHighlighted ? "border-amber-400 bg-amber-50/50 shadow-amber-100" : "",
        highlightedId && !isClusterHighlighted ? "opacity-40 grayscale-[0.5]" : ""
      )}>
        {members.map((person, idx) => {
          const next = members[idx + 1];
          const rel = next ? relationships.find(r => (r.person_id === person.id && r.related_person_id === next.id) || (r.person_id === next.id && r.related_person_id === person.id)) : null;
          const linkType = rel?.relationship_type.toLowerCase();

          return (
            <React.Fragment key={person.id}>
              <div className="relative flex flex-col items-center">
                {relationships.some(r => (r.person_id === person.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) || (r.related_person_id === person.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))) && (
                  <div className={cn(
                    "absolute -top-10 w-px h-10 transition-colors duration-500",
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
                  onSelect={onSelect}
                />
              </div>
              {linkType && (
                <div className="flex flex-col items-center gap-1 px-2">
                  <div className={cn("h-px w-8 transition-colors", lineageIds.has(person.id) && lineageIds.has(next.id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "bg-white p-1 rounded-full shadow-sm border transition-all",
                          lineageIds.has(person.id) && lineageIds.has(next.id) ? "border-amber-400 scale-110" : "border-stone-100"
                        )}>
                          {['spouse', 'wife', 'husband'].includes(linkType) ? <Heart className="w-3 h-3 text-red-400 fill-current" /> : <Users2 className="w-3 h-3 text-amber-400" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-stone-800 text-white border-none rounded-lg text-[10px] font-bold uppercase tracking-widest">
                        {linkType}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className={cn("h-px w-8 transition-colors", lineageIds.has(person.id) && lineageIds.has(next.id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {parentUnits.length > 0 && (
        <div className="flex gap-16 mt-10 relative">
          {parentUnits.map((unit, uIdx) => {
            const childProcessed = new Set<string>();
            const childClusters: any[][] = [];
            unit.children.forEach(c => {
              if (!childProcessed.has(c.id) && !parentProcessed.has(c.id)) {
                const cluster = getPeerCluster(c.id, level + 1, childProcessed);
                childClusters.push(cluster);
                cluster.forEach(p => parentProcessed.add(p.id));
              }
            });

            if (childClusters.length === 0) return null;

            const isUnitInLineage = unit.parents.some(p => lineageIds.has(p.id));

            return (
              <div key={uIdx} className="flex flex-col items-center relative">
                <div className={cn(
                  "w-px h-10 transition-colors duration-500",
                  isUnitInLineage ? "bg-amber-400 w-0.5" : "bg-stone-200"
                )} />
                
                {childClusters.length > 1 && (
                  <div className={cn(
                    "absolute top-10 h-px bg-stone-200 transition-colors",
                    isUnitInLineage ? "bg-amber-400 h-0.5" : "bg-stone-200"
                  )} style={{ 
                    width: 'calc(100% - 64px)',
                    left: '32px'
                  }} />
                )}

                <div className="flex gap-12">
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
                      parentProcessed={parentProcessed} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClusterNode;