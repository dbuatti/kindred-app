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
    try {
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*, memories(*)');
      
      if (peopleError) throw peopleError;

      const { data: suggestionsData } = await supabase
        .from('suggestions')
        .select('*')
        .eq('status', 'pending');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const profileMap: Record<string, Profile> = {};
      (profilesData || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);

      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('*');

      const reactionMap: Record<string, string[]> = {};
      (reactionsData || []).forEach((r: any) => {
        if (!reactionMap[r.memory_id]) reactionMap[r.memory_id] = [];
        reactionMap[r.memory_id].push(r.user_id);
      });
      setReactions(reactionMap);

      const { data: relData } = await supabase
        .from('relationships')
        .select('*');
      setRelationships(relData || []);

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
    } catch (error: any) {
      console.error("[FamilyContext] Error fetching data:", error.message);
    } finally {
      if (!silent) setLoading(false);
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

  const addPerson = useCallback(async (newPerson: Partial<Person>, relativeId?: string, relType?: string) => {
    if (!user) return;
    try {
      const { data: person, error } = await supabase
        .from('people')
        .insert([{
          name: newPerson.name,
          birth_year: newPerson.birthYear,
          birth_place: newPerson.birthPlace,
          vibe_sentence: newPerson.vibeSentence,
          personality_tags: newPerson.personalityTags,
          photo_url: newPerson.photoUrl,
          created_by_email: user.email,
        }])
        .select()
        .single();

      if (error) throw error;

      if (relativeId && relType && person) {
        await supabase.from('relationships').insert({
          person_id: relativeId,
          related_person_id: person.id,
          relationship_type: relType.toLowerCase()
        });
      }

      fetchData(true);
      return person.id;
    } catch (error: any) {
      toast.error("Failed to add person: " + error.message);
    }
  }, [fetchData, user]);

  const updatePerson = useCallback(async (id: string, updates: Partial<Person>) => {
    if (!user) return;
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
      fetchData(true);
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    }
  }, [fetchData, user]);

  const deletePerson = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Person removed from archive.");
      fetchData(true);
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  }, [fetchData, user]);

  const addMemory = useCallback(async (personId: string, content: string, type: MemoryType, imageUrl?: string) => {
    if (!user) return;
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
      fetchData(true);
    } catch (error: any) {
      toast.error("Failed to save story: " + error.message);
    }
  }, [fetchData, user]);

  const toggleReaction = useCallback(async (memoryId: string) => {
    if (!user) return;
    const userReactions = reactions[memoryId] || [];
    const hasReacted = userReactions.includes(user.id);

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
      fetchData(true);
    } catch (error: any) {
      toast.error("Failed to send suggestion: " + error.message);
    }
  }, [fetchData, user]);

  const addRelationship = useCallback(async (personId: string, relatedId: string, type: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('relationships')
        .insert({
          person_id: personId,
          related_person_id: relatedId,
          relationship_type: type.toLowerCase()
        });
      if (error) throw error;
      fetchData(true);
    } catch (error: any) {
      toast.error("Failed to add relationship: " + error.message);
    }
  }, [user, fetchData]);

  const resolveSuggestion = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    try {
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) return;

      // Optimistic UI: Remove from local state immediately
      setSuggestions(prev => prev.filter(s => s.id !== id));

      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      if (status === 'approved') {
        if (suggestion.fieldName === 'link_existing') {
          const match = suggestion.suggestedValue.match(/LINK_EXISTING: (.+) as (.+) to (.+)/);
          if (match) {
            const targetId = match[1];
            const relType = match[2].toLowerCase();
            const personId = match[3];

            await supabase.from('relationships').insert({
              person_id: personId,
              related_person_id: targetId,
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

            const { data: existingRel } = await supabase
              .from('relationships')
              .select('id')
              .eq('person_id', suggestion.personId)
              .eq('related_person_id', newPerson.id)
              .eq('relationship_type', type.toLowerCase())
              .maybeSingle();

            if (!existingRel) {
              await supabase.from('relationships').insert({
                person_id: suggestion.personId,
                related_person_id: newPerson.id,
                relationship_type: type.toLowerCase()
              });
            }

            const lines = suggestion.suggestedValue.split('\n');
            for (const line of lines) {
              const infMatch = line.match(/- Is .+\sthe\s(.+)\sof\s(.+)\?\s\(Yes\)/);
              if (infMatch) {
                const infRole = infMatch[1];
                const targetName = infMatch[2];
                const target = people.find(p => p.name === targetName);
                
                if (target) {
                  const { data: existingInf } = await supabase
                    .from('relationships')
                    .select('id')
                    .eq('person_id', target.id)
                    .eq('related_person_id', newPerson.id)
                    .eq('relationship_type', infRole.toLowerCase())
                    .maybeSingle();

                  if (!existingInf) {
                    await supabase.from('relationships').insert({
                      person_id: target.id,
                      related_person_id: newPerson.id,
                      relationship_type: infRole.toLowerCase()
                    });
                  }
                }
              }
            }
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
      toast.error("Failed to resolve suggestion: " + error.message);
      fetchData(true); // Revert on error
    }
  }, [suggestions, people, fetchData]);

  const resolveAllSuggestions = useCallback(async (status: 'approved' | 'rejected') => {
    const pending = suggestions.filter(s => s.status === 'pending');
    if (pending.length === 0) return;

    const toastId = toast.loading(`Processing ${pending.length} suggestions...`);
    
    try {
      // Process sequentially to handle complex relationship logic correctly
      for (const s of pending) {
        await resolveSuggestion(s.id, status);
      }
      toast.success(`All suggestions ${status === 'approved' ? 'approved' : 'skipped'}!`, { id: toastId });
    } catch (error: any) {
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