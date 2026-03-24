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
  if (!people.length) return [];

  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();

  // 1. Map standard relationships
  relationships.forEach((r) => {
    const type = r.relationship_type?.toLowerCase() || 'unknown';
    const p1 = r.person_id;
    const p2 = r.related_person_id;

    if (!personMap.has(p1) || !personMap.has(p2)) return;

    if (['father', 'mother', 'parent'].includes(type)) {
      // p1 is parent, p2 is child
      const children = childrenOf.get(p1) || [];
      if (!children.includes(p2)) children.push(p2);
      childrenOf.set(p1, children);
      
      const parents = parentsOf.get(p2) || [];
      if (!parents.includes(p1)) parents.push(p1);
      parentsOf.set(p2, parents);
    } else if (['son', 'daughter', 'child'].includes(type)) {
      // p1 is child, p2 is parent
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

  const globalVisited = new Set<string>();

  const constructNode = (personId: string, level: number, colorIndex: number): TreeNode | null => {
    if (globalVisited.has(personId)) return null;
    const person = personMap.get(personId);
    if (!person) return null;

    globalVisited.add(personId);

    // Find spouses
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

    // Find siblings (people who share the same parents)
    const myParents = parentsOf.get(personId) || [];
    const siblingIds = new Set<string>();
    myParents.forEach(pId => {
      (childrenOf.get(pId) || []).forEach(cId => {
        if (cId !== personId) siblingIds.add(cId);
      });
    });

    const siblings = Array.from(siblingIds)
      .map(id => {
        if (!globalVisited.has(id)) {
          globalVisited.add(id);
          return personMap.get(id);
        }
        return null;
      })
      .filter((p): p is Person => !!p);

    // Find children
    const childIds = childrenOf.get(personId) || [];
    // Also check spouses for children to ensure we catch everyone
    spouseIds.forEach(sId => {
      (childrenOf.get(sId) || []).forEach(cId => {
        if (!childIds.includes(cId)) childIds.push(cId);
      });
    });

    const children = childIds
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
  
  // Keep looking for roots until everyone is in the tree
  const allPeopleIds = people.map(p => p.id);
  
  // Priority 1: People with no parents (Natural Roots)
  const naturalRoots = allPeopleIds
    .filter(id => !parentsOf.has(id))
    .sort((a, b) => (childrenOf.get(b)?.length || 0) - (childrenOf.get(a)?.length || 0));

  naturalRoots.forEach(rootId => {
    const node = constructNode(rootId, 0, roots.length);
    if (node) roots.push(node);
  });

  // Priority 2: Anyone left over (Disconnected branches or loops)
  allPeopleIds.forEach(id => {
    if (!globalVisited.has(id)) {
      const node = constructNode(id, 0, roots.length);
      if (node) roots.push(node);
    }
  });

  return roots;
};