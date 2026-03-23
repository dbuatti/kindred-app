"use client";

import React, { useMemo } from 'react';
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
  debugMode?: boolean;
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
  settings,
  debugMode
}: ClusterNodeProps) => {
  
  // Filter out members already handled by a higher-level recursion
  const uniqueMembers = members.filter(m => !globalProcessed.has(m.id));
  uniqueMembers.forEach(m => globalProcessed.add(m.id));

  const partnerUnits = useMemo(() => {
    const units: { parents: any[], children: any[], isTerminated: boolean }[] = [];
    const processedInThisCluster = new Set<string>();

    uniqueMembers.forEach(m => {
      if (processedInThisCluster.has(m.id)) return;

      // Find spouse in the same generation
      const spouseRel = relationships.find(r => 
        (r.person_id === m.id || r.related_person_id === m.id) &&
        ['spouse', 'wife', 'husband', 'ex-spouse', 'ex-wife', 'ex-husband'].includes(r.relationship_type.toLowerCase())
      );
      
      const spouseId = spouseRel ? (spouseRel.person_id === m.id ? spouseRel.related_person_id : spouseRel.person_id) : null;
      const spouse = spouseId ? uniqueMembers.find(p => p.id === spouseId) : null;
      const isTerminated = spouseRel?.relationship_type.toLowerCase().includes('ex-') || false;

      const unitParents = spouse ? [m, spouse] : [m];
      unitParents.forEach(p => processedInThisCluster.add(p.id));

      // Find all children of this parent unit
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
    <div className="flex flex-col items-center w-full">
      <div className="flex items-start gap-32">
        {partnerUnits.map((unit, uIdx) => (
          <div key={uIdx} className="flex flex-col items-center">
            {/* Parent Row */}
            <div className="flex items-center gap-4 relative">
              {unit.parents.map((person, pIdx) => {
                const isLast = pIdx === unit.parents.length - 1;
                return (
                  <React.Fragment key={person.id}>
                    <PersonNode 
                      person={person} 
                      me={me}
                      relationships={relationships}
                      isHighlighted={person.id === highlightedId} 
                      isInLineage={lineageIds.has(person.id)}
                      isSelected={person.id === selectedPersonId}
                      onSelect={onSelect}
                      settings={settings}
                      debugMode={debugMode}
                      level={personLevels[person.id]}
                    />
                    {!isLast && (
                      <div className={cn(
                        "h-0.5 w-4",
                        unit.isTerminated ? "border-t-2 border-dashed border-stone-200" : "bg-stone-200"
                      )} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Connection Down to Children */}
            {unit.children.length > 0 && (
              <>
                <div className="w-0.5 h-12 bg-stone-200" />
                <div className="flex flex-col items-center w-full">
                  {/* The "Bus" line - horizontal connector */}
                  <div className="flex w-full">
                    {unit.children.length > 1 ? (
                      <div className="flex w-full">
                        <div className="flex-1 border-t-2 border-stone-200" />
                        <div className="flex-1 border-t-2 border-stone-200" />
                      </div>
                    ) : (
                      <div className="w-0.5 h-0 bg-stone-200" />
                    )}
                  </div>

                  {/* Children Row */}
                  <div className="flex gap-16 pt-0">
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
                        <div key={ccIdx} className="flex flex-col items-center">
                          {/* Vertical stem up to the bus */}
                          <div className="w-0.5 h-12 bg-stone-200" />
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
                            debugMode={debugMode}
                          />
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClusterNode;