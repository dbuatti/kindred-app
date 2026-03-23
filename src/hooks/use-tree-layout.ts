"use client";

import { useMemo } from 'react';
import { Person } from '../types';

interface Relationship {
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

export type TreeMode = 'all' | 'ancestors' | 'descendants';

export const useTreeLayout = (people: Person[], relationships: Relationship[], mode: TreeMode = 'all', rootId: string | null = null) => {
  
  // 1. Build a bidirectional graph for easier traversal
  const graph = useMemo(() => {
    const adj: Record<string, { id: string, type: string }[]> = {};
    people.forEach(p => adj[p.id] = []);
    
    relationships.forEach(r => {
      if (adj[r.person_id] && adj[r.related_person_id]) {
        adj[r.person_id].push({ id: r.related_person_id, type: r.relationship_type.toLowerCase() });
      }
    });
    return adj;
  }, [people, relationships]);

  // 2. Filter people based on mode (Ancestors/Descendants/All)
  const filteredPeople = useMemo(() => {
    if (mode === 'all' || !rootId) return people;

    const resultIds = new Set<string>([rootId]);
    const queue = [rootId];
    const visited = new Set([rootId]);

    while (queue.length > 0) {
      const currId = queue.shift()!;
      
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const isParentRel = ['mother', 'father', 'parent', 'grandmother', 'grandfather'].includes(type);
        const isChildRel = ['son', 'daughter', 'child', 'grandson', 'granddaughter'].includes(type);

        if (mode === 'ancestors') {
          if (r.person_id === currId && isParentRel && !visited.has(r.related_person_id)) {
            resultIds.add(r.related_person_id);
            visited.add(r.related_person_id);
            queue.push(r.related_person_id);
          } else if (r.related_person_id === currId && isChildRel && !visited.has(r.person_id)) {
            resultIds.add(r.person_id);
            visited.add(r.person_id);
            queue.push(r.person_id);
          }
        } else if (mode === 'descendants') {
          if (r.person_id === currId && isChildRel && !visited.has(r.related_person_id)) {
            resultIds.add(r.related_person_id);
            visited.add(r.related_person_id);
            queue.push(r.related_person_id);
          } else if (r.related_person_id === currId && isParentRel && !visited.has(r.person_id)) {
            resultIds.add(r.person_id);
            visited.add(r.person_id);
            queue.push(r.person_id);
          }
        }
      });
    }

    return people.filter(p => resultIds.has(p.id));
  }, [people, relationships, mode, rootId]);

  // 3. Calculate Generational Levels
  const personLevels = useMemo(() => {
    if (!filteredPeople.length) return {};
    const levels: Record<string, number> = {};
    filteredPeople.forEach(p => levels[p.id] = 0);

    for (let i = 0; i < 100; i++) {
      let changed = false;
      relationships.forEach(r => {
        if (!levels.hasOwnProperty(r.person_id) || !levels.hasOwnProperty(r.related_person_id)) return;

        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;

        if (['mother', 'father', 'parent'].includes(type)) {
          if (levels[p1] <= levels[p2]) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        } 
        else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[p2] <= levels[p1]) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        }
        else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling', 'cousin'].includes(type)) {
          if (levels[p1] !== levels[p2]) {
            const avg = Math.max(levels[p1], levels[p2]);
            levels[p1] = avg;
            levels[p2] = avg;
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

  // 4. Group into "Marriage Units"
  const rootClusters = useMemo(() => {
    const processed = new Set<string>();
    const clusters: any[][] = [];

    const sortedPeople = [...filteredPeople].sort((a, b) => personLevels[a.id] - personLevels[b.id]);

    sortedPeople.forEach(p => {
      if (processed.has(p.id)) return;

      const spouseRel = relationships.find(r => 
        (r.person_id === p.id || r.related_person_id === p.id) && 
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );

      const spouseId = spouseRel ? (spouseRel.person_id === p.id ? spouseRel.related_person_id : spouseRel.person_id) : null;
      const spouse = spouseId ? filteredPeople.find(sp => sp.id === spouseId) : null;

      const cluster = spouse ? [p, spouse] : [p];
      cluster.forEach(c => processed.add(c.id));
      clusters.push(cluster);
    });

    return clusters;
  }, [filteredPeople, personLevels, relationships]);

  return { personLevels, rootClusters, filteredPeople };
};