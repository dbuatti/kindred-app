"use client";

import { useMemo } from 'react';
import { Person } from '../types';
import { getInverseRelationship } from '@/lib/relationships';

export const usePersonRelatives = (person: Person | null, people: Person[], relationships: any[]) => {
  return useMemo(() => {
    if (!person || !relationships.length) return [];
    
    const seen = new Set();
    const relatives: any[] = [];

    // 1. Get Direct Relatives
    const direct = relationships
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
          type: type,
          isDirect: true
        };
      })
      .filter((r): r is any => r !== null);

    relatives.push(...direct);

    // 2. Infer Siblings of Direct Relatives
    // This solves the "James is Scott's brother, Scott is Daniele's cousin" case.
    direct.forEach(rel => {
      const siblings = relationships
        .filter(r => (r.person_id === rel.id || r.related_person_id === rel.id) && 
                     ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
        .map(r => {
          const sibId = r.person_id === rel.id ? r.related_person_id : r.person_id;
          if (sibId === person.id) return null; // Don't link to self
          
          const sibling = people.find(p => p.id === sibId);
          if (!sibling) return null;
          
          // Skip if this person is already a direct relative
          if (relatives.some(existing => existing.id === sibling.id)) return null;
          
          return {
            ...sibling,
            type: rel.type, // Inherit the relationship type (e.g. Cousin)
            isInferred: true,
            inferredFrom: rel.name
          };
        })
        .filter((s): s is any => s !== null);
      
      siblings.forEach(sib => {
        // Final check to avoid duplicates
        if (!relatives.some(r => r.id === sib.id)) {
          relatives.push(sib);
        }
      });
    });

    return relatives;
  }, [person, relationships, people]);
};