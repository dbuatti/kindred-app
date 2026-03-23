import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Mic, Camera, X, Loader2, MessageSquare } from 'lucide-react';
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
      toast.success("Your story has been saved!");
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
        <Button className="fixed bottom-8 right-8 h-20 px-8 rounded-full shadow-2xl bg-amber-600 hover:bg-amber-700 text-white z-20 text-lg font-medium gap-3">
          <Mic className="w-6 h-6" />
          Add a Story
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-50 p-8">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-stone-800 text-center">
            Tell a story about {personName.split(' ')[0]}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Big Voice Button */}
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={startListening}
              disabled={isListening}
              className={cn(
                "h-24 w-24 rounded-full shadow-lg transition-all duration-500",
                isListening ? "bg-red-500 animate-pulse scale-110" : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {isListening ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </Button>
            <p className="text-stone-600 font-medium">
              {isListening ? "Listening... Speak now" : "Tap the microphone to speak"}
            </p>
          </div>

          <div className="relative">
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Or type your story here..."
              className="min-h-[120px] bg-white border-stone-200 rounded-2xl p-4 text-lg font-serif leading-relaxed focus-visible:ring-amber-500"
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
          </div>

          <div className="flex gap-4">
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
              className="flex-1 h-14 rounded-2xl border-2 border-stone-200 text-stone-600 gap-2"
            >
              <Camera className="w-5 h-5" />
              Add Photo
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-lg"
              onClick={handleSubmit}
              disabled={!transcript.trim() && !imagePreview}
            >
              Save Story
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full text-stone-400"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemoryDialog;