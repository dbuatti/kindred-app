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
    if (!people.length) return { positions: [], connections: [], debug: "No data" };

    const ROW_HEIGHT = 200;
    const COLUMN_WIDTH = 250;

    // 1. Assign Generations (Simple Rank)
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    // Iterate to push children below parents
    for (let i = 0; i < 10; i++) {
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['father', 'mother', 'parent'].includes(type)) {
          // person_id is child, related_person_id is parent
          if (levels[r.person_id] <= levels[r.related_person_id]) {
            levels[r.person_id] = levels[r.related_person_id] + 1;
          }
        } else if (['son', 'daughter', 'child'].includes(type)) {
          // person_id is parent, related_person_id is child
          if (levels[r.related_person_id] <= levels[r.person_id]) {
            levels[r.related_person_id] = levels[r.person_id] + 1;
          }
        }
      });
    }

    // 2. Group by Level and Calculate X (Centered)
    const groups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(id);
    });

    const finalPositions: TreePosition[] = [];
    Object.entries(groups).forEach(([lvlStr, ids]) => {
      const lvl = parseInt(lvlStr);
      const rowWidth = (ids.length - 1) * COLUMN_WIDTH;
      
      ids.forEach((id, idx) => {
        const person = people.find(p => p.id === id);
        if (!person) return;
        
        finalPositions.push({
          id,
          x: (idx * COLUMN_WIDTH) - (rowWidth / 2),
          y: lvl * ROW_HEIGHT,
          person
        });
      });
    });

    // 3. Create Connections
    const finalConnections: TreeConnection[] = relationships.map(r => {
      const from = finalPositions.find(p => p.id === r.person_id);
      const to = finalPositions.find(p => p.id === r.related_person_id);
      if (!from || !to) return null;

      const type = r.relationship_type.toLowerCase();
      return {
        id: r.id,
        from: { x: from.x, y: from.y },
        to: { x: to.x, y: to.y },
        type: ['spouse', 'wife', 'husband'].includes(type) ? 'spouse' : 'blood'
      } as TreeConnection;
    }).filter((c): c is TreeConnection => c !== null);

    // Calculate Bounding Box for Debugging
    const minX = Math.min(...finalPositions.map(p => p.x));
    const maxX = Math.max(...finalPositions.map(p => p.x));
    const minY = Math.min(...finalPositions.map(p => p.y));
    const maxY = Math.max(...finalPositions.map(p => p.y));

    return { 
      positions: finalPositions, 
      connections: finalConnections,
      debug: `Bounds: [${Math.round(minX)}, ${Math.round(minY)}] to [${Math.round(maxX)}, ${Math.round(maxY)}]`
    };
  }, [people, relationships]);
};