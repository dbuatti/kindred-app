import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Edit3, Sparkles, Calendar, MapPin, Briefcase, User, Quote, Camera, Heart, Skull, Tag, GraduationCap, Shield, Eye, Utensils } from 'lucide-react';
import { Person } from '../types';
import { useFamily } from '../context/FamilyContext';
import { toast } from 'sonner';

interface SuggestionDialogProps {
  person: Person;
  trigger?: React.ReactNode;
  initialField?: string;
}

// Map database column names to Person interface keys
const FIELD_TO_KEY_MAP: Record<string, keyof Person> = {
  middle_name: 'middleName',
  birth_year: 'birthYear',
  birth_date: 'birthDate',
  birth_place: 'birthPlace',
  death_date: 'deathDate',
  death_place: 'deathPlace',
  occupation: 'occupation',
  gender: 'gender',
  nickname: 'nickname',
  maiden_name: 'maidenName',
  vibe_sentence: 'vibeSentence',
  photo_url: 'photoUrl',
  education: 'education',
  military_service: 'militaryService',
  burial_place: 'burialPlace',
  physical_traits: 'physicalTraits',
  favorite_things: 'favoriteThings'
};

const FIELD_CONFIG: Record<string, { label: string, icon: any, placeholder: string, type: 'input' | 'textarea' | 'select' }> = {
  middle_name: { label: 'Middle Name', icon: User, placeholder: 'e.g. Maria or "No middle name"', type: 'input' },
  birth_year: { label: 'Birth Year', icon: Calendar, placeholder: 'e.g. 1945', type: 'input' },
  birth_date: { label: 'Birth Date', icon: Calendar, placeholder: 'e.g. 15/05/1945', type: 'input' },
  birth_place: { label: 'Birth Place', icon: MapPin, placeholder: 'e.g. Brooklyn, NY', type: 'input' },
  death_date: { label: 'Date of Passing', icon: Skull, placeholder: 'e.g. 20/12/2010', type: 'input' },
  death_place: { label: 'Place of Passing', icon: MapPin, placeholder: 'e.g. London, UK', type: 'input' },
  occupation: { label: 'Occupation', icon: Briefcase, placeholder: 'e.g. Librarian', type: 'input' },
  gender: { label: 'Gender', icon: User, placeholder: 'Select gender', type: 'select' },
  nickname: { label: 'Nickname', icon: Tag, placeholder: 'e.g. "Bibi"', type: 'input' },
  maiden_name: { label: 'Maiden Name', icon: Heart, placeholder: 'Their family name at birth', type: 'input' },
  vibe_sentence: { label: 'Detailed Bio', icon: Quote, placeholder: 'Tell us about their personality...', type: 'textarea' },
  photo_url: { label: 'Photo URL', icon: Camera, placeholder: 'Link to a photo...', type: 'input' },
  education: { label: 'Education', icon: GraduationCap, placeholder: 'Schools, degrees, or mentors...', type: 'textarea' },
  military_service: { label: 'Military Service', icon: Shield, placeholder: 'Branch, rank, or years served...', type: 'textarea' },
  burial_place: { label: 'Final Resting Place', icon: MapPin, placeholder: 'Cemetery name and location...', type: 'input' },
  physical_traits: { label: 'Physical Traits', icon: Eye, placeholder: 'Eye color, height, or unique features...', type: 'textarea' },
  favorite_things: { label: 'Favorite Things', icon: Utensils, placeholder: 'Favorite meal, song, or hobby...', type: 'textarea' }
};

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Other", value: "other" }
];

const SuggestionDialog = ({ person, trigger, initialField = 'vibe_sentence' }: SuggestionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addSuggestion, updatePerson, isAdmin, user } = useFamily();
  const [fieldName, setFieldName] = useState(initialField);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) setFieldName(initialField);
  }, [isOpen, initialField]);

  const handleSubmit = async () => {
    if (!value) return;

    if (isAdmin) {
      const personKey = FIELD_TO_KEY_MAP[fieldName] || fieldName;
      await updatePerson(person.id, { [personKey]: value });
      toast.success("Record updated directly.");
    } else {
      await addSuggestion({
        personId: person.id,
        fieldName: fieldName,
        suggestedValue: value,
        suggestedByEmail: user?.email || 'family@kindred.com'
      });
      toast.success("Your suggestion has been sent to the family inbox.");
    }

    setIsOpen(false);
    setValue('');
  };

  const config = FIELD_CONFIG[fieldName] || FIELD_CONFIG.vibe_sentence;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="text-stone-400 hover:text-amber-600 gap-2 text-sm font-light italic">
            <Edit3 className="w-4 h-4" /> I remember this slightly differently...
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-50 p-10">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-stone-800 flex items-center gap-3">
            <config.icon className="w-6 h-6 text-amber-500" />
            {config.label}
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-lg">
            {isAdmin ? `Updating the record for ${person.name.split(' ')[0]}.` : `Help us complete the story of ${person.name.split(' ')[0]}.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-400">
              {config.label} for {person.name}
            </label>
            
            {config.type === 'input' && (
              <Input 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
                className="bg-white border-stone-200 rounded-2xl h-14 text-lg px-6 focus-visible:ring-amber-500"
              />
            )}

            {config.type === 'textarea' && (
              <Textarea 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
                className="bg-white border-stone-200 rounded-2xl min-h-[150px] text-lg font-serif p-6 focus-visible:ring-amber-500"
              />
            )}

            {config.type === 'select' && (
              <Select onValueChange={setValue} value={value}>
                <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14 text-lg px-6">
                  <SelectValue placeholder={config.placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {GENDER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-lg py-3">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full h-16 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-xl font-bold"
              onClick={handleSubmit}
              disabled={!value}
            >
              {isAdmin ? "Save Changes" : "Send Suggestion"}
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

export default SuggestionDialog;