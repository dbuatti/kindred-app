"use client";

import React, { useState } from 'react';
import { EducationRecord } from '@/types';
import { useFamily } from '@/context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Plus, Trash2, MapPin, Calendar, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EducationManagerProps {
  personId: string;
  records: EducationRecord[];
}

const EducationManager = ({ personId, records }: EducationManagerProps) => {
  const { addEducation, deleteEducation } = useFamily();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    location: '',
    degree: '',
    startYear: '',
    endYear: ''
  });

  const handleAdd = async () => {
    if (!formData.schoolName) return;
    await addEducation({
      personId,
      ...formData
    });
    setFormData({ schoolName: '', location: '', degree: '', startYear: '', endYear: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
            Education History
          </h3>
        </div>
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-stone-800 hover:bg-stone-900 text-white rounded-full h-10 px-5 text-xs font-bold uppercase tracking-widest gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="bg-amber-50/30 p-8 rounded-[2rem] border-2 border-amber-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 relative">
            <button 
              onClick={() => setIsAdding(false)}
              className="absolute top-4 right-4 p-2 text-amber-400 hover:text-amber-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">School or University</label>
                <Input 
                  value={formData.schoolName}
                  onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                  placeholder="e.g. University of Melbourne"
                  className="bg-white border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">Degree or Field of Study</label>
                <Input 
                  value={formData.degree}
                  onChange={(e) => setFormData({...formData, degree: e.target.value})}
                  placeholder="e.g. Bachelor of Arts"
                  className="bg-white border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">Location</label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Victoria, Australia"
                  className="bg-white border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">Start Year</label>
                  <Input 
                    value={formData.startYear}
                    onChange={(e) => setFormData({...formData, startYear: e.target.value})}
                    placeholder="1990"
                    className="bg-white border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">End Year</label>
                  <Input 
                    value={formData.endYear}
                    onChange={(e) => setFormData({...formData, endYear: e.target.value})}
                    placeholder="1994"
                    className="bg-white border-none rounded-2xl h-12 text-base px-4 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleAdd}
                disabled={!formData.schoolName}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl h-14 text-sm font-bold uppercase tracking-widest shadow-lg"
              >
                Save Education Entry
              </Button>
            </div>
          </div>
        )}

        {records.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-stone-50/50 rounded-[2rem] border-2 border-dashed border-stone-100">
            <p className="text-stone-400 italic text-sm">No education records added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-center justify-between group hover:border-amber-200 transition-all">
                <div className="space-y-2">
                  <p className="text-lg font-serif font-bold text-stone-800">{record.schoolName}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                    {record.degree && <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md"><BookOpen className="w-3 h-3" /> {record.degree}</span>}
                    {record.location && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {record.location}</span>}
                    {(record.startYear || record.endYear) && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {record.startYear || '?'}{record.endYear ? ` — ${record.endYear}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteEducation(record.id)}
                  className="h-10 w-10 rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationManager;