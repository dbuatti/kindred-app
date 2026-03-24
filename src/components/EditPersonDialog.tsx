"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Edit3, 
  Save, 
  Trash2, 
  Heart, 
  Skull, 
  Users, 
  Plus, 
  UserPlus, 
  Camera, 
  Tag, 
  User,
  Sparkles,
  UserCheck,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Shield,
  Eye,
  Utensils,
  History
} from 'lucide-react';
import { Person } from '../types';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { cn } from '@/lib/utils';
import EducationManager from './person/EducationManager';

interface EditPersonDialogProps {
  person: Person;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Other", value: "other" }
];

const EditPersonDialog = ({ person, trigger, open: externalOpen, onOpenChange: setExternalOpen }: EditPersonDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { updatePerson, deletePerson, relationships, people, addRelationship, addPerson } = useFamily();
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

  // Split the name for the form
  const nameParts = person.name.split(' ');
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    nickname: person.nickname || '',
    middleName: person.middleName || '',
    maidenName: person.maidenName || '',
    gender: person.gender || '',
    birthYear: person.birthYear || '',
    birthDate: person.birthDate || '',
    birthPlace: person.birthPlace || '',
    deathYear: person.deathYear || '',
    deathDate: person.deathDate || '',
    deathPlace: person.deathPlace || '',
    isLiving: person.isLiving !== false,
    occupation: person.occupation || '',
    vibeSentence: person.vibeSentence || '',
    photoUrl: person.photoUrl || '',
    personalityTags: person.personalityTags?.join(', ') || '',
    // Legacy Fields
    education: person.education || '',
    militaryService: person.militaryService || '',
    burialPlace: person.burialPlace || '',
    physicalTraits: person.physicalTraits || '',
    favoriteThings: person.favoriteThings || ''
  });

  useEffect(() => {
    if (isOpen) {
      const parts = person.name.split(' ');
      setFormData({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        nickname: person.nickname || '',
        middleName: person.middleName || '',
        maidenName: person.maidenName || '',
        gender: person.gender || '',
        birthYear: person.birthYear || '',
        birthDate: person.birthDate || '',
        birthPlace: person.birthPlace || '',
        deathYear: person.deathYear || '',
        deathDate: person.deathDate || '',
        deathPlace: person.deathPlace || '',
        isLiving: person.isLiving !== false,
        occupation: person.occupation || '',
        vibeSentence: person.vibeSentence || '',
        photoUrl: person.photoUrl || '',
        personalityTags: person.personalityTags?.join(', ') || '',
        education: person.education || '',
        militaryService: person.militaryService || '',
        burialPlace: person.burialPlace || '',
        physicalTraits: person.physicalTraits || '',
        favoriteThings: person.favoriteThings || ''
      });
    }
  }, [person, isOpen]);

  const handleSave = async () => {
    if (!formData.firstName) return;
    
    const tagsArray = formData.personalityTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    // Combine names back for the display name
    const combinedName = `${formData.firstName} ${formData.lastName}`.trim();

    await updatePerson(person.id, {
      ...formData,
      name: combinedName,
      personalityTags: tagsArray
    });
    
    toast.success("Changes saved to the archive.");
    setIsOpen(false);
  };

  const handleDelete = async () => {
    await deletePerson(person.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none bg-white p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl text-stone-800">Edit Entry</DialogTitle>
            <DialogDescription className="text-stone-500">
              Update the official record for {person.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
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

            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                <User className="w-3 h-3" /> Identity & Appearance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">First Name</label>
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="e.g. Daniele"
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Last Name</label>
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="e.g. Buatti"
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Middle Name(s)</label>
                  <Input 
                    value={formData.middleName}
                    onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                    placeholder="e.g. Ezio Adriano"
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Nickname</label>
                  <Input 
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    placeholder="e.g. 'Bibi'"
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Maiden Name</label>
                  <Input 
                    value={formData.maidenName}
                    onChange={(e) => setFormData({...formData, maidenName: e.target.value})}
                    placeholder="Optional"
                    className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Gender</label>
                  <Select onValueChange={(val) => setFormData({...formData, gender: val})} value={formData.gender}>
                    <SelectTrigger className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus:ring-amber-500/20">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Life Events
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-3">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                    <Input 
                      type="text"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      placeholder="e.g. 15/05/1920"
                      className="bg-stone-50 border-none rounded-2xl h-14 text-base pl-12 focus-visible:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-3">Birth Place</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                    <Input 
                      value={formData.birthPlace}
                      onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                      placeholder="City, Country"
                      className="bg-stone-50 border-none rounded-2xl h-14 text-base pl-12 focus-visible:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {!formData.isLiving && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-3">Date of Death</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <Input 
                        type="text"
                        value={formData.deathDate}
                        onChange={(e) => setFormData({...formData, deathDate: e.target.value})}
                        placeholder="e.g. 20/12/2005"
                        className="bg-stone-50 border-none rounded-2xl h-14 text-base pl-12 focus-visible:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-3">Death Place</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <Input 
                        value={formData.deathPlace}
                        onChange={(e) => setFormData({...formData, deathPlace: e.target.value})}
                        placeholder="City, Country"
                        className="bg-stone-50 border-none rounded-2xl h-14 text-base pl-12 focus-visible:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-3">Occupation</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <Input 
                    value={formData.occupation}
                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                    placeholder="e.g. Teacher, Engineer..."
                    className="bg-stone-50 border-none rounded-2xl h-14 text-base pl-12 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                <History className="w-3 h-3" /> Legacy & Details
              </h3>
              
              <div className="grid grid-cols-1 gap-8">
                <EducationManager personId={person.id} records={person.educationRecords || []} />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Military Service</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-4 w-4 h-4 text-stone-300" />
                    <Textarea 
                      value={formData.militaryService}
                      onChange={(e) => setFormData({...formData, militaryService: e.target.value})}
                      placeholder="Branch, rank, or years served..."
                      className="bg-stone-50 border-none rounded-2xl min-h-[80px] text-base pl-12 focus-visible:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Physical Traits</label>
                  <div className="relative">
                    <Eye className="absolute left-4 top-4 w-4 h-4 text-stone-300" />
                    <Textarea 
                      value={formData.physicalTraits}
                      onChange={(e) => setFormData({...formData, physicalTraits: e.target.value})}
                      placeholder="Eye color, height, or unique features..."
                      className="bg-stone-50 border-none rounded-2xl min-h-[80px] text-base pl-12 focus-visible:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Favorite Things</label>
                  <div className="relative">
                    <Utensils className="absolute left-4 top-4 w-4 h-4 text-stone-300" />
                    <Textarea 
                      value={formData.favoriteThings}
                      onChange={(e) => setFormData({...formData, favoriteThings: e.target.value})}
                      placeholder="Favorite meal, song, or hobby..."
                      className="bg-stone-50 border-none rounded-2xl min-h-[80px] text-base pl-12 focus-visible:ring-amber-500/20"
                    />
                  </div>
                </div>
                {!formData.isLiving && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Final Resting Place</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <Input 
                        value={formData.burialPlace}
                        onChange={(e) => setFormData({...formData, burialPlace: e.target.value})}
                        placeholder="Cemetery name and location..."
                        className="bg-stone-50 border-none rounded-2xl h-12 text-base pl-12 focus-visible:ring-amber-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Personality & Story
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Personality Tags</label>
                <Input 
                  value={formData.personalityTags}
                  onChange={(e) => setFormData({...formData, personalityTags: e.target.value})}
                  placeholder="e.g. Storyteller, Kind, Adventurous (comma separated)"
                  className="bg-stone-50 border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Vibe / Bio</label>
                <Textarea 
                  value={formData.vibeSentence}
                  onChange={(e) => setFormData({...formData, vibeSentence: e.target.value})}
                  placeholder="A short sentence describing their essence..."
                  className="bg-stone-50 border-none rounded-2xl min-h-[100px] text-base font-serif p-4 focus-visible:ring-amber-500/20"
                />
              </div>
            </div>
          </div>
        </div>

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