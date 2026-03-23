import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Mic, Send, X, Loader2 } from 'lucide-react';
import { useVoiceInput } from '../hooks/use-voice';
import { cn } from '@/lib/utils';

interface AddMemoryDialogProps {
  personName: string;
  onAdd: (content: string, type: 'text' | 'voice') => void;
}

const AddMemoryDialog = ({ personName, onAdd }: AddMemoryDialogProps) => {
  const { isListening, transcript, setTranscript, startListening } = useVoiceInput();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (transcript.trim()) {
      onAdd(transcript, isListening ? 'voice' : 'text');
      setTranscript('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl bg-amber-600 hover:bg-amber-700 text-white">
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
              className="min-h-[200px] bg-white border-stone-200 rounded-2xl p-4 text-lg font-serif leading-relaxed focus-visible:ring-amber-500"
            />
            {isListening && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-amber-600 animate-pulse">
                <div className="w-2 h-2 bg-amber-600 rounded-full" />
                <span className="text-xs font-medium uppercase tracking-wider">Listening</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={startListening}
              disabled={isListening}
              variant="outline"
              className={cn(
                "h-20 w-20 rounded-full border-2 transition-all duration-500",
                isListening ? "border-amber-500 bg-amber-50 scale-110" : "border-stone-200 hover:border-amber-300"
              )}
            >
              {isListening ? (
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-stone-600" />
              )}
            </Button>
            <p className="text-sm text-stone-500 font-light">
              {isListening ? "I'm listening. Take your time." : "Tap to start speaking"}
            </p>
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
              disabled={!transcript.trim()}
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