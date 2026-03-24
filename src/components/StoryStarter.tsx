"use client";

import React, { useState } from 'react';
import { Sparkles, RefreshCw, Mic, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import AddMemoryDialog from './AddMemoryDialog';

const PROMPTS = [
  "What was their favorite meal to cook?",
  "Do you remember a funny thing they used to say?",
  "What was their first job?",
  "What's a song that always reminds you of them?",
  "What was the best advice they ever gave you?",
  "Describe the smell of their house.",
  "What was their favorite hobby or pastime?",
  "Do you remember a story they told about their own childhood?"
];

const StoryStarter = () => {
  const [index, setIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const nextPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % PROMPTS.length);
  };

  return (
    <>
      <div 
        onClick={() => setIsDialogOpen(true)}
        className="bg-amber-50/50 border-2 border-amber-100 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:bg-amber-100/50 transition-all duration-500 shadow-sm hover:shadow-md"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-200/40 transition-colors" />
        
        <div className="relative space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-4 h-4" />
              Family Quest
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextPrompt}
              className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-200/50 z-10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="min-h-[80px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.p 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-serif italic text-stone-800 leading-tight"
              >
                "{PROMPTS[index]}"
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="pt-2">
            <Button 
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest gap-2 shadow-sm"
            >
              <Mic className="w-4 h-4" />
              Tell this Story
            </Button>
          </div>
        </div>
      </div>

      <AddMemoryDialog 
        personName="the family"
        initialContent={`Regarding the question: "${PROMPTS[index]}"\n\n`}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};

export default StoryStarter;