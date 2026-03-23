import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Person, Memory, Suggestion, MemoryType } from '../types';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface FamilyContextType {
  people: Person[];
  suggestions: Suggestion[];
  loading: boolean;
  user: any;
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
  const [user, setUser] = useState<any>(null);

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

      const mappedPeople = (peopleData || []).map((p: any) => ({
        id: p.id,
        familyId: p.family_id,
        name: p.name,
        birthYear: p.birth_year,
        birthPlace: p.birth_place,
        occupation: p.occupation,
        vibeSentence: p.vibe_sentence,
        personalityTags: p.personality_tags || [],
        photoUrl: p.photo_url,
        createdByEmail: p.created_by_email,
        memories: (p.memories || []).map((m: any) => ({
          id: m.id,
          personId: m.person_id,
          content: m.content,
          type: m.type,
          createdByEmail: m.created_by_email,
          createdAt: m.created_at,
          voiceUrl: m.voice_url,
          imageUrl: m.image_url
        }))
      }));

      const mappedSuggestions = (suggestionsData || []).map((s: any) => ({
        id: s.id,
        personId: s.person_id,
        fieldName: s.field_name,
        suggestedValue: s.suggested_value,
        suggestedByEmail: s.suggested_by_email,
        status: s.status
      }));

      setPeople(mappedPeople);
      setSuggestions(mappedSuggestions);
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchData();

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const addPerson = useCallback(async (newPerson: Partial<Person>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('people')
        .insert([{
          name: newPerson.name,
          birth_year: newPerson.birthYear,
          birth_place: newPerson.birthPlace,
          vibe_sentence: newPerson.vibeSentence,
          personality_tags: newPerson.personalityTags,
          photo_url: newPerson.photoUrl,
          created_by_email: user.email,
          family_id: null
        }]);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add person: " + error.message);
    }
  }, [fetchData, user]);

  const addMemory = useCallback(async (personId: string, content: string, type: MemoryType) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('memories')
        .insert([{
          person_id: personId,
          content,
          type,
          created_by_email: user.email
        }]);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error("Failed to save story: " + error.message);
    }
  }, [fetchData, user]);

  const addSuggestion = useCallback(async (s: Omit<Suggestion, 'id' | 'status'>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('suggestions')
        .insert([{
          person_id: s.personId,
          field_name: s.fieldName,
          suggested_value: s.suggestedValue,
          suggested_by_email: user.email
        }]);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error("Failed to send suggestion: " + error.message);
    }
  }, [fetchData, user]);

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
      user,
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