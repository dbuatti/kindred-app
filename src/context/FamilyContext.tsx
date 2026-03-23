import React, { createContext, useContext, useState, useCallback } from 'react';
import { Person, Memory, Suggestion, MemoryType } from '../types';
import { MOCK_PEOPLE } from '../data/mock';

interface FamilyContextType {
  people: Person[];
  suggestions: Suggestion[];
  addPerson: (person: Partial<Person>) => void;
  addMemory: (personId: string, content: string, type: MemoryType) => void;
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'status'>) => void;
  resolveSuggestion: (id: string, status: 'approved' | 'rejected') => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const addPerson = useCallback((newPerson: Partial<Person>) => {
    const person: Person = {
      id: Math.random().toString(36).substr(2, 9),
      familyId: 'fam-1',
      name: newPerson.name || 'Unknown',
      vibeSentence: newPerson.vibeSentence || '',
      personalityTags: newPerson.personalityTags || [],
      createdByEmail: 'me@family.com',
      memories: [],
      ...newPerson
    };
    setPeople(prev => [person, ...prev]);
  }, []);

  const addMemory = useCallback((personId: string, content: string, type: MemoryType) => {
    const memory: Memory = {
      id: Math.random().toString(36).substr(2, 9),
      personId,
      content,
      type,
      createdByEmail: 'me@family.com',
      createdAt: new Date().toISOString(),
    };
    setPeople(prev => prev.map(p => 
      p.id === personId ? { ...p, memories: [memory, ...p.memories] } : p
    ));
  }, []);

  const addSuggestion = useCallback((s: Omit<Suggestion, 'id' | 'status'>) => {
    const suggestion: Suggestion = {
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    };
    setSuggestions(prev => [suggestion, ...prev]);
  }, []);

  const resolveSuggestion = useCallback((id: string, status: 'approved' | 'rejected') => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    
    if (status === 'approved') {
      const suggestion = suggestions.find(s => s.id === id);
      if (suggestion) {
        setPeople(prev => prev.map(p => 
          p.id === suggestion.personId 
            ? { ...p, [suggestion.fieldName]: suggestion.suggestedValue } 
            : p
        ));
      }
    }
  }, [suggestions]);

  return (
    <FamilyContext.Provider value={{ 
      people, 
      suggestions, 
      addPerson, 
      addMemory, 
      addSuggestion, 
      resolveSuggestion 
    }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) throw new Error('useFamily must be used within a FamilyProvider');
  return context;
};