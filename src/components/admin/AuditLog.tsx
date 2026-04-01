"use client";

import React, { useState, useMemo } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { formatDistanceToNow } from 'date-fns';
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
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

const AuditLog = () => {
  const { activityLogs, people, profiles } = useFamily();
  const [hideLogins, setHideLogins] = useState(true);

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
      case 'login': return <LogIn className="w-4 h-4 text-blue-500" />;
      case 'signup': return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case 'add_person': return <Plus className="w-4 h-4 text-green-500" />;
      case 'edit_person': return <Edit3 className="w-4 h-4 text-amber-500" />;
      case 'delete_person': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'add_memory': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'warm_memory': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'add_relationship': return <Link2 className="w-4 h-4 text-cyan-500" />;
      case 'resolve_suggestion': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Activity className="w-4 h-4 text-stone-400" />;
    }
  };

  const filteredLogs = useMemo(() => {
    let logs = activityLogs;
    if (hideLogins) {
      logs = logs.filter(l => l.event_type !== 'login');
    }
    return logs.slice(0, 50);
  }, [activityLogs, hideLogins]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end px-2">
        <div className="flex items-center gap-3 bg-stone-100/50 px-4 py-2 rounded-2xl border border-stone-200/40">
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

      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-stone-100">
            <p className="text-stone-400 font-serif italic text-xl">No activity recorded yet...</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2">
              <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center shrink-0 border border-stone-100">
                {getIcon(log.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base text-stone-700 leading-relaxed">
                  {getLogMessage(log)}
                </p>
                <p className="text-[10px] text-stone-300 uppercase tracking-[0.2em] mt-1 font-bold">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLog;