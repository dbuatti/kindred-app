"use client";

import { useMemo } from 'react';
import { Person } from '../types';
import { getInverseRelationship } from '@/lib/relationships';

export const usePersonRelatives = (person: Person | null, people: Person[], relationships: any[]) => {
  return useMemo(() => {
    if (!person || !relationships.length) return [];
    
    const seen = new Set();
    const relatives: any[] = [];

    // Helper to infer gender if not explicitly set
    const getEffectiveGender = (p: Person) => {
      if (p.gender) return p.gender.toLowerCase();
      
      // Check personality tags
      const tags = (p.personalityTags || []).map(t => t.toLowerCase());
      if (tags.some(t => ['father', 'brother', 'son', 'uncle', 'grandfather'].includes(t))) return 'male';
      if (tags.some(t => ['mother', 'sister', 'daughter', 'aunt', 'grandmother'].includes(t))) return 'female';
      
      // Check if they are the 'person_id' in any gendered relationship
      const genderedRel = relationships.find(r => 
        r.person_id === p.id && 
        ['father', 'mother', 'brother', 'sister', 'son', 'daughter', 'uncle', 'aunt'].includes(r.relationship_type.toLowerCase())
      );
      
      if (genderedRel) {
        const t = genderedRel.relationship_type.toLowerCase();
        if (['father', 'brother', 'son', 'uncle'].includes(t)) return 'male';
        if (['mother', 'sister', 'daughter', 'aunt'].includes(t)) return 'female';
      }

      return null;
    };

    // 1. Get Direct Relatives
    const direct = relationships
      .filter(r => r.person_id === person.id || r.related_person_id === person.id)
      .map(r => {
        const isPrimary = r.person_id === person.id;
        const relativeId = isPrimary ? r.related_person_id : r.person_id;
        const relative = people.find(p => p.id === relativeId);
        
        if (!relative) return null;
        
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
    // This handles Aunts/Uncles (Siblings of Parents) and Siblings of Cousins
    direct.forEach(rel => {
      const siblings = relationships
        .filter(r => (r.person_id === rel.id || r.related_person_id === rel.id) && 
                     ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
        .map(r => {
          const sibId = r.person_id === rel.id ? r.related_person_id : r.person_id;
          if (sibId === person.id) return null;
          
          const sibling = people.find(p => p.id === sibId);
          if (!sibling) return null;
          
          // Determine inferred type
          let inferredType = rel.type;
          const relTypeLower = rel.type.toLowerCase();
          
          // If the direct relative is a parent, their sibling is an Aunt/Uncle
          if (['mother', 'father', 'parent'].includes(relTypeLower)) {
            const gender = getEffectiveGender(sibling);
            if (gender === 'female') inferredType = 'Aunt';
            else if (gender === 'male') inferredType = 'Uncle';
            else inferredType = 'Aunt/Uncle';
          }
          
          if (relatives.some(existing => existing.id === sibling.id)) return null;
          
          return {
            ...sibling,
            type: inferredType,
            isInferred: true,
            inferredFrom: rel.name
          };
        })
        .filter((s): s is any => s !== null);
      
      siblings.forEach(sib => {
        if (!relatives.some(r => r.id === sib.id)) {
          relatives.push(sib);
        }
      });
    });

    // 3. Infer Children of Aunts/Uncles as Cousins
    const cousins: any[] = [];
    relatives.forEach(rel => {
      const relTypeLower = rel.type.toLowerCase();
      if (relTypeLower.includes('aunt') || relTypeLower.includes('uncle')) {
        const children = relationships
          .filter(r => {
            const t = r.relationship_type.toLowerCase();
            // Rel is the parent
            if (r.person_id === rel.id && ['mother', 'father', 'parent'].includes(t)) return true;
            // Rel is the child (inverse)
            if (r.related_person_id === rel.id && ['son', 'daughter', 'child'].includes(t)) return true;
            return false;
          })
          .map(r => {
            const childId = r.person_id === rel.id ? r.related_person_id : r.person_id;
            if (childId === person.id) return null;
            
            const child = people.find(p => p.id === childId);
            if (!child) return null;
            
            // Skip if already in relatives or already in our new cousins list
            if (relatives.some(ex => ex.id === child.id) || cousins.some(ex => ex.id === child.id)) return null;
            
            return {
              ...child,
              type: 'Cousin',
              isInferred: true,
              inferredFrom: rel.name
            };
          })
          .filter((c): c is any => c !== null);
        
        cousins.push(...children);
      }
    });
    
    relatives.push(...cousins);

    return relatives;
  }, [person, relationships, people]);
};