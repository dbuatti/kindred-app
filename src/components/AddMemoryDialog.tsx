"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Mic, Camera, X, Loader2, CheckCircle2, UploadCloud, Plus, Sparkles, RefreshCw } from 'lucide-react';
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

const STORY_PROMPTS = [
  "What was their favorite meal to cook?",
  "Do you remember a funny thing they used to say?",
  "What was their first job?",
  "What's a song that always reminds you of them?",
  "What was the best advice they ever gave you?",
  "Describe the smell of their house.",
  "What was their favorite hobby or pastime?",
  "Do you remember a story they told about their own childhood?"
];

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
  const [images, setImages] = useState<{ url: string, caption: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

  useEffect(() => {
    if (initialImage) {
      setImages([{ url: initialImage, caption: '' }]);
    }
  }, [initialImage]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileList = Array.from(files);
    fileList.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { url: reader.result as string, caption: '' }]);
      };
      reader.readAsDataURL(file);
    });
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
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!transcript.trim() && images.length === 0) return;

    setIsSaving(true);
    try {
      if (transcript.trim() && images.length === 0) {
        await addMemory(personId || 'general', transcript, isListening ? 'voice' : 'text');
      } 
      else if (images.length > 0) {
        for (const img of images) {
          await addMemory(
            personId || 'general', 
            img.caption || transcript || "A family photo.", 
            'photo', 
            img.url
          );
        }
      }
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d97706', '#f59e0b', '#fbbf24']
      });
      
      toast.success("Stories saved! The family will love these.");
      setTranscript('');
      setImages([]);
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % STORY_PROMPTS.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
        className={cn(
          "sm:max-w-2xl rounded-[3rem] border-none bg-white p-8 transition-all duration-300 max-h-[90vh] overflow-y-auto",
          isDragging ? "ring-4 ring-amber-500/20 bg-amber-50/50" : ""
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-stone-800 text-center mb-2">
            {images.length > 0 ? "Share these photos" : `Tell a story about ${personName.split(' ')[0]}`}
          </DialogTitle>
          <DialogDescription className="text-center text-stone-500 text-lg">
            {images.length > 0 
              ? `Adding ${images.length} photo${images.length === 1 ? '' : 's'} to the archive.`
              : "Use your voice or type to share a memory with the family."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Story Starter Prompt */}
          {!images.length && !transcript && (
            <div className={cn(
              "bg-amber-50/50 border border-amber-100 rounded-3xl p-6 transition-all duration-500",
              showPrompt ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 p-0 overflow-hidden border-none"
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Need an idea?
                </div>
                <button onClick={nextPrompt} className="text-amber-600 hover:text-amber-800">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-lg font-serif italic text-stone-700">"{STORY_PROMPTS[promptIndex]}"</p>
            </div>
          )}

          {isDragging ? (
            <div className="h-64 border-4 border-dashed border-amber-400 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 bg-amber-50 animate-in fade-in zoom-in duration-300">
              <UploadCloud className="w-16 h-16 text-amber-600 animate-bounce" />
              <p className="text-2xl font-serif font-bold text-amber-900">Drop photos here</p>
            </div>
          ) : (
            <>
              {images.length === 0 && (
                <div className="flex flex-col items-center gap-6">
                  <button
                    onClick={startListening}
                    className={cn(
                      "h-28 w-28 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center border-8",
                      isListening 
                        ? "bg-red-500 border-red-200 animate-pulse scale-105" 
                        : "bg-amber-600 border-amber-100 hover:bg-amber-700"
                    )}
                  >
                    {isListening ? (
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    ) : (
                      <Mic className="w-12 h-12 text-white" />
                    )}
                  </button>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-serif font-bold text-stone-800">
                      {isListening ? "I'm listening..." : "Tap to start talking"}
                    </p>
                    <p className="text-stone-500">Your words will appear below automatically.</p>
                    {!transcript && (
                      <button 
                        onClick={() => setShowPrompt(!showPrompt)}
                        className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-2 hover:underline"
                      >
                        {showPrompt ? "Hide prompt" : "Need a prompt?"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-3xl overflow-hidden border-4 border-stone-100 bg-stone-50">
                        <img src={img.url} alt="Preview" className="w-full h-48 object-cover" />
                        <div className="p-3">
                          <Input 
                            placeholder="Add a caption..." 
                            value={img.caption}
                            onChange={(e) => {
                              const newImages = [...images];
                              newImages[idx].caption = e.target.value;
                              setImages(newImages);
                            }}
                            className="bg-white border-none rounded-xl h-10 text-sm"
                          />
                        </div>
                        <button 
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-full min-h-[200px] border-4 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-all bg-stone-50/50"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="font-bold uppercase tracking-widest text-xs">Add More</span>
                    </button>
                  </div>
                )}

                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={images.length > 0 ? "Add a general story for these photos..." : "Your story will appear here as you speak..."}
                  className="min-h-[150px] bg-stone-50 border-none rounded-[2rem] p-6 text-xl font-serif leading-relaxed focus-visible:ring-amber-500/20"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
            {images.length === 0 && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-16 rounded-2xl border-4 border-stone-100 text-stone-600 text-xl gap-4 hover:bg-stone-50"
              >
                <Camera className="w-8 h-8 text-amber-600" />
                Add Photos
              </Button>
            )}
            <Button 
              className="h-20 rounded-[2rem] bg-stone-800 hover:bg-stone-900 text-white text-2xl font-bold shadow-xl gap-4"
              onClick={handleSubmit}
              disabled={isSaving || (!transcript.trim() && images.length === 0)}
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
            <Button 
              variant="ghost" 
              className="h-12 text-stone-400 text-lg"
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