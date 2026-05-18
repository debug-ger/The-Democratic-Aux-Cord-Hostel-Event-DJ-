'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Activity, Zap, Users, AlertTriangle, Sparkles, Crown, ArrowLeftRight, X, Volume2, VolumeX } from 'lucide-react';
import { useQueueStore } from '../../../store/useQueueStore';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

export default function HostDashboardPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomCode = resolvedParams.code.toUpperCase();

  const connect = useQueueStore(s => s.connect);
  const disconnect = useQueueStore(s => s.disconnect);
  const queue = useQueueStore(s => s.queue);
  const vibe = useQueueStore(s => s.vibe);
  const roomStats = useQueueStore(s => s.roomStats);
  const connected = useQueueStore(s => s.connected);
  const nextSong = useQueueStore(s => s.nextSong);
  const prevSong = useQueueStore(s => s.prevSong);
  const aiSuggestion = useQueueStore(s => s.aiSuggestion);
  const skipThreshold = useQueueStore(s => s.skipThreshold);
  const updateSkipThreshold = useQueueStore(s => s.updateSkipThreshold);
  const transferHost = useQueueStore(s => s.transferHost);
  const retractHost = useQueueStore(s => s.retractHost);
  const topVoters = useQueueStore(s => s.topVoters);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(String(skipThreshold));
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDone, setTransferDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  connectRef.current = connect;
  disconnectRef.current = disconnect;

  useEffect(() => {
    connectRef.current(roomCode, true);
    return () => disconnectRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // Sync input when skipThreshold changes from server
  useEffect(() => { setThresholdInput(String(skipThreshold)); }, [skipThreshold]);

  const safeQueue = Array.isArray(queue) ? queue : [];
  const nowPlaying = safeQueue[0];
  const upNext = safeQueue[1];
  const nowPlayingId = nowPlaying?.id;

  // ── Audio Playback ──────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const hasPreview = nowPlaying?.previewUrl?.startsWith('http');

    if (hasPreview && audio.dataset.playingId !== nowPlaying!.id) {
      audio.dataset.playingId = nowPlaying!.id;
      audio.src = nowPlaying!.previewUrl!;
      audio.volume = isMuted ? 0 : 0.8;
      audio.crossOrigin = 'anonymous';
      audio.load();
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else if (!hasPreview) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      delete audio.dataset.playingId;
      setIsPlaying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlayingId]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else {
      if (nowPlaying.previewUrl?.startsWith('http')) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    audio.volume = next ? 0 : 0.8;
    setIsMuted(next);
  };

  const handleSetThreshold = () => {
    const val = parseInt(thresholdInput);
    if (!isNaN(val) && val >= -20 && val <= -1) {
      updateSkipThreshold(val);
    }
  };

  const handleTransfer = (userId: string) => {
    transferHost(userId);
    setTransferDone(true);
    setTimeout(() => { setShowTransferModal(false); setTransferDone(false); }, 2000);
  };

  const handleRetract = () => {
    retractHost();
    setTransferDone(false);
    setShowTransferModal(false);
  };

  const vibeScore = vibe?.vibeScore ?? 50;
  const totalVotes = safeQueue.reduce((acc, s) => acc + Math.abs(s.score), 0);
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
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 lg:p-8 font-sans">
      <audio ref={audioRef} onEnded={nextSong} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowTransferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-black text-lg text-white">Transfer Host Control</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Top voters in this session</p>
                </div>
                <button onClick={() => setShowTransferModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {transferDone ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-white font-bold">Host control transferred!</p>
                </div>
              ) : topVoters.length > 0 ? (
                <div className="space-y-3 mb-5">
                  {topVoters.map((voter, i) => (
                    <div key={voter.userId} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black
                        ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-zinc-400/20 text-zinc-300' : 'bg-amber-700/20 text-amber-600'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{voter.username}</p>
                        <p className="text-zinc-500 text-xs">+{voter.voteScore} votes</p>
                      </div>
                      <Button size="sm" onClick={() => handleTransfer(voter.userId)}
                        className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-xs border-0 hover:opacity-90 h-8">
                        <Crown className="w-3 h-3 mr-1" /> Make Host
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm text-center py-4 mb-4">No voters yet. Songs need upvotes first.</p>
              )}

              <div className="border-t border-white/5 pt-4">
                <Button onClick={handleRetract} variant="outline"
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 text-xs uppercase tracking-widest">
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-2" /> Retract Control Back to Me
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center bg-[#0a0a0a]/55 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">Vibebox</h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Host Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold leading-none mb-1">Room Code</p>
              <p className="text-lg sm:text-2xl font-black text-white font-mono tracking-[0.2em]">{roomCode}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/room/${roomCode}`)}
              className="bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs">
              Guest View
            </Button>
          </div>
        </header>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crowd Energy */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-6 uppercase">Crowd Energy</h2>
            <div className="flex flex-col md:flex-row items-center gap-8 justify-center py-4">
              <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                <motion.div className="absolute w-48 h-48 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center"
                  animate={{ scale: isPlaying ? [1, 1.08, 1] : 1 }} transition={{ duration: 2, repeat: Infinity }}>
                  <motion.div className="w-36 h-36 rounded-full border border-pink-500/30 bg-pink-500/5 flex items-center justify-center"
                    animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <div className="w-24 h-24 rounded-full bg-zinc-950 border border-white/10 flex flex-col items-center justify-center shadow-2xl">
                      <div className="flex gap-1 items-end h-5 mb-1.5">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`w-1 rounded-full ${isPlaying ? 'bg-cyan-400' : 'bg-zinc-700'}`}
                            style={{ height: isPlaying ? `${10+i*3}px` : '3px', animationName: isPlaying ? 'equalizer' : 'none', animationDuration: '1.2s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDirection: 'alternate', animationDelay: `${i*0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-xl font-black font-mono text-white">{vibeScore}%</span>
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Vibe Score</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
              {nowPlaying && (
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <p className="text-[10px] text-pink-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" /> Now Playing
                  </p>
                  <p className="text-lg font-black text-white truncate">{nowPlaying.title}</p>
                  <p className="text-sm text-zinc-400 truncate mb-2">{nowPlaying.artist}</p>
                  {!nowPlaying.previewUrl?.startsWith('http') && (
                    <span className="text-[9px] bg-red-950/80 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">No Preview</span>
                  )}
                </div>
              )}
            </div>
            {/* Controls */}
            <div className="absolute top-5 right-5 flex gap-2">
              <Button size="icon" variant="secondary" onClick={prevSong} className="bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 border-0"><SkipBack className="w-4 h-4" /></Button>
              <Button size="icon" variant="secondary" onClick={togglePlayback} className="bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 border-0">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <Button size="icon" variant="secondary" onClick={nextSong} className="bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 border-0"><SkipForward className="w-4 h-4" /></Button>
              <Button size="icon" variant="secondary" onClick={toggleMute} className="bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 border-0">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0"><Activity className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-1">Avg BPM</p>
                <div className="flex items-baseline gap-2"><span className="text-2xl sm:text-3xl font-black">{avgBpm}</span><span className="text-xs text-green-400">+2</span></div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 flex-shrink-0"><Zap className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-1">Vote Velocity</p>
                <div className="flex items-baseline gap-2"><span className="text-2xl sm:text-3xl font-black">+{voteVelocity}</span><span className="text-xs text-zinc-400">v/min</span></div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4 lg:flex-1">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0"><Users className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-1">Active Voters</p>
                <div className="flex items-baseline gap-2"><span className="text-2xl sm:text-3xl font-black">{roomStats?.memberCount || 1}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Vibe Continuity */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6">
          <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-5 uppercase">Vibe Continuity Engine</h2>
          <div className="flex flex-col md:flex-row gap-5 items-stretch">
            <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
              {nowPlaying ? (
                <>
                  <img src={nowPlaying.albumArt} alt={nowPlaying.title} className="w-14 h-14 rounded-lg object-cover shadow-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Playing</p>
                    <p className="text-base font-bold truncate text-white">{nowPlaying.title}</p>
                    <p className="text-sm text-zinc-400 truncate">{nowPlaying.artist}</p>
                  </div>
                </>
              ) : <div className="text-zinc-500 font-mono text-sm">No track playing</div>}
            </div>
            <div className="flex flex-col justify-center items-center px-2">
              {aiSuggestion && !aiSuggestion.isPositive && (
                <div className="bg-red-950 border border-red-900 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> Vibe Whiplash
                </div>
              )}
            </div>
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
              ) : <div className="text-zinc-600 font-mono text-sm">Queue is empty</div>}
            </div>
          </div>
          {aiSuggestion && (
            <div className="mt-5 flex items-center justify-between bg-zinc-900/40 p-4 rounded-xl border border-white/5">
              <p className={`text-sm font-medium ${!aiSuggestion.isPositive ? 'text-red-400' : 'text-zinc-300'}`}>
                <span className="font-bold uppercase tracking-widest text-xs mr-3 opacity-70">AI Insight:</span>
                {aiSuggestion.message}
              </p>
              {!aiSuggestion.isPositive && (
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase ml-4 flex-shrink-0">
                  <Sparkles className="w-3 h-3 mr-2" /> Smooth with AI
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Host Controls */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Threshold */}
          <div>
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-3 uppercase">Auto-Skip Threshold</h2>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={-20} max={-1} step={1}
                value={thresholdInput}
                onChange={e => setThresholdInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetThreshold()}
                className="w-24 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-lg font-black font-mono text-center focus:outline-none focus:border-cyan-500/50"
              />
              <Button onClick={handleSetThreshold} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs h-10">Set</Button>
              <span className="text-zinc-500 text-xs">Current: <span className="text-cyan-400 font-bold">{skipThreshold}</span></span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">Enter a negative number (e.g. -3). Songs reaching this vote score are auto-skipped.</p>
          </div>
          {/* Transfer */}
          <div className="flex flex-col justify-center border-t border-white/5 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-2 uppercase">Transfer Host Control</h2>
            <p className="text-[10px] text-zinc-600 mb-3">
              {topVoters.length > 0 ? `${topVoters.length} top voter(s) available to receive control.` : 'Get votes on songs to identify top voters.'}
            </p>
            <Button onClick={() => setShowTransferModal(true)} variant="outline"
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 uppercase tracking-widest text-xs">
              <Crown className="w-3.5 h-3.5 mr-2" /> Manage Host Powers
            </Button>
          </div>
        </div>

        {/* Queue */}
        {safeQueue.length > 0 && (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6">
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-5 uppercase flex items-center gap-2">
              Full Queue <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full text-xs font-normal">{safeQueue.length}</span>
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {safeQueue.map((song, i) => (
                <div key={song.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
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
