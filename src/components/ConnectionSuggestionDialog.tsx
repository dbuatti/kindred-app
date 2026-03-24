"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { UserPlus, Sparkles, Heart, HelpCircle, Link2, Search, Info, CheckCircle2 } from 'lucide-react';
import { Person } from '../types';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';

interface ConnectionSuggestionDialogProps {
  person: Person;
}

const RELATIONSHIPS = [
  "Mother", "Father", "Sister", "Brother", "Grandmother", "Grandfather", "Aunt", "Uncle", "Cousin", "Spouse", "Daughter", "Son"
];

const ConnectionSuggestionDialog = ({ person }: ConnectionSuggestionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addSuggestion, addRelationship, addPerson, isAdmin, relationships, people, user } = useFamily();
  
  const [relativeName, setRelativeName] = useState('');
  const [relationship, setRelationship] = useState('');
  
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [existingRelationship, setExistingRelationship] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [confirmedInferences, setConfirmedInferences] = useState<Record<string, boolean>>({});

  const otherPeople = useMemo(() => {
    return people
      .filter(p => p.id !== person.id)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [people, person, searchQuery]);

  const selectedPersonName = useMemo(() => {
    return people.find(p => p.id === selectedPersonId)?.name || '';
  }, [people, selectedPersonId]);

  const smartInferences = useMemo(() => {
    const name = relativeName || selectedPersonName;
    const rel = relationship || existingRelationship;
    
    if (!name || !rel || !person) return [];

    const inferences: { id: string; question: string; inferredRole: string; targetPersonName: string; targetId: string }[] = [];
    const relType = rel.toLowerCase();

    const myParents = Array.from(new Set(relationships
      .filter(r => {
        const type = r.relationship_type.toLowerCase();
        if (r.related_person_id === person.id && ['mother', 'father', 'parent'].includes(type)) return true;
        if (r.person_id === person.id && ['son', 'daughter', 'child'].includes(type)) return true;
        return false;
      })
      .map(r => r.related_person_id === person.id ? r.person_id : r.related_person_id)));

    if (relType === "brother" || relType === "sister") {
      myParents.forEach(parentId => {
        const parent = people.find(p => p.id === parentId);
        if (parent) {
          inferences.push({
            id: `sib-parent-${parent.id}`,
            question: `Is ${name} also a child of ${parent.name}?`,
            inferredRole: 'Child',
            targetPersonName: parent.name,
            targetId: parent.id
          });
        }
      });
    }

    return inferences;
  }, [relativeName, relationship, selectedPersonId, selectedPersonName, existingRelationship, person, relationships, people]);

  const handleSubmit = async () => {
    const name = relativeName || selectedPersonName;
    const rel = relationship || existingRelationship;
    
    if (!name || !rel) return;

    if (isAdmin) {
      if (selectedPersonId) {
        await addRelationship(selectedPersonId, person.id, rel);
        
        const confirmed = smartInferences.filter(inf => confirmedInferences[inf.id]);
        for (const inf of confirmed) {
          await addRelationship(selectedPersonId, inf.targetId, inf.inferredRole);
        }
      } else {
        const newId = await addPerson({ 
          name: relativeName, 
          personalityTags: [relationship],
          vibeSentence: ""
        }, person.id, relationship);

        if (newId) {
          const confirmed = smartInferences.filter(inf => confirmedInferences[inf.id]);
          for (const inf of confirmed) {
            await addRelationship(newId, inf.targetId, inf.inferredRole);
          }
        }
      }
      toast.success("Connection added directly.");
    } else {
      let finalValue = `${name} (${rel})`;
      
      if (selectedPersonId) {
        finalValue = `LINK_EXISTING: ${selectedPersonId} as ${rel} to ${person.id}`;
      }

      const confirmed = smartInferences.filter(inf => confirmedInferences[inf.id]);
      if (confirmed.length > 0) {
        finalValue += "\n\nAdditional Connections:";
        confirmed.forEach(inf => {
          finalValue += `\n- ${inf.question} (Yes) [Role: ${inf.inferredRole}] [Target: ${inf.targetId}]`;
        });
      }

      await addSuggestion({
        personId: person.id,
        fieldName: selectedPersonId ? 'link_existing' : 'new_relationship',
        suggestedValue: finalValue,
        suggestedByEmail: user?.email || 'family@kindred.com'
      });

      toast.success("Suggestion sent to the family inbox!");
    }

    setIsOpen(false);
    setRelativeName('');
    setRelationship('');
    setSelectedPersonId('');
    setExistingRelationship('');
    setSearchQuery('');
    setConfirmedInferences({});
  };

  const currentName = relativeName || selectedPersonName;
  const currentRel = relationship || existingRelationship;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all">
          <UserPlus className="w-4 h-4" /> Connect Someone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-50 p-10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-stone-800 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Connect to {person.name.split(' ')[0]}
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-lg">
            {isAdmin ? `Adding a connection directly to the archive.` : `Add a new relative or link someone already in the archive.`}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="new" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-stone-200/50 rounded-2xl p-1 h-14">
            <TabsTrigger value="new" className="rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Add New</TabsTrigger>
            <TabsTrigger value="existing" className="rounded-xl text-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Link Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6 py-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Relative's Name</label>
              <Input 
                value={relativeName}
                onChange={(e) => setRelativeName(e.target.value)}
                placeholder="e.g. Maria Rossi"
                className="bg-white border-stone-200 rounded-2xl h-14 text-lg px-6"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Relationship</label>
              <Select onValueChange={setRelationship} value={relationship}>
                <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg px-6">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {RELATIONSHIPS.map(r => (
                    <SelectItem key={r} value={r} className="text-lg py-3">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="existing" className="space-y-6 py-8">
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                <Input 
                  placeholder="Search family members..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white border-stone-200 rounded-2xl h-14 text-lg"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Select Person</label>
                <Select onValueChange={setSelectedPersonId} value={selectedPersonId}>
                  <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg px-6">
                    <SelectValue placeholder={otherPeople.length === 0 ? "No matches found" : "Choose from archive..."} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {otherPeople.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-lg py-3">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Relationship to {person.name.split(' ')[0]}</label>
                <Select onValueChange={setExistingRelationship} value={existingRelationship}>
                  <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg px-6">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {RELATIONSHIPS.map(r => (
                      <SelectItem key={r} value={r} className="text-lg py-3">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Relationship Preview Sentence */}
        {currentName && currentRel && (
          <div className="bg-white p-6 rounded-2xl border-2 border-amber-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm mb-8">
            <div className="flex-1">
              <p className="text-lg text-stone-800 leading-relaxed">
                <span className="font-bold text-amber-700">{currentName}</span> is the <span className="font-bold text-amber-700">{currentRel}</span> of <span className="font-bold text-amber-700">{person.name}</span>.
              </p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          </div>
        )}

        {smartInferences.length > 0 && (
          <div className="space-y-4 pb-8">
            <div className="flex items-center gap-2 text-amber-700">
              <HelpCircle className="w-5 h-5" />
              <h4 className="font-serif text-xl font-medium">Smart Follow-up</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-amber-100 space-y-4 shadow-sm">
              {smartInferences.map((inf) => (
                <div key={inf.id} className="flex items-start gap-4">
                  <Checkbox 
                    id={inf.id} 
                    checked={confirmedInferences[inf.id] || false}
                    onCheckedChange={(checked) => setConfirmedInferences(prev => ({ ...prev, [inf.id]: !!checked }))}
                    className="mt-1.5 h-5 w-5"
                  />
                  <label htmlFor={inf.id} className="text-stone-700 text-base font-medium cursor-pointer leading-tight">
                    {inf.question}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button 
            className="w-full h-20 rounded-[2rem] bg-stone-800 hover:bg-stone-900 text-white text-2xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleSubmit}
            disabled={!( (relativeName && relationship) || (selectedPersonId && existingRelationship) )}
          >
            {isAdmin ? "Add Connection" : "Send Suggestion"}
          </Button>
          <Button variant="ghost" className="w-full h-12 text-stone-400 text-lg" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionSuggestionDialog;