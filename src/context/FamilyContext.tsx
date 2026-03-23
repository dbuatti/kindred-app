import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Person, Memory, Suggestion, MemoryType, Profile } from '../types';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface Relationship {
  id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: string;
}

interface FamilyContextType {
  people: Person[];
  suggestions: Suggestion[];
  profiles: Record<string, Profile>;
  reactions: Record<string, string[]>; // memoryId -> array of userIds
  relationships: Relationship[];
  loading: boolean;
  user: any;
  addPerson: (person: Partial<Person>) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  addMemory: (personId: string, content: string, type: MemoryType) => Promise<void>;
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'status'>) => Promise<void>;
  resolveSuggestion: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  toggleReaction: (memoryId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchData = useCallback(async () => {
    console.log("[FamilyContext] Starting data fetch...");
    setLoading(true);
    try {
      // Fetch People & Memories
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*, memories(*)');
      
      if (peopleError) throw peopleError;
      console.log("[FamilyContext] Fetched people:", peopleData?.length);

      // Fetch Suggestions
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select('*')
        .eq('status', 'pending');

      if (suggestionsError) throw suggestionsError;
      console.log("[FamilyContext] Fetched pending suggestions:", suggestionsData?.length);

      // Fetch Profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const profileMap: Record<string, Profile> = {};
      (profilesData || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
      console.log("[FamilyContext] Fetched profiles:", Object.keys(profileMap).length);

      // Fetch Reactions
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('*');

      const reactionMap: Record<string, string[]> = {};
      (reactionsData || []).forEach((r: any) => {
        if (!reactionMap[r.memory_id]) reactionMap[r.memory_id] = [];
        reactionMap[r.memory_id].push(r.user_id);
      });
      setReactions(reactionMap);
      console.log("[FamilyContext] Fetched reactions for memories:", Object.keys(reactionMap).length);

      // Fetch Relationships
      const { data: relData } = await supabase
        .from('relationships')
        .select('*');
      setRelationships(relData || []);
      console.log("[FamilyContext] Fetched relationships:", relData?.length);

      const mappedPeople: Person[] = (peopleData || []).map((p: any) => ({
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
        userId: p.user_id,
        memories: (p.memories || []).map((m: any) => ({
          id: m.id,
          personId: m.person_id,
          content: m.content,
          type: m.type,
          createdByEmail: m.created_by_email,
          createdAt: m.created_at,
          voiceUrl: m.voice_url,
          imageUrl: m.image_url,
          authorName: profileMap[m.user_id]?.first_name || m.created_by_email.split('@')[0]
        }))
      }));

      setPeople(mappedPeople);
      setSuggestions((suggestionsData || []).map((s: any) => ({
        id: s.id,
        personId: s.person_id,
        fieldName: s.field_name,
        suggestedValue: s.suggested_value,
        suggestedByEmail: s.suggested_by_email,
        status: s.status
      })));
      console.log("[FamilyContext] Data mapping complete.");
    } catch (error: any) {
      console.error("[FamilyContext] Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("[FamilyContext] Initializing auth listener...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[FamilyContext] Initial session check:", session ? "User logged in" : "No session");
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[FamilyContext] Auth state change event:", event);
      setUser(session?.user ?? null);
    });

    fetchData();

    return () => {
      console.log("[FamilyContext] Cleaning up auth listener.");
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const addPerson = useCallback(async (newPerson: Partial<Person>) => {
    if (!user) {
      console.warn("[FamilyContext] Attempted to add person without user session.");
      return;
    }
    console.log("[FamilyContext] Adding new person:", newPerson.name);
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
        }]);

      if (error) throw error;
      console.log("[FamilyContext] Person added successfully.");
      fetchData();
    } catch (error: any) {
      console.error("[FamilyContext] Error adding person:", error.message);
      toast.error("Failed to add person: " + error.message);
    }
  }, [fetchData, user]);

  const updatePerson = useCallback(async (id: string, updates: Partial<Person>) => {
    if (!user) return;
    console.log("[FamilyContext] Updating person:", id, updates);
    try {
      const { error } = await supabase
        .from('people')
        .update({
          name: updates.name,
          birth_year: updates.birthYear,
          birth_place: updates.birthPlace,
          occupation: updates.occupation,
          vibe_sentence: updates.vibeSentence,
          personality_tags: updates.personalityTags,
          photo_url: updates.photoUrl,
        })
        .eq('id', id);

      if (error) throw error;
      console.log("[FamilyContext] Person updated successfully.");
      fetchData();
    } catch (error: any) {
      console.error("[FamilyContext] Error updating person:", error.message);
      toast.error("Failed to update: " + error.message);
    }
  }, [fetchData, user]);

  const deletePerson = useCallback(async (id: string) => {
    if (!user) return;
    console.log("[FamilyContext] Deleting person:", id);
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log("[FamilyContext] Person deleted successfully.");
      toast.success("Person removed from archive.");
      fetchData();
    } catch (error: any) {
      console.error("[FamilyContext] Error deleting person:", error.message);
      toast.error("Failed to delete: " + error.message);
    }
  }, [fetchData, user]);

  const addMemory = useCallback(async (personId: string, content: string, type: MemoryType) => {
    if (!user) return;
    console.log("[FamilyContext] Adding memory for person:", personId, "Type:", type);
    try {
      const { error } = await supabase
        .from('memories')
        .insert([{
          person_id: personId === 'general' ? null : personId,
          content,
          type,
          created_by_email: user.email,
          user_id: user.id
        }]);

      if (error) throw error;
      console.log("[FamilyContext] Memory added successfully.");
      fetchData();
    } catch (error: any) {
      console.error("[FamilyContext] Error adding memory:", error.message);
      toast.error("Failed to save story: " + error.message);
    }
  }, [fetchData, user]);

  const toggleReaction = useCallback(async (memoryId: string) => {
    if (!user) return;
    
    const userReactions = reactions[memoryId] || [];
    const hasReacted = userReactions.includes(user.id);
    console.log("[FamilyContext] Toggling reaction for memory:", memoryId, "Has reacted:", hasReacted);

    try {
      if (hasReacted) {
        await supabase
          .from('reactions')
          .delete()
          .eq('memory_id', memoryId)
          .eq('user_id', user.id);
        console.log("[FamilyContext] Reaction removed.");
      } else {
        await supabase
          .from('reactions')
          .upsert({ memory_id: memoryId, user_id: user.id }, { onConflict: 'memory_id,user_id' });
        console.log("[FamilyContext] Reaction added.");
      }
      fetchData();
    } catch (error: any) {
      console.error("[FamilyContext] Reaction error:", error.message);
    }
  }, [user, reactions, fetchData]);

  const addSuggestion = useCallback(async (s: Omit<Suggestion, 'id' | 'status'>) => {
    if (!user) return;
    console.log("[FamilyContext] Adding suggestion for person:", s.personId, "Field:", s.fieldName);
    try {
      const { error } = await supabase
        .from('suggestions')
        .insert([{
          person_id: s.personId,
          field_name: s.fieldName,
          suggested_value: s.suggestedValue,
          suggested_by_email: user.email,
          user_id: user.id
        }]);

      if (error) throw error;
      console.log("[FamilyContext] Suggestion added successfully.");
      fetchData();
    } catch (error: any) {
      console.error("[FamilyContext] Error adding suggestion:", error.message);
      toast.error("Failed to send suggestion: " + error.message);
    }
  }, [fetchData, user]);

  const resolveSuggestion = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    console.log("[FamilyContext] Resolving suggestion:", id, "Status:", status);
    try {
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) {
        console.warn("[FamilyContext] Suggestion not found for resolution:", id);
        return;
      }

      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      if (status === 'approved') {
        console.log("[FamilyContext] Applying approved suggestion to person:", suggestion.personId);
        const { error: personError } = await supabase
          .from('people')
          .update({ [suggestion.fieldName]: suggestion.suggestedValue })
          .eq('id', suggestion.personId);
        
        if (personError) throw personError;
      }

      console.log("[FamilyContext] Suggestion resolved successfully.");
      fetchData();
    } catch (error: any) {
      console.error("[FamilyContext] Error resolving suggestion:", error.message);
      toast.error("Failed to resolve suggestion: " + error.message);
    }
  }, [suggestions, fetchData]);

  return (
    <FamilyContext.Provider value={{ 
      people, 
      suggestions, 
      profiles,
      reactions,
      relationships,
      loading,
      user,
      addPerson, 
      updatePerson,
      deletePerson,
      addMemory, 
      addSuggestion, 
      resolveSuggestion,
      toggleReaction,
      refreshData: fetchData
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