"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  ChevronRight, 
  UploadCloud, 
  ShieldCheck,
  Plus,
  Search,
  X,
  Share2,
  MessageSquare,
  Heart
} from 'lucide-react';
import AddMemoryDialog from '../components/AddMemoryDialog';
import FamilyConnections from '../components/FamilyConnections';
import EditPersonDialog from '../components/EditPersonDialog';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import ScrollToTop from '../components/ScrollToTop';
import BottomNav from '../components/BottomNav';
import PersonHero from '../components/person/PersonHero';
import PhotoGallery from '../components/person/PhotoGallery';
import CommentSection from '../components/CommentSection';
import FloatingMenu from '../components/FloatingMenu';
import { PersonDetailSkeleton } from '../components/SkeletonLoader';
import { cn, formatFamilyDate } from '@/lib/utils';
import { toast } from 'sonner';
import { parsePersonIdFromSlug } from '@/lib/slugify';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useImageUpload } from '@/hooks/use-image-upload';
import { usePersonRelatives } from '@/hooks/use-person-relatives';
import { Mic, Camera, Play } from 'lucide-react';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const PersonDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { people, user, reactions, toggleReaction, relationships, updatePerson, loading } = useFamily();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  const [memorySearch, setMemorySearch] = useState('');
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);

  const shortId = useMemo(() => {
    const id = parsePersonIdFromSlug(slug);
    return id;
  }, [slug]);

  const person = useMemo(() => {
    if (!shortId || loading) return null;
    return people.find(p => p.id.startsWith(shortId));
  }, [shortId, people, loading]);

  const relatives = usePersonRelatives(person, people, relationships);

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
    if (person) {
      await updatePerson(person.id, { photoUrl: base64 });
      toast.success("Profile photo updated!");
    }
  });

  useEffect(() => {
    if (person) {
      const stored = localStorage.getItem('kindred_recent');
      let recent = stored ? JSON.parse(stored) : [];
      recent = [person.id, ...recent.filter((id: string) => id !== person.id)].slice(0, 10);
      localStorage.setItem('kindred_recent', JSON.stringify(recent));
    }
  }, [person]);

  const filteredMemories = useMemo(() => {
    if (!person) return [];
    if (!memorySearch) return person.memories;
    return person.memories.filter(m => 
      m.content.toLowerCase().includes(memorySearch.toLowerCase()) ||
      (m.authorName && m.authorName.toLowerCase().includes(memorySearch.toLowerCase()))
    );
  }, [person, memorySearch]);

  const photos = useMemo(() => {
    if (!person) return [];
    return person.memories.filter(m => m.type === 'photo' && m.imageUrl);
  }, [person]);

  const handleWarm = async (id: string) => {
    const memoryReactions = reactions[id] || [];
    const isWarmed = memoryReactions.includes(user?.id);
    await toggleReaction(id);
    if (!isWarmed) {
      toast.success("You warmed this story!", {
        icon: <Heart className="w-4 h-4 text-red-500 fill-current" />
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <nav className="sticky top-0 z-30 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500 h-12 w-12"><ArrowLeft className="w-6 h-6" /></Button>
        </div>
      </nav>
      <PersonDetailSkeleton />
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

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isOwnProfile = user?.id === person.userId;

  const handleShare = async () => {
    const shareData = {
      title: `${person.name} - Family Archive`,
      text: `Check out the stories and memories of ${person.name} in our family archive.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
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
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-amber-500 origin-left z-[100]" style={{ scaleX }} />

      {isDraggingOverPage && !isDraggingOverProfile && (
        <div className="fixed inset-0 z-50 bg-amber-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-amber-500 flex flex-col items-center gap-4 scale-105 transition-transform">
            <UploadCloud className="w-16 h-16 text-amber-600 animate-bounce" />
            <p className="text-2xl font-serif font-bold text-stone-800">Drop to share a photo</p>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-30 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500 h-12 w-12 hover:bg-stone-100"><ArrowLeft className="w-6 h-6" /></Button>
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
                trigger={<Button variant="ghost" size="icon" className="rounded-full text-amber-600 h-12 w-12 bg-amber-50 hover:bg-amber-100"><ShieldCheck className="w-6 h-6" /></Button>}
              />
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full text-stone-500 h-12 w-12 hover:bg-stone-100"><Share2 className="w-6 h-6" /></Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        <PersonHero 
          person={person}
          isOwnProfile={isOwnProfile}
          isAdmin={isAdmin}
          isDraggingOverProfile={isDraggingOverProfile}
          onEditProfile={() => navigate('/edit-profile')}
          onProfileDrop={onProfileDrop}
          onProfileDragOver={onProfileDragOver}
          onProfileDragLeave={onProfileDragLeave}
        />

        <PhotoGallery photos={photos} onAddPhoto={() => setIsAddMemoryOpen(true)} />

        {!isOwnProfile && <ProfileCompletionCard person={person} />}

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">Family Tree</h2>
          </div>
          <FamilyConnections person={person} relatives={relatives} />
        </section>

        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-stone-100 pb-6">
            <h2 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">The Archive</h2>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                <Input 
                  placeholder="Search memories..." 
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="pl-10 h-10 bg-stone-100 border-none rounded-full text-sm w-48 md:w-64 focus-visible:ring-amber-500/20"
                />
                {memorySearch && <button onClick={() => setMemorySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><X className="w-3 h-3" /></button>}
              </div>
              <Button onClick={() => setIsAddMemoryOpen(true)} className="rounded-full bg-stone-800 hover:bg-stone-900 text-white gap-2 px-6"><Plus className="w-4 h-4" /> Add Story</Button>
            </div>
          </div>

          <div className="space-y-12 relative before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-1 before:bg-stone-100">
            {filteredMemories.length === 0 ? (
              <div className="text-center py-20 space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
                <p className="text-stone-400 font-serif italic text-xl">No stories shared yet...</p>
              </div>
            ) : (
              filteredMemories.map((memory, idx) => {
                const memoryReactions = reactions[memory.id] || [];
                const isWarmed = memoryReactions.includes(user?.id);
                
                return (
                  <motion.div key={memory.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="relative pl-16 group">
                    <div className="absolute left-0 top-2 w-12 h-12 rounded-full bg-white border-4 border-stone-50 flex items-center justify-center z-10 shadow-sm group-hover:border-amber-100 transition-colors">
                      {memory.type === 'voice' ? <Mic className="w-5 h-5 text-amber-600" /> : memory.type === 'photo' ? <Camera className="w-5 h-5 text-stone-400" /> : <MessageSquare className="w-5 h-5 text-stone-400" />}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-stone-800 uppercase tracking-widest">{memory.authorName || memory.createdByEmail.split('@')[0]}</span>
                          <span className="text-stone-200">•</span>
                          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em]">
                            {formatFamilyDate(memory.createdAt)}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleWarm(memory.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300 group/heart",
                            isWarmed 
                              ? "bg-red-50 text-red-500" 
                              : "bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-500"
                          )}
                        >
                          <Heart className={cn("w-3 h-3 transition-transform group-active:scale-125", isWarmed && "fill-current")} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {memoryReactions.length > 0 ? memoryReactions.length : ''} {isWarmed ? 'Warmed' : 'Warm this'}
                          </span>
                        </button>
                      </div>
                      <div className={cn("p-8 rounded-[2.5rem] text-xl font-serif leading-relaxed shadow-sm transition-all duration-500", memory.type === 'voice' ? "bg-amber-50/40 border border-amber-100/50" : memory.type === 'photo' ? "bg-stone-50/50 border border-stone-100" : "bg-white border border-stone-100 group-hover:shadow-md")}>
                        {memory.type === 'voice' && <Button size="icon" variant="ghost" className="mb-6 h-14 w-14 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm"><Play className="w-6 h-6 fill-current" /></Button>}
                        {memory.type === 'photo' && memory.imageUrl && <div className="mb-6 rounded-2xl overflow-hidden border-4 border-white shadow-sm"><img src={memory.imageUrl} alt="Memory" className="w-full h-auto max-h-[400px] object-cover" /></div>}
                        <p className="text-stone-700 italic">"{memory.content}"</p>
                        
                        <CommentSection memoryId={memory.id} comments={memory.comments || []} />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <FloatingMenu personId={person.id} personName={person.name} />
      <AddMemoryDialog personId={person.id} personName={person.name} open={isAddMemoryOpen} onOpenChange={setIsAddMemoryOpen} initialImage={droppedImage} />
      <ScrollToTop />
      <BottomNav />
    </div>
  );
};

export default PersonDetail;