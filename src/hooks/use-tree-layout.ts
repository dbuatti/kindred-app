"use client";

import { useMemo, useCallback } from 'react';
import { Person } from '../types';

interface Relationship {
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

export const useTreeLayout = (people: Person[], relationships: Relationship[]) => {
  const personLevels = useMemo(() => {
    if (!people.length) return {};
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;

        if (['mother', 'father', 'parent'].includes(type)) {
          if (levels[p1] !== levels[p2] + 1) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        } else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[p2] !== levels[p1] + 1) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        } else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          if (levels[p1] !== levels[p2]) {
            const max = Math.max(levels[p1], levels[p2]);
            levels[p1] = max;
            levels[p2] = max;
            changed = true;
          }
        }
      });
      if (!changed) break;
    }
    return levels;
  }, [people, relationships]);

  const getPeerCluster = useCallback((startId: string, level: number, processed: Set<string>) => {
    const cluster: any[] = [];
    const queue = [startId];
    const clusterIds = new Set([startId]);

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const person = people.find(p => p.id === currId);
      if (person) cluster.push(person);
      processed.add(currId);

      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          const otherId = r.person_id === currId ? r.related_person_id : r.person_id;
          if (personLevels[otherId] === level && !clusterIds.has(otherId)) {
            clusterIds.add(otherId);
            queue.push(otherId);
          }
        }
      });
    }
    return cluster;
  }, [people, relationships, personLevels]);

  const rootClusters = useMemo(() => {
    const processed = new Set<string>();
    const clusters: any[][] = [];
    
    const roots = people.filter(p => {
      const hasParent = relationships.some(r => 
        (r.person_id === p.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) ||
        (r.related_person_id === p.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
      );
      return !hasParent;
    });

    roots.forEach(r => {
      if (!processed.has(r.id)) {
        clusters.push(getPeerCluster(r.id, personLevels[r.id], processed));
      }
    });

    people.forEach(p => {
      if (!processed.has(p.id)) {
        clusters.push(getPeerCluster(p.id, personLevels[p.id], processed));
      }
    });

    return clusters;
  }, [people, personLevels, relationships, getPeerCluster]);

  return { personLevels, rootClusters, getPeerCluster };
};