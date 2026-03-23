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
        
        const type = isPrimary 
          ? r.relationship_type 
          : getInverseRelationship(r.relationship_type, person.gender);
          
        const key = `${relative.id}-${type}`;
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