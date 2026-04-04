"use client";

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  UserCircle, 
  Edit3, 
  ShieldCheck, 
  LogOut, 
  Mail,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Check,
  X,
  Briefcase,
  Heart,
  UploadCloud,
  Camera,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { getPersonUrl } from '@/lib/slugify';
import ConnectionSuggestionDialog from '../components/ConnectionSuggestionDialog';
import AddMemoryDialog from '../components/AddMemoryDialog';
import FloatingMenu from '../components/FloatingMenu';
import ProfileChecklist from '../components/ProfileChecklist';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useImageUpload } from '@/hooks/use-image-upload';
import { usePersonRelatives } from '@/hooks/use-person-relatives';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profiles, people, relationships, suggestions, resolveSuggestion, updatePerson, loading } = useFamily();

  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const profile = user ? profiles[user.id] : null;
  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const myPerson = useMemo(() => {
    return people.find(p => p.userId === user?.id);
  }, [people, user]);

  const relatives = usePersonRelatives(myPerson || null, people, relationships);

  const mySuggestions = useMemo(() => {
    if (!myPerson) return [];
    return suggestions.filter(s => s.personId === myPerson.id && s.status === 'pending');
  }, [myPerson, suggestions]);

  const { 
    isDragging: isDraggingOverPage, 
    onDragOver: onDragOverPage, 
    onDragLeave: onDragLeavePage, 
    onDrop: onDropPage,
    previewUrl: droppedImage
  } = useImageUpload(() => setIsAddMemoryOpen(true));

  const {
    isDragging: isDraggingOverProfile,
    onDragOver: onProfileDragOver,
    onDragLeave: onProfileDragLeave,
    onDrop: onProfileDrop
  } = useImageUpload(async (base64) => {
    if (myPerson) {
      await updatePerson(myPerson.id, { photoUrl: base64 });
      toast.success("Profile photo updated!");
    }
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleResetOnboarding = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: false })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Onboarding reset! Signing you out to start fresh...");
      await supabase.auth.signOut();
      navigate('/join');
    } catch (error: any) {
      toast.error("Failed to reset: " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Loading your hub...</div>;

  const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'Family Member';

  return (
    <div 
      className="min-h-screen bg-[#FDFCF9] pb-32 relative"
      onDragOver={onDragOverPage}
      onDragLeave={onDragLeavePage}
      onDrop={onDropPage}
    >
      {isDraggingOverPage && !isDraggingOverProfile && (
        <div className="fixed inset-0 z-50 bg-amber-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-amber-500 flex flex-col items-center gap-4 scale-105 transition-transform">
            <UploadCloud className="w-16 h-16 text-amber-600 animate-bounce" />
            <p className="text-2xl font-serif font-bold text-stone-800">Drop to share a photo</p>
          </div>
        </div>
      )}

      <header className="bg-white border-b-4 border-stone-100 px-6 py-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')} 
              className="rounded-full h-10 w-10 text-stone-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-stone-800">Your Hub</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin')}
                className="text-amber-600 hover:bg-amber-50 rounded-full gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="text-red-500 hover:bg-red-50 rounded-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <section className="flex flex-col md:flex-row gap-10 items-start">
          <div 
            className={cn(
              "relative group shrink-0 w-40 h-40 rounded-full overflow-hidden shadow-xl ring-4 transition-all duration-300",
              isDraggingOverProfile ? "ring-amber-500 scale-105 shadow-amber-200" : "ring-white"
            )}
            onDragOver={onProfileDragOver}
            onDragLeave={onProfileDragLeave}
            onDrop={onProfileDrop}
          >
            <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
              {myPerson?.photoUrl ? (
                <img src={myPerson.photoUrl} className="w-full h-full object-cover grayscale-[0.2]" />
              ) : (
                <UserCircle className="w-24 h-24" />
              )}
            </div>
            
            {isDraggingOverProfile && (
              <div className="absolute inset-0 bg-amber-600/40 flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-white animate-bounce" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group/overlay cursor-pointer">
              <Camera className="w-8 h-8 text-white opacity-0 group-hover/overlay:opacity-100 transition-opacity" />
            </div>

            <Button 
              size="icon" 
              onClick={() => navigate('/edit-profile')}
              className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg border-4 border-white z-10"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-serif font-bold text-stone-800">{fullName}</h2>
                {profile?.nickname && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none rounded-full px-3">
                    "{profile.nickname}"
                  </Badge>
                )}
              </div>
              <p className="text-stone-500 text-lg italic flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user?.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-stone-600">
              {profile?.birth_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span>Born {new Date(profile.birth_date).toLocaleDateString()}</span>
                </div>
              )}
              {profile?.birth_place && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <span>{profile.birth_place}</span>
                </div>
              )}
              {profile?.occupation && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                  <span>{profile.occupation}</span>
                </div>
              )}
            </div>

            {profile?.bio && (
              <div className="bg-stone-100/50 p-6 rounded-3xl border border-stone-100 relative">
                <Heart className="absolute -top-2 -right-2 w-8 h-8 text-amber-600/10 fill-current" />
                <p className="text-stone-700 font-serif italic leading-relaxed">
                  "{profile.bio}"
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {myPerson && <ProfileChecklist person={myPerson} />}

            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
                  <Users className="w-6 h-6 text-stone-400" />
                  Your Connections
                </h3>
                {myPerson && <ConnectionSuggestionDialog person={myPerson} />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatives.length === 0 ? (
                  <Card className="p-8 border-dashed border-2 border-stone-200 bg-transparent text-center space-y-4 md:col-span-2">
                    <p className="text-stone-400 italic">No connections mapped yet.</p>
                  </Card>
                ) : (
                  relatives.map((rel: any) => (
                    <Card 
                      key={rel.id} 
                      onClick={() => navigate(getPersonUrl(rel.id, rel.name))}
                      className="p-4 bg-white border-stone-100 shadow-sm rounded-2xl flex items-center justify-between group hover:border-amber-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-100 shrink-0">
                          {rel.photoUrl ? (
                            <img src={rel.photoUrl} className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <UserCircle className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">{rel.name}</p>
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{rel.type}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition-colors" />
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-stone-400" />
                Stories About You
              </h3>
              <div className="space-y-4">
                {myPerson?.memories.length === 0 ? (
                  <p className="text-stone-400 italic text-center py-8">No stories shared about you yet. Invite family to share!</p>
                ) : (
                  myPerson?.memories.map((memory) => (
                    <Card key={memory.id} className="p-6 bg-white border-stone-100 shadow-sm rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          Shared by {memory.authorName}
                        </span>
                        <span className="text-[10px] text-stone-300">
                          {new Date(memory.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-stone-700 font-serif italic leading-relaxed">"{memory.content}"</p>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-500" />
                Pending Reviews
              </h3>
              
              {mySuggestions.length === 0 ? (
                <Card className="p-8 bg-stone-50 border-none rounded-[2rem] text-center">
                  <p className="text-stone-400 text-sm italic">No pending suggestions for your profile.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {mySuggestions.map(s => (
                    <Card key={s.id} className="p-6 bg-white border-amber-100 shadow-md rounded-3xl space-y-4 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Suggested Edit</p>
                        <p className="text-stone-700 font-serif italic">"{s.suggestedValue}"</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
                          onClick={() => resolveSuggestion(s.id, 'approved')}
                        >
                          <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 text-stone-400 hover:text-stone-600 rounded-xl"
                          onClick={() => resolveSuggestion(s.id, 'rejected')}
                        >
                          <X className="w-4 h-4 mr-2" /> Skip
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Quick Actions</h3>
              <Button 
                onClick={() => navigate('/edit-profile')}
                className="w-full h-16 bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-100 rounded-2xl shadow-sm justify-between px-6"
              >
                Edit Full Profile
                <ChevronRight className="w-4 h-4 text-stone-300" />
              </Button>
              <Button 
                onClick={() => navigate('/help')}
                className="w-full h-16 bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-100 rounded-2xl shadow-sm justify-between px-6"
              >
                How to use Kindred
                <ChevronRight className="w-4 h-4 text-stone-300" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleResetOnboarding}
                disabled={isResetting}
                className="w-full h-16 bg-amber-50/30 hover:bg-amber-50 text-amber-700 border-2 border-amber-100 border-dashed rounded-2xl shadow-sm justify-between px-6"
              >
                <span className="flex items-center gap-2">
                  {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Trial Onboarding Flow
                </span>
                <ChevronRight className="w-4 h-4 text-amber-300" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <FloatingMenu personId={myPerson?.id} personName={fullName} />
      <AddMemoryDialog 
        personId={myPerson?.id}
        personName={fullName} 
        open={isAddMemoryOpen}
        onOpenChange={setIsAddMemoryOpen}
        initialImage={droppedImage}
      />
    </div>
  );
};

export default Profile;