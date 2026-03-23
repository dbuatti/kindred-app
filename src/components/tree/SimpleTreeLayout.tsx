"use client";

import React from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName, copyPersonDebugInfo } from '@/lib/utils';
import { useFamily } from '@/context/FamilyContext';
import { Users, Heart, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

const SimpleNode = ({ node, debugMode }: { node: TreeNode, debugMode?: boolean }) => {
  const { relationships, people } = useFamily();
  
  const siblingRels = relationships.filter(r => 
    (r.person_id === node.id || r.related_person_id === node.id) && 
    ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())
  );

  const siblingNames = siblingRels.map(r => {
    const sibId = r.person_id === node.id ? r.related_person_id : r.person_id;
    return people.find(p => p.id === sibId)?.name.split(' ')[0];
  }).filter(Boolean);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center">
        <div className="flex items-center gap-6 p-10 bg-white/20 rounded-[4rem] border border-stone-200/30 backdrop-blur-[1px] shadow-sm">
          
          {/* Main Person & Siblings Group */}
          <div className="flex flex-col gap-4">
            {[node.person, ...node.siblings].map((p, idx) => (
              <div 
                key={p.id}
                className={cn(
                  "px-8 py-8 bg-white border-2 rounded-[3rem] min-w-[220px] text-center shadow-md relative z-10 group transition-all duration-1000",
                  debugMode ? "border-red-200" : "border-stone-200 hover:border-amber-300"
                )}
              >
                {debugMode && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-30 whitespace-nowrap">
                    LEVEL: {node.level} {idx > 0 ? '(Sib)' : ''}
                  </div>
                )}

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    copyPersonDebugInfo(p, relationships);
                  }}
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-stone-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                >
                  <Bug className="w-4 h-4" />
                </button>

                <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-50 mx-auto mb-4 border-4 border-white shadow-inner ring-1 ring-stone-100">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <span className="text-2xl font-serif font-bold opacity-20">{p.name[0]}</span>
                    </div>
                  )}
                </div>
                <p className="text-xl font-serif font-bold text-stone-800 leading-tight">
                  {formatDisplayName(p.name)}
                </p>
                <p className="text-[10px] font-bold text-stone-400 mt-2 uppercase tracking-[0.2em]">
                  {p.birthYear || '????'} — {p.isLiving ? 'Present' : (p.deathYear || '????')}
                </p>
              </div>
            ))}
          </div>

          {/* Spouses */}
          {node.spouses.map(spouse => (
            <React.Fragment key={spouse.id}>
              <div className="w-16 h-px bg-stone-200 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FDFCF9] p-1.5 rounded-full border border-stone-100">
                  <Heart className="w-3 h-3 text-red-300 fill-current" />
                </div>
              </div>
              <div className={cn(
                "px-8 py-8 bg-stone-50/60 border-2 rounded-[3rem] min-w-[220px] text-center italic shadow-sm group transition-all duration-1000 relative",
                debugMode ? "border-red-100" : "border-stone-200 hover:border-amber-200"
              )}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    copyPersonDebugInfo(spouse, relationships);
                  }}
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-stone-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                >
                  <Bug className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white mx-auto mb-4 border-2 border-white shadow-inner ring-1 ring-stone-100">
                  {spouse.photoUrl ? (
                    <img src={spouse.photoUrl} className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-1000" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-100">
                      <span className="text-xl font-serif font-bold opacity-20">{spouse.name[0]}</span>
                    </div>
                  )}
                </div>
                <p className="text-lg font-serif font-medium text-stone-600 leading-tight">
                  {formatDisplayName(spouse.name)}
                </p>
                <p className="text-[9px] font-bold text-stone-300 mt-2 uppercase tracking-widest">Spouse</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-16 bg-stone-200" />
          <div className="flex gap-24 relative pt-16 border-t-2 border-stone-200 rounded-t-[4rem]">
            {node.children.map((child) => (
              <div key={child.id} className="relative">
                <SimpleNode node={child} debugMode={debugMode} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SimpleTreeLayout = ({ roots, debugMode }: { roots: TreeNode[], debugMode?: boolean }) => {
  const rootsByLevel = roots.reduce((acc, root) => {
    if (!acc[root.level]) acc[root.level] = [];
    acc[root.level].push(root);
    return acc;
  }, {} as Record<number, TreeNode[]>);

  return (
    <div className="flex flex-col items-center gap-80 py-40">
      {Object.entries(rootsByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, levelRoots]) => (
        <div key={level} className="flex gap-64 items-start">
          {levelRoots.map(root => (
            <SimpleNode key={root.id} node={root} debugMode={debugMode} />
          ))}
        </div>
      ))}
    </div>
  );
};