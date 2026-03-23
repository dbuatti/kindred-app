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
        
        // If we are the related_person_id (Object), the relationship_type 
        // already describes the person_id (Relative).
        // If we are the person_id (Subject), we need to invert it to describe the relative.
        const type = !isPrimary 
          ? r.relationship_type
          : getInverseRelationship(r.relationship_type, relative.gender);
          
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