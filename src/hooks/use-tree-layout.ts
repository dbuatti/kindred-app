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
  type: 'parent-child' | 'spouse';
}

export const useTreeLayout = (people: Person[], relationships: Relationship[]) => {
  return useMemo(() => {
    if (!people.length) return { positions: [], connections: [] };

    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 100;
    const LEVEL_HEIGHT = 250;
    const SIBLING_GAP = 250;

    // 1. Calculate Generational Levels (Y-axis)
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    // Iterative constraint relaxation for levels
    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;
        if (!levels.hasOwnProperty(p1) || !levels.hasOwnProperty(p2)) return;

        if (['mother', 'father', 'parent'].includes(type)) {
          if (levels[p1] <= levels[p2]) { levels[p1] = levels[p2] + 1; changed = true; }
        } else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[p2] <= levels[p1]) { levels[p2] = levels[p1] + 1; changed = true; }
        } else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          if (levels[p1] !== levels[p2]) {
            const max = Math.max(levels[p1], levels[p2]);
            levels[p1] = max; levels[p2] = max; changed = true;
          }
        }
      });
      if (!changed) break;
    }

    // Normalize levels
    const minLvl = Math.min(...Object.values(levels));
    Object.keys(levels).forEach(id => levels[id] -= minLvl);

    // 2. Calculate X Positions
    const positions: Record<string, number> = {};
    
    // Group people by level and sort them to keep families together
    const peopleByLevel: Record<number, string[]> = {};
    people.forEach(p => {
      const lvl = levels[p.id];
      if (!peopleByLevel[lvl]) peopleByLevel[lvl] = [];
      peopleByLevel[lvl].push(p.id);
    });

    // Simple initial X assignment: spread them out
    Object.keys(peopleByLevel).forEach(lvlStr => {
      const lvl = parseInt(lvlStr);
      const ids = peopleByLevel[lvl];
      ids.forEach((id, idx) => {
        positions[id] = (idx - (ids.length - 1) / 2) * SIBLING_GAP;
      });
    });

    // 3. Refine X Positions (Pull children toward parents, spouses together)
    for (let i = 0; i < 20; i++) {
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;
        
        if (['spouse', 'wife', 'husband'].includes(type)) {
          const avg = (positions[p1] + positions[p2]) / 2;
          positions[p1] = avg - 60;
          positions[p2] = avg + 60;
        }
        
        if (['mother', 'father', 'parent'].includes(type)) {
          // Child (p1) should be near parent (p2)
          const diff = positions[p1] - positions[p2];
          positions[p1] -= diff * 0.1;
        }
      });
    }

    const finalPositions: TreePosition[] = people.map(p => ({
      id: p.id,
      x: positions[p.id],
      y: levels[p.id] * LEVEL_HEIGHT,
      person: p
    }));

    // 4. Generate Connections
    const connections: TreeConnection[] = [];
    relationships.forEach(r => {
      const type = r.relationship_type.toLowerCase();
      const fromPos = finalPositions.find(p => p.id === r.person_id);
      const toPos = finalPositions.find(p => p.id === r.related_person_id);
      
      if (!fromPos || !toPos) return;

      if (['mother', 'father', 'parent'].includes(type)) {
        connections.push({
          id: `rel-${r.id}`,
          from: { x: toPos.x + NODE_WIDTH/2, y: toPos.y + NODE_HEIGHT },
          to: { x: fromPos.x + NODE_WIDTH/2, y: fromPos.y },
          type: 'parent-child'
        });
      } else if (['son', 'daughter', 'child'].includes(type)) {
        connections.push({
          id: `rel-${r.id}`,
          from: { x: fromPos.x + NODE_WIDTH/2, y: fromPos.y + NODE_HEIGHT },
          to: { x: toPos.x + NODE_WIDTH/2, y: toPos.y },
          type: 'parent-child'
        });
      } else if (['spouse', 'wife', 'husband'].includes(type)) {
        connections.push({
          id: `rel-${r.id}`,
          from: { x: fromPos.x + NODE_WIDTH, y: fromPos.y + NODE_HEIGHT/2 },
          to: { x: toPos.x, y: toPos.y + NODE_HEIGHT/2 },
          type: 'spouse'
        });
      }
    });

    return { positions: finalPositions, connections };
  }, [people, relationships]);
};