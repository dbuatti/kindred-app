"use client";

import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
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
    <div className="flex flex-col items-center">
      {/* Parent Row */}
      <div className="flex items-start gap-24 relative">
        {partnerUnits.map((unit, uIdx) => (
          <div key={uIdx} className="flex flex-col items-center">
            <div className="flex items-center gap-8 relative">
              {unit.parents.map((person, pIdx) => {
                const isLast = pIdx === unit.parents.length - 1;
                const hasAncestors = relationships.some(r => 
                  (r.person_id === person.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) || 
                  (r.related_person_id === person.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
                );

                return (
                  <React.Fragment key={person.id}>
                    <div className="relative flex flex-col items-center">
                      {/* Line UP to ancestors */}
                      {hasAncestors && (
                        <div className={cn(
                          "absolute -top-16 w-0.5 h-16",
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

                    {/* Spouse Link */}
                    {!isLast && (
                      <div className="flex items-center px-2">
                        <div className={cn(
                          "h-0.5 w-8", 
                          unit.isTerminated ? "border-t-2 border-dashed border-stone-300" : (lineageIds.has(person.id) && lineageIds.has(unit.parents[pIdx+1].id) ? "bg-amber-500" : "bg-stone-800")
                        )} />
                        <Heart className={cn("w-3 h-3 mx-1", unit.isTerminated ? "text-stone-300" : "text-stone-800 fill-current")} />
                        <div className={cn(
                          "h-0.5 w-8", 
                          unit.isTerminated ? "border-t-2 border-dashed border-stone-300" : (lineageIds.has(person.id) && lineageIds.has(unit.parents[pIdx+1].id) ? "bg-amber-500" : "bg-stone-800")
                        )} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Vertical line DOWN from the center of the parent unit */}
              {unit.children.length > 0 && (
                <div className={cn(
                  "absolute top-[50px] left-1/2 -translate-x-1/2 w-0.5 h-24",
                  unit.parents.some(p => lineageIds.has(p.id)) ? "bg-amber-500" : "bg-stone-800"
                )} />
              )}
            </div>

            {/* Children Row */}
            {unit.children.length > 0 && (
              <div className="mt-24 relative flex flex-col items-center">
                {/* Horizontal "Bus" line connecting all children */}
                {unit.children.length > 1 && (
                  <div className={cn(
                    "absolute top-0 h-0.5",
                    unit.parents.some(p => lineageIds.has(p.id)) ? "bg-amber-500" : "bg-stone-800"
                  )} style={{ 
                    width: `calc(100% - 192px)`, // Width of one PersonNode (48 * 4 = 192)
                    left: '96px'
                  }} />
                )}

                <div className="flex gap-12">
                  {(() => {
                    const childClusters: any[][] = [];
                    const localProcessed = new Set<string>();
                    unit.children.forEach(c => {
                      if (!globalProcessed.has(c.id) && !localProcessed.has(c.id)) {
                        const cluster = getPeerCluster(c.id, level + 1, localProcessed);
                        if (cluster.length > 0) childClusters.push(cluster);
                      }
                    });

                    return childClusters.map((cc, ccIdx) => (
                      <div key={ccIdx} className="relative flex flex-col items-center">
                        {/* Vertical line UP from child to the horizontal bus */}
                        <div className={cn(
                          "absolute -top-8 w-0.5 h-8",
                          cc.some(p => lineageIds.has(p.id)) ? "bg-amber-500" : "bg-stone-800"
                        )} />
                        
                        <ClusterNode 
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
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClusterNode;