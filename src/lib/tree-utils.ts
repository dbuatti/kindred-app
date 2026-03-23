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
  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  const parentMap = new Map<string, string[]>();
  const childToParents = new Map<string, string[]>();
  
  relationships.forEach(r => {
    const type = r.relationship_type.toLowerCase();
    if (['father', 'mother', 'parent'].includes(type)) {
      const children = parentMap.get(r.related_person_id) || [];
      if (!children.includes(r.person_id)) children.push(r.person_id);
      parentMap.set(r.related_person_id, children);
      
      const parents = childToParents.get(r.person_id) || [];
      parents.push(r.related_person_id);
      childToParents.set(r.person_id, parents);
    } else if (['son', 'daughter', 'child'].includes(type)) {
      const children = parentMap.get(r.person_id) || [];
      if (!children.includes(r.related_person_id)) children.push(r.related_person_id);
      parentMap.set(r.person_id, children);

      const parents = childToParents.get(r.related_person_id) || [];
      parents.push(r.person_id);
      childToParents.set(r.related_person_id, parents);
    }
  });

  const spouseMap = new Map<string, string[]>();
  relationships.forEach(r => {
    const type = r.relationship_type.toLowerCase();
    if (['spouse', 'wife', 'husband'].includes(type)) {
      const s1 = spouseMap.get(r.person_id) || [];
      if (!s1.includes(r.related_person_id)) s1.push(r.related_person_id);
      spouseMap.set(r.person_id, s1);

      const s2 = spouseMap.get(r.related_person_id) || [];
      if (!s2.includes(r.person_id)) s2.push(r.person_id);
      spouseMap.set(r.related_person_id, s2);
    }
  });

  const globalVisited = new Set<string>();

  const constructNode = (personId: string, level: number, colorIndex: number): TreeNode | null => {
    if (globalVisited.has(personId)) return null;
    globalVisited.add(personId);

    const person = personMap.get(personId);
    if (!person) return null;

    const spouseIds = spouseMap.get(personId) || [];
    const spouses = spouseIds
      .map(id => {
        if (globalVisited.has(id)) return null;
        globalVisited.add(id);
        return personMap.get(id);
      })
      .filter((p): p is Person => !!p);

    // Children can come from this person OR their spouses
    const allParentIds = [personId, ...spouseIds];
    const childIds = new Set<string>();
    allParentIds.forEach(pId => {
      (parentMap.get(pId) || []).forEach(cId => childIds.add(cId));
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

  // A person is a root if they have no parents AND they aren't married to someone who has parents
  const roots: TreeNode[] = [];
  const potentialRoots = people.filter(p => !childToParents.has(p.id));
  
  potentialRoots.forEach((p, idx) => {
    if (globalVisited.has(p.id)) return;
    
    const spouses = spouseMap.get(p.id) || [];
    const spouseHasParents = spouses.some(sId => childToParents.has(sId));
    
    // If I have no parents but my spouse does, I'll be picked up as a spouse in their branch
    if (!spouseHasParents) {
      const node = constructNode(p.id, 0, roots.length);
      if (node) roots.push(node);
    }
  });

  return roots;
};