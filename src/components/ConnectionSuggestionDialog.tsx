"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserPlus, Sparkles, Heart } from 'lucide-react';
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
  const { addSuggestion } = useFamily();
  const [relativeName, setRelativeName] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSubmit = async () => {
    if (!relativeName || !relationship) return;

    await addSuggestion({
      personId: person.id,
      fieldName: 'new_relationship',
      suggestedValue: `${relativeName} (${relationship})`,
      suggestedByEmail: 'family@kindred.com'
    });

    toast.success(`Suggestion for ${relativeName} sent to the family inbox!`, {
      icon: <Heart className="w-4 h-4 text-red-500 fill-current" />
    });
    setIsOpen(false);
    setRelativeName('');
    setRelationship('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all">
          <UserPlus className="w-4 h-4" /> Suggest a Relative
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-50 p-10">
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
          <p className="text-stone-500 text-lg leading-relaxed italic">
            Who is missing from {person.name.split(' ')[0]}'s story? Suggest a relative and the family will review it.
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Relative's Name</label>
              <Input 
                value={relativeName}
                onChange={(e) => setRelativeName(e.target.value)}
                placeholder="e.g. Aunt Martha"
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