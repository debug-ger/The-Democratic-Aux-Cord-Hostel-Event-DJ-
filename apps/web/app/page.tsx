'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music2, ArrowRight, Plus, Wifi, Users, Zap, Shield, ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { GeometricWebBackground } from '../components/GeometricWebBackground';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// Generate a client-side anonymous host ID
function getAnonymousId() {
  if (typeof window === 'undefined') return 'anon';
  let id = localStorage.getItem('vibebox_uid');
  if (!id) {
    id = `anon_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('vibebox_uid', id);
  }
  return id;
}

// Feature Slideshow definition
const slides = [
  {
    title: "📲 Scan & Slide In",
    desc: "Host displays the printable flyer, guests scan with camera, and they slide directly into the active queue. Instant access, zero typing.",
    gradient: "from-pink-500 to-purple-600",
    image: "/images/slide1.png"
  },
  {
    title: "🗳️ Anonymous Crowd Veto",
    desc: "Upvote the heaters, downvote the trash. If a song drops to -3 score, it triggers the Auto-Skip 'Death Spiral' instantly.",
    gradient: "from-red-500 to-orange-500",
    image: "/images/slide2.png"
  },
  {
    title: "🧠 Explore Genres & Continuity",
    desc: "AI Vibe Continuity Engine continuously analyzes average BPM and valence, guiding smooth transitions between diverse musical genres.",
    gradient: "from-cyan-500 to-blue-500",
    image: "/images/slide3.png"
  },
  {
    title: "🏆 Save Elite Music Taste",
    desc: "Vibe Savior's Playlist is computed and compiled. Instantly save the session recap and top-voted tracks to your profile as a badge of honor.",
    gradient: "from-emerald-500 to-teal-500",
    image: "/images/slide4.png"
  }
];

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError('');
    try {
      const hostId = getAnonymousId();
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      const room = await res.json();
      router.push(`/host/${room.roomCode}`);
    } catch {
      // Fallback: generate code client-side if server unavailable
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      router.push(`/host/${code}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError('Room codes are 4 characters');
      inputRef.current?.focus();
      return;
    }
    setError('');
    router.push(`/room/${code}`);
  };

  // Next/Prev slide helpers
  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-black text-white">
      {/* Full-screen High Opacity Background Image */}
      <div className="absolute inset-0 -z-50 bg-cover bg-center opacity-[0.82] pointer-events-none" style={{ backgroundImage: "url('/images/bg-landing.jpg')" }} />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-400/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-6xl z-10 flex flex-col items-center"
      >
        {/* Logo + Badge */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 pulse-ring"
            style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)' }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Music2 className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>

          <Badge variant="live" className="mb-3 text-[10px] px-2.5 py-0.5">
            ● LIVE — Real-time collaborative DJ
          </Badge>

          <h1 className="text-4xl font-black tracking-tight mb-2">
            Vibe<span className="text-gradient">box</span>
          </h1>
          <p className="text-zinc-300 text-sm leading-relaxed">
            No aux cord dictators. Everyone votes. The best song always plays.
          </p>
        </div>

        {/* 3-Column Split Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          
          {/* LEFT SIDE: Join Room (Column span: 3) */}
          <div className="lg:col-span-3 bg-[#0a0a0c]/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-full backdrop-blur-md">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white mb-1.5">Join a Room</h2>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Enter the 4-digit code provided on the host's screen to join, request songs, and vote collectively!
              </p>
            </div>
            <form onSubmit={handleJoin} className="space-y-3 mt-auto w-full">
              <div className="relative w-full">
                <Input
                  ref={inputRef}
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setError('');
                  }}
                  placeholder="CODE"
                  maxLength={4}
                  className="text-center text-lg font-black tracking-[0.5em] placeholder:tracking-widest placeholder:font-normal placeholder:text-zinc-600 h-14 bg-black/45 border-white/10"
                  autoComplete="off"
                  autoCapitalize="characters"
                  id="room-code-input"
                />
                {/* Character dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i < roomCode.length ? 'bg-cyan-400' : 'bg-zinc-700'
                      }`}
                      animate={{ scale: i === roomCode.length - 1 ? [1, 1.5, 1] : 1 }}
                      transition={{ duration: 0.15 }}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-xs text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full text-base font-semibold border-white/15 hover:bg-white/5 h-14"
                disabled={roomCode.length !== 4}
              >
                Join Room
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            </form>
          </div>

          {/* MID SECTION: Feature Carousel (Column span: 6 - COMPLETELY occupying center stage!) */}
          <div className="lg:col-span-6 bg-[#0a0a0c]/90 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[380px] h-full backdrop-blur-md lg:scale-110 lg:z-10 lg:shadow-[0_0_50px_rgba(0,240,255,0.15)] transition-transform duration-500">
            <div className="absolute top-3 right-4 flex gap-1.5 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeSlide === idx ? 'bg-cyan-400 scale-125' : 'bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {(() => {
                const currentSlide = slides[activeSlide] || {
                  title: "📲 Scan & Slide In",
                  desc: "Host displays the printable flyer, guests scan with camera, and they slide directly into the active queue. Instant access, zero typing.",
                  gradient: "from-pink-500 to-purple-600",
                  image: "/images/slide1.png"
                };
                return (
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="flex-1 flex flex-col sm:flex-row gap-6 items-center justify-between z-10"
                  >
                    <div className="flex-1 flex flex-col justify-center pr-2">
                      <h3 className={`text-lg font-black bg-gradient-to-r ${currentSlide.gradient} bg-clip-text text-transparent mb-2.5`}>
                        {currentSlide.title}
                      </h3>
                      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                        {currentSlide.desc}
                      </p>
                    </div>
                    {/* Enlarged Slide Image */}
                    <div className="w-32 h-32 sm:w-56 sm:h-56 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-2xl relative bg-black/40">
                      <img src={currentSlide.image} alt={currentSlide.title} className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 z-20">
              <button onClick={prevSlide} className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 hover:text-white transition-colors">
                ← Prev
              </button>
              <span className="text-[10px] font-mono text-zinc-600">
                {activeSlide + 1} / {slides.length}
              </span>
              <button onClick={nextSlide} className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 hover:text-white transition-colors">
                Next →
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Create Room (Column span: 3) */}
          <div className="lg:col-span-3 bg-[#0a0a0c]/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-full backdrop-blur-md">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white mb-1.5">Host a Session</h2>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Start a new shared DJ room, generate a flyer flyer, track queue BPM continuity, and run democratic skip vetos!
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              size="lg"
              className="w-full text-base font-bold bg-white text-black hover:bg-zinc-200 h-14 mt-auto"
            >
              <Plus className="w-5 h-5 mr-1" />
              {isCreating ? 'Creating...' : 'Create Room'}
              {!isCreating && <ArrowRight className="w-4 h-4 ml-auto opacity-60" />}
            </Button>
          </div>

        </div>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-zinc-800 text-[10px] font-mono tracking-widest">
        BUILT AT INTEGRATA_VIEW · 2026 · NESTJS + NEXT.JS
      </p>
    </main>
  );
}
