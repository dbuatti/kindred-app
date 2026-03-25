export const getInverseRelationship = (type: string, relativeGender?: string) => {
  const t = type.toLowerCase();
  const g = relativeGender?.toLowerCase();
  
  // If the record describes ME (e.g., 'I am the son'), 
  // then the relative's role is the inverse (e.g., 'Father' or 'Mother').
  
  if (t === 'mother' || t === 'father' || t === 'parent' || t === 'son' || t === 'daughter' || t === 'child') {
    if (t === 'mother' || t === 'father' || t === 'parent') {
      // I am the parent -> Relative is the child
      if (g === 'male') return 'Son';
      if (g === 'female') return 'Daughter';
      return 'Child';
    } else {
      // I am the child -> Relative is the parent
      if (g === 'male') return 'Father';
      if (g === 'female') return 'Mother';
      return 'Parent';
    }
  }
  
  if (t === 'brother' || t === 'sister' || t === 'sibling') {
    if (g === 'male') return 'Brother';
    if (g === 'female') return 'Sister';
    return 'Sibling';
  }
  
  if (t === 'spouse' || t === 'wife' || t === 'husband') {
    if (g === 'male') return 'Husband';
    if (g === 'female') return 'Wife';
    if (t === 'wife') return 'Husband';
    if (t === 'husband') return 'Wife';
    return 'Spouse';
  }
  
  if (t === 'grandmother' || t === 'grandfather' || t === 'grandparent' || t === 'grandson' || t === 'granddaughter' || t === 'grandchild') {
    if (t.includes('grandparent') || t.includes('grandm') || t.includes('grandf')) {
      if (g === 'male') return 'Grandson';
      if (g === 'female') return 'Granddaughter';
      return 'Grandchild';
    } else {
      if (g === 'male') return 'Grandfather';
      if (g === 'female') return 'Grandmother';
      return 'Grandparent';
    }
  }

  if (t === 'aunt' || t === 'uncle') {
    if (g === 'male') return 'Nephew';
    if (g === 'female') return 'Niece';
    return 'Relative';
  }

  return type;
};

/**
 * Returns a gender-appropriate version of a role.
 * e.g. ("Son", "female") -> "Daughter"
 */
export const getGenderedRole = (role: string, gender?: string) => {
  const r = role.toLowerCase();
  const g = gender?.toLowerCase();
  
  if (['son', 'daughter', 'child'].includes(r)) {
    if (g === 'male') return 'Son';
    if (g === 'female') return 'Daughter';
    return 'Child';
  }
  if (['mother', 'father', 'parent'].includes(r)) {
    if (g === 'male') return 'Father';
    if (g === 'female') return 'Mother';
    return 'Parent';
  }
  if (['brother', 'sister', 'sibling'].includes(r)) {
    if (g === 'male') return 'Brother';
    if (g === 'female') return 'Sister';
    return 'Sibling';
  }
  if (['uncle', 'aunt'].includes(r)) {
    if (g === 'male') return 'Uncle';
    if (g === 'female') return 'Aunt';
    return 'Uncle/Aunt';
  }
  return role;
};