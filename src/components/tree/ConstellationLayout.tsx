"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Heart, Users, Sparkles } from 'lucide-react';

const ConstellationNode = ({ node }: { node: TreeNode }) => {
  const hasSiblings = node.siblings.length > 0;
  const hasSpouses = node.spouses.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center gap-8">
        {/* Main Person & Siblings Group */}
        <div className="flex flex-col gap-4 p-6 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
          {[node.person, ...node.siblings].map((p, idx) => (
            <motion.div 
              key={p.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="w-56 p-5 rounded-2xl bg-stone-900 border border-white/20 text-center relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-lg font-serif font-bold text-white relative z-10">
                {formatDisplayName(p.name)}
              </p>
              <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-widest font-bold relative z-10">
                {p.birthYear || '????'} — {p.isLiving ? 'Present' : (p.deathYear || '????')}
              </p>
              {idx > 0 && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                  <Users className="w-3 h-3 text-blue-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Spouses */}
        {node.spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <div className="w-12 h-px bg-gradient-to-r from-white/20 to-white/5 flex items-center justify-center relative">
              <Heart className="w-4 h-4 text-red-400/60 fill-current absolute" />
            </div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-56 p-5 rounded-2xl bg-stone-900/50 border border-white/10 text-center italic backdrop-blur-sm"
            >
              <p className="text-lg font-serif font-medium text-stone-300">
                {formatDisplayName(spouse.name)}
              </p>
              <p className="text-[9px] text-stone-500 uppercase tracking-tighter font-bold">Partner</p>
            </motion.div>
          </React.Fragment>
        ))}
      </div>

      {/* Children Section */}
      {node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-20 bg-gradient-to-b from-white/20 to-white/5" />
          
          <div className="flex gap-16 relative">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative pt-20">
                {/* Vertical line down to child */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-white/10" />
                
                {/* Horizontal connector bar */}
                {node.children.length > 1 && (
                  <div 
                    className="absolute top-0 h-px bg-white/10" 
                    style={{ 
                      left: idx === 0 ? '50%' : '0', 
                      right: idx === node.children.length - 1 ? '50%' : '0' 
                    }} 
                  />
                )}
                
                <ConstellationNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ConstellationLayout = ({ roots }: { roots: TreeNode[] }) => {
  return (
    <div className="p-40 bg-stone-950 min-h-full flex flex-col items-center gap-64 min-w-full relative overflow-hidden">
      {/* Background Stars */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {roots.map((root, idx) => (
        <div key={root.id} className="relative flex flex-col items-center">
          {idx > 0 && (
            <div className="absolute -top-32 flex flex-col items-center gap-4">
              <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-center gap-2 text-amber-400/40">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Another Constellation</span>
              </div>
            </div>
          )}
          <ConstellationNode node={root} />
        </div>
      ))}
    </div>
  );
};