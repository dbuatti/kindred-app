"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserPlus, ArrowUp, ArrowDown, Heart, X } from 'lucide-react';
import { Button } from './ui/button';
import AddPersonDialog from './AddPersonDialog';
import { cn } from '@/lib/utils';

interface QuickAddMenuProps {
  personId: string;
  personName: string;
}

const QuickAddMenu = ({ personId, personName }: QuickAddMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ rel: string, open: boolean }>({ rel: '', open: false });

  const options = [
    { label: 'Add Parent', icon: ArrowUp, rel: 'Father', color: 'bg-blue-500' },
    { label: 'Add Child', icon: ArrowDown, rel: 'Son', color: 'bg-green-500' },
    { label: 'Add Spouse', icon: Heart, rel: 'Spouse', color: 'bg-red-500' },
  ];

  const handleOptionClick = (rel: string) => {
    setDialogConfig({ rel, open: true });
    setIsOpen(false);
  };

  return (
    <div className="absolute -right-2 -top-2 z-20">
      <div className="relative flex flex-col items-center">
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              className="absolute bottom-full mb-3 flex flex-col items-center gap-2"
            >
              {options.map((opt, idx) => (
                <motion.button
                  key={opt.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(opt.rel);
                  }}
                  className="group flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="bg-stone-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    {opt.label}
                  </span>
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform hover:scale-110",
                    opt.color
                  )}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "h-8 w-8 rounded-full shadow-lg border-2 border-white transition-all duration-300",
            isOpen ? "bg-stone-800 rotate-45" : "bg-amber-600 hover:bg-amber-700"
          )}
        >
          <Plus className="w-4 h-4 text-white" />
        </Button>
      </div>

      <AddPersonDialog 
        open={dialogConfig.open}
        onOpenChange={(open) => setDialogConfig(prev => ({ ...prev, open }))}
        initialRelationship={dialogConfig.rel}
        initialRelatedToId={personId}
      />
    </div>
  );
};

export default QuickAddMenu;