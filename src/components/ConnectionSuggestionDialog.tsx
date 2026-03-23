"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { UserPlus, Sparkles, Heart, HelpCircle, Link2, Search } from 'lucide-react';
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
  const { addSuggestion, relationships, people, user } = useFamily();
  
  // State for "Add New" mode
  const [relativeName, setRelativeName] = useState('');
  const [relationship, setRelationship] = useState('');
  
  // State for "Link Existing" mode
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [existingRelationship, setExistingRelationship] = useState('');
  
  const [confirmedInferences, setConfirmedInferences] = useState<Record<string, boolean>>({});

  const otherPeople = useMemo(() => {
    return people.filter(p => p.id !== person.id);
  }, [people, person]);

  const smartInferences = useMemo(() => {
    const name = relativeName || (selectedPersonId ? people.find(p => p.id === selectedPersonId)?.name : '');
    const rel = relationship || existingRelationship;
    
    if (!name || !rel || !person) return [];

    const inferences: { id: string; question: string; inferredRole: string; targetPersonName: string; targetId: string }[] = [];
    const relType = rel.toLowerCase();

    // 1. SIBLING Inference: If linking a sibling, they share the same parents
    if (relType === "brother" || relType === "sister") {
      const parentRels = relationships.filter(r => r.person_id === person.id && (r.relationship_type === 'mother' || r.relationship_type === 'father'));
      parentRels.forEach(pr => {
        const parent = people.find(p => p.id === pr.related_person_id);
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

    // 2. COUSIN Inference: If adding a cousin, ask about the parent link (The "Missing Link" fix)
    if (relType === "cousin") {
      const myParents = relationships
        .filter(r => r.person_id === person.id && (r.relationship_type === 'mother' || r.relationship_type === 'father'))
        .map(r => people.find(p => p.id === r.related_person_id))
        .filter(Boolean);

      myParents.forEach(parent => {
        inferences.push({
          id: `cousin-parent-link-${parent!.id}`,
          question: `Is one of ${name}'s parents a brother or sister of ${parent!.name}?`,
          inferredRole: 'Sibling',
          targetPersonName: parent!.name,
          targetId: parent!.id
        });
      });
    }

    return inferences;
  }, [relativeName, relationship, selectedPersonId, existingRelationship, person, relationships, people]);

  const handleSubmit = async () => {
    const name = relativeName || people.find(p => p.id === selectedPersonId)?.name;
    const rel = relationship || existingRelationship;
    
    if (!name || !rel) return;

    let finalValue = `${name} (${rel})`;
    
    // If linking existing, we use a special format for the admin to process
    if (selectedPersonId) {
      finalValue = `LINK_EXISTING: ${selectedPersonId} as ${rel} to ${person.id}`;
    }

    const confirmed = smartInferences.filter(inf => confirmedInferences[inf.id]);
    if (confirmed.length > 0) {
      finalValue += "\n\nAdditional Connections:";
      confirmed.forEach(inf => {
        finalValue += `\n- ${inf.question} (Yes) [Target: ${inf.targetId}]`;
      });
    }

    await addSuggestion({
      personId: person.id,
      fieldName: selectedPersonId ? 'link_existing' : 'new_relationship',
      suggestedValue: finalValue,
      suggestedByEmail: user?.email || 'family@kindred.com'
    });

    toast.success("Suggestion sent to the family inbox!");
    setIsOpen(false);
    setRelativeName('');
    setRelationship('');
    setSelectedPersonId('');
    setExistingRelationship('');
    setConfirmedInferences({});
  };

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
          <DialogDescription className="text-stone-500">
            Add a new relative or link someone already in the archive.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="new" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-stone-100 rounded-2xl p-1 h-12">
            <TabsTrigger value="new" className="rounded-xl data-[state=active]:bg-white">Add New</TabsTrigger>
            <TabsTrigger value="existing" className="rounded-xl data-[state=active]:bg-white">Link Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Relative's Name</label>
              <Input 
                value={relativeName}
                onChange={(e) => setRelativeName(e.target.value)}
                placeholder="e.g. Maria Rossi"
                className="bg-white border-stone-200 rounded-2xl h-14 text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Relationship</label>
              <Select onValueChange={setRelationship} value={relationship}>
                <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg">
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

          <TabsContent value="existing" className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Select Person</label>
              <Select onValueChange={setSelectedPersonId} value={selectedPersonId}>
                <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg">
                  <SelectValue placeholder="Choose from archive..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {otherPeople.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-lg py-3">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Relationship to {person.name.split(' ')[0]}</label>
              <Select onValueChange={setExistingRelationship} value={existingRelationship}>
                <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg">
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
        </Tabs>

        {smartInferences.length > 0 && (
          <div className="space-y-4 pb-6">
            <div className="flex items-center gap-2 text-amber-700">
              <HelpCircle className="w-5 h-5" />
              <h4 className="font-serif text-lg font-medium">Smart Follow-up</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-amber-100 space-y-4 shadow-sm">
              {smartInferences.map((inf) => (
                <div key={inf.id} className="flex items-start gap-3">
                  <Checkbox 
                    id={inf.id} 
                    checked={confirmedInferences[inf.id] || false}
                    onCheckedChange={(checked) => setConfirmedInferences(prev => ({ ...prev, [inf.id]: !!checked }))}
                    className="mt-1"
                  />
                  <label htmlFor={inf.id} className="text-stone-700 text-sm font-medium cursor-pointer">
                    {inf.question}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button 
            className="w-full h-16 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-xl font-bold"
            onClick={handleSubmit}
            disabled={!( (relativeName && relationship) || (selectedPersonId && existingRelationship) )}
          >
            Send Suggestion
          </Button>
          <Button variant="ghost" className="w-full h-12 text-stone-400" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionSuggestionDialog;