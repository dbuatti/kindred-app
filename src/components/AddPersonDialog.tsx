import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserPlus, History, CheckCircle2 } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';

const RELATIONSHIPS = [
  "Parent", "Grandparent", "Great Grandparent", "Sibling", "Aunt/Uncle", "Cousin", "Spouse", "Child"
];

const AddPersonDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addPerson } = useFamily();
  
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSave = async () => {
    if (!name || !relationship) {
      toast.error("Please enter a name and relationship.");
      return;
    }

    await addPerson({
      name,
      relationshipType: relationship,
      vibeSentence: `A beloved ${relationship.toLowerCase()} in our family.`,
      personalityTags: [relationship],
      photoUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=400"
    });

    toast.success(`${name} added!`);
    setIsOpen(false);
    setName('');
    setRelationship('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-24 px-10 rounded-full shadow-2xl bg-stone-800 hover:bg-stone-900 text-white text-xl font-bold gap-4 border-4 border-white">
          <UserPlus className="w-8 h-8" />
          Add Someone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-[3rem] border-none bg-white p-10">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <History className="w-8 h-8" />
            </div>
            <DialogTitle className="text-3xl text-stone-800">
              Add to Family
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="space-y-3">
            <label className="text-lg font-bold text-stone-600">Name or Nickname</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aunt Martha or Grandpa Joe"
              className="h-16 bg-stone-50 border-2 border-stone-100 rounded-2xl text-xl px-6"
            />
            <p className="text-sm text-stone-400 italic">Just a first name is fine if you don't know the rest.</p>
          </div>

          <div className="space-y-3">
            <label className="text-lg font-bold text-stone-600">Who are they to you?</label>
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