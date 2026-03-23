import { Person } from '../types';

export interface TreeNode {
  id: string;
  person: Person;
  children: TreeNode[];
  spouses: Person[];
  siblings: Person[];
  level: number;
  color?: string;
}

const BRANCH_COLORS = ['#d97706', '#2563eb', '#16a34a', '#dc2626', '#7c3aed'];

export const buildTree = (people: Person[], relationships: any[]): TreeNode[] => {
  console.log("[TreeUtils] --- STARTING TREE BUILD ---");
  
  if (!people.length) {
    console.warn("[TreeUtils] No people found in archive.");
    return [];
  }

  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();
  const siblingsOf = new Map<string, string[]>();

  relationships.forEach((r) => {
    const type = r.relationship_type?.toLowerCase() || 'unknown';
    const p1 = r.person_id;
    const p2 = r.related_person_id;

    if (!personMap.has(p1) || !personMap.has(p2)) return;

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
    } else if (['brother', 'sister', 'sibling'].includes(type)) {
      const sib1 = siblingsOf.get(p1) || [];
      if (!sib1.includes(p2)) sib1.push(p2);
      siblingsOf.set(p1, sib1);

      const sib2 = siblingsOf.get(p2) || [];
      if (!sib2.includes(p1)) sib2.push(p1);
      siblingsOf.set(p2, sib2);
    }
  });

  const levels: Record<string, number> = {};
  people.forEach(p => levels[p.id] = 0);

  // Iterative level assignment
  for (let i = 0; i < 20; i++) {
    let changed = false;
    relationships.forEach(r => {
      const type = r.relationship_type?.toLowerCase();
      const p1 = r.person_id;
      const p2 = r.related_person_id;
      if (!personMap.has(p1) || !personMap.has(p2)) return;

      if (['father', 'mother', 'parent'].includes(type)) {
        if (levels[p2] <= levels[p1]) {
          levels[p2] = levels[p1] + 1;
          changed = true;
        }
      } else if (['son', 'daughter', 'child'].includes(type)) {
        if (levels[p1] <= levels[p2]) {
          levels[p1] = levels[p2] + 1;
          changed = true;
        }
      } else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
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
    if (!person) return null;

    if (globalVisited.has(personId)) {
      // Use debug instead of warn to reduce console noise for expected graph overlaps
      console.debug(`[TreeUtils] Skipping ${person.name}: Already placed in tree.`);
      return null;
    }
    globalVisited.add(personId);

    const spouseIds = spousesOf.get(personId) || [];
    const spouses = spouseIds
      .map(id => personMap.get(id))
      .filter((p): p is Person => !!p);

    const siblingIds = siblingsOf.get(personId) || [];
    const siblings = siblingIds
      .map(id => personMap.get(id))
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
      siblings,
      level,
      color: BRANCH_COLORS[colorIndex % BRANCH_COLORS.length]
    };
  };

  const roots: TreeNode[] = [];
  const potentialRoots = people
    .filter(p => !parentsOf.has(p.id))
    .sort((a, b) => levels[a.id] - levels[b.id]);
  
  potentialRoots.forEach((p) => {
    if (globalVisited.has(p.id)) return;
    
    const spouses = spousesOf.get(p.id) || [];
    const siblings = siblingsOf.get(p.id) || [];
    const hasProcessedConnection = [...spouses, ...siblings].some(id => globalVisited.has(id));
    
    if (!hasProcessedConnection) {
      const node = constructNode(p.id, levels[p.id], roots.length);
      if (node) roots.push(node);
    }
  });

  console.log(`[TreeUtils] FINISHED: Built ${roots.length} separate tree branches.`);
  return roots;
};