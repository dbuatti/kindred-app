export const getInverseRelationship = (type: string, relativeGender?: string) => {
  const t = type.toLowerCase();
  
  // If the record describes ME (e.g., 'I am the son'), 
  // then the relative's role is the inverse (e.g., 'Father' or 'Mother').
  // We use the RELATIVE'S gender to determine which one.
  
  if (t === 'mother' || t === 'father' || t === 'parent' || t === 'son' || t === 'daughter' || t === 'child') {
    if (t === 'mother' || t === 'father' || t === 'parent') {
      // I am the parent -> Relative is the child
      if (relativeGender === 'male') return 'Son';
      if (relativeGender === 'female') return 'Daughter';
      return 'Child';
    } else {
      // I am the child -> Relative is the parent
      if (relativeGender === 'male') return 'Father';
      if (relativeGender === 'female') return 'Mother';
      return 'Parent';
    }
  }
  
  if (t === 'brother' || t === 'sister' || t === 'sibling') {
    if (relativeGender === 'male') return 'Brother';
    if (relativeGender === 'female') return 'Sister';
    return 'Sibling';
  }
  
  if (t === 'spouse' || t === 'wife' || t === 'husband') {
    if (relativeGender === 'male') return 'Husband';
    if (relativeGender === 'female') return 'Wife';
    return 'Spouse';
  }
  
  if (t === 'grandmother' || t === 'grandfather' || t === 'grandparent' || t === 'grandson' || t === 'granddaughter' || t === 'grandchild') {
    if (t.includes('grandparent') || t.includes('grandm') || t.includes('grandf')) {
      if (relativeGender === 'male') return 'Grandson';
      if (relativeGender === 'female') return 'Granddaughter';
      return 'Grandchild';
    } else {
      if (relativeGender === 'male') return 'Grandfather';
      if (relativeGender === 'female') return 'Grandmother';
      return 'Grandparent';
    }
  }

  if (t === 'aunt' || t === 'uncle') {
    if (relativeGender === 'male') return 'Nephew';
    if (relativeGender === 'female') return 'Niece';
    return 'Relative';
  }

  return type;
};