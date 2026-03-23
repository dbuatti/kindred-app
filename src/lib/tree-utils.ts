import { Person } from '../types';

export interface TreeNode {
  id: string;
  person: Person;
  children: TreeNode[];
  spouses: Person[];
  level: number;
  color?: string;
}

const BRANCH_COLORS = ['#d97706', '#2563eb', '#16a34a', '#dc2626', '#7c3aed'];

export const buildTree = (people: Person[], relationships: any[]): TreeNode[] => {
  if (!people.length) {
    console.warn("[tree-utils] No people provided to buildTree.");
    return [];
  }

  console.log(`[tree-utils] Building tree for ${people.length} people and ${relationships.length} relationships.`);

  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();
  const allConnections = new Map<string, string[]>();

  const addConn = (a: string, b: string) => {
    const aList = allConnections.get(a) || [];
    if (!aList.includes(b)) aList.push(b);
    allConnections.set(a, aList);
    
    const bList = allConnections.get(b) || [];
    if (!bList.includes(a)) bList.push(a);
    allConnections.set(b, bList);
  };

  relationships.forEach((r) => {
    const type = r.relationship_type?.toLowerCase() || 'unknown';
    const p1 = r.person_id;
    const p2 = r.related_person_id;

    if (!personMap.has(p1) || !personMap.has(p2)) return;

    addConn(p1, p2);

    if (['father', 'mother', 'parent'].includes(type)) {
      const children = childrenOf.get(p1) || [];
      if (!children.includes(p2)) children.push(p2);
      childrenOf.set(p1, children);

      const parents = parentsOf.get(p2) || [];
      if (!parents.includes(p1)) parents.push(p1);
      parentsOf.set(p2, parents);
    } else if (['son', 'daughter', 'child'].includes(type)) {
      const children = childrenOf.get(p2) || [];
      if (!children.includes(p1)) children.push(p1);
      childrenOf.set(p2, children);

      const parents = parentsOf.get(p1) || [];
      if (!parents.includes(p2)) parents.push(p2);
      parentsOf.set(p1, parents);
    } else if (['spouse', 'wife', 'husband'].includes(type)) {
      const s1 = spousesOf.get(p1) || [];
      if (!s1.includes(p2)) s1.push(p2);
      spousesOf.set(p1, s1);

      const s2 = spousesOf.get(p2) || [];
      if (!s2.includes(p1)) s2.push(p1);
      spousesOf.set(p2, s2);
    }
  });

  const levels: Record<string, number> = {};
  people.forEach(p => levels[p.id] = 0);

  console.log("[tree-utils] Calculating generational levels...");
  for (let i = 0; i < 20; i++) {
    let changed = false;
    relationships.forEach(r => {
      const type = r.relationship_type?.toLowerCase();
      const p1 = r.person_id;
      const p2 = r.related_person_id;
      if (!personMap.has(p1) || !personMap.has(p2)) return;

      if (['father', 'mother', 'parent'].includes(type)) {
        if (levels[p2] <= levels[p1]) {
          console.log(`[tree-utils] Level Shift: ${personMap.get(p2)?.name} moved to level ${levels[p1] + 1} (Child of ${personMap.get(p1)?.name})`);
          levels[p2] = levels[p1] + 1;
          changed = true;
        }
      } else if (['son', 'daughter', 'child'].includes(type)) {
        if (levels[p1] <= levels[p2]) {
          console.log(`[tree-utils] Level Shift: ${personMap.get(p1)?.name} moved to level ${levels[p2] + 1} (Child of ${personMap.get(p2)?.name})`);
          levels[p1] = levels[p2] + 1;
          changed = true;
        }
      } else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
        const maxLvl = Math.max(levels[p1], levels[p2]);
        if (levels[p1] !== maxLvl || levels[p2] !== maxLvl) {
          console.log(`[tree-utils] Level Sync: ${personMap.get(p1)?.name} and ${personMap.get(p2)?.name} synced to level ${maxLvl}`);
          levels[p1] = maxLvl;
          levels[p2] = maxLvl;
          changed = true;
        }
      }
    });
    if (!changed) break;
  }

  const visitedIslands = new Set<string>();
  const islands: string[][] = [];

  people.forEach(p => {
    if (!visitedIslands.has(p.id)) {
      const island: string[] = [];
      const queue = [p.id];
      visitedIslands.add(p.id);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        island.push(curr);
        (allConnections.get(curr) || []).forEach(neighbor => {
          if (!visitedIslands.has(neighbor)) {
            visitedIslands.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
      islands.push(island);
    }
  });

  console.log(`[tree-utils] Detected ${islands.length} connected islands.`);

  const globalVisited = new Set<string>();

  const constructNode = (personId: string, level: number, colorIndex: number): TreeNode | null => {
    const person = personMap.get(personId);
    if (!person || globalVisited.has(personId)) return null;

    globalVisited.add(personId);
    console.log(`[tree-utils] Constructing node for ${person.name} at level ${level}`);

    const spouseIds = spousesOf.get(personId) || [];
    const spouses = spouseIds
      .map(id => {
        globalVisited.add(id);
        return personMap.get(id);
      })
      .filter((p): p is Person => !!p);

    const parentGroupIds = [personId, ...spouseIds];
    const childIds = new Set<string>();
    parentGroupIds.forEach(pId => {
      (childrenOf.get(pId) || []).forEach(cId => childIds.add(cId));
    });

    const children = Array.from(childIds)
      .map((id, idx) => constructNode(id, level + 1, level === 0 ? idx : colorIndex))
      .filter((n): n is TreeNode => n !== null);

    return {
      id: personId,
      person,
      children,
      spouses,
      level,
      color: BRANCH_COLORS[colorIndex % BRANCH_COLORS.length]
    };
  };

  const roots: TreeNode[] = [];
  
  islands.forEach((island, islandIdx) => {
    const islandRoots = island
      .filter(id => !parentsOf.has(id))
      .sort((a, b) => levels[a] - levels[b]);

    if (islandRoots.length === 0 && island.length > 0) {
      const minLvl = Math.min(...island.map(id => levels[id]));
      islandRoots.push(island.find(id => levels[id] === minLvl)!);
    }

    islandRoots.forEach(rootId => {
      if (!globalVisited.has(rootId)) {
        const node = constructNode(rootId, levels[rootId], islandIdx);
        if (node) roots.push(node);
      }
    });
  });

  console.log(`[tree-utils] Tree construction complete. ${roots.length} root branches created.`);
  return roots;
};