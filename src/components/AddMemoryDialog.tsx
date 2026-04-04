"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Mic, Camera, X, Loader2, CheckCircle2, UploadCloud, Plus, Sparkles, RefreshCw, Trash2, Calendar, Star, Square, Settings2, Keyboard, Users, User, Volume2 } from 'lucide-react';
import { useVoiceInput } from '../hooks/use-voice';
import { useFamily } from '../context/FamilyContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface AddMemoryDialogProps {
  personId?: string;
  personName: string;
  initialContent?: string;
  initialImage?: string | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddMemoryDialog = ({ 
  personId: initialPersonId, 
  personName: initialPersonName, 
  initialContent, 
  initialImage,
  trigger,
  open: externalOpen,
  onOpenChange: setExternalOpen
}: AddMemoryDialogProps) => {
  const { addMemory, uploadAudio, people } = useFamily();
  const { 
    isListening, 
    transcript, 
    setTranscript, 
    startListening, 
    stopListening, 
    audioBlob, 
    setAudioBlob,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    getDevices
  } = useVoiceInput();

  const [internalOpen, setInternalOpen] = useState(false);
  const [images, setImages] = useState<{ url: string, caption: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(initialPersonId || 'general');
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

  const selectedPersonName = useMemo(() => {
    if (selectedPersonId === 'general') return 'the family';
    return people.find(p => p.id === selectedPersonId)?.name || 'the family';
  }, [selectedPersonId, people]);

  useEffect(() => {
    if (isOpen) {
      getDevices();
      const draftKey = `kindred_draft_${selectedPersonId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && !transcript) setTranscript(savedDraft);
    }
  }, [isOpen, selectedPersonId, getDevices, setTranscript, transcript]);

  useEffect(() => {
    if (transcript) {
      const draftKey = `kindred_draft_${selectedPersonId}`;
      localStorage.setItem(draftKey, transcript);
    }
  }, [transcript, selectedPersonId]);

  const clearDraft = () => {
    setTranscript('');
    setAudioBlob(null);
    localStorage.removeItem(`kindred_draft_${selectedPersonId}`);
    toast.success("Draft cleared.");
  };

  const handleSubmit = async () => {
    if (!transcript.trim() && images.length === 0 && !audioBlob) return;

    setIsSaving(true);
    try {
      let voiceUrl = undefined;
      if (audioBlob) {
        voiceUrl = await uploadAudio(audioBlob);
      }

      if ((transcript.trim() || audioBlob) && images.length === 0) {
        await addMemory(
          selectedPersonId, 
          transcript || "Voice memo shared with the family.", 
          audioBlob ? 'voice' : 'text', 
          undefined, 
          eventDate, 
          isMilestone,
          voiceUrl || undefined
        );
      } 
      else if (images.length > 0) {
        for (const img of images) {
          await addMemory(
            selectedPersonId, 
            img.caption || transcript || "A family photo.", 
            'photo', 
            img.url,
            eventDate,
            isMilestone
          );
        }
      }
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d97706', '#f59e0b', '#fbbf24']
      });
      
      toast.success("Stories saved!");
      localStorage.removeItem(`kindred_draft_${selectedPersonId}`);
      setTranscript('');
      setImages([]);
      setAudioBlob(null);
      setEventDate('');
      setIsMilestone(false);
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl rounded-[3rem] border-none bg-white p-10 max-h-[95vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-4xl font-serif text-stone-800 text-center mb-4">
            Share a Story
          </DialogTitle>
          <DialogDescription className="text-center text-stone-500 text-xl italic">
            Tell us about {selectedPersonName.split(' ')[0]}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-10 py-6">
          {/* Person Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-stone-500 ml-1">
              <User className="w-4 h-4" />
              Who is this story about?
            </div>
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger className="h-20 bg-stone-50 border-4 border-stone-100 rounded-[1.5rem] px-8 text-2xl font-serif focus:ring-amber-500/20">
                <SelectValue placeholder="Select a family member..." />
              </SelectTrigger>
              <SelectContent className="rounded-[1.5rem]">
                <SelectItem value="general" className="text-xl py-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-stone-400" />
                    General Family Lore
                  </div>
                </SelectItem>
                {people.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xl py-4">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-center gap-8 bg-amber-50/30 p-10 rounded-[3rem] border-4 border-amber-100 shadow-inner">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif font-bold text-amber-900">Option 1: Just Start Talking</h3>
              <p className="text-amber-700/70 text-lg">Tap the big orange button and tell your story out loud.</p>
            </div>
            
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "h-36 w-36 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center border-[12px]",
                isListening 
                  ? "bg-red-500 border-red-200 animate-pulse scale-110" 
                  : "bg-amber-600 border-white hover:bg-amber-700 hover:scale-105"
              )}
            >
              {isListening ? (
                <Square className="w-14 h-14 text-white fill-current" />
              ) : (
                <Mic className="w-16 h-16 text-white" />
              )}
            </button>
            
            <div className="text-center space-y-1">
              <p className="text-3xl font-serif font-bold text-stone-800">
                {isListening ? "Listening to you..." : audioBlob ? "Voice recorded!" : "Tap to Record"}
              </p>
              {isListening && <p className="text-red-600 font-bold animate-pulse">Tap the square when you're finished.</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif font-bold text-stone-800">Option 2: Type it Out</h3>
              <p className="text-stone-500 text-lg">Your words will appear here as you speak, or you can type manually.</p>
            </div>

            {audioBlob && !isListening && (
              <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100 flex items-center justify-between animate-in zoom-in">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <span className="text-lg font-bold text-green-900">Voice Recording Ready!</span>
                </div>
                <button onClick={() => setAudioBlob(null)} className="h-10 w-10 flex items-center justify-center bg-white rounded-full text-red-400 hover:text-red-600 shadow-sm">
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            <div className="relative">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Start typing your story here..."
                className="min-h-[250px] bg-stone-50 border-4 border-stone-100 rounded-[2.5rem] p-8 text-2xl font-serif leading-relaxed focus-visible:ring-amber-500/20 shadow-inner"
              />
              {transcript && (
                <button 
                  onClick={clearDraft}
                  className="absolute bottom-6 right-6 h-12 px-4 bg-white rounded-xl text-stone-400 hover:text-red-500 transition-colors shadow-sm border border-stone-100 flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                >
                  <Trash2 className="w-4 h-4" /> Clear Text
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-stone-50 p-6 rounded-[2rem] border-2 border-stone-100 flex items-center gap-6">
              <Calendar className="w-8 h-8 text-stone-400" />
              <div className="flex-1 space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-stone-500">When did this happen?</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Summer of 1972" 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-10 bg-transparent border-none p-0 text-xl font-serif focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="bg-amber-50/50 p-6 rounded-[2rem] border-2 border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-colors shadow-sm",
                  isMilestone ? "bg-amber-500 text-white" : "bg-white text-stone-300"
                )}>
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-lg font-bold text-stone-800">Major Event?</Label>
                  <p className="text-xs text-stone-500 font-medium">Like a wedding or birth</p>
                </div>
              </div>
              <Switch checked={isMilestone} onCheckedChange={setIsMilestone} className="scale-125" />
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <Button 
              className="h-24 rounded-[2.5rem] bg-stone-900 hover:bg-black text-white text-3xl font-serif font-bold shadow-2xl gap-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleSubmit}
              disabled={isSaving || (!transcript.trim() && images.length === 0 && !audioBlob)}
            >
              {isSaving ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-10 h-10 text-amber-500" />
                  Save to Archive
                </>
              )}
            </Button>
            <Button variant="ghost" className="h-14 text-stone-400 text-xl font-medium hover:text-stone-600" onClick={() => setIsOpen(false)}>
              Cancel and Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemoryDialog;