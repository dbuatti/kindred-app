import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserPlus, History, CheckCircle2, Heart, Skull, Info, ArrowRight } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddPersonDialogProps {
  trigger?: React.ReactNode;
  initialRelationship?: string;
  initialRelatedToId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const RELATIONSHIPS = [
  "Mother", "Father", "Grandmother", "Grandfather", "Great Grandparent", "Sister", "Brother", "Aunt", "Uncle", "Cousin", "Spouse", "Daughter", "Son"
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Other", value: "other" }
];

const AddPersonDialog = ({ 
  trigger, 
  initialRelationship = '', 
  initialRelatedToId = '',
  open: externalOpen,
  onOpenChange: setExternalOpen
}: AddPersonDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { addPerson, people, user } = useFamily();
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [relationship, setRelationship] = useState(initialRelationship);
  const [relatedToId, setRelatedToId] = useState<string>(initialRelatedToId);

  const myPerson = useMemo(() => {
    return people.find(p => p.userId === user?.id);
  }, [people, user]);

  const targetPerson = useMemo(() => {
    return people.find(p => p.id === relatedToId);
  }, [people, relatedToId]);

  useEffect(() => {
    if (isOpen) {
      setRelationship(initialRelationship);
      setRelatedToId(initialRelatedToId || (myPerson?.id || ''));
    }
  }, [isOpen, initialRelationship, initialRelatedToId, myPerson]);

  const handleSave = async () => {
    if (!name || !relationship || !relatedToId) {
      toast.error("Please fill in all fields.");
      return;
    }

    await addPerson({
      name,
      gender,
      isLiving,
      relationshipType: relationship,
      vibeSentence: "", 
      personalityTags: [relationship],
      photoUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=400"
    }, relatedToId, relationship);

    toast.success(`${name} added to the family!`);
    setIsOpen(false);
    setName('');
    setGender('');
    setRelationship('');
    setIsLiving(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none bg-white p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="flex flex-row items-center gap-4 space-y-0 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <UserPlus className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-3xl font-serif text-stone-800">
              Add to Family
            </DialogTitle>
            <DialogDescription className="text-stone-500 text-lg">
              Tell us who this person is and how they fit into our story.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-stone-50 rounded-3xl border border-stone-100">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                isLiving ? "bg-red-50 text-red-500" : "bg-stone-200 text-stone-500"
              )}>
                {isLiving ? <Heart className="w-6 h-6 fill-current" /> : <Skull className="w-6 h-6" />}
              </div>
              <div className="space-y-0.5">
                <Label className="text-xl font-serif font-bold text-stone-800">Living Status</Label>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">
                  {isLiving ? "Currently with us" : "In our memories"}
                </p>
              </div>
            </div>
            <Switch 
              checked={isLiving} 
              onCheckedChange={setIsLiving} 
              className="data-[state=checked]:bg-red-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Full Name</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aunt Martha"
                className="h-14 bg-white border-stone-200 rounded-2xl text-lg px-6 focus-visible:ring-amber-500/20"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Gender</label>
              <Select onValueChange={setGender} value={gender}>
                <SelectTrigger className="h-14 bg-white border-stone-200 rounded-2xl text-lg px-6 focus:ring-amber-500/20">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {GENDER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-lg py-3">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-amber-50/30 p-8 rounded-[2rem] border-2 border-amber-100/50 space-y-6">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Info className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Define Relationship</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-amber-700/60 ml-1">The new person is the...</label>
                <Select onValueChange={setRelationship} value={relationship}>
                  <SelectTrigger className="h-14 bg-white border-amber-200 rounded-2xl text-lg px-6 shadow-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {RELATIONSHIPS.map(r => (
                      <SelectItem key={r} value={r} className="text-lg py-3">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-amber-700/60 ml-1">...of this family member:</label>
                <Select onValueChange={setRelatedToId} value={relatedToId}>
                  <SelectTrigger className="h-14 bg-white border-amber-200 rounded-2xl text-lg px-6 shadow-sm">
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {people.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-lg py-3">
                        {p.name} {p.id === myPerson?.id ? "(You)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Relationship Preview Sentence */}
            {name && relationship && targetPerson && (
              <div className="bg-white p-6 rounded-2xl border border-amber-200 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <div className="flex-1">
                  <p className="text-lg text-stone-800 leading-relaxed">
                    <span className="font-bold text-amber-700">{name}</span> is the <span className="font-bold text-amber-700">{relationship}</span> of <span className="font-bold text-amber-700">{targetPerson.name}</span>.
                  </p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <Button 
              className="w-full h-20 rounded-[2rem] bg-stone-800 hover:bg-stone-900 text-white text-2xl font-bold gap-4 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleSave}
              disabled={!name || !relationship || !relatedToId}
            >
              <CheckCircle2 className="w-8 h-8" />
              Add to Archive
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-12 text-stone-400 text-lg font-medium hover:text-stone-600"
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

export default AddPersonDialog;