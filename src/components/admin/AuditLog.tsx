"use client";

import React, { useState, useMemo } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from 'date-fns';
import { 
  User, 
  Edit3, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Heart, 
  Link2, 
  CheckCircle2, 
  LogIn,
  Activity,
  UserCheck,
  Search,
  X,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const AuditLog = () => {
  const { activityLogs, people, profiles } = useFamily();
  const [hideLogins, setHideLogins] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const getPersonName = (id: string) => {
    return people.find(p => p.id === id)?.name || 'Unknown Person';
  };

  const getLogMessage = (log: any) => {
    const profile = profiles[log.user_id];
    const userName = profile ? `${profile.first_name} ${profile.last_name}` : log.user_email?.split('@')[0] || 'Someone';
    const details = log.details || {};

    switch (log.event_type) {
      case 'login':
        return <span><strong>{userName}</strong> signed into the archive.</span>;
      case 'add_person':
        return <span><strong>{userName}</strong> added <strong>{details.name}</strong> to the family.</span>;
      case 'edit_person':
        const fields = details.fields?.map((f: string) => f.replace('_', ' ')).join(', ') || 'details';
        return <span><strong>{userName}</strong> updated {fields} for <strong>{getPersonName(details.personId)}</strong>.</span>;
      case 'delete_person':
        return <span><strong>{userName}</strong> removed a record from the archive.</span>;
      case 'add_memory':
        const target = details.personId === 'general' ? 'the family lore' : getPersonName(details.personId);
        return <span><strong>{userName}</strong> shared a {details.type} story about <strong>{target}</strong>.</span>;
      case 'add_comment':
        return <span><strong>{userName}</strong> added a comment to a story.</span>;
      case 'warm_memory':
        return <span><strong>{userName}</strong> warmed a family story.</span>;
      case 'add_suggestion':
        return <span><strong>{userName}</strong> suggested an edit for <strong>{getPersonName(details.personId)}</strong>.</span>;
      case 'add_relationship':
        return <span><strong>{userName}</strong> linked <strong>{getPersonName(details.personId)}</strong> and <strong>{getPersonName(details.relatedId)}</strong>.</span>;
      case 'resolve_suggestion':
        return <span><strong>{userName}</strong> {details.status} a suggested edit.</span>;
      case 'signup':
        return <span><strong>{userName}</strong> joined the family archive.</span>;
      default:
        return <span><strong>{userName}</strong> performed an action: {log.event_type.replace('_', ' ')}.</span>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="w-3.5 h-3.5 text-blue-500" />;
      case 'signup': return <UserCheck className="w-3.5 h-3.5 text-indigo-500" />;
      case 'add_person': return <Plus className="w-3.5 h-3.5 text-green-500" />;
      case 'edit_person': return <Edit3 className="w-3.5 h-3.5 text-amber-500" />;
      case 'delete_person': return <Trash2 className="w-3.5 h-3.5 text-red-500" />;
      case 'add_memory': return <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />;
      case 'warm_memory': return <Heart className="w-3.5 h-3.5 text-pink-500" />;
      case 'add_relationship': return <Link2 className="w-3.5 h-3.5 text-cyan-500" />;
      case 'resolve_suggestion': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Activity className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  const filteredLogs = useMemo(() => {
    let logs = activityLogs;
    
    if (hideLogins) {
      logs = logs.filter(l => l.event_type !== 'login');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(l => {
        const profile = profiles[l.user_id];
        const userName = profile ? `${profile.first_name} ${profile.last_name}` : l.user_email;
        const details = JSON.stringify(l.details || {}).toLowerCase();
        return (
          userName?.toLowerCase().includes(q) || 
          l.event_type.toLowerCase().includes(q) ||
          details.includes(q)
        );
      });
    }

    return logs;
  }, [activityLogs, hideLogins, searchQuery, profiles]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredLogs.forEach(log => {
      const date = new Date(log.created_at);
      let dateKey = format(date, 'yyyy-MM-dd');
      
      if (isToday(date)) dateKey = 'Today';
      else if (isYesterday(date)) dateKey = 'Yesterday';
      else dateKey = format(date, 'MMMM d, yyyy');

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });

    return groups;
  }, [filteredLogs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input 
            placeholder="Search by user, action, or person..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-stone-50 border-none rounded-xl text-sm focus-visible:ring-amber-500/20"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
          <Label htmlFor="hide-logins" className="text-[10px] font-bold uppercase tracking-widest text-stone-500 cursor-pointer">
            {hideLogins ? "Show Login Events" : "Hide Login Events"}
          </Label>
          <Switch 
            id="hide-logins" 
            checked={hideLogins} 
            onCheckedChange={setHideLogins}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
      </div>

      <div className="space-y-10">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-stone-100">
            <p className="text-stone-400 font-serif italic text-xl">No activity matches your search...</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([date, logs]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-[0.2em]">{date}</h3>
                <div className="h-px flex-1 bg-stone-100" />
              </div>

              <div className="space-y-1 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-100">
                {logs.map((log) => (
                  <div key={log.id} className="group relative pl-12 py-3 transition-all hover:bg-stone-50/50 rounded-2xl">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-2 border-stone-50 flex items-center justify-center z-10 shadow-sm group-hover:border-amber-100 transition-colors">
                      {getIcon(log.event_type)}
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pr-4">
                      <p className="text-sm text-stone-700 leading-relaxed">
                        {getLogMessage(log)}
                      </p>
                      <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest whitespace-nowrap">
                        {format(new Date(log.created_at), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLog;