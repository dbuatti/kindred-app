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
  const siblingsOf = new Map<string, string[]>();

  relationships.forEach(r => {
    const type = r.relationship_type.toLowerCase();
    const p1 = r.person_id;
    const p2 = r.related_person_id;

    if (['father', 'mother', 'parent'].includes(type)) {
      const children = childrenOf.get(p2) || [];
      if (!children.includes(p1)) children.push(p1);
      childrenOf.set(p2, children);

      const parents = parentsOf.get(p1) || [];
      if (!parents.includes(p2)) parents.push(p2);
      parentsOf.set(p1, parents);
    } else if (['son', 'daughter', 'child'].includes(type)) {
      const children = childrenOf.get(p1) || [];
      if (!children.includes(p2)) children.push(p2);
      childrenOf.set(p1, children);

      const parents = parentsOf.get(p2) || [];
      if (!parents.includes(p1)) parents.push(p1);
      parentsOf.set(p2, parents);
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

  // Multi-pass leveling to align generations
  const levels: Record<string, number> = {};
  people.forEach(p => levels[p.id] = 0);

  for (let i = 0; i < 20; i++) {
    relationships.forEach(r => {
      const type = r.relationship_type.toLowerCase();
      if (['father', 'mother', 'parent'].includes(type)) {
        levels[r.person_id] = Math.max(levels[r.person_id], levels[r.related_person_id] + 1);
      } else if (['son', 'daughter', 'child'].includes(type)) {
        levels[r.related_person_id] = Math.max(levels[r.related_person_id], levels[r.person_id] + 1);
      } else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
        const maxLvl = Math.max(levels[r.person_id], levels[r.related_person_id]);
        levels[r.person_id] = maxLvl;
        levels[r.related_person_id] = maxLvl;
      }
    });
  }

  const globalVisited = new Set<string>();

  const constructNode = (personId: string, level: number, colorIndex: number): TreeNode | null => {
    if (globalVisited.has(personId)) return null;
    globalVisited.add(personId);

    const person = personMap.get(personId);
    if (!person) return null;

    const spouseIds = spousesOf.get(personId) || [];
    const spouses = spouseIds
      .map(id => {
        if (globalVisited.has(id)) return null;
        globalVisited.add(id);
        return personMap.get(id);
      })
      .filter((p): p is Person => !!p);

    const allParentIds = [personId, ...spouseIds];
    const childIds = new Set<string>();
    allParentIds.forEach(pId => {
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
  const potentialRoots = people
    .filter(p => !parentsOf.has(p.id))
    .sort((a, b) => levels[a.id] - levels[b.id]);
  
  potentialRoots.forEach((p, idx) => {
    if (globalVisited.has(p.id)) return;
    
    const spouses = spousesOf.get(p.id) || [];
    const siblings = siblingsOf.get(p.id) || [];
    const hasProcessedConnection = [...spouses, ...siblings].some(id => globalVisited.has(id));
    
    if (!hasProcessedConnection) {
      const node = constructNode(p.id, levels[p.id], roots.length);
      if (node) roots.push(node);
    }
  });

  return roots;
};