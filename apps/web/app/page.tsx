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

const features = [
  { icon: Wifi, label: 'Real-time sync', desc: 'Socket.IO keeps everyone in perfect sync' },
  { icon: Users, label: 'Up to 50 people', desc: 'The whole hostel room can join one session' },
  { icon: Zap, label: 'Auto-skip', desc: 'Bad songs voted out below −3 automatically' },
  { icon: Shield, label: 'Anonymous votes', desc: 'Vote freely — no social pressure' },
];

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-400/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Logo + Badge */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 pulse-ring"
            style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)' }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Music2 className="w-10 h-10 text-white" strokeWidth={1.5} />
          </motion.div>

          <Badge variant="live" className="mb-4 text-xs px-3 py-1">
            ● LIVE — Real-time collaborative DJ
          </Badge>

          <h1 className="text-5xl font-black tracking-tight mb-3">
            Vibe<span className="text-gradient">box</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            No aux cord dictators.<br />
            Everyone votes. The best song always plays.
          </p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-3xl p-7 shadow-2xl mb-6">
          {/* Create Room */}
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            size="lg"
            className="w-full mb-5 text-base font-bold"
          >
            <Plus className="w-5 h-5" />
            {isCreating ? 'Creating room...' : 'Create a Room'}
            {!isCreating && <ArrowRight className="w-4 h-4 ml-auto opacity-60" />}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">or join</span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          {/* Join Room */}
          <form onSubmit={handleJoin} className="space-y-3">
            <div className="relative">
              <Input
                ref={inputRef}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  setError('');
                }}
                placeholder="ROOM CODE"
                maxLength={4}
                className="text-center text-xl font-black tracking-[0.5em] placeholder:tracking-widest placeholder:font-normal placeholder:text-zinc-600 h-14"
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
                      i < roomCode.length ? 'bg-primary-start' : 'bg-zinc-700'
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
              className="w-full text-base font-semibold"
              disabled={roomCode.length !== 4}
            >
              Join Room
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </form>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass rounded-2xl p-4 cursor-default"
            >
              <Icon className="w-5 h-5 text-primary-start mb-2" strokeWidth={1.5} />
              <p className="text-white text-xs font-semibold mb-0.5">{label}</p>
              <p className="text-zinc-500 text-xs leading-tight">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-zinc-700 text-xs">
        Built at Integrata_VIEW · 2026 · NestJS + Next.js
      </p>
    </main>
  );
}
