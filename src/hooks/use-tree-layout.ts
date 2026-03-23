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

    // Iteratively adjust levels based on relationships
    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id; // The person the relationship is defined for
        const p2 = r.related_person_id; // The relative

        // If p1 has a "Father/Mother", then p2 is the parent (p2 should be level above p1)
        if (['mother', 'father', 'parent', 'grandmother', 'grandfather'].includes(type)) {
          const offset = type.includes('grand') ? 2 : 1;
          if (levels[p1] <= levels[p2] + (offset - 1)) {
            levels[p1] = levels[p2] + offset;
            changed = true;
          }
        } 
        // If p1 has a "Son/Daughter", then p2 is the child (p2 should be level below p1)
        else if (['son', 'daughter', 'child', 'grandson', 'granddaughter'].includes(type)) {
          const offset = type.includes('grand') ? 2 : 1;
          if (levels[p2] <= levels[p1] + (offset - 1)) {
            levels[p2] = levels[p1] + offset;
            changed = true;
          }
        } 
        // Peer relationships (Spouses, Siblings, Cousins) should be on the same level
        else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling', 'cousin'].includes(type)) {
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

    // Normalize levels so the top-most level is 0
    const minLevel = Math.min(...Object.values(levels));
    Object.keys(levels).forEach(id => {
      levels[id] -= minLevel;
    });

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
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling', 'cousin'].includes(type)) {
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

  // 3. Identify Root Clusters (Elders)
  const rootClusters = useMemo(() => {
    const globalProcessed = new Set<string>();
    const clusters: any[][] = [];
    
    // Helper to check if someone has any parent-type links pointing TO them
    const hasAncestors = (id: string) => {
      return relationships.some(r => {
        const type = r.relationship_type.toLowerCase();
        // Either they have a parent defined
        if (r.person_id === id && ['mother', 'father', 'parent', 'grandmother', 'grandfather'].includes(type)) return true;
        // Or they are someone's child
        if (r.related_person_id === id && ['son', 'daughter', 'child', 'grandson', 'granddaughter'].includes(type)) return true;
        return false;
      });
    };

    // Sort people by level (elders first)
    const sortedPeople = [...people].sort((a, b) => personLevels[a.id] - personLevels[b.id]);

    // First pass: Find true roots (people with no ancestors in the system)
    sortedPeople.forEach(p => {
      if (!globalProcessed.has(p.id) && !hasAncestors(p.id)) {
        const cluster = getPeerCluster(p.id, personLevels[p.id], globalProcessed);
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