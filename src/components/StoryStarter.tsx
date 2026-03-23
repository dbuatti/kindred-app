import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import AddMemoryDialog from './AddMemoryDialog';

const PROMPTS = [
  "What was their favorite Sunday tradition?",
  "What's a piece of advice they always gave?",
  "Describe the sound of their laugh.",
  "What did their kitchen always smell like?",
  "What was the most rebellious thing they ever did?",
  "How did they react when they were truly happy?",
  "What was their favorite song to hum or sing?"
];

const StoryStarter = () => {
  const [index, setIndex] = React.useState(0);

  const nextPrompt = () => {
    setIndex((prev) => (prev + 1) % PROMPTS.length);
  };

  return (
    <Card className="bg-amber-50/30 border-amber-100/50 p-6 rounded-[2rem] shadow-none group hover:bg-amber-50/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Story Starter
          </div>
          
          <AddMemoryDialog 
            personName="the family"
            initialContent={PROMPTS[index]}
            trigger={
              <button className="text-left space-y-2 block w-full">
                <h3 className="font-serif text-xl text-stone-800 leading-tight group-hover:text-amber-900 transition-colors">
                  {PROMPTS[index]}
                </h3>
                <p className="text-stone-500 text-sm">
                  Tap to share a memory inspired by this question.
                </p>
              </button>
            }
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            nextPrompt();
          }}
          className="text-amber-600 hover:bg-amber-100 rounded-full shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default StoryStarter;