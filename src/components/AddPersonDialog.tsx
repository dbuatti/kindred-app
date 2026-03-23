import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Plus, Sparkles, Mic, Heart, History, UserPlus } from 'lucide-react';
import { useVoiceInput } from '../hooks/use-voice';
import { useFamily } from '../context/FamilyContext.tsx';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RELATIONSHIPS = [
  "Parent", "Grandparent", "Great Grandparent", "Sibling", "Aunt/Uncle", "Cousin", "Spouse", "Child"
];

const SPIRIT_TAGS = [
  { label: "Storyteller", text: "They had a way of making every small event feel like an epic adventure." },
  { label: "Quiet Soul", text: "A gentle presence who spoke more with their eyes than with words." },
  { label: "Rebel", text: "Never one to follow the rules, they lived life entirely on their own terms." },
  { label: "Nurturer", text: "Their kitchen was the heart of the home, always smelling of warmth and spices." },
  { label: "Hard Worker", text: "They believed in the dignity of labor and the value of a promise kept." }
];

const AddPersonDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addPerson } = useFamily();
  const { isListening, transcript, setTranscript, startListening } = useVoiceInput();
  
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [isLiving, setIsLiving] = useState(false);

  const handleSpiritTag = (text: string) => {
    setTranscript(prev => prev ? `${prev}\n\n${text}` : text);
  };

  const handleSave = async () => {
    if (!name || !relationship) {
      toast.error("Please provide at least a name and their relationship to you.");
      return;
    }

    await addPerson({
      name,
      birthYear,
      birthPlace,
      relationshipType: relationship,
      isLiving,
      vibeSentence: transcript || `A beloved ${relationship.toLowerCase()} in our family tree.`,
      personalityTags: [relationship, isLiving ? "Living" : "Ancestor"],
      photoUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=400"
    });

    toast.success(`${name} has been added to the tree.`);
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setRelationship('');
    setBirthYear('');
    setBirthPlace('');
    setTranscript('');
    setIsLiving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-28 right-8 h-16 px-6 rounded-full shadow-2xl bg-stone-800 hover:bg-stone-900 text-white z-20 gap-3 group">
          <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Add to Tree</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none bg-stone-50 p-0 overflow-hidden">
        <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <History className="w-5 h-5" />
              </div>
              <DialogTitle className="font-serif text-3xl text-stone-800">
                Growing the Tree
              </DialogTitle>
            </div>
            <p className="text-stone-500 italic">Who are we remembering today?</p>
          </DialogHeader>

          <div className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Full Name</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Martha 'Nana' Miller"
                  className="bg-white border-stone-200 rounded-2xl h-14 text-lg focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Relationship</label>
                <Select onValueChange={setRelationship} value={relationship}>
                  <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg focus:ring-amber-500/20">
                    <SelectValue placeholder="Who are they?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-stone-100">
                    {RELATIONSHIPS.map(r => (
                      <SelectItem key={r} value={r} className="rounded-xl">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Roots */}
            <div className="bg-white p-6 rounded-[2rem] border border-stone-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="living-status" 
                    checked={isLiving} 
                    onCheckedChange={setIsLiving}
                    className="data-[state=checked]:bg-amber-600"
                  />
                  <Label htmlFor="living-status" className="text-stone-600 font-medium">Still with us</Label>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-300">Roots & Origins</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Birth Year</label>
                  <Input 
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="e.g. 1924"
                    className="bg-stone-50/50 border-stone-100 rounded-xl h-12 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Birth Place</label>
                  <Input 
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="e.g. Sicily, Italy"
                    className="bg-stone-50/50 border-stone-100 rounded-xl h-12 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Spirit & Vibe */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                  Their Spirit <Sparkles className="w-3 h-3 text-amber-500" />
                </label>
                <span className="text-[10px] text-stone-300 italic">Tap a tag to start the story</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {SPIRIT_TAGS.map(tag => (
                  <button
                    key={tag.label}
                    onClick={() => handleSpiritTag(tag.text)}
                    className="px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-100/50"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Textarea 
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="What was their essence? What will we always remember about them?"
                  className="bg-white border-stone-200 rounded-2xl min-h-[140px] p-5 text-lg font-serif leading-relaxed focus-visible:ring-amber-500/20"
                />
                <Button
                  onClick={startListening}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute bottom-4 right-4 rounded-full transition-all duration-500",
                    isListening ? "bg-red-100 text-red-600 animate-pulse scale-110" : "text-stone-400 hover:text-amber-600"
                  )}
                >
                  <Mic className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              variant="ghost" 
              className="flex-1 rounded-2xl text-stone-500 h-16 text-lg"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white h-16 text-lg font-medium shadow-lg shadow-stone-200"
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