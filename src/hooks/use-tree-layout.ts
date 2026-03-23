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

        // Parent -> Child relationship
        if (['mother', 'father', 'parent'].includes(type)) {
          if (levels[p1] <= levels[p2]) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        } 
        // Child -> Parent relationship
        else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[p2] <= levels[p1]) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        } 
        // Peer relationships (Spouse, Sibling)
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

  // 2. Helper to get a cluster of peers (spouses/siblings at the same level)
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

  // 3. Identify Root Clusters (Entry points for the tree)
  const rootClusters = useMemo(() => {
    const globalProcessed = new Set<string>();
    const clusters: any[][] = [];
    
    // A person is a "True Root" if they have NO parents in the dataset
    const isDescendant = (id: string) => {
      return relationships.some(r => {
        const type = r.relationship_type.toLowerCase();
        return (r.related_person_id === id && ['mother', 'father', 'parent'].includes(type)) ||
               (r.person_id === id && ['son', 'daughter', 'child'].includes(type));
      });
    };

    // First pass: Start from people who have no parents
    const trueRoots = people.filter(p => !isDescendant(p.id));
    
    // Sort roots by level (highest first)
    trueRoots.sort((a, b) => personLevels[b.id] - personLevels[a.id]);

    trueRoots.forEach(r => {
      if (!globalProcessed.has(r.id)) {
        // When we create a cluster, we need to mark ALL descendants as processed
        // so they don't show up as roots later.
        const cluster = getPeerCluster(r.id, personLevels[r.id], globalProcessed);
        clusters.push(cluster);
        
        // Recursively find all descendants of this cluster and mark them as processed
        const markDescendants = (ids: string[]) => {
          ids.forEach(id => {
            relationships.forEach(rel => {
              const type = rel.relationship_type.toLowerCase();
              let childId = null;
              if (rel.person_id === id && ['mother', 'father', 'parent', 'son', 'daughter', 'child'].includes(type)) {
                // If rel is parent->child, related is child. If rel is child->parent, person is child.
                if (['mother', 'father', 'parent'].includes(type)) childId = rel.related_person_id;
              } else if (rel.related_person_id === id && ['son', 'daughter', 'child'].includes(type)) {
                childId = rel.person_id;
              }

              if (childId && !globalProcessed.has(childId)) {
                globalProcessed.add(childId);
                markDescendants([childId]);
              }
            });
          });
        };
        markDescendants(cluster.map(p => p.id));
      }
    });

    // Second pass: Catch any remaining disconnected components (islands with cycles or missing roots)
    people.forEach(p => {
      if (!globalProcessed.has(p.id)) {
        const cluster = getPeerCluster(p.id, personLevels[p.id], globalProcessed);
        clusters.push(cluster);
      }
    });

    return clusters;
  }, [people, personLevels, relationships, getPeerCluster]);

  return { personLevels, rootClusters, getPeerCluster };
};