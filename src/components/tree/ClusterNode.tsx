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
  settings,
  debugMode
}: ClusterNodeProps) => {
  
  const children = useMemo(() => {
    const childIds = new Set<string>();
    members.forEach(m => {
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['son', 'daughter', 'child'].includes(type) && r.person_id === m.id) childIds.add(r.related_person_id);
        if (['mother', 'father', 'parent'].includes(type) && r.related_person_id === m.id) childIds.add(r.person_id);
      });
    });
    return Array.from(childIds).map(id => people.find(p => p.id === id)).filter(Boolean);
  }, [members, relationships, people]);

  const childClusters = useMemo(() => {
    const clusters: any[][] = [];
    const processed = new Set<string>();

    children.forEach(child => {
      if (processed.has(child.id)) return;

      const spouseRel = relationships.find(r => 
        (r.person_id === child.id || r.related_person_id === child.id) && 
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );

      const spouseId = spouseRel ? (spouseRel.person_id === child.id ? spouseRel.related_person_id : spouseRel.person_id) : null;
      const spouse = spouseId ? people.find(p => p.id === spouseId) : null;

      const cluster = spouse ? [child, spouse] : [child];
      cluster.forEach(c => processed.add(c.id));
      clusters.push(cluster);
    });

    return clusters;
  }, [children, relationships, people]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 relative">
        {members.map((person, idx) => (
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
              level={level}
            />
            {idx < members.length - 1 && (
              <div className="h-0.5 w-8 bg-stone-200" />
            )}
          </React.Fragment>
        ))}
      </div>

      {childClusters.length > 0 && (
        <>
          <div className="w-0.5 h-12 bg-stone-200" />
          <div className="flex gap-16 relative">
            {childClusters.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-12rem)] h-0.5 bg-stone-200" />
            )}
            
            {childClusters.map((cluster, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-0.5 h-12 bg-stone-200" />
                <ClusterNode 
                  members={cluster}
                  level={level + 1}
                  people={people}
                  relationships={relationships}
                  personLevels={personLevels}
                  lineageIds={lineageIds}
                  highlightedId={highlightedId}
                  selectedPersonId={selectedPersonId}
                  me={me}
                  onSelect={onSelect}
                  settings={settings}
                  debugMode={debugMode}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClusterNode;