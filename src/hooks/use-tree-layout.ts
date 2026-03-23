"use client";

import { useMemo } from 'react';
import { Person } from '../types';

interface Relationship {
  id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

export interface RadialNode {
  id: string;
  x: number;
  y: number;
  angle: number;
  radius: number;
  person: Person;
  generation: number;
}

export interface RadialLink {
  id: string;
  source: { x: number, y: number };
  target: { x: number, y: number };
  type: 'blood' | 'spouse';
}

export const useTreeLayout = (people: Person[], relationships: Relationship[], centerId: string | null) => {
  return useMemo(() => {
    if (!people.length || !centerId) return { nodes: [], links: [] };

    const nodes: RadialNode[] = [];
    const links: RadialLink[] = [];
    const visited = new Set<string>();
    
    // 1. Calculate Generational Distance from Center
    const distance: Record<string, number> = {};
    const queue: [string, number][] = [[centerId, 0]];
    distance[centerId] = 0;

    while (queue.length > 0) {
      const [currId, dist] = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        let neighborId = null;
        
        if (r.person_id === currId) neighborId = r.related_person_id;
        else if (r.related_person_id === currId) neighborId = r.person_id;

        if (neighborId && !visited.has(neighborId)) {
          // Blood relations change generation, spouses/siblings stay on same orbit
          const isBlood = ['mother', 'father', 'parent', 'son', 'daughter', 'child'].includes(type);
          const nextDist = isBlood ? (['mother', 'father', 'parent'].includes(type) ? dist - 1 : dist + 1) : dist;
          
          if (distance[neighborId] === undefined) {
            distance[neighborId] = nextDist;
            queue.push([neighborId, nextDist]);
          }
        }
      });
    }

    // 2. Group by Generation and Calculate Angles
    const genGroups: Record<number, string[]> = {};
    Object.entries(distance).forEach(([id, gen]) => {
      if (!genGroups[gen]) genGroups[gen] = [];
      genGroups[gen].push(id);
    });

    const RADIUS_STEP = 350;
    
    Object.entries(genGroups).forEach(([genStr, ids]) => {
      const gen = parseInt(genStr);
      const radius = Math.abs(gen) * RADIUS_STEP;
      
      ids.forEach((id, idx) => {
        const person = people.find(p => p.id === id);
        if (!person) return;

        // Spread nodes around the circle
        const angle = (idx / ids.length) * 2 * Math.PI + (gen * 0.5); // Offset each gen slightly
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        nodes.push({ id, x, y, angle, radius, person, generation: gen });
      });
    });

    // 3. Create Links
    relationships.forEach(r => {
      const source = nodes.find(n => n.id === r.person_id);
      const target = nodes.find(n => n.id === r.related_person_id);
      
      if (source && target) {
        const type = r.relationship_type.toLowerCase();
        const isSpouse = ['spouse', 'wife', 'husband'].includes(type);
        
        links.push({
          id: r.id,
          source: { x: source.x, y: source.y },
          target: { x: target.x, y: target.y },
          type: isSpouse ? 'spouse' : 'blood'
        });
      }
    });

    return { nodes, links };
  }, [people, relationships, centerId]);
};