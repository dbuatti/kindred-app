"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Mic, Camera, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useVoiceInput } from '../hooks/use-voice';
import { useFamily } from '../context/FamilyContext.tsx';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface AddMemoryDialogProps {
  personId?: string;
  personName: string;
  initialContent?: string;
  trigger?: React.ReactNode;
}

const AddMemoryDialog = ({ personId, personName, initialContent, trigger }: AddMemoryDialogProps) => {
  const { addMemory } = useFamily();
  const { isListening, transcript, setTranscript, startListening } = useVoiceInput();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!transcript.trim() && !imagePreview) return;

    try {
      await addMemory(personId || 'general', transcript, imagePreview ? 'photo' : (isListening ? 'voice' : 'text'));
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success("Story saved! The family will love this.");
      setTranscript('');
      setImagePreview(null);
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Couldn't save. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="fixed bottom-8 right-8 h-28 px-12 rounded-full shadow-2xl bg-amber-600 hover:bg-amber-700 text-white z-20 text-2xl font-bold gap-4 border-4 border-white">
            <Mic className="w-10 h-10" />
            Tell a Story
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-[3rem] border-none bg-white p-10">
        <DialogHeader>
          <DialogTitle className="text-4xl text-stone-800 text-center mb-6">
            {initialContent ? "Share your memory" : `Tell a story about ${personName.split(' ')[0]}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-12 py-4">
          {/* Massive Mic Button */}
          <div className="flex flex-col items-center gap-8">
            <button
              onClick={startListening}
              className={cn(
                "h-40 w-40 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center border-[12px]",
                isListening 
                  ? "bg-red-500 border-red-200 animate-pulse scale-110" 
                  : "bg-amber-600 border-amber-100 hover:bg-amber-700"
              )}
            >
              {isListening ? (
                <Loader2 className="w-20 h-20 text-white animate-spin" />
              ) : (
                <Mic className="w-20 h-20 text-white" />
              )}
            </button>
            <div className="text-center space-y-3">
              <p className="text-3xl font-bold text-stone-800">
                {isListening ? "I'm listening..." : "Tap to start talking"}
              </p>
              <p className="text-stone-500 text-xl">Your words will appear below automatically.</p>
            </div>
          </div>

          <div className="space-y-6">
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your story will appear here as you speak..."
              className="min-h-[200px] bg-stone-50 border-4 border-stone-100 rounded-[2rem] p-8 text-2xl font-serif leading-relaxed focus-visible:ring-amber-500"
            />
            
            {imagePreview && (
              <div className="relative rounded-[2rem] overflow-hidden border-8 border-stone-100">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                <button 
                  onClick={() => setImagePreview(null)}
                  className="absolute top-6 right-6 p-3 bg-black/60 text-white rounded-full"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-20 rounded-[1.5rem] border-4 border-stone-200 text-stone-600 text-2xl gap-4"
            >
              <Camera className="w-8 h-8" />
              Add a Photo
            </Button>
            <Button 
              className="h-24 rounded-[1.5rem] bg-stone-800 hover:bg-stone-900 text-white text-3xl font-bold shadow-xl gap-4"
              onClick={handleSubmit}
              disabled={!transcript.trim() && !imagePreview}
            >
              <CheckCircle2 className="w-10 h-10" />
              Save Story
            </Button>
            <Button 
              variant="ghost" 
              className="h-16 text-stone-400 text-2xl"
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

export default AddMemoryDialog;