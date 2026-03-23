import { Person } from '../types';

export interface TreeNode {
  id: string;
  person: Person;
  children: TreeNode[];
  spouses: Person[];
  level: number;
  color?: string;
}

const BRANCH_COLORS = [
  '#d97706', // Amber
  '#2563eb', // Blue
  '#16a34a', // Green
  '#dc2626', // Red
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#0891b2', // Cyan
];

export const buildTree = (people: Person[], relationships: any[]): TreeNode[] => {
  const personMap = new Map<string, Person>();
  people.forEach(p => personMap.set(p.id, p));

  // Find parents for everyone
  const parentMap = new Map<string, string[]>();
  relationships.forEach(r => {
    const type = r.relationship_type.toLowerCase();
    if (['father', 'mother', 'parent'].includes(type)) {
      const children = parentMap.get(r.related_person_id) || [];
      children.push(r.person_id);
      parentMap.set(r.related_person_id, children);
    } else if (['son', 'daughter', 'child'].includes(type)) {
      const children = parentMap.get(r.person_id) || [];
      children.push(r.related_person_id);
      parentMap.set(r.person_id, children);
    }
  });

  // Find spouses
  const spouseMap = new Map<string, string[]>();
  relationships.forEach(r => {
    const type = r.relationship_type.toLowerCase();
    if (['spouse', 'wife', 'husband'].includes(type)) {
      const s1 = spouseMap.get(r.person_id) || [];
      s1.push(r.related_person_id);
      spouseMap.set(r.person_id, s1);

      const s2 = spouseMap.get(r.related_person_id) || [];
      s2.push(r.person_id);
      spouseMap.set(r.related_person_id, s2);
    }
  });

  // Identify Roots (People with no parents in the system)
  const allChildren = new Set<string>();
  parentMap.forEach(children => children.forEach(c => allChildren.add(c)));
  const roots = people.filter(p => !allChildren.has(p.id));

  const visited = new Set<string>();

  const constructNode = (personId: string, level: number, colorIndex: number): TreeNode | null => {
    if (visited.has(personId)) return null;
    visited.add(personId);

    const person = personMap.get(personId);
    if (!person) return null;

    const childIds = parentMap.get(personId) || [];
    const children = childIds
      .map((id, idx) => constructNode(id, level + 1, level === 0 ? idx : colorIndex))
      .filter((n): n is TreeNode => n !== null);

    const spouseIds = spouseMap.get(personId) || [];
    const spouses = spouseIds
      .map(id => personMap.get(id))
      .filter((p): p is Person => !!p);

    return {
      id: personId,
      person,
      children,
      spouses,
      level,
      color: BRANCH_COLORS[colorIndex % BRANCH_COLORS.length]
    };
  };

  return roots.map((root, idx) => constructNode(root.id, 0, idx)).filter((n): n is TreeNode => n !== null);
};