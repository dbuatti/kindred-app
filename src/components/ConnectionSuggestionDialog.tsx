"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { UserPlus, Sparkles, Heart, HelpCircle, Info } from 'lucide-react';
import { Person } from '../types';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConnectionSuggestionDialogProps {
  person: Person;
}

const RELATIONSHIPS = [
  "Mother", "Father", "Sister", "Brother", "Grandmother", "Grandfather", "Aunt", "Uncle", "Cousin", "Spouse", "Daughter", "Son"
];

const ConnectionSuggestionDialog = ({ person }: ConnectionSuggestionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addSuggestion, relationships, people } = useFamily();
  const [relativeName, setRelativeName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [confirmedInferences, setConfirmedInferences] = useState<Record<string, boolean>>({});

  // Smart Inference Logic
  const smartInferences = useMemo(() => {
    if (!relativeName || !relationship || !person) return [];

    const inferences: { id: string; question: string; inferredRole: string; targetPersonName: string }[] = [];

    // If suggesting a Spouse for Alfred
    if (relationship === "Spouse") {
      // Find everyone who has Alfred as a Father or Mother
      const children = relationships
        .filter(r => (r.related_person_id === person.id) && (r.relationship_type === 'father' || r.relationship_type === 'mother'))
        .map(r => people.find(p => p.id === r.person_id))
        .filter(Boolean);

      children.forEach(child => {
        const role = person.personalityTags.includes('Father') || person.relationshipType === 'Father' ? 'Mother' : 'Father';
        inferences.push({
          id: `spouse-child-${child!.id}`,
          question: `Is ${relativeName} the ${role} of ${child!.name}?`,
          inferredRole: role,
          targetPersonName: child!.name
        });
      });
    }

    // If suggesting a Mother/Father for Alfred
    if (relationship === "Mother" || relationship === "Father") {
      // Find Alfred's siblings
      const siblings = relationships
        .filter(r => {
          // Find people who share a parent with Alfred
          const alfredParents = relationships.filter(rel => rel.person_id === person.id && (rel.relationship_type === 'mother' || rel.relationship_type === 'father'));
          const otherPersonParents = relationships.filter(rel => rel.person_id === r.person_id && (rel.relationship_type === 'mother' || rel.relationship_type === 'father'));
          return alfredParents.some(ap => otherPersonParents.some(op => op.related_person_id === ap.related_person_id)) && r.person_id !== person.id;
        })
        .map(r => people.find(p => p.id === r.person_id))
        .filter(Boolean);

      // Remove duplicates
      const uniqueSiblings = Array.from(new Set(siblings.map(s => s!.id))).map(id => siblings.find(s => s!.id === id));

      uniqueSiblings.forEach(sibling => {
        inferences.push({
          id: `parent-sibling-${sibling!.id}`,
          question: `Is ${relativeName} also the ${relationship} of ${sibling!.name}?`,
          inferredRole: relationship,
          targetPersonName: sibling!.name
        });
      });
    }

    return inferences;
  }, [relativeName, relationship, person, relationships, people]);

  const handleSubmit = async () => {
    if (!relativeName || !relationship) return;

    let finalValue = `${relativeName} (${relationship})`;
    
    // Append confirmed inferences to the suggestion
    const confirmed = smartInferences.filter(inf => confirmedInferences[inf.id]);
    if (confirmed.length > 0) {
      finalValue += "\n\nAdditional Connections:";
      confirmed.forEach(inf => {
        finalValue += `\n- ${inf.question} (Yes)`;
      });
    }

    await addSuggestion({
      personId: person.id,
      fieldName: 'new_relationship',
      suggestedValue: finalValue,
      suggestedByEmail: 'family@kindred.com'
    });

    toast.success(`Suggestion for ${relativeName} sent to the family inbox!`, {
      icon: <Heart className="w-4 h-4 text-red-500 fill-current" />
    });
    
    setIsOpen(false);
    setRelativeName('');
    setRelationship('');
    setConfirmedInferences({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all">
          <UserPlus className="w-4 h-4" /> Suggest a Relative
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-50 p-10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-stone-800 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Grow the Tree
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            Suggest a new family connection for {person.name.split(' ')[0]}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Relative's Name</label>
              <Input 
                value={relativeName}
                onChange={(e) => setRelativeName(e.target.value)}
                placeholder="e.g. Venna Buatti"
                className="bg-white border-stone-200 rounded-2xl h-14 text-lg focus-visible:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Relationship to {person.name.split(' ')[0]}</label>
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
          </div>

          {/* Smart Inferences Section */}
          {smartInferences.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-amber-700">
                <HelpCircle className="w-5 h-5" />
                <h4 className="font-serif text-lg font-medium">Smart Follow-up</h4>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-amber-100 space-y-4 shadow-sm">
                <p className="text-stone-500 text-sm italic leading-relaxed">
                  Based on our records, we noticed some potential connections:
                </p>
                <div className="space-y-3">
                  {smartInferences.map((inf) => (
                    <div key={inf.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                      <Checkbox 
                        id={inf.id} 
                        checked={confirmedInferences[inf.id] || false}
                        onCheckedChange={(checked) => setConfirmedInferences(prev => ({ ...prev, [inf.id]: !!checked }))}
                        className="mt-1 border-stone-300 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                      />
                      <label htmlFor={inf.id} className="text-stone-700 text-sm font-medium cursor-pointer leading-tight">
                        {inf.question}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              className="w-full h-16 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-xl font-bold"
              onClick={handleSubmit}
              disabled={!relativeName || !relationship}
            >
              Send Suggestion
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-12 text-stone-400"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionSuggestionDialog;