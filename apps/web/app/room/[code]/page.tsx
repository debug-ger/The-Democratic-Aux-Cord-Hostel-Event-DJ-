'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Search, ChevronUp, ChevronDown, Play, Pause, SkipForward,
  Music2, Users, Copy, Check, Wifi, WifiOff, Zap,
} from 'lucide-react';
import { useQueueStore } from '../../../store/useQueueStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import type { Song } from '@repo/types';

// ── iTunes Search API ─────────────────────────────────────────
interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  trackTimeMillis: number;
}

async function searchITunes(query: string): Promise<ItunesTrack[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=6&media=music`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results ?? [];
}

// ── Vibe label → color ────────────────────────────────────────
const vibeLabelColor: Record<string, string> = {
  Peak: 'text-pink-400',
  Energetic: 'text-orange-400',
  Building: 'text-yellow-400',
  Chill: 'text-cyan-400',
};

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomCode = (params.code as string).toUpperCase();
  const isHost = searchParams.get('host') === 'true';

  const { connect, disconnect, queue, vibe, roomStats, connected, addSong, voteSong } =
    useQueueStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ItunesTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    connect(roomCode, isHost);
    return () => disconnect();
  }, [roomCode, isHost, connect, disconnect]);

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchITunes(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = (track: ItunesTrack) => {
    const song: Omit<Song, 'score'> = {
      id: track.trackId.toString(),
      title: track.trackName,
      artist: track.artistName,
      albumArt: track.artworkUrl100.replace('100x100', '300x300'),
    };
    addSong(song);
    setSearchQuery('');
    setSearchResults([]);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // ── Render ────────────────────────────────────────────────────

  const nowPlaying = queue[0] ?? null;
  const upNext = queue.slice(1);
  const vibeLabel = vibe?.vibeLabel ?? 'Chill';
  const vibeScore = vibe?.vibeScore ?? 50;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Room code */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)' }}
            >
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold leading-none mb-0.5">
                Room Code
              </p>
              <button
                onClick={copyCode}
                className="font-black text-xl font-mono tracking-[0.2em] text-white flex items-center gap-1.5 hover:text-primary-start transition-colors"
              >
                {roomCode}
                {codeCopied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-500" />
                )}
              </button>
            </div>
          </div>

          {/* Vibe + Stats */}
          <div className="flex items-center gap-2">
            {roomStats && (
              <Badge variant="secondary" className="hidden sm:flex gap-1.5">
                <Users className="w-3 h-3" />
                {roomStats.memberCount}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`${vibeLabelColor[vibeLabel] ?? 'text-zinc-300'} flex gap-1`}
            >
              <Zap className="w-3 h-3" />
              {vibeLabel}
            </Badge>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400 pulse-ring' : 'bg-red-500'}`} />
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* ── Vibe Bar ──────────────────────────────────────── */}
        {vibe && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl px-5 py-3 flex items-center gap-4"
          >
            <div className="flex gap-1 items-end h-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="equalizer-bar w-1"
                  style={{ animationDelay: `${i * 0.1}s`, height: `${8 + i * 3}px` }}
                />
              ))}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400 font-medium">Crowd Energy</span>
                <span className={`text-xs font-bold ${vibeLabelColor[vibeLabel]}`}>
                  {vibeLabel} · {vibe.bpmAverage} BPM avg
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FF007F, #00F0FF)' }}
                  animate={{ width: `${vibeScore}%` }}
                  transition={{ type: 'spring', stiffness: 80 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Search ────────────────────────────────────────── */}
        <div ref={searchRef} className="relative">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any song to add..."
                className="pl-10 pr-4 h-12"
                id="song-search-input"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="h-12 px-5 flex-shrink-0"
            >
              {isSearching ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                />
              ) : 'Add'}
            </Button>
          </form>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 glass rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              >
                {searchResults.map((track) => (
                  <motion.button
                    key={track.trackId}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => handleAddSong(track)}
                    className="flex items-center gap-3 w-full p-3 text-left border-b border-white/5 last:border-0"
                  >
                    <img
                      src={track.artworkUrl100}
                      alt={track.trackName}
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{track.trackName}</p>
                      <p className="text-zinc-400 text-xs truncate">{track.artistName}</p>
                    </div>
                    <Plus className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Now Playing ───────────────────────────────────── */}
        {nowPlaying && (
          <motion.div
            key={nowPlaying.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-5 border border-pink-500/20 glow-pink"
          >
            <p className="text-[10px] text-pink-400 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
              Now Playing
            </p>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={nowPlaying.albumArt}
                  alt={nowPlaying.title}
                  className="w-20 h-20 rounded-2xl object-cover shadow-xl"
                />
                <div className="absolute inset-0 rounded-2xl ring-2 ring-pink-500/40" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-lg font-black truncate mb-0.5">{nowPlaying.title}</h2>
                <p className="text-zinc-400 text-sm truncate mb-3">{nowPlaying.artist}</p>
                {/* Fake progress bar */}
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #FF007F, #FF007F88)' }}
                    animate={{ width: ['15%', '85%'] }}
                    transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                  />
                </div>
              </div>

              {/* Host Controls */}
              {isHost && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-9 w-9"
                  >
                    {isPlaying
                      ? <Pause className="w-4 h-4 fill-current" />
                      : <Play className="w-4 h-4 fill-current" />
                    }
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <SkipForward className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Queue ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              Up Next
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-normal">
                {upNext.length}
              </span>
            </h2>
            {!connected && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <WifiOff className="w-3.5 h-3.5" /> Reconnecting...
              </span>
            )}
          </div>

          {queue.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-zinc-800 rounded-3xl text-center"
            >
              <Music2 className="w-12 h-12 text-zinc-700 mb-3" strokeWidth={1} />
              <p className="text-zinc-500 font-medium">The queue is empty</p>
              <p className="text-zinc-700 text-sm mt-1">Search for a song above to get started</p>
            </motion.div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {upNext.map((song, index) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    rank={index + 2}
                    onUpvote={() => voteSong(song.id, 1)}
                    onDownvote={() => voteSong(song.id, -1)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── SongCard Component ────────────────────────────────────────
function SongCard({
  song,
  rank,
  onUpvote,
  onDownvote,
}: {
  song: Song;
  rank: number;
  onUpvote: () => void;
  onDownvote: () => void;
}) {
  const [voted, setVoted] = useState<1 | -1 | null>(null);

  const handleVote = (delta: 1 | -1) => {
    if (voted === delta) return; // No double-voting same direction
    setVoted(delta);
    if (delta === 1) onUpvote();
    else onDownvote();
  };

  const scoreColor =
    song.score > 3
      ? 'text-pink-400'
      : song.score > 0
        ? 'text-green-400'
        : song.score < -1
          ? 'text-red-400'
          : 'text-zinc-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass rounded-2xl p-3.5 flex items-center gap-3.5"
    >
      {/* Rank */}
      <div className="w-6 text-center text-zinc-600 text-xs font-mono font-bold flex-shrink-0">
        {rank}
      </div>

      {/* Album Art */}
      <img
        src={song.albumArt}
        alt={song.title}
        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{song.title}</p>
        <p className="text-zinc-400 text-xs truncate">{song.artist}</p>
      </div>

      {/* Vote Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleVote(1)}
          className={`p-1.5 rounded-lg transition-colors ${
            voted === 1 ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-green-400 hover:bg-zinc-800'
          }`}
          id={`upvote-${song.id}`}
          aria-label={`Upvote ${song.title}`}
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>

        <span className={`w-8 text-center text-xs font-black font-mono ${scoreColor}`}>
          {song.score > 0 ? `+${song.score}` : song.score}
        </span>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleVote(-1)}
          className={`p-1.5 rounded-lg transition-colors ${
            voted === -1 ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'
          }`}
          id={`downvote-${song.id}`}
          aria-label={`Downvote ${song.title}`}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
