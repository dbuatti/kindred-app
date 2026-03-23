"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Mic, Camera, X, Loader2, CheckCircle2, UploadCloud } from 'lucide-react';
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
  const { addMemory } = useFamily();
  const { isListening, transcript, setTranscript, startListening } = useVoiceInput();
  const [internalOpen, setInternalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

  useEffect(() => {
    if (initialImage) {
      setImagePreview(initialImage);
    }
  }, [initialImage]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

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
          <Button className="fixed bottom-6 right-6 h-16 px-8 rounded-full shadow-xl bg-amber-600 hover:bg-amber-700 text-white z-20 text-lg font-bold gap-3 border-2 border-white">
            <Mic className="w-6 h-6" />
            Tell a Story
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className={cn(
          "sm:max-w-md rounded-3xl border-none bg-white p-8 transition-all duration-300",
          isDragging ? "ring-4 ring-amber-500/20 bg-amber-50/50" : ""
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-stone-800 text-center mb-2">
            {initialContent ? "Share your memory" : `Tell a story about ${personName.split(' ')[0]}`}
          </DialogTitle>
          <DialogDescription className="text-center text-stone-500">
            Use your voice or type to share a memory with the family.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-2">
          {isDragging ? (
            <div className="h-48 border-2 border-dashed border-amber-400 rounded-2xl flex flex-col items-center justify-center gap-3 bg-amber-50 animate-in fade-in zoom-in duration-300">
              <UploadCloud className="w-12 h-12 text-amber-600 animate-bounce" />
              <p className="text-xl font-bold text-amber-900">Drop photo here</p>
            </div>
          ) : (
            <>
              {/* Mic Button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={startListening}
                  className={cn(
                    "h-24 w-24 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center border-8",
                    isListening 
                      ? "bg-red-500 border-red-200 animate-pulse scale-105" 
                      : "bg-amber-600 border-amber-100 hover:bg-amber-700"
                  )}
                >
                  {isListening ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>
                <div className="text-center space-y-1">
                  <p className="text-xl font-bold text-stone-800">
                    {isListening ? "I'm listening..." : "Tap to start talking"}
                  </p>
                  <p className="text-stone-500 text-sm">Your words will appear below automatically.</p>
                </div>
              </div>

              <div className="space-y-4">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your story will appear here as you speak..."
                  className="min-h-[150px] bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 text-lg font-serif leading-relaxed focus-visible:ring-amber-500"
                />
                
                {imagePreview && (
                  <div className="relative rounded-2xl overflow-hidden border-4 border-stone-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-14 rounded-xl border-2 border-stone-200 text-stone-600 text-lg gap-3"
            >
              <Camera className="w-6 h-6" />
              Add a Photo
            </Button>
            <Button 
              className="h-16 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xl font-bold shadow-lg gap-3"
              onClick={handleSubmit}
              disabled={!transcript.trim() && !imagePreview}
            >
              <CheckCircle2 className="w-6 h-6" />
              Save Story
            </Button>
            <Button 
              variant="ghost" 
              className="h-10 text-stone-400 text-lg"
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