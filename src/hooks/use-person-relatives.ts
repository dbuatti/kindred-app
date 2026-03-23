"use client";

import { useMemo } from 'react';
import { Person } from '../types';
import { getInverseRelationship } from '@/lib/relationships';

export const usePersonRelatives = (person: Person | null, people: Person[], relationships: any[]) => {
  return useMemo(() => {
    if (!person || !relationships.length) return [];
    
    const seen = new Set();
    return relationships
      .filter(r => r.person_id === person.id || r.related_person_id === person.id)
      .map(r => {
        const isPrimary = r.person_id === person.id;
        const relativeId = isPrimary ? r.related_person_id : r.person_id;
        const relative = people.find(p => p.id === relativeId);
        
        if (!relative) return null;
        
        // If the current person is the 'person_id', the relative is the 'related_person_id'.
        // The relationship type (e.g. 'father') describes the 'person_id'.
        // So if I am the 'person_id' and the type is 'father', the relative is my 'son/daughter'.
        const type = isPrimary 
          ? getInverseRelationship(r.relationship_type, person.gender)
          : r.relationship_type;
          
        const key = `${relative.id}-${type.toLowerCase()}`;
        if (seen.has(key)) return null;
        seen.add(key);
        
        return {
          ...relative,
          type: type
        };
      })
      .filter(Boolean);
  }, [person, relationships, people]);
};