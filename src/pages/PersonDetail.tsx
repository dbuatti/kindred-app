"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Quote, 
  Mic, 
  MessageSquare, 
  Play, 
  Clock, 
  Camera, 
  Edit3, 
  Share2, 
  ChevronRight, 
  UploadCloud, 
  Users, 
  ShieldCheck,
  MapPin,
  Calendar,
  Briefcase,
  Sparkles,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import AddMemoryDialog from '../components/AddMemoryDialog';
import SuggestionDialog from '../components/SuggestionDialog';
import ConnectionSuggestionDialog from '../components/ConnectionSuggestionDialog';
import FamilyConnections from '../components/FamilyConnections';
import EditPersonDialog from '../components/EditPersonDialog';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parsePersonIdFromSlug, getPersonUrl } from '@/lib/slugify';
import { getInverseRelationship } from '@/lib/relationships';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const PersonDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { people, user, relationships, updatePerson, loading } = useFamily();
  
  const shortId = useMemo(() => {
    return parsePersonIdFromSlug(slug);
  }, [slug]);

  const person = useMemo(() => {
    if (!shortId || loading) return null;
    const found = people.find(p => p.id.startsWith(shortId));
    return found;
  }, [shortId, people, loading]);

  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [droppedImage, setDroppedImage] = useState<string | null>(null);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const [isDraggingOverProfile, setIsDraggingOverProfile] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const relatives = useMemo(() => {
    if (!person || !relationships.length) return [];
    
    const seen = new Set();
    return relationships
      .filter(r => r.person_id === person.id || r.related_person_id === person.id)
      .map(r => {
        const isPrimary = r.person_id === person.id;
        const relativeId = isPrimary ? r.related_person_id : r.person_id;
        const relative = people.find(p => p.id === relativeId);
        
        if (!relative) return null;
        
        const type = isPrimary 
          ? r.relationship_type 
          : getInverseRelationship(r.relationship_type, person.gender);
          
        const key = `${relative.id}-${type}`;
        if (seen.has(key)) return null;
        seen.add(key);
        
        return {
          ...relative,
          type: type
        };
      })
      .filter(Boolean);
  }, [person, relationships, people]);

  const photos = useMemo(() => {
    if (!person) return [];
    return person.memories.filter(m => m.type === 'photo' && m.imageUrl);
  }, [person]);

  const handleMemoryFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDroppedImage(reader.result as string);
      setIsAddMemoryOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleProfilePhotoUpdate = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }
    if (!person) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await updatePerson(person.id, { photoUrl: base64 });
      toast.success("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  }, [person, updatePerson]);

  const onDragOverPage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverPage(true);
  };

  const onDragLeavePage = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDraggingOverPage(false);
    }
  };

  const onDropPage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverPage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleMemoryFile(file);
  };

  const onDragOverProfile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverProfile(true);
  };

  const onDragLeaveProfile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverProfile(false);
  };

  const onDropProfile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverProfile(false);
    setIsDraggingOverPage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProfilePhotoUpdate(file);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
      <p className="text-stone-400 font-serif italic">Loading person details...</p>
    </div>
  );

  if (!person) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
      <div className="text-center space-y-4">
        <p className="text-stone-400 font-serif italic">This person hasn't been found in the archive...</p>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-full">Return Home</Button>
      </div>
    </div>
  );

  const isOwnProfile = user?.id === person.userId;

  const handleShare = async () => {
    const shareData = {
      title: `${person.name} - Family Archive`,
      text: `Check out the stories and memories of ${person.name} in our family archive.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans pb-32 relative"
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

      <nav className="sticky top-0 z-30 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="rounded-full text-stone-500 h-12 w-12 hover:bg-stone-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
              <span className="cursor-pointer hover:text-stone-800 transition-colors" onClick={() => navigate('/')}>Archive</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-stone-800">{person.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <EditPersonDialog 
                person={person} 
                trigger={
                  <Button variant="ghost" size="icon" className="rounded-full text-amber-600 h-12 w-12 bg-amber-50 hover:bg-amber-100">
                    <ShieldCheck className="w-6 h-6" />
                  </Button>
                }
              />
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full text-stone-500 h-12 w-12 hover:bg-stone-100">
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div 
            className={cn(
              "relative w-48 h-48 md:w-64 md:h-64 rounded-[3rem] overflow-hidden shadow-2xl ring-8 transition-all duration-500 shrink-0",
              isDraggingOverProfile ? "ring-amber-500 scale-105 shadow-amber-200" : "ring-white"
            )}
            onDragOver={onDragOverProfile}
            onDragLeave={onDragLeaveProfile}
            onDrop={onDropProfile}
          >
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
            ) : (
              <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                <Camera className="w-12 h-12 text-stone-300" />
              </div>
            )}
            {isDraggingOverProfile && (
              <div className="absolute inset-0 bg-amber-600/40 flex items-center justify-center">
                <UploadCloud className="w-12 h-12 text-white animate-bounce" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center group cursor-pointer">
              <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-5xl font-serif font-bold text-stone-800 leading-tight">{person.name}</h1>
                {isOwnProfile && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate('/onboarding')}
                    className="rounded-full text-stone-400 hover:text-amber-600 h-10 w-10 bg-stone-50"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-6 text-stone-500">
                {person.birthYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span className="text-lg font-medium">Born {person.birthYear}</span>
                  </div>
                )}
                {person.birthPlace && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <span className="text-lg font-medium">{person.birthPlace}</span>
                  </div>
                )}
                {person.occupation && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-amber-600" />
                    <span className="text-lg font-medium">{person.occupation}</span>
                  </div>
                )}
              </div>
            </div>

            {person.vibeSentence && person.vibeSentence.trim() !== "" && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors" />
                <Quote className="absolute top-6 left-6 w-10 h-10 text-amber-600/5" />
                <p className="text-2xl font-serif italic text-stone-700 leading-relaxed relative z-10 pl-4">
                  "{person.vibeSentence}"
                </p>
                <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                  {person.personalityTags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-stone-50 text-stone-500 border-none rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <div className="flex flex-wrap gap-3 pt-4">
                <SuggestionDialog person={person} />
                <ConnectionSuggestionDialog person={person} />
              </div>
            )}
          </div>
        </section>

        {/* Photo Gallery Section */}
        {photos.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
                <ImageIcon className="w-8 h-8 text-stone-300" />
                Photo Gallery
              </h2>
              <Button 
                variant="ghost" 
                onClick={() => setIsAddMemoryOpen(true)}
                className="text-amber-600 hover:bg-amber-50 rounded-full gap-2"
              >
                <Plus className="w-4 h-4" /> Add Photos
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="group relative aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer"
                >
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.content} 
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white text-xs font-medium line-clamp-2">{photo.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile Completion Card */}
        {!isOwnProfile && <ProfileCompletionCard person={person} />}

        {/* Family Connections Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
              <Users className="w-8 h-8 text-stone-300" />
              Family Tree
            </h2>
            <ConnectionSuggestionDialog person={person} />
          </div>
          <FamilyConnections person={person} relatives={relatives} />
        </section>

        {/* Memories Section */}
        <section className="space-y-12">
          <div className="flex items-center justify-between border-b-4 border-stone-100 pb-6">
            <h2 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-stone-300" />
              The Archive
            </h2>
            <Button 
              onClick={() => setIsAddMemoryOpen(true)}
              className="rounded-full bg-stone-800 hover:bg-stone-900 text-white gap-2 px-6"
            >
              <Plus className="w-4 h-4" /> Add Story
            </Button>
          </div>

          <div className="space-y-12 relative before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-1 before:bg-stone-100">
            {person.memories.length === 0 ? (
              <div className="text-center py-20 space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
                <div className="h-20 w-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-stone-200" />
                </div>
                <div className="space-y-2">
                  <p className="text-stone-400 font-serif italic text-xl">No stories shared yet...</p>
                  <p className="text-stone-300 text-sm">Be the first to add a memory of {person.name.split(' ')[0]}.</p>
                </div>
                <Button 
                  onClick={() => setIsAddMemoryOpen(true)}
                  variant="outline"
                  className="rounded-full border-stone-200 text-stone-500"
                >
                  Tell a Story
                </Button>
              </div>
            ) : (
              person.memories.map((memory, idx) => (
                <div key={memory.id} className="relative pl-16 group animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="absolute left-0 top-2 w-12 h-12 rounded-full bg-white border-4 border-stone-50 flex items-center justify-center z-10 shadow-sm group-hover:border-amber-100 transition-colors">
                    {memory.type === 'voice' ? <Mic className="w-5 h-5 text-amber-600" /> : memory.type === 'photo' ? <Camera className="w-5 h-5 text-stone-400" /> : <MessageSquare className="w-5 h-5 text-stone-400" />}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-800 uppercase tracking-widest">
                          {memory.authorName || memory.createdByEmail.split('@')[0]}
                        </span>
                        <span className="text-stone-200">•</span>
                        <span className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em]">
                          {format(new Date(memory.createdAt), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "p-8 rounded-[2.5rem] text-xl font-serif leading-relaxed shadow-sm transition-all duration-500",
                      memory.type === 'voice' ? "bg-amber-50/40 border border-amber-100/50" : 
                      memory.type === 'photo' ? "bg-stone-50/50 border border-stone-100" :
                      "bg-white border border-stone-100 group-hover:shadow-md"
                    )}>
                      {memory.type === 'voice' && (
                        <Button size="icon" variant="ghost" className="mb-6 h-14 w-14 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm">
                          <Play className="w-6 h-6 fill-current" />
                        </Button>
                      )}
                      {memory.type === 'photo' && memory.imageUrl && (
                        <div className="mb-6 rounded-2xl overflow-hidden border-4 border-white shadow-sm">
                          <img src={memory.imageUrl} alt="Memory" className="w-full h-auto max-h-[400px] object-cover" />
                        </div>
                      )}
                      <p className="text-stone-700 italic">"{memory.content}"</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <AddMemoryDialog 
        personId={person.id}
        personName={person.name} 
        open={isAddMemoryOpen}
        onOpenChange={setIsAddMemoryOpen}
        initialImage={droppedImage}
      />
    </div>
  );
};

export default PersonDetail;