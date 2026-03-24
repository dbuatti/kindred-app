"use client";

import React, { useState } from 'react';
import { EducationRecord } from '@/types';
import { useFamily } from '@/context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Plus, Trash2, MapPin, Calendar, BookOpen } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
          <GraduationCap className="w-3 h-3" /> Education History
        </h3>
        {!isAdding && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="text-amber-600 hover:bg-amber-50 rounded-full h-8 px-3 text-[10px] font-bold uppercase tracking-widest"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Entry
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="font-bold text-stone-800">{record.schoolName}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                {record.degree && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {record.degree}</span>}
                {record.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {record.location}</span>}
                {(record.startYear || record.endYear) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {record.startYear || '?'}{record.endYear ? ` — ${record.endYear}` : ''}
                  </span>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => deleteEducation(record.id)}
              className="h-8 w-8 rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="bg-amber-50/30 p-6 rounded-3xl border-2 border-amber-100 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">School Name</label>
                <Input 
                  value={formData.schoolName}
                  onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                  placeholder="e.g. University of Melbourne"
                  className="bg-white border-none rounded-xl h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">Degree / Study</label>
                <Input 
                  value={formData.degree}
                  onChange={(e) => setFormData({...formData, degree: e.target.value})}
                  placeholder="e.g. Bachelor of Arts"
                  className="bg-white border-none rounded-xl h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">Location</label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Victoria, Australia"
                  className="bg-white border-none rounded-xl h-10 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">Start Year</label>
                  <Input 
                    value={formData.startYear}
                    onChange={(e) => setFormData({...formData, startYear: e.target.value})}
                    placeholder="1990"
                    className="bg-white border-none rounded-xl h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 ml-2">End Year</label>
                  <Input 
                    value={formData.endYear}
                    onChange={(e) => setFormData({...formData, endYear: e.target.value})}
                    placeholder="1994"
                    className="bg-white border-none rounded-xl h-10 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleAdd}
                disabled={!formData.schoolName}
                className="flex-1 bg-stone-800 hover:bg-stone-900 text-white rounded-xl h-10 text-xs font-bold uppercase tracking-widest"
              >
                Save Entry
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsAdding(false)}
                className="px-4 text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {records.length === 0 && !isAdding && (
          <p className="text-stone-400 italic text-xs text-center py-4">No education records added yet.</p>
        )}
      </div>
    </div>
  );
};

export default EducationManager;