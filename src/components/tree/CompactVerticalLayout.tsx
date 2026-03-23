"use client";

import React, { useState } from 'react';
import { TreeNode } from '@/lib/tree-utils';
import { formatDisplayName } from '@/lib/utils';
import EditPersonDialog from '../EditPersonDialog';
import { Person } from '@/types';

const CompactNode = ({ node, onSelect }: { node: TreeNode, onSelect: (p: Person) => void }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {/* Main Person */}
        <button 
          onClick={() => onSelect(node.person)}
          className="px-4 py-2 bg-white border border-stone-200 rounded-md shadow-sm min-w-[140px] text-center hover:border-amber-500 transition-colors"
        >
          <p className="text-[11px] font-bold text-stone-800 truncate">
            {formatDisplayName(node.person.name)}
          </p>
          <p className="text-[9px] text-stone-400 font-mono">
            {node.person.birthYear || '????'} — {node.person.isLiving ? 'Pres.' : (node.person.deathYear || '????')}
          </p>
        </button>

        {/* Spouses */}
        {node.spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <div className="w-4 h-px bg-stone-300" />
            <button 
              onClick={() => onSelect(spouse)}
              className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-md shadow-sm min-w-[140px] text-center italic hover:border-amber-500 transition-colors"
            >
              <p className="text-[11px] font-bold text-stone-600 truncate">
                {formatDisplayName(spouse.name)}
              </p>
              <p className="text-[8px] text-stone-400 uppercase tracking-tighter">Spouse</p>
            </button>
          </React.Fragment>
        ))}

        {/* Siblings */}
        {node.siblings.map(sib => (
          <React.Fragment key={sib.id}>
            <div className="w-4 h-px bg-stone-300 border-dashed" />
            <button 
              onClick={() => onSelect(sib)}
              className="px-4 py-2 bg-white border border-stone-200 border-dashed rounded-md shadow-sm min-w-[140px] text-center hover:border-amber-500 transition-colors"
            >
              <p className="text-[11px] font-bold text-stone-500 truncate">
                {formatDisplayName(sib.name)}
              </p>
              <p className="text-[8px] text-stone-300 uppercase tracking-tighter">Sibling</p>
            </button>
          </React.Fragment>
        ))}
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-stone-300" />
          <div className="flex gap-4 pt-0 relative">
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-stone-300" />
                {node.children.length > 1 && (
                  <div 
                    className="absolute top-0 h-px bg-stone-300" 
                    style={{ 
                      left: idx === 0 ? '50%' : '0', 
                      right: idx === node.children.length - 1 ? '50%' : '0' 
                    }} 
                  />
                )}
                <CompactNode node={child} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CompactVerticalLayout = ({ roots }: { roots: TreeNode[] }) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  return (
    <div className="p-20 bg-[#faf9f6] min-h-full flex flex-col items-center gap-20 min-w-full">
      {roots.map(root => (
        <CompactNode key={root.id} node={root} onSelect={setSelectedPerson} />
      ))}

      {selectedPerson && (
        <EditPersonDialog 
          person={selectedPerson} 
          open={!!selectedPerson} 
          onOpenChange={(open) => !open && setSelectedPerson(null)} 
        />
      )}
    </div>
  );
};