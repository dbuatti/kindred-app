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
  if (!people.length) return [];

  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();

  relationships.forEach((r) => {
    const type = r.relationship_type?.toLowerCase() || 'unknown';
    const p1 = r.person_id;
    const p2 = r.related_person_id;

    if (!personMap.has(p1) || !personMap.has(p2)) return;

    if (['father', 'mother', 'parent'].includes(type)) {
      // p1 is the parent of p2
      const children = childrenOf.get(p1) || [];
      if (!children.includes(p2)) children.push(p2);
      childrenOf.set(p1, children);

      const parents = parentsOf.get(p2) || [];
      if (!parents.includes(p1)) parents.push(p1);
      parentsOf.set(p2, parents);
    } else if (['son', 'daughter', 'child'].includes(type)) {
      // p1 is the child of p2
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

  // Iterative level assignment to ensure parents are always above children
  for (let i = 0; i < 20; i++) {
    let changed = false;
    relationships.forEach(r => {
      const type = r.relationship_type?.toLowerCase();
      const p1 = r.person_id;
      const p2 = r.related_person_id;
      if (!personMap.has(p1) || !personMap.has(p2)) return;

      if (['father', 'mother', 'parent'].includes(type)) {
        // p1 (parent) should be at a lower level (higher up) than p2 (child)
        if (levels[p2] <= levels[p1]) {
          levels[p2] = levels[p1] + 1;
          changed = true;
        }
      } else if (['son', 'daughter', 'child'].includes(type)) {
        // p1 (child) should be at a higher level than p2 (parent)
        if (levels[p1] <= levels[p2]) {
          levels[p1] = levels[p2] + 1;
          changed = true;
        }
      } else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
        // Spouses and siblings should be on the same level
        const maxLvl = Math.max(levels[p1], levels[p2]);
        if (levels[p1] !== maxLvl || levels[p2] !== maxLvl) {
          levels[p1] = maxLvl;
          levels[p2] = maxLvl;
          changed = true;
        }
      }
    });
    if (!changed) break;
  }

  const globalVisited = new Set<string>();

  const constructNode = (personId: string, level: number, colorIndex: number): TreeNode | null => {
    const person = personMap.get(personId);
    if (!person || globalVisited.has(personId)) return null;

    globalVisited.add(personId);

    const spouseIds = spousesOf.get(personId) || [];
    const spouses = spouseIds
      .map(id => {
        // Mark spouses as visited so they don't appear as separate main nodes
        globalVisited.add(id);
        return personMap.get(id);
      })
      .filter((p): p is Person => !!p);

    // Collect all children from this person and all their spouses
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
  // Potential roots are people with no parents, sorted by their calculated level
  const potentialRoots = people
    .filter(p => !parentsOf.has(p.id))
    .sort((a, b) => levels[a.id] - levels[b.id]);
  
  potentialRoots.forEach((p) => {
    if (globalVisited.has(p.id)) return;
    
    const node = constructNode(p.id, levels[p.id], roots.length);
    if (node) roots.push(node);
  });

  return roots;
};