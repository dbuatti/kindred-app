"use client";

import React, { useMemo } from 'react';
import { Heart, Users2, Bug } from 'lucide-react';
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
  debugMode?: boolean;
  onSelect: (id: string) => void;
  getPeerCluster: (id: string, level: number, processed: Set<string>) => any[];
  globalProcessed?: Set<string>;
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
  globalProcessed = new Set() 
}: ClusterNodeProps) => {
  
  // Filter out members who have already been rendered
  const uniqueMembers = members.filter(m => !globalProcessed.has(m.id));
  uniqueMembers.forEach(m => globalProcessed.add(m.id));

  // Group members into "Partner Units" (Couples or Single Parents)
  const partnerUnits = useMemo(() => {
    const units: { parents: any[], children: any[] }[] = [];
    const processedInThisCluster = new Set<string>();

    uniqueMembers.forEach(m => {
      if (processedInThisCluster.has(m.id)) return;

      // Find spouse within the same cluster
      const spouseRel = relationships.find(r => 
        (r.person_id === m.id || r.related_person_id === m.id) &&
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );
      
      const spouseId = spouseRel ? (spouseRel.person_id === m.id ? spouseRel.related_person_id : spouseRel.person_id) : null;
      const spouse = spouseId ? uniqueMembers.find(p => p.id === spouseId) : null;

      const unitParents = spouse ? [m, spouse] : [m];
      unitParents.forEach(p => processedInThisCluster.add(p.id));

      // Find children belonging to this specific unit
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
    <div className="flex flex-col items-center">
      {/* The Generation Row */}
      <div className={cn(
        "flex items-center gap-12 p-8 rounded-[4rem] bg-white/40 backdrop-blur-sm border-2 border-stone-50 shadow-sm relative z-10 transition-all duration-700",
        isClusterHighlighted ? "border-amber-400 bg-amber-50/30 shadow-amber-100" : "",
        highlightedId && !isClusterHighlighted ? "opacity-40 grayscale-[0.5]" : ""
      )}>
        {debugMode && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-stone-800 text-amber-400 text-[8px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
            <Bug className="w-2 h-2" /> GEN ROW: {partnerUnits.length} units
          </div>
        )}

        {partnerUnits.map((unit, uIdx) => (
          <div key={uIdx} className="flex items-center gap-4">
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
                        "absolute -top-12 w-px h-12 transition-colors duration-500",
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
                    <div className="flex flex-col items-center gap-1 px-2">
                      <div className={cn("h-px w-6 transition-colors", lineageIds.has(person.id) && lineageIds.has(unit.parents[pIdx+1].id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                      <Heart className="w-3 h-3 text-red-400 fill-current" />
                      <div className={cn("h-px w-6 transition-colors", lineageIds.has(person.id) && lineageIds.has(unit.parents[pIdx+1].id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {/* Sibling link between units if they are siblings */}
            {uIdx < partnerUnits.length - 1 && (
              <div className="flex flex-col items-center gap-1 px-4">
                <div className="h-px w-12 bg-stone-100" />
                <Users2 className="w-3 h-3 text-stone-200" />
                <div className="h-px w-12 bg-stone-100" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* The Children Branches */}
      <div className="flex gap-20 mt-12 relative">
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
              {/* Vertical line DOWN from parents */}
              <div className={cn(
                "w-px h-12 transition-colors duration-500",
                isUnitInLineage ? "bg-amber-400 w-0.5" : "bg-stone-200"
              )} />
              
              {/* Horizontal connector for multiple child branches */}
              {childClusters.length > 1 && (
                <div className={cn(
                  "absolute top-12 h-px bg-stone-200 transition-colors",
                  isUnitInLineage ? "bg-amber-400 h-0.5" : "bg-stone-200"
                )} style={{ 
                  width: 'calc(100% - 80px)',
                  left: '40px'
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