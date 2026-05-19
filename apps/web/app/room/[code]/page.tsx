'use client';

import { useEffect, useState, useRef, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronUp, ChevronDown, Plus,
  Music2, Users, Copy, Check, WifiOff, Zap, X, Clock, Sparkles, LogOut, AlertTriangle,
} from 'lucide-react';
import { useQueueStore } from '../../../store/useQueueStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { GeometricWebBackground } from '../../../components/GeometricWebBackground';
import type { Song } from '../../../lib/types';

// ── API Helpers ──────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function searchSpotifyProxy(query: string): Promise<Song[]> {
  try {
    const res = await fetch(`${API}/spotify/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('Search error', e);
    return [];
  }
}

async function fetchRecommendations(seedIds: string[]): Promise<Song[]> {
  if (seedIds.length === 0) return [];
  try {
    const seeds = seedIds.slice(0, 5).join(',');
    const res = await fetch(`${API}/spotify/recommendations?seeds=${encodeURIComponent(seeds)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('Recommendations error', e);
    return [];
  }
}

// ── Vibe label → color ────────────────────────────────────────
const vibeLabelColor: Record<string, string> = {
  Peak: 'text-pink-400',
  Energetic: 'text-orange-400',
  Building: 'text-yellow-400',
  Chill: 'text-cyan-400',
};

const LS_HISTORY_KEY = 'vb_search_history';
const LS_SEEDS_KEY = 'vb_seed_tracks';

function loadFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function GuestRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomCode = resolvedParams.code.toUpperCase();

  // Use individual selectors to avoid object reference churn
  const connect = useQueueStore(s => s.connect);
  const disconnect = useQueueStore(s => s.disconnect);
  const queue = useQueueStore(s => s.queue);
  const vibe = useQueueStore(s => s.vibe);
  const roomStats = useQueueStore(s => s.roomStats);
  const connected = useQueueStore(s => s.connected);
  const addSong = useQueueStore(s => s.addSong);
  const voteSong = useQueueStore(s => s.voteSong);
  const lastSkippedSong = useQueueStore(s => s.lastSkippedSong);
  const sessionEnded = useQueueStore(s => s.sessionEnded);

  // ── Session-ended auto-redirect ────────────────────────────────
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  useEffect(() => {
    if (!sessionEnded) return;
    setRedirectCountdown(5);
    const interval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          disconnectRef.current();
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionEnded, router]);

  // ── Search State ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Search History & Recommendations ──────────────────────────
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [seedTrackIds, setSeedTrackIds] = useState<string[]>([]);

  // ── UI State ───────────────────────────────────────────────────
  const [codeCopied, setCodeCopied] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load from localStorage on mount ───────────────────────────
  useEffect(() => {
    setSearchHistory(loadFromLS<string[]>(LS_HISTORY_KEY, []));
    setSeedTrackIds(loadFromLS<string[]>(LS_SEEDS_KEY, []));
  }, []);

  // ── Connect WebSocket (ref pattern avoids infinite loop) ──────
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  connectRef.current = connect;
  disconnectRef.current = disconnect;

  useEffect(() => {
    connectRef.current(roomCode, false);
    return () => disconnectRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // ── Fetch recommendations when seeds change ────────────────────
  useEffect(() => {
    if (seedTrackIds.length === 0) return;
    setIsLoadingRecs(true);
    fetchRecommendations(seedTrackIds)
      .then(setRecommendations)
      .finally(() => setIsLoadingRecs(false));
  }, [seedTrackIds]);

  // ── Clear results when query is empty ─────────────────────────
  useEffect(() => {
    if (!searchQuery) setSearchResults([]);
  }, [searchQuery]);

  // ── Close search dropdown on outside click ─────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const results = await searchSpotifyProxy(q);
      setSearchResults(results);
      setSearchHistory(prev => {
        const next = [q, ...prev.filter(h => h !== q)].slice(0, 8);
        localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleAddSong = useCallback((track: Song) => {
    addSong(track);
    setSearchQuery('');
    setSearchResults([]);
    setSearchFocused(false);
    setSeedTrackIds(prev => {
      const next = [track.id, ...prev.filter(id => id !== track.id)].slice(0, 10);
      localStorage.setItem(LS_SEEDS_KEY, JSON.stringify(next));
      return next;
    });
  }, [addSong]);

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    inputRef.current?.focus();
  };

  const removeHistoryItem = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const next = prev.filter(h => h !== query);
      localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(LS_HISTORY_KEY);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // ── Derived ───────────────────────────────────────────────────
  const safeQueue = Array.isArray(queue) ? queue : [];
  const nowPlaying = safeQueue[0] ?? null;
  const upNext = safeQueue.slice(1);
  const vibeLabel = vibe?.vibeLabel ?? 'Chill';
  const vibeScore = vibe?.vibeScore ?? 50;
  const showDropdown = searchFocused && (searchResults.length > 0 || searchQuery === '');

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Full-screen Background Image */}
      <div className="absolute inset-0 -z-50 bg-cover bg-center opacity-[0.35] pointer-events-none" style={{ backgroundImage: "url('/images/bg-guest.jpg')" }} />

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)' }}
            >
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold leading-none mb-0.5">Room Code</p>
              <button
                onClick={copyCode}
                className="font-black text-xl font-mono tracking-[0.2em] text-white flex items-center gap-1.5 hover:text-pink-400 transition-colors"
              >
                {roomCode}
                {codeCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/host/${roomCode}`)}
              className="h-7 text-xs bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
            >
              Host View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { disconnectRef.current(); router.push('/'); }}
              className="h-7 text-xs bg-red-950/20 border-red-500/20 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Exit Room</span>
            </Button>
            {roomStats && (
              <Badge variant="secondary" className="hidden sm:flex gap-1.5">
                <Users className="w-3 h-3" />
                {roomStats.memberCount}
              </Badge>
            )}
            <Badge variant="secondary" className={`${vibeLabelColor[vibeLabel] ?? 'text-zinc-300'} flex gap-1`}>
              <Zap className="w-3 h-3" />
              {vibeLabel}
            </Badge>
            <Badge variant="outline" className="text-pink-400 border-pink-500/30">Guest</Badge>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400 pulse-ring' : 'bg-red-500'}`} />
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* ── Vibe Bar (full-width always) ── */}
        {vibe && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl px-5 py-3 flex items-center gap-4 w-full"
          >
            <div className="flex gap-1 items-end h-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="equalizer-bar w-1" style={{ animationDelay: `${i * 0.1}s`, height: `${8 + i * 3}px` }} />
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

        {/* ── Responsive 2-column grid on md+, stacked on mobile ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* RIGHT / SEARCH SIDE — shown first on mobile via order */}
          <div className="order-1 md:order-2 md:col-span-7 flex flex-col gap-4">

            {/* Search Console */}
            <div ref={searchRef} className="relative">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <Input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search any song to add..."
                    className="pl-10 pr-4 h-12"
                    id="song-search-input"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button type="submit" disabled={isSearching || !searchQuery.trim()} className="h-12 px-5 flex-shrink-0">
                  {isSearching ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : 'Search'}
                </Button>
              </form>

              {/* Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 glass rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-h-[60vh] overflow-y-auto"
                  >
                    {searchResults.length > 0 ? (
                      searchResults.map((track) => (
                        <motion.button
                          key={track.id}
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                          onClick={() => handleAddSong(track)}
                          className="flex items-center gap-3 w-full p-3 text-left border-b border-white/5 last:border-0"
                        >
                          <img src={track.albumArt} alt={track.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{track.title}</p>
                            <p className="text-zinc-400 text-xs truncate">{track.artist}</p>
                          </div>
                          <Plus className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        </motion.button>
                      ))
                    ) : (
                      <>
                        {searchHistory.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between px-4 pt-3 pb-1">
                              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Recent Searches
                              </span>
                              <button onClick={clearHistory} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                                Clear all
                              </button>
                            </div>
                            {searchHistory.map((query) => (
                              <motion.div
                                key={query}
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                                onClick={() => handleHistoryClick(query)}
                              >
                                <Clock className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                                <span className="flex-1 text-sm text-zinc-300 truncate">{query}</span>
                                <button onClick={(e) => removeHistoryItem(query, e)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                            <Sparkles className="w-3 h-3 text-pink-400" />
                            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                              {seedTrackIds.length > 0 ? 'Recommended for You' : 'Popular Right Now'}
                            </span>
                          </div>
                          {isLoadingRecs ? (
                            <div className="flex justify-center py-4">
                              <motion.div
                                className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              />
                            </div>
                          ) : recommendations.length > 0 ? (
                            recommendations.map((track) => (
                              <motion.button
                                key={track.id}
                                whileHover={{ backgroundColor: 'rgba(255,0,127,0.06)' }}
                                onClick={() => handleAddSong(track)}
                                className="flex items-center gap-3 w-full p-3 text-left border-b border-white/5 last:border-0"
                              >
                                <img src={track.albumArt} alt={track.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-semibold truncate">{track.title}</p>
                                  <p className="text-zinc-400 text-xs truncate">{track.artist}</p>
                                </div>
                                <Plus className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              </motion.button>
                            ))
                          ) : seedTrackIds.length === 0 ? (
                            <p className="text-zinc-600 text-sm text-center py-4 px-4">
                              Add a song to get personalized recommendations!
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:block glass rounded-2xl p-4 border border-white/5 text-center text-xs text-zinc-500">
              ⚡ Tip: Search tracks and upvote your favourites to boost them to the top of the queue!
            </div>
          </div>

          {/* LEFT / QUEUE SIDE */}
          <div className="order-2 md:order-1 md:col-span-5 flex flex-col gap-4">

            {/* Now Playing */}
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
                    <img src={nowPlaying.albumArt} alt={nowPlaying.title} className="w-20 h-20 rounded-2xl object-cover shadow-xl" />
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-pink-500/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white text-lg font-black truncate mb-0.5">{nowPlaying.title}</h2>
                    <p className="text-zinc-400 text-sm truncate mb-3">{nowPlaying.artist}</p>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #FF007F, #FF007F88)' }}
                        animate={{ width: ['15%', '85%'] }}
                        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Up Next queue */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-base flex items-center gap-2">
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

              {safeQueue.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl text-center"
                >
                  <Music2 className="w-10 h-10 text-zinc-700 mb-3" strokeWidth={1} />
                  <p className="text-zinc-500 font-medium text-sm">The queue is empty</p>
                  <p className="text-zinc-700 text-xs mt-1">Search for a song to get started</p>
                </motion.div>
              ) : (
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
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

          </div>
        </div>
      </main>
      <AnimatePresence>
        {lastSkippedSong && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[9999] bg-black/90 border-2 border-red-500/80 rounded-2xl p-4 flex items-center gap-4 max-w-sm shadow-[0_0_30px_rgba(239,68,68,0.3)] backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0 animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-red-400 font-mono tracking-widest uppercase font-bold">Vibe Check Failed</p>
              <p className="text-sm font-bold text-white truncate">{lastSkippedSong.title}</p>
              <p className="text-xs text-zinc-400 truncate">Voted off the queue by the crowd</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session Ended Overlay (host terminated session) ──────────────── */}
      <AnimatePresence>
        {sessionEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-[0_0_60px_rgba(255,0,127,0.2)]"
            >
              {/* Animated icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 border border-pink-500/30 flex items-center justify-center">
                <span className="text-4xl">🎵</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-wide">Session Ended</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  The host has ended this Vibebox session.
                  <br />Thanks for voting — the crowd spoke!
                </p>
              </div>

              {/* Countdown ring */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-pink-500/40 flex items-center justify-center">
                  <span className="text-pink-400 font-black text-xl font-mono">{redirectCountdown}</span>
                </div>
                <p className="text-zinc-500 text-xs">Redirecting to home…</p>
              </div>

              <Button
                onClick={() => { disconnectRef.current(); router.push('/'); }}
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold uppercase tracking-wider h-11 shadow-lg shadow-pink-500/25"
              >
                Go Home Now
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SongCard Component ────────────────────────────────────────
function SongCard({
  song, rank, onUpvote, onDownvote,
}: {
  song: Song; rank: number; onUpvote: () => void; onDownvote: () => void;
}) {
  const [voted, setVoted] = useState<1 | -1 | null>(null);

  const handleVote = (delta: 1 | -1) => {
    if (voted === delta) return;
    setVoted(delta);
    if (delta === 1) onUpvote(); else onDownvote();
  };

  const scoreColor = song.score > 3 ? 'text-pink-400' : song.score > 0 ? 'text-green-400' : song.score < -1 ? 'text-red-400' : 'text-zinc-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass rounded-2xl p-3 flex items-center gap-3"
    >
      <div className="w-5 text-center text-zinc-600 text-xs font-mono font-bold flex-shrink-0">{rank}</div>
      <img src={song.albumArt} alt={song.title} className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-md" />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{song.title}</p>
        <p className="text-zinc-400 text-xs truncate">{song.artist}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleVote(1)}
          className={`p-1.5 rounded-lg transition-colors ${voted === 1 ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-green-400 hover:bg-zinc-800'}`}
          id={`upvote-${song.id}`}
          aria-label={`Upvote ${song.title}`}
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
        <span className={`w-7 text-center text-xs font-black font-mono ${scoreColor}`}>
          {song.score > 0 ? `+${song.score}` : song.score}
        </span>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleVote(-1)}
          className={`p-1.5 rounded-lg transition-colors ${voted === -1 ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'}`}
          id={`downvote-${song.id}`}
          aria-label={`Downvote ${song.title}`}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
