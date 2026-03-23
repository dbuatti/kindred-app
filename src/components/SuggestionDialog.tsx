import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit3, Sparkles } from 'lucide-react';
import { Person } from '../types';

interface SuggestionDialogProps {
  person: Person;
}

const SuggestionDialog = ({ person }: SuggestionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-stone-400 hover:text-amber-600 gap-2 text-sm font-light italic">
          <Edit3 className="w-4 h-4" /> I remember this slightly differently...
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl border-none bg-stone-50">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-stone-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Help us get it right
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-stone-500 text-sm leading-relaxed">
            Memories can be fuzzy. If you have a different detail for {person.name.split(' ')[0]}, 
            share it here. The family will see your suggestion.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-stone-400">What's the correction?</label>
              <Input 
                placeholder="e.g. He was born in 1927, not 1928"
                className="bg-white border-stone-200 rounded-xl h-12 focus-visible:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-stone-400">The story behind it (optional)</label>
              <Textarea 
                placeholder="How do you remember this?"
                className="bg-white border-stone-200 rounded-xl min-h-[100px] focus-visible:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="flex-1 rounded-xl text-stone-500"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-stone-800 hover:bg-stone-900 text-white"
              onClick={() => setIsOpen(false)}
            >
              Send Suggestion
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDialog;