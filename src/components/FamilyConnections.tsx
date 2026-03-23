"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Person } from '../types';
import { getPersonUrl } from '@/lib/slugify';
import { Users, Heart, ArrowUp, ArrowDown, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FamilyConnectionsProps {
  person: Person;
  relatives: any[];
}

const FamilyConnections = ({ person, relatives }: FamilyConnectionsProps) => {
  const navigate = useNavigate();

  // Group relatives by their relationship type
  const grouped = relatives.reduce((acc, rel) => {
    const type = rel.type.toLowerCase();
    if (type.includes('mother') || type.includes('father')) {
      if (!acc.parents) acc.parents = [];
      acc.parents.push(rel);
    } else if (type.includes('son') || type.includes('daughter') || type.includes('child')) {
      if (!acc.children) acc.children = [];
      acc.children.push(rel);
    } else if (type.includes('spouse') || type.includes('wife') || type.includes('husband')) {
      if (!acc.spouse) acc.spouse = [];
      acc.spouse.push(rel);
    } else if (type.includes('sister') || type.includes('brother')) {
      if (!acc.siblings) acc.siblings = [];
      acc.siblings.push(rel);
    } else {
      if (!acc.others) acc.others = [];
      acc.others.push(rel);
    }
    return acc;
  }, {} as any);

  const RelativeNode = ({ rel, label }: { rel: any, label?: string }) => (
    <div 
      onClick={() => navigate(getPersonUrl(rel.id, rel.name))}
      className="flex flex-col items-center gap-2 group cursor-pointer animate-in fade-in zoom-in duration-500"
    >
      <div className="relative">
        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all duration-300">
          {rel.photoUrl ? (
            <img src={rel.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0" />
          ) : (
            <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300">
              <Users className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-stone-50">
          <span className="text-[8px] font-bold text-amber-600 uppercase tracking-tighter">
            {label || rel.type}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-stone-500 group-hover:text-stone-800 transition-colors">
        {rel.name.split(' ')[0]}
      </span>
    </div>
  );

  const hasConnections = Object.keys(grouped).length > 0;

  if (!hasConnections) return null;

  return (
    <div className="w-full py-12 space-y-12 border-y border-stone-100/50 bg-stone-50/30 rounded-[3rem] my-8">
      <div className="text-center space-y-1">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Family Connections</p>
        <h3 className="text-xl font-serif text-stone-800">The branches of {person.name.split(' ')[0]}'s life</h3>
      </div>

      <div className="max-w-2xl mx-auto relative px-6">
        {/* Parents Section */}
        {grouped.parents && (
          <div className="flex flex-col items-center gap-4 mb-12">
            <div className="flex justify-center gap-8">
              {grouped.parents.map((p: any) => <RelativeNode key={p.id} rel={p} />)}
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-stone-200 to-transparent" />
          </div>
        )}

        {/* Central Row: Person & Spouse */}
        <div className="flex items-center justify-center gap-8 md:gap-16 relative">
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-amber-100 shadow-xl ring-2 ring-white">
              {person.photoUrl ? (
                <img src={person.photoUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                  <Users className="w-10 h-10" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">Current Profile</span>
          </div>

          {grouped.spouse && (
            <div className="flex items-center gap-4 md:gap-8">
              <div className="flex flex-col items-center gap-1">
                <div className="h-px w-8 md:w-12 bg-stone-200" />
                <Heart className="w-3 h-3 text-red-300 fill-current" />
              </div>
              <div className="flex gap-6">
                {grouped.spouse.map((s: any) => <RelativeNode key={s.id} rel={s} />)}
              </div>
            </div>
          )}
        </div>

        {/* Siblings Section */}
        {grouped.siblings && (
          <div className="mt-12 space-y-4">
            <div className="flex justify-center">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {grouped.siblings.map((s: any) => <RelativeNode key={s.id} rel={s} />)}
            </div>
          </div>
        )}

        {/* Children Section */}
        {grouped.children && (
          <div className="flex flex-col items-center gap-4 mt-12">
            <div className="h-8 w-px bg-gradient-to-t from-stone-200 to-transparent" />
            <div className="flex flex-wrap justify-center gap-8">
              {grouped.children.map((c: any) => <RelativeNode key={c.id} rel={c} />)}
            </div>
          </div>
        )}

        {/* Other Relatives */}
        {grouped.others && (
          <div className="mt-16 pt-8 border-t border-stone-100">
            <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest text-center mb-6">Extended Family</p>
            <div className="flex flex-wrap justify-center gap-6">
              {grouped.others.map((o: any) => <RelativeNode key={o.id} rel={o} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyConnections;