import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserPlus, History, CheckCircle2, Heart, Skull } from 'lucide-react';
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
      <DialogContent className="sm:max-w-lg rounded-[3rem] border-none bg-white p-10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <History className="w-8 h-8" />
            </div>
            <DialogTitle className="text-3xl text-stone-800">
              Add to Family
            </DialogTitle>
          </div>
          <DialogDescription className="text-stone-500">
            Tell us who this person is and how they fit into our story.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Living Status Toggle */}
          <div className="flex items-center justify-between p-5 bg-stone-50 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                isLiving ? "bg-red-50 text-red-500" : "bg-stone-200 text-stone-500"
              )}>
                {isLiving ? <Heart className="w-5 h-5 fill-current" /> : <Skull className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <Label className="text-lg font-serif font-bold text-stone-800">Living Status</Label>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">
                  {isLiving ? "Currently with us" : "In our memories"}
                </p>
              </div>
            </div>
            <Switch 
              checked={isLiving} 
              onCheckedChange={setIsLiving} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-lg font-bold text-stone-600">Name</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aunt Martha"
                className="h-16 bg-stone-50 border-2 border-stone-100 rounded-2xl text-xl px-6"
              />
            </div>
            <div className="space-y-3">
              <label className="text-lg font-bold text-stone-600">Gender</label>
              <Select onValueChange={setGender} value={gender}>
                <SelectTrigger className="h-16 bg-stone-50 border-2 border-stone-100 rounded-2xl text-xl px-6">
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

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-lg font-bold text-stone-600">They are the...</label>
              <Select onValueChange={setRelationship} value={relationship}>
                <SelectTrigger className="h-16 bg-stone-50 border-2 border-stone-100 rounded-2xl text-xl px-6">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {RELATIONSHIPS.map(r => (
                    <SelectItem key={r} value={r} className="text-lg py-3">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-lg font-bold text-stone-600">...of who?</label>
              <Select onValueChange={setRelatedToId} value={relatedToId}>
                <SelectTrigger className="h-16 bg-stone-50 border-2 border-stone-100 rounded-2xl text-xl px-6">
                  <SelectValue placeholder="Select family member" />
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

          <div className="pt-6 space-y-4">
            <Button 
              className="w-full h-20 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-2xl font-bold gap-3"
              onClick={handleSave}
            >
              <CheckCircle2 className="w-7 h-7" />
              Add to Archive
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-12 text-stone-400 text-lg"
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