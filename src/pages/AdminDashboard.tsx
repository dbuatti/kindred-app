import React, { useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp,
  UserCircle,
  Clock,
  ChevronRight,
  Link as LinkIcon,
  Activity,
  LogIn,
  UserPlus,
  Edit3,
  Heart,
  GitMerge,
  Brain,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { formatDistanceToNow, format, subDays, isSameDay } from 'date-fns';
import { getPersonUrl } from '@/lib/slugify';
import EditPersonDialog from '../components/EditPersonDialog';
import AddPersonDialog from '../components/AddPersonDialog';
import AdminStats from '../components/admin/AdminStats';
import MergeProfilesDialog from '../components/admin/MergeProfilesDialog';
import AuditLog from '../components/admin/AuditLog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { people, suggestions, user, loading, activityLogs, profiles } = useFamily();

  if (!loading && user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/" />;
  }

  const handleCopyInvite = (person: any) => {
    const inviteUrl = `${window.location.origin}/join?token=${person.inviteToken}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success(`Invite link for ${person.name} copied!`);
  };

  const totalMemories = people.reduce((acc, p) => acc + p.memories.length, 0);
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length;
  
  const recentMemories = people
    .flatMap(p => p.memories.map(m => ({ ...m, personName: p.name, personId: p.id })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const chartData = people.map(p => ({
    name: p.name.split(' ')[0],
    memories: p.memories.length
  })).sort((a, b) => b.memories - a.memories).slice(0, 5);

  // Engagement Data
  const engagementStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
    
    return last7Days.map(day => {
      const dayLogs = activityLogs.filter(log => isSameDay(new Date(log.created_at), day));
      return {
        date: format(day, 'MMM d'),
        logins: dayLogs.filter(l => l.event_type === 'login').length,
        edits: dayLogs.filter(l => ['edit_person', 'add_memory', 'add_suggestion'].includes(l.event_type)).length,
        newMembers: dayLogs.filter(l => l.event_type === 'signup' || l.event_type === 'add_person').length
      };
    });
  }, [activityLogs]);

  const COLORS = ['#d97706', '#b45309', '#92400e', '#78350f', '#451a03'];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans pb-20">
      <header className="sticky top-0 z-10 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="rounded-full text-stone-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-medium text-stone-800">Admin Zone</h1>
              <p className="text-stone-400 text-xs uppercase tracking-widest font-medium">Archive Oversight</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            Authorized Access
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-stone-100 p-1 rounded-2xl h-14 w-full md:w-auto">
              <TabsTrigger value="overview" className="rounded-xl px-6 data-[state=active]:bg-white">Overview</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-xl px-6 data-[state=active]:bg-white">Audit Log</TabsTrigger>
              <TabsTrigger value="engagement" className="rounded-xl px-6 data-[state=active]:bg-white">Engagement</TabsTrigger>
              <TabsTrigger value="people" className="rounded-xl px-6 data-[state=active]:bg-white">People</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://grok.com/c/9e022c38-65a8-4b46-8ea0-704425917767?rid=926a95ed-96e6-45f6-8f55-a0216d1452c1', '_blank')}
                className="rounded-full border-indigo-100 text-indigo-600 hover:bg-indigo-50 gap-2 h-10 px-4"
              >
                <Brain className="w-4 h-4" /> Grok Research
              </Button>
              <MergeProfilesDialog />
              <AddPersonDialog />
            </div>
          </div>

          <TabsContent value="overview" className="space-y-10">
            <AdminStats 
              totalPeople={people.length} 
              totalMemories={totalMemories} 
              pendingSuggestions={pendingSuggestions} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 bg-white border-stone-100 shadow-sm rounded-[3rem] space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    Most Remembered
                  </h2>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#a8a29e', fontSize: 12 }}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: '#fafaf9' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="memories" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-8 bg-white border-stone-100 shadow-sm rounded-[3rem] space-y-6">
                <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-stone-400" />
                  Recent Stories
                </h2>
                <div className="space-y-4">
                  {recentMemories.map((memory) => (
                    <div 
                      key={memory.id} 
                      className="flex items-start gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer" 
                      onClick={() => navigate(getPersonUrl(memory.personId, memory.personName))}
                    >
                      <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">About {memory.personName}</p>
                        <p className="text-xs text-stone-500 line-clamp-1 italic">"{memory.content}"</p>
                        <p className="text-[10px] text-stone-400 mt-1">
                          {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-300 self-center" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <div className="flex items-center justify-between border-b-4 border-stone-100 pb-4">
              <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
                <History className="w-6 h-6 text-stone-400" />
                Archive Audit Log
              </h2>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Real-time updates</span>
            </div>
            <AuditLog />
          </TabsContent>

          <TabsContent value="engagement" className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 p-8 bg-white border-stone-100 shadow-sm rounded-[3rem] space-y-6">
                <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Activity Trends (Last 7 Days)
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                      <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Logins" />
                      <Line type="monotone" dataKey="edits" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Edits" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-8 bg-white border-stone-100 shadow-sm rounded-[3rem] space-y-6">
                <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-stone-400" />
                  Live Feed
                </h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {activityLogs.map((log) => {
                    const profile = profiles[log.user_id];
                    const name = profile ? `${profile.first_name} ${profile.last_name}` : log.user_email?.split('@')[0] || 'Someone';
                    
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50/50 border border-stone-100">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                          log.event_type === 'login' ? "bg-blue-50 text-blue-500" :
                          log.event_type === 'add_memory' ? "bg-amber-50 text-amber-500" :
                          "bg-stone-100 text-stone-400"
                        )}>
                          {log.event_type === 'login' ? <LogIn className="w-4 h-4" /> :
                           log.event_type === 'add_memory' ? <MessageSquare className="w-4 h-4" /> :
                           log.event_type === 'edit_person' ? <Edit3 className="w-4 h-4" /> :
                           log.event_type === 'warm_memory' ? <Heart className="w-4 h-4" /> :
                           <Activity className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-800">{name}</p>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                            {log.event_type.replace('_', ' ')}
                          </p>
                          <p className="text-[9px] text-stone-300 mt-0.5">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-stone-400" />
                Manage Archive Entries
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {people.map((person) => (
                <Card key={person.id} className="p-6 bg-white border-stone-100 shadow-sm rounded-3xl flex items-center justify-between group hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-100 shrink-0">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.5]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <UserCircle className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{person.name}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                        {person.memories.length} memories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!person.userId && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCopyInvite(person)}
                        className="rounded-full text-amber-600 hover:bg-amber-50"
                        title="Copy Invite Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <EditPersonDialog person={person} />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate(getPersonUrl(person.id, person.name))}
                      className="rounded-full text-stone-400 hover:text-stone-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;