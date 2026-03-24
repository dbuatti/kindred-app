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

const BRANCH_COLORS = ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa'];

export const buildTree = (people: Person[], relationships: any[]): TreeNode[] => {
  if (!people.length) return [];

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

  const globalVisited = new Set<string>();

  const constructNode = (personId: string, level: number, colorIndex: number): TreeNode | null => {
    if (globalVisited.has(personId)) return null;
    const person = personMap.get(personId);
    if (!person) return null;

    globalVisited.add(personId);

    const spouseIds = spousesOf.get(personId) || [];
    const spouses = spouseIds
      .map(id => {
        if (!globalVisited.has(id)) {
          globalVisited.add(id);
          return personMap.get(id);
        }
        return null;
      })
      .filter((p): p is Person => !!p);

    // Find siblings and mark them as visited so they don't become separate roots
    const siblingIds = siblingsOf.get(personId) || [];
    const siblings = siblingIds
      .map(id => {
        if (!globalVisited.has(id)) {
          globalVisited.add(id);
          return personMap.get(id);
        }
        return null;
      })
      .filter((p): p is Person => !!p);

    // Children can come from the person or their siblings
    const parentGroup = [personId, ...siblingIds];
    const childIds = new Set<string>();
    parentGroup.forEach(pId => {
      (childrenOf.get(pId) || []).forEach(cId => childIds.add(cId));
    });

    const children = Array.from(childIds)
      .map(id => constructNode(id, level + 1, colorIndex))
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
  const allIds = people.map(p => p.id);
  
  // 1. Start with people who have no parents listed
  const potentialRoots = allIds.filter(id => !parentsOf.has(id));
  potentialRoots.forEach(id => {
    const node = constructNode(id, 0, roots.length);
    if (node) roots.push(node);
  });

  // 2. Catch anyone else
  allIds.forEach(id => {
    if (!globalVisited.has(id)) {
      const node = constructNode(id, 0, roots.length);
      if (node) roots.push(node);
    }
  });

  return roots;
};