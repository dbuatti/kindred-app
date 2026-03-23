import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Mic, Camera, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useVoiceInput } from '../hooks/use-voice';
import { useFamily } from '../context/FamilyContext.tsx';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddMemoryDialogProps {
  personId?: string;
  personName: string;
  onAdd?: (content: string, type: 'text' | 'voice' | 'photo') => void;
}

const AddMemoryDialog = ({ personId, personName, onAdd }: AddMemoryDialogProps) => {
  const { addMemory } = useFamily();
  const { isListening, transcript, setTranscript, startListening } = useVoiceInput();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!transcript.trim() && !imagePreview) return;

    if (personId) {
      addMemory(personId, transcript, imagePreview ? 'photo' : (isListening ? 'voice' : 'text'));
      toast.success("Memory saved to the archive.");
    } else if (onAdd) {
      onAdd(transcript, imagePreview ? 'photo' : 'text');
    }

    setTranscript('');
    setImagePreview(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl bg-amber-600 hover:bg-amber-700 text-white z-20">
          <Mic className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl border-none bg-stone-50">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-stone-800">
            Tell us about {personName.split(' ')[0]}...
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="relative">
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Tap the mic to speak, or start typing a memory..."
              className="min-h-[150px] bg-white border-stone-200 rounded-2xl p-4 text-lg font-serif leading-relaxed focus-visible:ring-amber-500"
            />
            
            {imagePreview && (
              <div className="mt-4 relative rounded-xl overflow-hidden border border-stone-200">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <button 
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isListening && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-amber-600 animate-pulse">
                <div className="w-2 h-2 bg-amber-600 rounded-full" />
                <span className="text-xs font-medium uppercase tracking-wider">Listening</span>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={startListening}
                disabled={isListening}
                variant="outline"
                className={cn(
                  "h-16 w-16 rounded-full border-2 transition-all duration-500",
                  isListening ? "border-amber-500 bg-amber-50 scale-110" : "border-stone-200 hover:border-amber-300"
                )}
              >
                {isListening ? (
                  <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                ) : (
                  <Mic className="w-6 h-6 text-stone-600" />
                )}
              </Button>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest">Voice</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-16 w-16 rounded-full border-2 border-stone-200 hover:border-amber-300"
              >
                <Camera className="w-6 h-6 text-stone-600" />
              </Button>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest">Photo</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="flex-1 rounded-xl text-stone-500"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl bg-stone-800 hover:bg-stone-900 text-white"
              onClick={handleSubmit}
              disabled={!transcript.trim() && !imagePreview}
            >
              Save Memory
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemoryDialog;