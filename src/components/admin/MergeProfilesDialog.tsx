"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GitMerge, ArrowRight, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MergeProfilesDialog = () => {
  const { people, refreshData } = useFamily();
  const [isOpen, setIsOpen] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const sourcePerson = useMemo(() => people.find(p => p.id === sourceId), [people, sourceId]);
  const targetPerson = useMemo(() => people.find(p => p.id === targetId), [people, targetId]);

  const handleMerge = async () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    
    setIsProcessing(true);
    try {
      // 1. Move relationships
      await supabase.from('relationships').update({ person_id: targetId }).eq('person_id', sourceId);
      await supabase.from('relationships').update({ related_person_id: targetId }).eq('related_person_id', sourceId);
      
      // 2. Move memories
      await supabase.from('memories').update({ person_id: targetId }).eq('person_id', sourceId);
      
      // 3. Move suggestions
      await supabase.from('suggestions').update({ person_id: targetId }).eq('person_id', sourceId);

      // 4. Copy missing data from source to target if target is empty
      const updates: any = {};
      if (!targetPerson?.maidenName && sourcePerson?.maidenName) updates.maiden_name = sourcePerson.maidenName;
      if (!targetPerson?.birthDate && sourcePerson?.birthDate) updates.birth_date = sourcePerson.birthDate;
      if (!targetPerson?.birthPlace && sourcePerson?.birthPlace) updates.birth_place = sourcePerson.birthPlace;
      if (!targetPerson?.occupation && sourcePerson?.occupation) updates.occupation = sourcePerson.occupation;
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('people').update(updates).eq('id', targetId);
      }

      // 5. Delete the source (duplicate)
      const { error: deleteError } = await supabase.from('people').delete().eq('id', sourceId);
      if (deleteError) throw deleteError;

      toast.success("Profiles merged successfully!");
      setIsOpen(false);
      setSourceId('');
      setTargetId('');
      await refreshData();
    } catch (error: any) {
      toast.error("Merge failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-stone-50">
          <GitMerge className="w-4 h-4" /> Merge Duplicates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none bg-stone-50 p-10">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-stone-800 flex items-center gap-3">
            <GitMerge className="w-6 h-6 text-amber-500" />
            Merge Profiles
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-lg">
            Combine two records into one. All stories and connections will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Duplicate Profile (To Delete)</label>
              <Select onValueChange={setSourceId} value={sourceId}>
                <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14">
                  <SelectValue placeholder="Select duplicate..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {people.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.memories.length} stories)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sourcePerson && (
              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 text-xs text-red-700 italic">
                This record will be removed.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Primary Profile (To Keep)</label>
              <Select onValueChange={setTargetId} value={targetId}>
                <SelectTrigger className="bg-white border-stone-200 rounded-2xl h-14">
                  <SelectValue placeholder="Select primary..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {people.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.userId ? '👤' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {targetPerson && (
              <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100 text-xs text-green-700 italic">
                This record will receive all data.
              </div>
            )}
          </div>
        </div>

        {sourcePerson && targetPerson && (
          <div className="bg-white p-6 rounded-3xl border-2 border-amber-100 flex items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-2">
            <div className="text-center flex-1">
              <p className="font-bold text-stone-800">{sourcePerson.name}</p>
              <p className="text-[10px] text-stone-400 uppercase">Source</p>
            </div>
            <ArrowRight className="w-6 h-6 text-amber-500" />
            <div className="text-center flex-1">
              <p className="font-bold text-stone-800">{targetPerson.name}</p>
              <p className="text-[10px] text-stone-400 uppercase">Destination</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button 
            className="w-full h-20 rounded-[2rem] bg-stone-800 hover:bg-stone-900 text-white text-2xl font-bold shadow-xl gap-4"
            onClick={handleMerge}
            disabled={!sourceId || !targetId || sourceId === targetId || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CheckCircle2 className="w-8 h-8" /> Confirm Merge</>}
          </Button>
          <Button variant="ghost" className="w-full h-12 text-stone-400" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MergeProfilesDialog;