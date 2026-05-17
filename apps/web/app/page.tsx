'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, ArrowRight, Plus } from 'lucide-react';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length === 4) {
      router.push(`/room/${roomCode.toUpperCase()}`);
    }
  };

  const handleCreate = () => {
    // Generate random 4 character code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    router.push(`/room/${code}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-4 rounded-2xl shadow-lg shadow-purple-500/20">
            <Music className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-center mb-2 tracking-tight">
          Vibe<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">box</span>
        </h1>
        <p className="text-zinc-400 text-center mb-10 text-sm">
          The democratic aux cord. No dictators.
        </p>

        <form onSubmit={handleJoin} className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 4-letter code"
              maxLength={4}
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:text-zinc-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={roomCode.length !== 4}
            className="w-full bg-white text-black font-semibold rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Join Room
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-zinc-800 flex-1"></div>
          <span className="text-zinc-500 text-sm font-medium">OR</span>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        <button
          onClick={handleCreate}
          className="w-full bg-transparent border-2 border-zinc-800 text-white font-semibold rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Room
        </button>
      </motion.div>

      <div className="absolute bottom-8 text-center">
        <p className="text-zinc-600 text-sm">Powered by NestJS + Next.js MVP</p>
      </div>
    </main>
  );
}
