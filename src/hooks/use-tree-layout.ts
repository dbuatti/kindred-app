"use client";

import { useMemo } from 'react';
import { Person } from '../types';

interface Relationship {
  id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

export interface TreePosition {
  id: string;
  x: number;
  y: number;
  person: Person;
}

export interface TreeConnection {
  id: string;
  from: { x: number, y: number };
  to: { x: number, y: number };
  type: 'blood' | 'spouse';
}

export const useTreeLayout = (people: Person[], relationships: Relationship[]) => {
  return useMemo(() => {
    console.log("[useTreeLayout] Starting layout calculation...", { 
      peopleCount: people.length, 
      relCount: relationships.length 
    });

    if (!people.length) return { positions: [], connections: [], debug: "No people found" };

    const ITERATIONS = 50;
    const SPRING_LENGTH = 300;
    const REPULSION = 100000;
    const DAMPING = 0.85;

    // 1. Initialize positions randomly to avoid overlaps
    const pos: Record<string, { x: number, y: number, vx: number, vy: number }> = {};
    people.forEach((p, i) => {
      pos[p.id] = {
        x: Math.cos(i) * 500,
        y: Math.sin(i) * 500,
        vx: 0,
        vy: 0
      };
    });

    // 2. Run Physics Simulation (Force-Directed)
    for (let i = 0; i < ITERATIONS; i++) {
      // Repulsion (Push everyone apart)
      people.forEach(p1 => {
        people.forEach(p2 => {
          if (p1.id === p2.id) return;
          const dx = pos[p1.id].x - pos[p2.id].x;
          const dy = pos[p1.id].y - pos[p2.id].y;
          const distSq = dx * dx + dy * dy + 0.1;
          const force = REPULSION / distSq;
          pos[p1.id].vx += (dx / Math.sqrt(distSq)) * force * 0.01;
          pos[p1.id].vy += (dy / Math.sqrt(distSq)) * force * 0.01;
        });
      });

      // Attraction (Pull relatives together)
      relationships.forEach(r => {
        if (!pos[r.person_id] || !pos[r.related_person_id]) return;
        const p1 = pos[r.person_id];
        const p2 = pos[r.related_person_id];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - SPRING_LENGTH) * 0.05;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        p1.vx += fx;
        p1.vy += fy;
        p2.vx -= fx;
        p2.vy -= fy;
      });

      // Apply velocity and damping
      people.forEach(p => {
        const node = pos[p.id];
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= DAMPING;
        node.vy *= DAMPING;
      });
    }

    const finalPositions: TreePosition[] = people.map(p => ({
      id: p.id,
      x: pos[p.id].x,
      y: pos[p.id].y,
      person: p
    }));

    const finalConnections: TreeConnection[] = relationships.map(r => {
      const from = pos[r.person_id];
      const to = pos[r.related_person_id];
      if (!from || !to) return null;
      
      const type = r.relationship_type.toLowerCase();
      const isSpouse = ['spouse', 'wife', 'husband'].includes(type);

      return {
        id: r.id,
        from: { x: from.x, y: from.y },
        to: { x: to.x, y: to.y },
        type: isSpouse ? 'spouse' : 'blood'
      } as TreeConnection;
    }).filter((c): c is TreeConnection => c !== null);

    console.log("[useTreeLayout] Layout complete.", { 
      nodes: finalPositions.length, 
      links: finalConnections.length 
    });

    return { 
      positions: finalPositions, 
      connections: finalConnections,
      debug: `Calculated ${finalPositions.length} nodes and ${finalConnections.length} links.`
    };
  }, [people, relationships]);
};