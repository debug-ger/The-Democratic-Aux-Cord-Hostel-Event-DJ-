'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Activity, Zap, Users, AlertTriangle, Sparkles } from 'lucide-react';
import { useQueueStore } from '../../../store/useQueueStore';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

export default function HostDashboardPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomCode = resolvedParams.code.toUpperCase();

  // Selector-based subscriptions for stable references
  const connect = useQueueStore(s => s.connect);
  const disconnect = useQueueStore(s => s.disconnect);
  const queue = useQueueStore(s => s.queue);
  const vibe = useQueueStore(s => s.vibe);
  const roomStats = useQueueStore(s => s.roomStats);
  const connected = useQueueStore(s => s.connected);
  const nextSong = useQueueStore(s => s.nextSong);
  const prevSong = useQueueStore(s => s.prevSong);
  const aiSuggestion = useQueueStore(s => s.aiSuggestion);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ref-based connection to avoid infinite re-runs
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  connectRef.current = connect;
  disconnectRef.current = disconnect;

  useEffect(() => {
    connectRef.current(roomCode, true);
    return () => disconnectRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // Ensure queue is always an array
  const safeQueue = Array.isArray(queue) ? queue : [];
  const nowPlaying = safeQueue[0];
  const upNext = safeQueue[1];
  const nowPlayingId = nowPlaying?.id;

  // ── Audio Playback Logic ──────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const hasValidPreview = nowPlaying?.previewUrl &&
      (nowPlaying.previewUrl.startsWith('http://') || nowPlaying.previewUrl.startsWith('https://'));

    if (hasValidPreview) {
      if (audio.dataset.playingId !== nowPlaying.id) {
        audio.dataset.playingId = nowPlaying.id;
        audio.src = nowPlaying.previewUrl!;
        audio.load();
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(e => {
            console.warn('[Host Audio] Autoplay prevented:', e.message);
            setIsPlaying(false);
          });
      }
    } else if (nowPlaying) {
      console.warn(`[Host Audio] No preview URL for: ${nowPlaying.title}`);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      delete audio.dataset.playingId;
      setIsPlaying(false);
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      delete audio.dataset.playingId;
      setIsPlaying(false);
    }
  }, [nowPlayingId]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;

    const hasValidPreview = nowPlaying.previewUrl &&
      (nowPlaying.previewUrl.startsWith('http://') || nowPlaying.previewUrl.startsWith('https://'));

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (hasValidPreview) {
        if (audio.dataset.playingId !== nowPlaying.id) {
          audio.dataset.playingId = nowPlaying.id;
          audio.src = nowPlaying.previewUrl!;
          audio.load();
        }
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(e => {
            console.warn('[Host Audio] Play failed:', e.message);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleEnded = () => nextSong();

  const vibeScore = vibe?.vibeScore ?? 50;

  // Calculate telemetry stats
  const totalVotes = safeQueue.reduce((acc, song) => acc + Math.abs(song.score), 0);
  const voteVelocity = safeQueue.length > 0 && totalVotes > 0 ? (totalVotes / safeQueue.length).toFixed(1) : '0.0';
  const avgBpm = safeQueue.length > 0 ? 120 + Math.floor(safeQueue.length * 2.5) : 120;

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-mono text-sm tracking-widest">INITIALIZING TELEMETRY</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500/30">

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={handleEnded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex justify-between items-center bg-[#0a0a0a]/55 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/10 flex-shrink-0">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                Vibebox
              </h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Host Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold leading-none mb-1">Room Code</p>
              <p className="text-lg sm:text-2xl font-black text-white font-mono tracking-[0.1em] sm:tracking-[0.2em]">{roomCode}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/room/${roomCode}`)}
              className="bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs h-9 sm:h-10 sm:px-4"
            >
              Guest View
            </Button>
          </div>
        </header>

        {/* ── Telemetry Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CROWD ENERGY WIDGET */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-6 uppercase">Crowd Energy</h2>

            <div className="flex flex-col md:flex-row items-center gap-8 justify-center py-4">
              {/* Concentric circles */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center flex-shrink-0">
                <motion.div
                  className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center"
                  animate={{ scale: isPlaying ? [1, 1.08, 1] : 1 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-pink-500/30 bg-pink-500/5 flex items-center justify-center"
                    animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-950 border border-white/10 flex flex-col items-center justify-center shadow-2xl">
                      <div className="flex gap-1 items-end h-5 mb-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full ${isPlaying ? 'bg-cyan-400' : 'bg-zinc-700'}`}
                            style={{
                              height: isPlaying ? `${10 + i * 3}px` : '3px',
                              animation: isPlaying ? 'equalizer 1.2s ease-in-out infinite alternate' : 'none',
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xl sm:text-2xl font-black font-mono text-white">{vibeScore}%</span>
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Vibe Score</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Playback info */}
              {nowPlaying && (
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <p className="text-[10px] text-pink-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                    Now Playing
                  </p>
                  <p className="text-lg font-black text-white truncate">{nowPlaying.title}</p>
                  <p className="text-sm text-zinc-400 truncate mb-2">{nowPlaying.artist}</p>
                  {(!nowPlaying.previewUrl || (!nowPlaying.previewUrl.startsWith('http://') && !nowPlaying.previewUrl.startsWith('https://'))) && (
                    <span className="text-[9px] bg-red-950/80 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      No Preview
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="absolute top-5 right-5 flex gap-2">
              <Button size="icon" variant="secondary" onClick={prevSong} className="bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 backdrop-blur-md border-0">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" onClick={togglePlayback} className="bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 backdrop-blur-md border-0">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <Button size="icon" variant="secondary" onClick={nextSong} className="bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 backdrop-blur-md border-0">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* RIGHT STATS — adaptive grid on sm/md, flex-col on lg */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col gap-4">

            {/* AVG BPM */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-1">Avg BPM</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black">{avgBpm}</span>
                  <span className="text-xs text-green-400">+2</span>
                </div>
              </div>
            </div>

            {/* VOTE VELOCITY */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-1">Vote Velocity</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black">+{voteVelocity}</span>
                  <span className="text-xs text-zinc-400">v/min</span>
                </div>
                <p className="text-xs text-pink-400/80 mt-0.5">High Engagement</p>
              </div>
            </div>

            {/* ACTIVE VOTERS */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4 lg:flex-1">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-1">Active Voters</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black">{roomStats?.memberCount || 1}</span>
                  <span className="text-lg text-zinc-600 font-black">/ {Math.max((roomStats?.memberCount || 1), 42)}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">~90% participation</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Vibe Continuity Engine ────────────────────────── */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6">
          <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-5 uppercase">Vibe Continuity Engine</h2>

          <div className="flex flex-col md:flex-row gap-5 items-stretch">

            {/* Now Playing card */}
            <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
              {nowPlaying ? (
                <>
                  <img src={nowPlaying.albumArt} alt={nowPlaying.title} className="w-14 h-14 rounded-lg object-cover shadow-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Playing</p>
                      {(!nowPlaying.previewUrl || (!nowPlaying.previewUrl.startsWith('http://') && !nowPlaying.previewUrl.startsWith('https://'))) && (
                        <span className="text-[9px] bg-red-950/80 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">No Preview</span>
                      )}
                    </div>
                    <p className="text-base font-bold truncate text-white">{nowPlaying.title}</p>
                    <p className="text-sm text-zinc-400 truncate">{nowPlaying.artist}</p>
                  </div>
                </>
              ) : (
                <div className="text-zinc-500 py-3 font-mono text-sm">No track playing</div>
              )}
            </div>

            {/* AI Divider */}
            <div className="flex flex-col justify-center items-center px-2 relative">
              <div className="w-full md:w-[2px] h-[2px] md:h-full bg-zinc-800 absolute -z-10" />
              {aiSuggestion && !aiSuggestion.isPositive && (
                <div className="bg-red-950 border border-red-900 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  <AlertTriangle className="w-3 h-3" />
                  Vibe Whiplash
                </div>
              )}
              {aiSuggestion && aiSuggestion.isPositive && (
                <div className="bg-green-950 border border-green-900 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 shadow-[0_0_15px_rgba(22,163,74,0.2)]">
                  <Activity className="w-3 h-3" />
                  Smooth Transition
                </div>
              )}
            </div>

            {/* Up Next card */}
            <div className="flex-1 bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex gap-4 items-center opacity-80">
              {upNext ? (
                <>
                  <img src={upNext.albumArt} alt={upNext.title} className="w-14 h-14 rounded-lg object-cover grayscale opacity-70 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Up Next</p>
                    <p className="text-base font-bold truncate text-zinc-300">{upNext.title}</p>
                    <p className="text-sm text-zinc-500 truncate">{upNext.artist}</p>
                  </div>
                </>
              ) : (
                <div className="text-zinc-600 py-3 font-mono text-sm">Queue is empty</div>
              )}
            </div>

          </div>

          {/* AI Insight Banner */}
          {aiSuggestion && (
            <div className="mt-5 flex items-center justify-between bg-zinc-900/40 p-4 rounded-xl border border-white/5">
              <p className={`text-sm font-medium ${!aiSuggestion.isPositive ? 'text-red-400' : 'text-zinc-300'}`}>
                <span className="font-bold uppercase tracking-widest text-xs mr-3 opacity-70">AI Insight:</span>
                {aiSuggestion.message}
              </p>
              {!aiSuggestion.isPositive && (
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] ml-4 flex-shrink-0">
                  <Sparkles className="w-3 h-3 mr-2" />
                  Smooth with AI
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Full Queue List ────────────────────────────────── */}
        {safeQueue.length > 0 && (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6">
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-5 uppercase flex items-center gap-2">
              Full Queue
              <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full text-xs font-normal">{safeQueue.length}</span>
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {safeQueue.map((song, i) => (
                <div key={song.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                  <span className="w-6 text-center text-zinc-600 text-xs font-mono">{i + 1}</span>
                  <img src={song.albumArt} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{song.title}</p>
                    <p className="text-zinc-500 text-xs truncate">{song.artist}</p>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${song.score > 0 ? 'text-green-400' : song.score < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {song.score > 0 ? `+${song.score}` : song.score}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
