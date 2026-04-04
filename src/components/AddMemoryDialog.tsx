"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Mic, Camera, X, Loader2, CheckCircle2, UploadCloud, Plus, Sparkles, RefreshCw, Trash2, Calendar, Star, Square, Settings2, Keyboard } from 'lucide-react';
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
  personId, 
  personName, 
  initialContent, 
  initialImage,
  trigger,
  open: externalOpen,
  onOpenChange: setExternalOpen
}: AddMemoryDialogProps) => {
  const { addMemory, uploadAudio } = useFamily();
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
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

  // Fetch devices when dialog opens
  useEffect(() => {
    if (isOpen) {
      getDevices();
      const draftKey = `kindred_draft_${personId || 'general'}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && !transcript) setTranscript(savedDraft);
    }
  }, [isOpen, personId, getDevices, setTranscript, transcript]);

  useEffect(() => {
    if (transcript) {
      const draftKey = `kindred_draft_${personId || 'general'}`;
      localStorage.setItem(draftKey, transcript);
    }
  }, [transcript, personId]);

  const clearDraft = () => {
    setTranscript('');
    setAudioBlob(null);
    localStorage.removeItem(`kindred_draft_${personId || 'general'}`);
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
          personId || 'general', 
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
            personId || 'general', 
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
      localStorage.removeItem(`kindred_draft_${personId || 'general'}`);
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
      <DialogContent className="sm:max-w-2xl rounded-[3rem] border-none bg-white p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-stone-800 text-center mb-2">
            Tell a story about {personName.split(' ')[0]}
          </DialogTitle>
          <DialogDescription className="text-center text-stone-500 text-lg">
            Choose how you'd like to share this memory.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center gap-4">
              <Calendar className="w-5 h-5 text-stone-400" />
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">When did this happen?</label>
                <Input 
                  type="text" 
                  placeholder="e.g. 1985" 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-8 bg-transparent border-none p-0 text-sm focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                  isMilestone ? "bg-amber-500 text-white" : "bg-stone-200 text-stone-400"
                )}>
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-stone-800">Milestone</Label>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest">Major Life Event</p>
                </div>
              </div>
              <Switch checked={isMilestone} onCheckedChange={setIsMilestone} />
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
            <div className="flex items-center gap-3 text-blue-700">
              <Keyboard className="w-5 h-5" />
              <h3 className="font-serif font-bold">Prefer to type?</h3>
            </div>
            <p className="text-sm text-blue-600 leading-relaxed">
              Voice recording is completely optional. You can simply type your story into the box below and we'll preserve it just the same.
            </p>
          </div>

          {/* Microphone Selector */}
          {devices.length > 1 && !isListening && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">
                <Settings2 className="w-3 h-3" />
                Select Microphone
              </div>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger className="h-12 bg-stone-50 border-none rounded-xl px-4 text-sm focus:ring-amber-500/20">
                  <SelectValue placeholder="Choose microphone..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {devices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="text-sm">
                      {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col items-center gap-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "h-28 w-28 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center border-8",
                isListening 
                  ? "bg-red-500 border-red-200 animate-pulse scale-105" 
                  : "bg-amber-600 border-amber-100 hover:bg-amber-700"
              )}
            >
              {isListening ? (
                <Square className="w-10 h-10 text-white fill-current" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </button>
            <div className="text-center space-y-1">
              <p className="text-2xl font-serif font-bold text-stone-800">
                {isListening ? "Recording your voice..." : audioBlob ? "Voice recorded!" : "Tap to start talking"}
              </p>
              <p className="text-stone-500">
                {isListening ? "Tap the square to stop." : "Or just start typing your story below."}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {audioBlob && !isListening && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-amber-900">Voice Memo Ready</span>
                </div>
                <button onClick={() => setAudioBlob(null)} className="text-amber-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="relative">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your story will appear here as you speak, or you can type it manually..."
                className="min-h-[150px] bg-stone-50 border-none rounded-[2rem] p-6 text-xl font-serif leading-relaxed focus-visible:ring-amber-500/20"
              />
              {transcript && (
                <button 
                  onClick={clearDraft}
                  className="absolute bottom-4 right-4 p-2 text-stone-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button 
              className="h-20 rounded-[2rem] bg-stone-800 hover:bg-stone-900 text-white text-2xl font-bold shadow-xl gap-4"
              onClick={handleSubmit}
              disabled={isSaving || (!transcript.trim() && images.length === 0 && !audioBlob)}
            >
              {isSaving ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-8 h-8" />
                  Save to Archive
                </>
              )}
            </Button>
            <Button variant="ghost" className="h-12 text-stone-400 text-lg" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemoryDialog;