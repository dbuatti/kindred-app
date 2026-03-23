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
    console.log("[TreeLayout] --- START CALCULATION ---");
    if (!people.length) return { positions: [], connections: [], debug: "No data" };

    const ROW_HEIGHT = 250;
    const COLUMN_WIDTH = 300;

    // 1. Assign Generations
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    for (let i = 0; i < 15; i++) {
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['father', 'mother', 'parent'].includes(type)) {
          if (levels[r.person_id] <= levels[r.related_person_id]) {
            levels[r.person_id] = levels[r.related_person_id] + 1;
          }
        } else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[r.related_person_id] <= levels[r.person_id]) {
            levels[r.related_person_id] = levels[r.person_id] + 1;
          }
        }
      });
    }

    // 2. Group and Position
    const groups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(id);
    });

    let rawPositions: TreePosition[] = [];
    Object.entries(groups).forEach(([lvlStr, ids]) => {
      const lvl = parseInt(lvlStr);
      const rowWidth = (ids.length - 1) * COLUMN_WIDTH;
      ids.forEach((id, idx) => {
        const person = people.find(p => p.id === id);
        if (!person) return;
        rawPositions.push({
          id,
          x: (idx * COLUMN_WIDTH) - (rowWidth / 2),
          y: lvl * ROW_HEIGHT,
          person
        });
      });
    });

    // 3. CRITICAL: Calculate Bounding Box and Center
    const minX = Math.min(...rawPositions.map(p => p.x));
    const maxX = Math.max(...rawPositions.map(p => p.x));
    const minY = Math.min(...rawPositions.map(p => p.y));
    const maxY = Math.max(...rawPositions.map(p => p.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    console.log(`[TreeLayout] Bounds: X(${minX} to ${maxX}), Y(${minY} to ${maxY})`);
    console.log(`[TreeLayout] Centering at: ${centerX}, ${centerY}`);

    const positions = rawPositions.map(p => ({
      ...p,
      x: p.x - centerX,
      y: p.y - centerY
    }));

    // 4. Connections
    const connections: TreeConnection[] = relationships.map(r => {
      const from = positions.find(p => p.id === r.person_id);
      const to = positions.find(p => p.id === r.related_person_id);
      if (!from || !to) return null;
      return {
        id: r.id,
        from: { x: from.x, y: from.y },
        to: { x: to.x, y: to.y },
        type: ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase()) ? 'spouse' : 'blood'
      } as TreeConnection;
    }).filter((c): c is TreeConnection => c !== null);

    console.log(`[TreeLayout] Final: ${positions.length} nodes, ${connections.length} links.`);
    console.log("[TreeLayout] --- END CALCULATION ---");

    return { 
      positions, 
      connections,
      debug: `Size: ${Math.round(maxX - minX)}x${Math.round(maxY - minY)}`
    };
  }, [people, relationships]);
};