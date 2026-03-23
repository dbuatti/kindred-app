"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Edit3, Save, Trash2, AlertCircle, Heart, Skull } from 'lucide-react';
import { Person } from '../types';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface EditPersonDialogProps {
  person: Person;
  trigger?: React.ReactNode;
}

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Other", value: "other" }
];

const EditPersonDialog = ({ person, trigger }: EditPersonDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { updatePerson, deletePerson } = useFamily();
  
  const [formData, setFormData] = useState({
    name: person.name,
    maidenName: person.maidenName || '',
    gender: person.gender || '',
    birthYear: person.birthYear || '',
    birthPlace: person.birthPlace || '',
    deathYear: person.deathYear || '',
    deathPlace: person.deathPlace || '',
    isLiving: person.isLiving !== false,
    occupation: person.occupation || '',
    vibeSentence: person.vibeSentence || '',
    photoUrl: person.photoUrl || ''
  });

  useEffect(() => {
    setFormData({
      name: person.name,
      maidenName: person.maidenName || '',
      gender: person.gender || '',
      birthYear: person.birthYear || '',
      birthPlace: person.birthPlace || '',
      deathYear: person.deathYear || '',
      deathPlace: person.deathPlace || '',
      isLiving: person.isLiving !== false,
      occupation: person.occupation || '',
      vibeSentence: person.vibeSentence || '',
      photoUrl: person.photoUrl || ''
    });
  }, [person]);

  const handleSave = async () => {
    if (!formData.name) return;
    await updatePerson(person.id, formData);
    toast.success("Changes saved to the archive.");
    setIsOpen(false);
  };

  const handleDelete = async () => {
    await deletePerson(person.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full text-stone-400 hover:text-amber-600">
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] border-none bg-white p-10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-stone-800">Edit Entry</DialogTitle>
          <DialogDescription className="text-stone-500">
            Update the official record for {person.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="flex items-center gap-3">
              {formData.isLiving ? <Heart className="w-5 h-5 text-red-500 fill-current" /> : <Skull className="w-5 h-5 text-stone-400" />}
              <Label className="text-lg font-serif font-medium text-stone-800">This person is living</Label>
            </div>
            <Switch 
              checked={formData.isLiving} 
              onCheckedChange={(val) => setFormData({...formData, isLiving: val})} 
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Full Name</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-stone-50 border-none rounded-2xl h-14 text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Maiden Name</label>
                <Input 
                  value={formData.maidenName}
                  onChange={(e) => setFormData({...formData, maidenName: e.target.value})}
                  placeholder="Optional"
                  className="bg-stone-50 border-none rounded-2xl h-14 text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Birth Year</label>
                <Input 
                  value={formData.birthYear}
                  onChange={(e) => setFormData({...formData, birthYear: e.target.value})}
                  className="bg-stone-50 border-none rounded-2xl h-14 text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Birth Place</label>
                <Input 
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                  className="bg-stone-50 border-none rounded-2xl h-14 text-lg"
                />
              </div>
            </div>

            {!formData.isLiving && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Death Year</label>
                  <Input 
                    value={formData.deathYear}
                    onChange={(e) => setFormData({...formData, deathYear: e.target.value})}
                    className="bg-stone-50 border-none rounded-2xl h-14 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Death Place</label>
                  <Input 
                    value={formData.deathPlace}
                    onChange={(e) => setFormData({...formData, deathPlace: e.target.value})}
                    className="bg-stone-50 border-none rounded-2xl h-14 text-lg"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Occupation</label>
              <Input 
                value={formData.occupation}
                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                className="bg-stone-50 border-none rounded-2xl h-14 text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Vibe / Bio</label>
              <Textarea 
                value={formData.vibeSentence}
                onChange={(e) => setFormData({...formData, vibeSentence: e.target.value})}
                className="bg-stone-50 border-none rounded-2xl min-h-[100px] text-lg font-serif"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              className="w-full h-16 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-xl font-bold gap-2"
              onClick={handleSave}
            >
              <Save className="w-5 h-5" /> Save Changes
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full h-12 text-red-400 hover:text-red-600 hover:bg-red-50 gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Entry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem] border-none p-8">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-serif">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-stone-500 text-lg">
                    This will permanently remove {person.name} and all their associated memories from the family archive. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3">
                  <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPersonDialog;