"use client";

import { useMemo, useCallback } from 'react';
import { Person } from '../types';

interface Relationship {
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

export type TreeMode = 'all' | 'ancestors' | 'descendants';

export const useTreeLayout = (people: Person[], relationships: Relationship[], mode: TreeMode = 'all', rootId: string | null = null) => {
  
  // 1. Filter people based on mode
  const filteredPeople = useMemo(() => {
    if (mode === 'all' || !rootId) return people;

    const resultIds = new Set<string>([rootId]);
    const queue = [rootId];

    while (queue.length > 0) {
      const currId = queue.shift()!;
      
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const isParentRel = ['mother', 'father', 'parent', 'grandmother', 'grandfather'].includes(type);
        const isChildRel = ['son', 'daughter', 'child', 'grandson', 'granddaughter'].includes(type);

        if (mode === 'ancestors') {
          // Follow parent links UP
          if (r.person_id === currId && isParentRel) {
            if (!resultIds.has(r.related_person_id)) {
              resultIds.add(r.related_person_id);
              queue.push(r.related_person_id);
            }
          } else if (r.related_person_id === currId && isChildRel) {
            if (!resultIds.has(r.person_id)) {
              resultIds.add(r.person_id);
              queue.push(r.person_id);
            }
          }
        } else if (mode === 'descendants') {
          // Follow child links DOWN
          if (r.person_id === currId && isChildRel) {
            if (!resultIds.has(r.related_person_id)) {
              resultIds.add(r.related_person_id);
              queue.push(r.related_person_id);
            }
          } else if (r.related_person_id === currId && isParentRel) {
            if (!resultIds.has(r.person_id)) {
              resultIds.add(r.person_id);
              queue.push(r.person_id);
            }
          }
        }
      });
    }

    return people.filter(p => resultIds.has(p.id));
  }, [people, relationships, mode, rootId]);

  // 2. Calculate Generational Levels
  const personLevels = useMemo(() => {
    if (!filteredPeople.length) return {};
    const levels: Record<string, number> = {};
    filteredPeople.forEach(p => levels[p.id] = 0);

    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        if (!levels.hasOwnProperty(r.person_id) || !levels.hasOwnProperty(r.related_person_id)) return;

        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;

        if (['mother', 'father', 'parent', 'grandmother', 'grandfather'].includes(type)) {
          const offset = type.includes('grand') ? 2 : 1;
          if (levels[p1] <= levels[p2] + (offset - 1)) {
            levels[p1] = levels[p2] + offset;
            changed = true;
          }
        } 
        else if (['son', 'daughter', 'child', 'grandson', 'granddaughter'].includes(type)) {
          const offset = type.includes('grand') ? 2 : 1;
          if (levels[p2] <= levels[p1] + (offset - 1)) {
            levels[p2] = levels[p1] + offset;
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

    const minLevel = Math.min(...Object.values(levels));
    Object.keys(levels).forEach(id => {
      levels[id] -= minLevel;
    });

    return levels;
  }, [filteredPeople, relationships]);

  // 3. Helper to get a cluster of peers
  const getPeerCluster = useCallback((startId: string, level: number, processed: Set<string>) => {
    const cluster: any[] = [];
    const queue = [startId];
    const clusterIds = new Set([startId]);

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (processed.has(currId)) continue;
      
      const person = filteredPeople.find(p => p.id === currId);
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
  }, [filteredPeople, relationships, personLevels]);

  // 4. Identify Root Clusters
  const rootClusters = useMemo(() => {
    const globalProcessed = new Set<string>();
    const clusters: any[][] = [];
    
    const hasAncestors = (id: string) => {
      return relationships.some(r => {
        if (!personLevels.hasOwnProperty(r.person_id) || !personLevels.hasOwnProperty(r.related_person_id)) return false;
        const type = r.relationship_type.toLowerCase();
        if (r.person_id === id && ['mother', 'father', 'parent', 'grandmother', 'grandfather'].includes(type)) return true;
        if (r.related_person_id === id && ['son', 'daughter', 'child', 'grandson', 'granddaughter'].includes(type)) return true;
        return false;
      });
    };

    const sortedPeople = [...filteredPeople].sort((a, b) => personLevels[a.id] - personLevels[b.id]);

    sortedPeople.forEach(p => {
      if (!globalProcessed.has(p.id) && !hasAncestors(p.id)) {
        const cluster = getPeerCluster(p.id, personLevels[p.id], globalProcessed);
        if (cluster.length > 0) clusters.push(cluster);
      }
    });

    sortedPeople.forEach(p => {
      if (!globalProcessed.has(p.id)) {
        const cluster = getPeerCluster(p.id, personLevels[p.id], globalProcessed);
        if (cluster.length > 0) clusters.push(cluster);
      }
    });

    return clusters;
  }, [filteredPeople, personLevels, relationships, getPeerCluster]);

  return { personLevels, rootClusters, getPeerCluster, filteredPeople };
};