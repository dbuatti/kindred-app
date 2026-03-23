import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Sparkles, Mic } from 'lucide-react';
import { useVoiceInput } from '../hooks/use-voice';
import { useFamily } from '../context/FamilyContext.tsx';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AddPersonDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addPerson } = useFamily();
  const { isListening, transcript, setTranscript, startListening } = useVoiceInput();
  
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  const handleSave = () => {
    if (!name || !transcript) {
      toast.error("Please provide at least a name and a short description.");
      return;
    }

    addPerson({
      name,
      birthYear,
      birthPlace,
      vibeSentence: transcript,
      personalityTags: ["✨ new addition"],
      photoUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=400" // Placeholder
    });

    toast.success(`${name} has been added to the archive.`);
    setIsOpen(false);
    setName('');
    setBirthYear('');
    setBirthPlace('');
    setTranscript('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-28 right-8 h-14 w-14 rounded-full shadow-xl bg-stone-800 hover:bg-stone-900 text-white z-20">
          <Plus className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-3xl border-none bg-stone-50 p-0 overflow-hidden">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl text-stone-800">
              Who are we remembering?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Their Name</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Great Aunt Martha"
                className="bg-white border-stone-200 rounded-2xl h-14 text-lg focus-visible:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Birth Year</label>
                <Input 
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="e.g. Around 1920"
                  className="bg-white border-stone-200 rounded-2xl h-12 focus-visible:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Birth Place</label>
                <Input 
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="e.g. Dublin, Ireland"
                  className="bg-white border-stone-200 rounded-2xl h-12 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-medium uppercase tracking-widest text-stone-400 flex items-center gap-2">
                What were they like? <Sparkles className="w-3 h-3 text-amber-500" />
              </label>
              <div className="relative">
                <Textarea 
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Tell us a little about their spirit... (or tap the mic to speak)"
                  className="bg-white border-stone-200 rounded-2xl min-h-[120px] p-4 text-lg font-serif leading-relaxed focus-visible:ring-amber-500"
                />
                <Button
                  onClick={startListening}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute bottom-3 right-3 rounded-full transition-colors",
                    isListening ? "bg-amber-100 text-amber-600 animate-pulse" : "text-stone-400 hover:text-amber-600"
                  )}
                >
                  <Mic className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="ghost" 
              className="flex-1 rounded-2xl text-stone-500 h-14"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white h-14"
              onClick={handleSave}
            >
              Add to Archive
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPersonDialog;