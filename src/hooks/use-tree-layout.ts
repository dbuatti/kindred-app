"use client";

import { useMemo, useCallback } from 'react';
import { Person } from '../types';

interface Relationship {
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

export const useTreeLayout = (people: Person[], relationships: Relationship[]) => {
  // 1. Calculate Generational Levels
  const personLevels = useMemo(() => {
    if (!people.length) return {};
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    // Iteratively push parents above children
    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;

        if (['mother', 'father', 'parent'].includes(type)) {
          if (levels[p2] <= levels[p1]) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        } 
        else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[p1] <= levels[p2]) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        } 
        else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
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

  // 2. Helper to get a cluster of peers
  const getPeerCluster = useCallback((startId: string, level: number, processed: Set<string>) => {
    const cluster: any[] = [];
    const queue = [startId];
    const clusterIds = new Set([startId]);

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (processed.has(currId)) continue;
      
      const person = people.find(p => p.id === currId);
      if (person) cluster.push(person);
      processed.add(currId);

      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          const otherId = r.person_id === currId ? r.related_person_id : r.person_id;
          if (personLevels[otherId] === level && !clusterIds.has(otherId) && !processed.has(otherId)) {
            clusterIds.add(otherId);
            queue.push(otherId);
          }
        }
      });
    }
    return cluster;
  }, [people, relationships, personLevels]);

  // 3. Identify Root Clusters
  const rootClusters = useMemo(() => {
    const globalProcessed = new Set<string>();
    const clusters: any[][] = [];
    
    const isDescendant = (id: string) => {
      return relationships.some(r => {
        const type = r.relationship_type.toLowerCase();
        return (r.person_id === id && ['mother', 'father', 'parent'].includes(type)) ||
               (r.related_person_id === id && ['son', 'daughter', 'child'].includes(type));
      });
    };

    // Sort people by level (elders first)
    const sortedPeople = [...people].sort((a, b) => personLevels[b.id] - personLevels[a.id]);

    // First pass: True Roots (no parents)
    sortedPeople.filter(p => !isDescendant(p.id)).forEach(r => {
      if (!globalProcessed.has(r.id)) {
        const cluster = getPeerCluster(r.id, personLevels[r.id], globalProcessed);
        if (cluster.length > 0) clusters.push(cluster);
      }
    });

    // Second pass: Catch anyone missed (islands)
    sortedPeople.forEach(p => {
      if (!globalProcessed.has(p.id)) {
        const cluster = getPeerCluster(p.id, personLevels[p.id], globalProcessed);
        if (cluster.length > 0) clusters.push(cluster);
      }
    });

    return clusters;
  }, [people, personLevels, relationships, getPeerCluster]);

  return { personLevels, rootClusters, getPeerCluster };
};