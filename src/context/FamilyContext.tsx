import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Person, Memory, Suggestion, MemoryType, Profile } from '../types';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

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
  isAdmin: boolean;
  addPerson: (person: Partial<Person>, relativeId?: string, relType?: string) => Promise<string | undefined>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  addMemory: (personId: string, content: string, type: MemoryType, imageUrl?: string) => Promise<void>;
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'status'>) => Promise<void>;
  addRelationship: (personId: string, relatedId: string, type: string) => Promise<void>;
  resolveSuggestion: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  resolveAllSuggestions: (status: 'approved' | 'rejected') => Promise<void>;
  toggleReaction: (memoryId: string) => Promise<void>;
  refreshData: (silent?: boolean) => Promise<void>;
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

  const isAdmin = user?.email === ADMIN_EMAIL;

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    console.log("[FamilyContext] --- START FETCHING ARCHIVE DATA ---");
    
    try {
      console.log("[FamilyContext] Fetching people and memories...");
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*, memories(*)');
      
      if (peopleError) throw peopleError;
      console.log(`[FamilyContext] Loaded ${peopleData?.length || 0} people.`);

      console.log("[FamilyContext] Fetching suggestions...");
      const { data: suggestionsData } = await supabase
        .from('suggestions')
        .select('*')
        .eq('status', 'pending');

      console.log("[FamilyContext] Fetching profiles...");
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const profileMap: Record<string, Profile> = {};
      (profilesData || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
      console.log(`[FamilyContext] Mapped ${Object.keys(profileMap).length} user profiles.`);

      console.log("[FamilyContext] Fetching reactions...");
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('*');

      const reactionMap: Record<string, string[]> = {};
      (reactionsData || []).forEach((r: any) => {
        if (!reactionMap[r.memory_id]) reactionMap[r.memory_id] = [];
        reactionMap[r.memory_id].push(r.user_id);
      });
      setReactions(reactionMap);

      console.log("[FamilyContext] Fetching relationships...");
      const { data: relData } = await supabase
        .from('relationships')
        .select('*');
      setRelationships(relData || []);
      console.log(`[FamilyContext] Loaded ${relData?.length || 0} relationships.`);

      console.log("[FamilyContext] Mapping data to application types...");
      const mappedPeople: Person[] = (peopleData || []).map((p: any) => ({
        id: p.id,
        familyId: p.family_id,
        name: p.name,
        maidenName: p.maiden_name,
        gender: p.gender,
        isLiving: p.is_living,
        birthYear: p.birth_year,
        birthDate: p.birth_date,
        birthPlace: p.birth_place,
        deathYear: p.death_year,
        deathDate: p.death_date,
        deathPlace: p.death_place,
        occupation: p.occupation,
        vibeSentence: p.vibe_sentence,
        personalityTags: p.personality_tags || [],
        photoUrl: p.photo_url,
        createdByEmail: p.created_by_email,
        userId: p.user_id,
        inviteToken: p.invite_token,
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
      
      console.log("[FamilyContext] Data mapping complete. State updated.");
    } catch (error: any) {
      console.error("[FamilyContext] CRITICAL ERROR fetching data:", error.message);
      toast.error("Failed to load family archive.");
    } finally {
      if (!silent) setLoading(false);
      console.log("[FamilyContext] --- FETCH CYCLE COMPLETE ---");
    }
  }, []);

  useEffect(() => {
    console.log("[FamilyContext] Initializing Auth listener...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[FamilyContext] Initial session check:", session ? `User: ${session.user.email}` : "No session");
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[FamilyContext] Auth state changed: ${event}`, session ? `User: ${session.user.email}` : "No session");
      setUser(session?.user ?? null);
    });

    fetchData();

    return () => {
      console.log("[FamilyContext] Cleaning up Auth listener.");
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const addPerson = useCallback(async (newPerson: Partial<Person>, relativeId?: string, relType?: string) => {
    if (!user) return;
    console.log("[FamilyContext] Adding new person:", newPerson.name);
    try {
      const { data: person, error } = await supabase
        .from('people')
        .insert([{
          name: newPerson.name,
          gender: newPerson.gender,
          maiden_name: newPerson.maidenName,
          is_living: newPerson.isLiving !== false,
          birth_year: newPerson.birthYear,
          birth_date: newPerson.birthDate || null,
          birth_place: newPerson.birthPlace,
          vibe_sentence: newPerson.vibeSentence || "",
          personality_tags: newPerson.personalityTags,
          photo_url: newPerson.photoUrl,
          created_by_email: user.email,
        }])
        .select()
        .single();

      if (error) throw error;
      console.log("[FamilyContext] Person created with ID:", person.id);

      if (relativeId && relType && person) {
        console.log(`[FamilyContext] Creating relationship: ${person.id} is ${relType} of ${relativeId}`);
        await supabase.from('relationships').insert({
          person_id: person.id,
          related_person_id: relativeId,
          relationship_type: relType.toLowerCase()
        });
      }

      fetchData(true);
      return person.id;
    } catch (error: any) {
      console.error("[FamilyContext] Error adding person:", error.message);
      toast.error("Failed to add person: " + error.message);
    }
  }, [fetchData, user]);

  const updatePerson = useCallback(async (id: string, updates: Partial<Person>) => {
    if (!user) return;
    console.log(`[FamilyContext] Updating person ${id}:`, updates);
    try {
      const { error } = await supabase
        .from('people')
        .update({
          name: updates.name,
          birth_year: updates.birthYear,
          birth_date: updates.birthDate || null,
          birth_place: updates.birthPlace,
          death_year: updates.deathYear,
          death_date: updates.deathDate || null,
          death_place: updates.deathPlace,
          occupation: updates.occupation,
          vibe_sentence: updates.vibeSentence,
          personality_tags: updates.personalityTags,
          photo_url: updates.photoUrl,
          is_living: updates.isLiving,
          gender: updates.gender,
          maiden_name: updates.maidenName
        })
        .eq('id', id);

      if (error) throw error;
      console.log("[FamilyContext] Update successful.");
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error updating person:", error.message);
      toast.error("Failed to update: " + error.message);
    }
  }, [fetchData, user]);

  const deletePerson = useCallback(async (id: string) => {
    if (!user) return;
    console.log(`[FamilyContext] Deleting person ${id}`);
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log("[FamilyContext] Deletion successful.");
      toast.success("Person removed from archive.");
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error deleting person:", error.message);
      toast.error("Failed to delete: " + error.message);
    }
  }, [fetchData, user]);

  const addMemory = useCallback(async (personId: string, content: string, type: MemoryType, imageUrl?: string) => {
    if (!user) return;
    console.log(`[FamilyContext] Adding ${type} memory for ${personId}`);
    try {
      const { error } = await supabase
        .from('memories')
        .insert([{
          person_id: personId === 'general' ? null : personId,
          content,
          type,
          image_url: imageUrl,
          created_by_email: user.email,
          user_id: user.id
        }]);

      if (error) throw error;
      console.log("[FamilyContext] Memory saved.");
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error adding memory:", error.message);
      toast.error("Failed to save story: " + error.message);
    }
  }, [fetchData, user]);

  const toggleReaction = useCallback(async (memoryId: string) => {
    if (!user) return;
    const userReactions = reactions[memoryId] || [];
    const hasReacted = userReactions.includes(user.id);
    console.log(`[FamilyContext] Toggling reaction for memory ${memoryId}. Current state: ${hasReacted}`);

    try {
      if (hasReacted) {
        await supabase
          .from('reactions')
          .delete()
          .eq('memory_id', memoryId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('reactions')
          .upsert({ memory_id: memoryId, user_id: user.id }, { onConflict: 'memory_id,user_id' });
      }
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Reaction error:", error.message);
    }
  }, [user, reactions, fetchData]);

  const addSuggestion = useCallback(async (s: Omit<Suggestion, 'id' | 'status'>) => {
    if (!user) return;
    console.log(`[FamilyContext] Adding suggestion for ${s.personId}: ${s.fieldName}`);
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
      console.log("[FamilyContext] Suggestion sent.");
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error adding suggestion:", error.message);
      toast.error("Failed to send suggestion: " + error.message);
    }
  }, [fetchData, user]);

  const addRelationship = useCallback(async (personId: string, relatedId: string, type: string) => {
    if (!user) return;
    console.log(`[FamilyContext] Adding relationship: ${personId} is ${type} of ${relatedId}`);
    try {
      const { error } = await supabase
        .from('relationships')
        .insert({
          person_id: personId,
          related_person_id: relatedId,
          relationship_type: type.toLowerCase()
        });
      if (error) throw error;
      console.log("[FamilyContext] Relationship added.");
      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error adding relationship:", error.message);
      toast.error("Failed to add relationship: " + error.message);
    }
  }, [user, fetchData]);

  const resolveSuggestion = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    console.log(`[FamilyContext] Resolving suggestion ${id} as ${status}`);
    try {
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) {
        console.warn("[FamilyContext] Suggestion not found in local state.");
        return;
      }

      setSuggestions(prev => prev.filter(s => s.id !== id));

      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      if (status === 'approved') {
        console.log(`[FamilyContext] Applying approved suggestion: ${suggestion.fieldName}`);
        if (suggestion.fieldName === 'link_existing') {
          const match = suggestion.suggestedValue.match(/LINK_EXISTING: (.+) as (.+) to (.+)/);
          if (match) {
            const targetId = match[1];
            const relType = match[2].toLowerCase();
            const personId = match[3];

            await supabase.from('relationships').insert({
              person_id: targetId,
              related_person_id: personId,
              relationship_type: relType
            });
          }
        } else if (suggestion.fieldName === 'new_relationship') {
          const match = suggestion.suggestedValue.match(/^(.+)\s\((.+)\)/);
          if (match) {
            const name = match[1];
            const type = match[2];

            const { data: newPerson, error: pErr } = await supabase
              .from('people')
              .insert({
                name,
                vibe_sentence: "",
                personality_tags: [type],
                created_by_email: suggestion.suggestedByEmail
              })
              .select()
              .single();

            if (pErr) throw pErr;

            await supabase.from('relationships').insert({
              person_id: newPerson.id,
              related_person_id: suggestion.personId,
              relationship_type: type.toLowerCase()
            });
          }
        } else {
          const { error: personError } = await supabase
            .from('people')
            .update({ [suggestion.fieldName]: suggestion.suggestedValue })
            .eq('id', suggestion.personId);
          
          if (personError) throw personError;
        }
      }

      fetchData(true);
    } catch (error: any) {
      console.error("[FamilyContext] Error resolving suggestion:", error.message);
      toast.error("Failed to resolve suggestion: " + error.message);
      fetchData(true);
    }
  }, [suggestions, people, fetchData]);

  const resolveAllSuggestions = useCallback(async (status: 'approved' | 'rejected') => {
    const pending = suggestions.filter(s => s.status === 'pending');
    if (pending.length === 0) return;

    console.log(`[FamilyContext] Resolving ALL (${pending.length}) suggestions as ${status}`);
    const toastId = toast.loading(`Processing ${pending.length} suggestions...`);
    
    try {
      for (const s of pending) {
        await resolveSuggestion(s.id, status);
      }
      toast.success(`All suggestions ${status === 'approved' ? 'approved' : 'skipped'}!`, { id: toastId });
    } catch (error: any) {
      console.error("[FamilyContext] Error resolving all suggestions:", error.message);
      toast.error("Failed to process all suggestions.", { id: toastId });
    }
  }, [suggestions, resolveSuggestion]);

  return (
    <FamilyContext.Provider value={{ 
      people, 
      suggestions, 
      profiles,
      reactions,
      relationships,
      loading,
      user,
      isAdmin,
      addPerson, 
      updatePerson,
      deletePerson,
      addMemory, 
      addSuggestion, 
      addRelationship,
      resolveSuggestion,
      resolveAllSuggestions,
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