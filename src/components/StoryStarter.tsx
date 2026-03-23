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
    <Card className="bg-amber-50/30 border-amber-100/50 p-8 rounded-[2.5rem] shadow-none group hover:bg-amber-50/50 transition-all duration-500 border-2 border-dashed">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Prompt of the Day
          </div>
          
          <AddMemoryDialog 
            personName="the family"
            initialContent={PROMPTS[index]}
            trigger={
              <button className="text-left space-y-3 block w-full group/btn">
                <h3 className="font-serif text-2xl text-stone-800 leading-tight group-hover/btn:text-amber-900 transition-colors">
                  {PROMPTS[index]}
                </h3>
                <p className="text-stone-500 text-sm italic font-light">
                  Tap to share a memory inspired by this question...
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
          className="text-amber-600 hover:bg-amber-100 rounded-full shrink-0 h-12 w-12 transition-transform active:rotate-180 duration-500"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
};

export default StoryStarter;