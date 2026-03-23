export const getInverseRelationship = (type: string, gender?: string) => {
  const t = type.toLowerCase();
  
  if (t === 'mother' || t === 'father' || t === 'parent') {
    if (gender === 'male') return 'Son';
    if (gender === 'female') return 'Daughter';
    return 'Child';
  }
  
  if (t === 'son' || t === 'daughter' || t === 'child') {
    if (gender === 'male') return 'Father';
    if (gender === 'female') return 'Mother';
    return 'Parent';
  }
  
  if (t === 'brother' || t === 'sister' || t === 'sibling') {
    if (gender === 'male') return 'Brother';
    if (gender === 'female') return 'Sister';
    return 'Sibling';
  }
  
  if (t === 'spouse' || t === 'wife' || t === 'husband') {
    if (gender === 'male') return 'Husband';
    if (gender === 'female') return 'Wife';
    return 'Spouse';
  }
  
  if (t === 'grandmother' || t === 'grandfather' || t === 'grandparent') {
    if (gender === 'male') return 'Grandson';
    if (gender === 'female') return 'Granddaughter';
    return 'Grandchild';
  }
  
  if (t === 'grandson' || t === 'granddaughter' || t === 'grandchild') {
    if (gender === 'male') return 'Grandfather';
    if (gender === 'female') return 'Grandmother';
    return 'Grandparent';
  }

  if (t === 'aunt' || t === 'uncle') {
    if (gender === 'male') return 'Nephew';
    if (gender === 'female') return 'Niece';
    return 'Relative';
  }

  return type;
};