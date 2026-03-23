import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Person, Memory, Suggestion, MemoryType } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface FamilyContextType {
  people: Person[];
  suggestions: Suggestion[];
  loading: boolean;
  addPerson: (person: Partial<Person>) => Promise<void>;
  addMemory: (personId: string, content: string, type: MemoryType) => Promise<void>;
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'status'>) => Promise<void>;
  resolveSuggestion: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*, memories(*)');
      
      if (peopleError) throw peopleError;

      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select('*')
        .eq('status', 'pending');

      if (suggestionsError) throw suggestionsError;

      setPeople(peopleData || []);
      setSuggestions(suggestionsData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addPerson = useCallback(async (newPerson: Partial<Person>) => {
    try {
      const { data, error } = await supabase
        .from('people')
        .insert([{
          name: newPerson.name,
          birth_year: newPerson.birthYear,
          birth_place: newPerson.birthPlace,
          vibe_sentence: newPerson.vibeSentence,
          personality_tags: newPerson.personalityTags,
          photo_url: newPerson.photoUrl,
          created_by_email: 'me@family.com', // In a real app, get from auth
          family_id: '00000000-0000-0000-0000-000000000000' // Placeholder family ID
        }])
        .select();

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add person: " + error.message);
    }
  }, [fetchData]);

  const addMemory = useCallback(async (personId: string, content: string, type: MemoryType) => {
    try {
      const { error } = await supabase
        .from('memories')
        .insert([{
          person_id: personId,
          content,
          type,
          created_by_email: 'me@family.com'
        }]);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error("Failed to save story: " + error.message);
    }
  }, [fetchData]);

  const addSuggestion = useCallback(async (s: Omit<Suggestion, 'id' | 'status'>) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .insert([{
          person_id: s.personId,
          field_name: s.fieldName,
          suggested_value: s.suggestedValue,
          suggested_by_email: s.suggestedByEmail
        }]);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error("Failed to send suggestion: " + error.message);
    }
  }, [fetchData]);

  const resolveSuggestion = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    try {
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) return;

      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      if (status === 'approved') {
        const { error: personError } = await supabase
          .from('people')
          .update({ [suggestion.fieldName]: suggestion.suggestedValue })
          .eq('id', suggestion.personId);
        
        if (personError) throw personError;
      }

      fetchData();
    } catch (error: any) {
      toast.error("Failed to resolve suggestion: " + error.message);
    }
  }, [suggestions, fetchData]);

  return (
    <FamilyContext.Provider value={{ 
      people, 
      suggestions, 
      loading,
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