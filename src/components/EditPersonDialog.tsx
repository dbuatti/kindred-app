"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Edit3, Save, Trash2, Heart, Skull, Users, Plus, X, UserPlus } from 'lucide-react';
import { Person } from '../types';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { cn } from '@/lib/utils';

interface EditPersonDialogProps {
  person: Person;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const RELATIONSHIP_OPTIONS = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Spouse", value: "spouse" },
  { label: "Son", value: "son" },
  { label: "Daughter", value: "daughter" },
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" }
];

const EditPersonDialog = ({ person, trigger, open: externalOpen, onOpenChange: setExternalOpen }: EditPersonDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { updatePerson, deletePerson, relationships, people, addRelationship } = useFamily();
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

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

  const [newRelType, setNewRelType] = useState('');
  const [newRelTargetId, setNewRelTargetId] = useState('');

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

  const currentRels = useMemo(() => {
    return relationships
      .filter(r => r.person_id === person.id || r.related_person_id === person.id)
      .map(r => {
        const isPrimary = r.person_id === person.id;
        const targetId = isPrimary ? r.related_person_id : r.person_id;
        const target = people.find(p => p.id === targetId);
        return {
          id: r.id,
          targetName: target?.name || 'Unknown',
          type: r.relationship_type
        };
      });
  }, [relationships, person.id, people]);

  const otherPeople = useMemo(() => {
    return people.filter(p => p.id !== person.id);
  }, [people, person.id]);

  const handleSave = async () => {
    if (!formData.name) return;
    await updatePerson(person.id, formData);
    toast.success("Changes saved to the archive.");
    setIsOpen(false);
  };

  const handleAddRelationship = async () => {
    if (!newRelType || !newRelTargetId) return;
    await addRelationship(person.id, newRelTargetId, newRelType);
    setNewRelType('');
    setNewRelTargetId('');
    toast.success("Relationship added!");
  };

  const handleDelete = async () => {
    await deletePerson(person.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none bg-white p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl text-stone-800">Edit Entry</DialogTitle>
            <DialogDescription className="text-stone-500">
              Update the official record for {person.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Status Toggle */}
            <div className="flex items-center justify-between p-5 bg-stone-50 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                  formData.isLiving ? "bg-red-50 text-red-500" : "bg-stone-200 text-stone-500"
                )}>
                  {formData.isLiving ? <Heart className="w-5 h-5 fill-current" /> : <Skull className="w-5 h-5" />}
                </div>
                <div className="space-y-0.5">
                  <Label className="text-lg font-serif font-bold text-stone-800">Living Status</Label>
                  <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">
                    {formData.isLiving ? "Currently with us" : "In our memories"}
                  </p>
                </div>
              </div>
              <Switch 
                checked={formData.isLiving} 
                onCheckedChange={(val) => setFormData({...formData, isLiving: val})} 
              />
            </div>

            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                <Edit3 className="w-3 h-3" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Full Name</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Maiden Name</label>
                  <Input 
                    value={formData.maidenName}
                    onChange={(e) => setFormData({...formData, maidenName: e.target.value})}
                    placeholder="Optional"
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Birth Year</label>
                  <Input 
                    value={formData.birthYear}
                    onChange={(e) => setFormData({...formData, birthYear: e.target.value})}
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Birth Place</label>
                  <Input 
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>

              {!formData.isLiving && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Death Year</label>
                    <Input 
                      value={formData.deathYear}
                      onChange={(e) => setFormData({...formData, deathYear: e.target.value})}
                      className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Death Place</label>
                    <Input 
                      value={formData.deathPlace}
                      onChange={(e) => setFormData({...formData, deathPlace: e.target.value})}
                      className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Occupation</label>
                <Input 
                  value={formData.occupation}
                  onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                  className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Vibe / Bio</label>
                <Textarea 
                  value={formData.vibeSentence}
                  onChange={(e) => setFormData({...formData, vibeSentence: e.target.value})}
                  className="bg-stone-50 border-none rounded-2xl min-h-[100px] text-base font-serif p-4 focus-visible:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Relationships Section */}
            <div className="space-y-6 pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                <Users className="w-3 h-3" /> Family Connections
              </h3>
              
              <div className="space-y-3">
                {currentRels.map(rel => (
                  <div key={rel.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-stone-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-700">{rel.targetName}</p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{rel.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 space-y-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-3 h-3" /> Add New Connection
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select onValueChange={setNewRelType} value={newRelType}>
                    <SelectTrigger className="bg-white border-none rounded-xl h-10 text-sm">
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {RELATIONSHIP_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={setNewRelTargetId} value={newRelTargetId}>
                    <SelectTrigger className="bg-white border-none rounded-xl h-10 text-sm">
                      <SelectValue placeholder="Select Person" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {otherPeople.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddRelationship}
                  disabled={!newRelType || !newRelTargetId}
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest gap-2"
                >
                  <Plus className="w-3 h-3" /> Add Connection
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-stone-50 border-t border-stone-100 flex flex-col gap-3">
          <Button 
            className="w-full h-14 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-lg font-bold gap-2 shadow-lg"
            onClick={handleSave}
          >
            <Save className="w-5 h-5" /> Save Changes
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full h-10 text-red-400 hover:text-red-600 hover:bg-red-50 gap-2 text-xs font-bold uppercase tracking-widest">
                <Trash2 className="w-3 h-3" /> Delete Entry
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] border-none p-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-serif">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-stone-500 text-lg">
                  This will permanently remove {person.name} and all their associated memories from the family archive.
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
      </DialogContent>
    </Dialog>
  );
};

export default EditPersonDialog;