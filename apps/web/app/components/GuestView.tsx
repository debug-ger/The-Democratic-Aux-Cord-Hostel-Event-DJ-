// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronUp, ChevronDown, Search } from "lucide-react";
import { useQueueStore, Track } from "../../store/useQueueStore";

export default function GuestView() {
  const tracks = useQueueStore((state) => state.tracks);
  const activeUsers = useQueueStore((state) => state.activeUsers);
  const roomCode = useQueueStore((state) => state.roomCode);
  const initSocket = useQueueStore((state) => state.initSocket);
  const disconnectSocket = useQueueStore((state) => state.disconnectSocket);
  const voteTrack = useQueueStore((state) => state.voteTrack);
  const decayVelocity = useQueueStore((state) => state.decayVelocity);
  const [searchOpen, setSearchOpen] = useState(false);

  // Initialize WebSockets
  useEffect(() => {
    initSocket(roomCode);
    return () => disconnectSocket();
  }, [roomCode, initSocket, disconnectSocket]);

  // Decay vote velocity
  useEffect(() => {
    const interval = setInterval(() => {
      decayVelocity();
    }, 1000);
    return () => clearInterval(interval);
  }, [decayVelocity]);

  const handleVote = (id: string, delta: number) => {
    voteTrack(id, delta);

    // Haptic feedback simulation
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  return (
    <div className="h-full flex flex-col pt-8">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 font-mono tracking-widest text-lg font-bold shadow-lg shadow-primary-start/20">
            {roomCode}
          </div>
          <div className="flex items-center gap-1.5 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 text-sm text-muted">
            <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
            <Users className="w-4 h-4" />
            <span className="font-medium text-white">{activeUsers}</span>
          </div>
        </div>
      </header>

      {/* Active Track Card */}
      <div className="px-6 py-4">
        <div className="relative rounded-3xl overflow-hidden glass-panel h-64 shadow-2xl flex flex-col justify-end p-6 border border-white/10 group">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-40 transition-transform duration-1000 group-hover:scale-125"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-primary-start text-xs font-bold tracking-wider mb-2 uppercase flex items-center gap-2">
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-1 bg-primary-start rounded-t-sm animate-equalizer" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-primary-start rounded-t-sm animate-equalizer" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 bg-primary-start rounded-t-sm animate-equalizer" style={{ animationDelay: '400ms' }} />
                </span>
                Now Playing
              </p>
              <h2 className="text-3xl font-bold tracking-tight mb-1 font-sans">Paint The Town Red</h2>
              <p className="text-muted text-lg">Doja Cat</p>
            </div>
            {/* Album Art Mini */}
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border border-white/20">
               <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop" alt="Now Playing" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* The Kinetic Queue */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 relative">
        <AnimatePresence>
          {tracks.map((track) => (
            !track.isDead && (
              <QueueItem key={track.id} track={track} onVote={handleVote} />
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Search Fab / Bottom Area */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setSearchOpen(!searchOpen)}
          className="bg-primary-start hover:bg-primary-end transition-colors text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center border border-white/20"
        >
          <Search className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function QueueItem({ track, onVote }: { track: Track; onVote: (id: string, d: number) => void }) {
  // Death Spiral Animations
  const isDying = track.score === -2;
  const isDead = track.isDead;

  // Velocity Glow
  const isHighVelocity = track.voteVelocity > 2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDead ? 0 : 1, 
        y: isDead ? -20 : 0,
        height: isDead ? 0 : 'auto',
        scale: isDead ? 0.9 : 1,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          opacity: { duration: 0.2 },
          height: { duration: 0.3 }
        }
      }}
      exit={{ opacity: 0, height: 0, scale: 0.8, transition: { duration: 0.3 } }}
      className={`glass-panel glass-border rounded-2xl p-3 flex items-center gap-4 transition-all duration-300 ${isDying ? 'bg-critical/10 border-critical/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : ''} ${isHighVelocity ? 'velocity-glow' : ''} ${track.score <= -3 ? 'animate-wiggle' : ''}`}
      style={{ overflow: 'hidden' }}
    >
      {/* Number Badge */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${track.score > 0 ? 'bg-positive/20 text-positive' : track.score < 0 ? 'bg-critical/20 text-critical' : 'bg-white/5 text-muted'}`}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={track.score}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {track.score > 0 ? '+' : ''}{track.score}
          </motion.span>
        </AnimatePresence>
      </div>

      <img src={track.art} alt={track.title} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white truncate font-sans tracking-wide">{track.title}</h4>
        <p className={`text-sm truncate transition-colors ${isDying ? 'text-critical/80' : 'text-muted'}`}>{track.artist}</p>
      </div>

      <div className="flex flex-col items-center gap-1">
        <button 
          onClick={() => onVote(track.id, 1)}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-positive/20 hover:text-positive text-muted transition-all flex items-center justify-center active:scale-95 border border-transparent hover:border-positive/30"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button 
          onClick={() => onVote(track.id, -1)}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-critical/20 hover:text-critical text-muted transition-all flex items-center justify-center active:scale-95 border border-transparent hover:border-critical/30"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}
