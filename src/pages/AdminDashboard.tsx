import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp,
  UserCircle,
  Mail,
  Clock,
  ChevronRight,
  Edit3,
  Trash2,
  UserPlus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { getPersonUrl } from '@/lib/slugify';
import EditPersonDialog from '../components/EditPersonDialog';
import AddPersonDialog from '../components/AddPersonDialog';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { people, suggestions, profiles, user, loading } = useFamily();

  // Access Control
  if (!loading && user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/" />;
  }

  const totalMemories = people.reduce((acc, p) => acc + p.memories.length, 0);
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length;
  
  // Get recent activity (last 5 memories)
  const recentMemories = people
    .flatMap(p => p.memories.map(m => ({ ...m, personName: p.name, personId: p.id })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Prepare data for a simple chart: Memories per person
  const chartData = people.map(p => ({
    name: p.name.split(' ')[0],
    memories: p.memories.length
  })).sort((a, b) => b.memories - a.memories).slice(0, 5);

  const COLORS = ['#d97706', '#b45309', '#92400e', '#78350f', '#451a03'];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans pb-20">
      <header className="sticky top-0 z-10 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-stone-100 shadow-sm rounded-[2rem] space-y-2">
            <div className="h-10 w-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-serif font-medium text-stone-800">{people.length}</p>
              <p className="text-stone-400 text-xs uppercase tracking-widest">Total People</p>
            </div>
          </Card>
          <Card className="p-6 bg-white border-stone-100 shadow-sm rounded-[2rem] space-y-2">
            <div className="h-10 w-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-serif font-medium text-stone-800">{totalMemories}</p>
              <p className="text-stone-400 text-xs uppercase tracking-widest">Stories Shared</p>
            </div>
          </Card>
          <Card className="p-6 bg-amber-50/50 border-amber-100 shadow-sm rounded-[2rem] space-y-2">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-serif font-medium text-amber-900">{pendingSuggestions}</p>
              <p className="text-amber-700/60 text-xs uppercase tracking-widest">Pending Edits</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Chart */}
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

          {/* Recent Activity Feed */}
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

        {/* Manage People */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-400" />
              Manage Archive Entries
            </h2>
            <AddPersonDialog />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Family Profiles */}
        <div className="space-y-6">
          <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-stone-400" />
            Family Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(profiles).map((profile: any) => (
              <Card key={profile.id} className="p-6 bg-white border-stone-100 shadow-sm rounded-3xl flex items-center justify-between group hover:border-amber-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {profile.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-stone-400 hover:text-stone-600 rounded-xl">
                  View
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;