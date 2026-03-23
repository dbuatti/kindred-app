"use client";

import React, { useMemo } from 'react';
import { Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [index, setIndex] = React.useState(0);

  const nextPrompt = () => {
    setIndex((prev) => (prev + 1) % PROMPTS.length);
  };

  return (
    <div className="bg-amber-50/50 border border-amber-100 rounded-[2.5rem] p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 blur-3xl rounded-full -mr-16 -mt-16" />
      
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-4 h-4" />
            Story Starter
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextPrompt}
            className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-100"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

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

        <p className="text-stone-500 text-sm">
          Tap the <span className="font-bold text-amber-600">+</span> button below to share a memory based on this prompt.
        </p>
      </div>
    </div>
  );
};

export default StoryStarter;