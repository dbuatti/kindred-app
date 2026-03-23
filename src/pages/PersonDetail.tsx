"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Quote, Mic, MessageSquare, Play, Clock, Camera, Edit3, Share2, ChevronRight, UploadCloud, Users } from 'lucide-react';
import AddMemoryDialog from '../components/AddMemoryDialog';
import SuggestionDialog from '../components/SuggestionDialog';
import ConnectionSuggestionDialog from '../components/ConnectionSuggestionDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parsePersonIdFromSlug, getPersonUrl } from '@/lib/slugify';

const PersonDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { people, user, relationships, updatePerson, loading } = useFamily();
  
  const shortId = useMemo(() => {
    return parsePersonIdFromSlug(slug);
  }, [slug]);

  const person = useMemo(() => {
    if (!shortId || loading) return null;
    // Find the person whose ID starts with our short identifier
    const found = people.find(p => p.id.startsWith(shortId));
    console.log("[PersonDetail] Searching for person with short ID:", shortId, found ? "Found: " + found.name : "Not found");
    return found;
  }, [shortId, people, loading]);

  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [droppedImage, setDroppedImage] = useState<string | null>(null);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const [isDraggingOverProfile, setIsDraggingOverProfile] = useState(false);

  // Find relatives
  const relatives = useMemo(() => {
    if (!person || !relationships.length) return [];
    
    return relationships
      .filter(r => r.person_id === person.id || r.related_person_id === person.id)
      .map(r => {
        const isPrimary = r.person_id === person.id;
        const relativeId = isPrimary ? r.related_person_id : r.person_id;
        const relative = people.find(p => p.id === relativeId);
        
        if (!relative) return null;
        
        return {
          ...relative,
          type: r.relationship_type
        };
      })
      .filter(Boolean);
  }, [person, relationships, people]);

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
      className="min-h-screen bg-[#FDFCF9] text-stone-900 font-sans pb-24 relative"
      onDragOver={onDragOverPage}
      onDragLeave={onDragLeavePage}
      onDrop={onDropPage}
    >
      {/* Drag Overlay for Memories */}
      {isDraggingOverPage && !isDraggingOverProfile && (
        <div className="fixed inset-0 z-50 bg-amber-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-amber-500 flex flex-col items-center gap-4 scale-105 transition-transform">
            <UploadCloud className="w-16 h-16 text-amber-600 animate-bounce" />
            <p className="text-2xl font-serif font-bold text-stone-800">Drop to share a photo</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="rounded-full text-stone-500 h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-medium text-stone-400 uppercase tracking-widest">
              <span className="cursor-pointer hover:text-stone-800 transition-colors" onClick={() => navigate('/')}>Archive</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-stone-800">{person.name.split(' ')[0]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full text-stone-500 h-10 w-10">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-6 pt-8 pb-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div 
            className={cn(
              "relative w-32 h-32 rounded-full overflow-hidden shadow-lg ring-2 transition-all duration-300",
              isDraggingOverProfile ? "ring-amber-500 scale-105 shadow-amber-200" : "ring-white"
            )}
            onDragOver={onDragOverProfile}
            onDragLeave={onDragLeaveProfile}
            onDrop={onDropProfile}
          >
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover grayscale-[0.2]" />
            ) : (
              <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                <Camera className="w-8 h-8 text-stone-400" />
              </div>
            )}
            {isDraggingOverProfile && (
              <div className="absolute inset-0 bg-amber-600/40 flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-white animate-bounce" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center group cursor-pointer">
              <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-serif font-medium text-stone-800">{person.name}</h1>
              {isOwnProfile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/onboarding')}
                  className="rounded-full text-stone-400 hover:text-amber-600 h-8 w-8"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-stone-500 font-light tracking-wide uppercase text-[10px]">
              {person.birthYear} {person.birthPlace && `• ${person.birthPlace}`}
            </p>
            <p className="text-amber-700 font-medium text-xs">{person.occupation}</p>
          </div>
        </div>

        {/* Family Circle Pills */}
        {relatives.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] text-center">Family Circle</p>
            <div className="flex flex-wrap justify-center gap-2">
              {relatives.map((rel: any) => (
                <button
                  key={rel.id}
                  onClick={() => navigate(getPersonUrl(rel.id, rel.name))}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-100 rounded-full shadow-sm hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
                >
                  <div className="h-5 w-5 rounded-full overflow-hidden bg-stone-100 shrink-0">
                    {rel.photoUrl ? (
                      <img src={rel.photoUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <Users className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-stone-600 group-hover:text-amber-900">{rel.name.split(' ')[0]}</span>
                  <span className="text-[9px] text-stone-300 italic">{rel.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {person.vibeSentence && person.vibeSentence.trim() !== "" && (
          <div className="bg-stone-100/50 rounded-2xl p-6 relative">
            <Quote className="absolute top-3 left-3 w-6 h-6 text-amber-600/10" />
            <p className="text-lg font-serif italic text-stone-700 leading-relaxed text-center">
              "{person.vibeSentence}"
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {person.personalityTags?.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-white/80 text-stone-600 border-none rounded-full px-3 py-0.5 text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {!isOwnProfile && (
            <div className="flex flex-wrap justify-center gap-2">
              <SuggestionDialog person={person} />
              <ConnectionSuggestionDialog person={person} />
            </div>
          )}
        </div>
      </header>

      {/* Memories Feed */}
      <main className="max-w-4xl mx-auto px-6 space-y-8 mt-8">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="font-serif text-xl text-stone-800">Memories</h2>
          <span className="text-stone-400 text-xs">{person.memories.length} stories shared</span>
        </div>

        <div className="space-y-8">
          {person.memories.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-stone-400 font-serif italic text-sm">No memories shared yet. Be the first to tell a story.</p>
            </div>
          ) : (
            person.memories.map((memory, idx) => (
              <div key={memory.id} className="group space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-stone-400">
                    {memory.type === 'voice' ? <Mic className="w-3.5 h-3.5" /> : memory.type === 'photo' ? <Camera className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                        {memory.authorName || memory.createdByEmail.split('@')[0]}
                      </span>
                      <span className="text-[9px] text-stone-300 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {format(new Date(memory.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className={cn(
                      "p-4 rounded-xl text-base font-serif leading-relaxed",
                      memory.type === 'voice' ? "bg-amber-50/50 border border-amber-100/50" : 
                      memory.type === 'photo' ? "bg-stone-100/30 border border-stone-200/50" :
                      "bg-white border border-stone-100"
                    )}>
                      {memory.type === 'voice' && (
                        <Button size="sm" variant="ghost" className="mb-3 h-8 w-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 p-0">
                          <Play className="w-3 h-3 fill-current" />
                        </Button>
                      )}
                      <p className="text-stone-700">{memory.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Action */}
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