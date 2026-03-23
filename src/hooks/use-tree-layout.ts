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
    // We do this many times to ensure the levels stabilize
    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id; // The subject
        const p2 = r.related_person_id; // The relative

        // If p2 is the parent of p1, p2 should be at a higher level than p1
        if (['mother', 'father', 'parent'].includes(type)) {
          if (levels[p2] <= levels[p1]) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        } 
        // If p2 is the child of p1, p1 should be at a higher level than p2
        else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[p1] <= levels[p2]) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        } 
        // Peer relationships (Spouse, Sibling) should be on the same level
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
        // Peers are spouses or siblings
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          const otherId = r.person_id === currId ? r.related_person_id : r.person_id;
          // Only cluster them if they are on the same generational level
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
    
    // A person is a "descendant" if they have a parent link pointing to them
    const isDescendant = (id: string) => {
      return relationships.some(r => {
        const type = r.relationship_type.toLowerCase();
        // If r.person_id is 'id' and type is 'father', then 'id' has a father (is descendant)
        // If r.related_person_id is 'id' and type is 'son', then 'id' is a son (is descendant)
        return (r.person_id === id && ['mother', 'father', 'parent'].includes(type)) ||
               (r.related_person_id === id && ['son', 'daughter', 'child'].includes(type));
      });
    };

    // First pass: Start from people who have no parents (True Roots)
    const trueRoots = people.filter(p => !isDescendant(p.id));
    
    // Sort roots by level (highest first) so elders appear at the top
    trueRoots.sort((a, b) => personLevels[b.id] - personLevels[a.id]);

    trueRoots.forEach(r => {
      if (!globalProcessed.has(r.id)) {
        const cluster = getPeerCluster(r.id, personLevels[r.id], globalProcessed);
        clusters.push(cluster);
        
        // Mark all descendants of this root cluster as processed so they don't render as roots
        const markDescendants = (ids: string[]) => {
          ids.forEach(id => {
            relationships.forEach(rel => {
              const type = rel.relationship_type.toLowerCase();
              let childId = null;
              
              // If rel says person_id is parent of related_person_id
              if (rel.person_id === id && ['mother', 'father', 'parent'].includes(type)) {
                childId = rel.related_person_id;
              } 
              // If rel says related_person_id is child of person_id
              else if (rel.person_id === id && ['son', 'daughter', 'child'].includes(type)) {
                childId = rel.related_person_id;
              }
              // Inverse cases
              else if (rel.related_person_id === id && ['son', 'daughter', 'child'].includes(type)) {
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

    // Second pass: Catch any remaining disconnected people (orphans or islands)
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