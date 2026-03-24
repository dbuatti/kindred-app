"use client";

import React, { useState } from 'react';
import { Plus, UserPlus, Mic, X } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import AddPersonDialog from './AddPersonDialog';
import AddMemoryDialog from './AddMemoryDialog';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface FloatingMenuProps {
  personId?: string;
  personName?: string;
}

const FloatingMenu = ({ personId, personName = "the family" }: FloatingMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [isMemoryDialogOpen, setIsMemoryDialogOpen] = useState(false);

  // Add shortcuts for the floating menu actions
  useKeyboardShortcuts([
    { key: 'n', action: () => setIsMemoryDialogOpen(true), description: 'New Story' },
    { key: 'a', action: () => setIsPersonDialogOpen(true), description: 'Add Person' }
  ]);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">Add to Family</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1 mr-1">Press 'A'</span>
              </div>
              <AddPersonDialog 
                open={isPersonDialogOpen}
                onOpenChange={setIsPersonDialogOpen}
                initialRelatedToId={personId}
                trigger={
                  <button className="h-14 w-14 rounded-full bg-white text-stone-800 shadow-xl border-2 border-stone-100 hover:bg-stone-50 flex items-center justify-center transition-transform hover:scale-110">
                    <UserPlus className="w-6 h-6" />
                  </button>
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">Tell a Story</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1 mr-1">Press 'N'</span>
              </div>
              <AddMemoryDialog 
                personId={personId}
                personName={personName}
                open={isMemoryDialogOpen}
                onOpenChange={setIsMemoryDialogOpen}
                trigger={
                  <button className="h-14 w-14 rounded-full bg-amber-600 text-white shadow-xl border-2 border-white hover:bg-amber-700 flex items-center justify-center transition-transform hover:scale-110">
                    <Mic className="w-6 h-6" />
                  </button>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-full shadow-2xl transition-all duration-500 border-4 border-white",
          isOpen ? "bg-stone-800 rotate-45" : "bg-amber-600"
        )}
      >
        <Plus className="w-8 h-8 text-white" />
      </Button>
    </div>
  );
};

export default FloatingMenu;