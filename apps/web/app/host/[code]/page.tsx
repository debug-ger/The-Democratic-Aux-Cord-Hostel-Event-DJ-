'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Activity, Zap, Users, AlertTriangle, Sparkles, QrCode, Award } from 'lucide-react';
import type { Song } from '../../../lib/types';
import { useQueueStore } from '../../../store/useQueueStore';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { GeometricWebBackground } from '../../../components/GeometricWebBackground';

// Beautiful Woofer Cymatics (Dancing Water Particles with Spring Physics & Motion Trails)
function WooferCymatics({ vibeScore, isPlaying, bpm, isHypeTrainActive }: { vibeScore: number; isPlaying: boolean; bpm: number; isHypeTrainActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }> = [];
    
    const actualBpm = bpm > 40 ? bpm : (vibeScore > 60 ? 124 : 85);
    const beatInterval = (60 / actualBpm) * 1000;
    let lastBeat = Date.now();
    
    let speakerScale = 1.0;
    let speakerVelocity = 0.0;
    const springStiffness = 0.08;
    const springDamping = 0.82;
    
    const colors = vibeScore > 60 
      ? ['#FF007F', '#FF3300', '#D946EF', '#FF0055', '#FFEA00'] 
      : ['#00F0FF', '#3B82F6', '#00FF66', '#A855F7'];

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 220;
      canvas.height = 220;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const createSplashes = (centerX: number, centerY: number, radius: number) => {
      if (!isPlaying) return;
      const count = isHypeTrainActive ? 40 : (vibeScore > 60 ? 25 : 8);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (isHypeTrainActive ? 6.5 : (vibeScore > 60 ? 4.5 : 2.0)) + Math.random() * 3.5;
        particles.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.0,
          vy: Math.sin(angle) * speed - (Math.random() * 5 + 3),
          size: Math.random() * 5 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)] || '#FF007F',
          alpha: 1.0,
          decay: Math.random() * 0.015 + 0.01
        });
      }
    };

    const render = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 42;
      
      const now = Date.now();
      if (isPlaying && (now - lastBeat > beatInterval)) {
        lastBeat = now;
        speakerVelocity += vibeScore > 60 ? 0.15 : 0.07;
        createSplashes(centerX, centerY, baseRadius * speakerScale);
      }
      
      const springForce = (1.0 - speakerScale) * springStiffness;
      speakerVelocity += springForce;
      speakerVelocity *= springDamping;
      speakerScale += speakerVelocity;
      
      const auraGrad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.4, centerX, centerY, baseRadius * speakerScale * 1.9);
      const auraColor = vibeScore > 60 ? 'rgba(255, 0, 127, 0.18)' : 'rgba(0, 240, 255, 0.15)';
      auraGrad.addColorStop(0, 'rgba(0,0,0,0)');
      auraGrad.addColorStop(1, auraColor);
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * speakerScale * 2.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.16 * speakerScale, 0, Math.PI * 2);
      ctx.strokeStyle = '#16161a';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.20 * speakerScale, 0, Math.PI * 2);
      ctx.strokeStyle = vibeScore > 60 ? 'rgba(255, 0, 127, 0.25)' : 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * speakerScale, 0, Math.PI * 2);
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = vibeScore > 60 ? '#FF007F' : '#00F0FF';
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 25;
      ctx.shadowColor = vibeScore > 60 ? '#FF007F' : '#00F0FF';
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.38 * speakerScale, 0, Math.PI * 2);
      ctx.fillStyle = '#010101';
      ctx.strokeStyle = vibeScore > 60 ? 'rgba(255, 0, 127, 0.5)' : 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24;
        p.vx *= 0.98;
        p.alpha -= p.decay;
        
        if (p.alpha <= 0) {
          particles.splice(index, 1);
          return;
        }
        
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        ctx.beginPath();
        if (speed > 1.5) {
          const angle = Math.atan2(p.vy, p.vx);
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      });
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [vibeScore, isPlaying, bpm]);

  return <canvas ref={canvasRef} className="w-full h-full block rounded-full" />;
}

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
  const lastSkippedSong = useQueueStore(s => s.lastSkippedSong);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pure-frontend QR Flyer & Vibe Savior Session Recap states
  const [isFlyerOpen, setIsFlyerOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [recapData, setRecapData] = useState<{
    savior: Song | null;
    slayer: Song | null;
    hypeIndex: number;
  } | null>(null);

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
        
        if (isAudioUnlocked) {
          audio.play()
            .then(() => {
              setIsPlaying(true);
              setAudioError(null);
            })
            .catch(e => {
              console.warn('[Host Audio] Autoplay prevented:', e.message);
              setIsPlaying(false);
            });
        } else {
          setIsPlaying(false);
        }
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
  }, [nowPlayingId, isAudioUnlocked]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;

    if (!isAudioUnlocked) {
      setIsAudioUnlocked(true);
    }

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
          .then(() => {
            setIsPlaying(true);
            setAudioError(null);
          })
          .catch(e => {
            console.warn('[Host Audio] Play failed:', e.message);
            setAudioError('Playback failed. Please try again.');
            setIsPlaying(false);
          });
      }
    }
  };

  const handleUnlockAudio = () => {
    setIsAudioUnlocked(true);
    const audio = audioRef.current;
    if (audio && nowPlaying) {
      const hasValidPreview = nowPlaying.previewUrl &&
        (nowPlaying.previewUrl.startsWith('http://') || nowPlaying.previewUrl.startsWith('https://'));
      if (hasValidPreview) {
        audio.dataset.playingId = nowPlaying.id;
        audio.src = nowPlaying.previewUrl!;
        audio.load();
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setAudioError(null);
          })
          .catch(e => {
            console.error('[Host Audio] Unlock play failed:', e);
            setAudioError('Unlock failed: check your audio permissions.');
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

  // Pure-frontend dynamic Hype Train calculation
  const isHypeTrainActive = parseFloat(voteVelocity) >= 1.5 && isPlaying;

  const triggerRecap = () => {
    if (safeQueue.length === 0) return;
    const sorted = [...safeQueue].sort((a, b) => b.score - a.score);
    const savior = sorted[0] || null;
    const slayer = sorted[sorted.length - 1] || null;
    const hypeIndex = Math.min(100, Math.round(parseFloat(voteVelocity) * 35 + vibeScore));
    
    setRecapData({ savior, slayer, hypeIndex });
    setIsRecapOpen(true);
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-mono text-sm tracking-widest">INITIALIZING TELEMETRY</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Full-screen Background Image */}
      <div className="absolute inset-0 -z-50 bg-cover bg-center opacity-[0.28] pointer-events-none" style={{ backgroundImage: "url('/images/bg-host.jpg')" }} />

      {/* Hidden audio element with error tracking and CORS attributes */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="auto"
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          setAudioError(null);
        }}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          const err = audioRef.current?.error;
          console.error('[Host Audio] Element Error:', err);
          if (err) {
            if (err.code === 1) setAudioError('Audio fetching aborted.');
            else if (err.code === 2) setAudioError('Network error downloading audio.');
            else if (err.code === 3) setAudioError('Audio decoding failed (unsupported format).');
            else if (err.code === 4) setAudioError('Audio source not supported or CORS blocked.');
            else setAudioError(`Playback error: ${err.message || 'unknown error'}`);
          } else {
            setAudioError('Failed to load audio preview.');
          }
          setIsPlaying(false);
        }}
      />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex justify-between items-center bg-[#0a0a0a]/55 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/10 flex-shrink-0">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                  Vibebox
                </h1>
                {isHypeTrainActive && (
                  <span className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce tracking-widest uppercase shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                    🔥 HYPE ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Host Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right mr-1 sm:mr-3">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold leading-none mb-1">Room Code</p>
              <p className="text-base sm:text-2xl font-black text-white font-mono tracking-[0.1em] sm:tracking-[0.2em]">{roomCode}</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFlyerOpen(true)}
              className="bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:text-white hover:bg-cyan-500/25 text-xs h-9 px-2 sm:px-3 flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Flyer</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={triggerRecap}
              className="bg-pink-500/10 border-pink-500/20 text-pink-400 hover:text-white hover:bg-pink-500/25 text-xs h-9 px-2 sm:px-3 flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden md:inline">End Session</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/room/${roomCode}`)}
              className="bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs h-9 sm:px-4"
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
              {/* Animated Woofer Cymatics visualizer */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center flex-shrink-0 bg-black rounded-full overflow-hidden border border-white/5 shadow-2xl">
                <WooferCymatics vibeScore={vibeScore} isPlaying={isPlaying} bpm={avgBpm} isHypeTrainActive={isHypeTrainActive} />
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
                  {(!nowPlaying.previewUrl || (!nowPlaying.previewUrl.startsWith('http://') && !nowPlaying.previewUrl.startsWith('https://'))) ? (
                    <span className="text-[9px] bg-red-950/80 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      No Preview
                    </span>
                  ) : (
                    audioError && (
                      <div className="mt-2 text-[10px] bg-red-950/60 border border-red-900/50 text-red-400 px-2 py-1 rounded flex items-center gap-1.5 justify-center md:justify-start font-mono">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        {audioError}
                      </div>
                    )
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

        {/* Pure-frontend QR Flyer Modal */}
        {isFlyerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/10 mb-4">
                <Zap className="w-6 h-6 text-white animate-pulse" />
              </div>
              
              <h3 className="font-black text-lg tracking-wider text-white uppercase mb-1">
                Join the Session
              </h3>
              <p className="text-xs text-zinc-400 mb-6">Scan with phone camera to add and upvote songs</p>
              
              <div className="p-3 bg-white rounded-2xl mb-6 shadow-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=000000&data=${encodeURIComponent(
                    typeof window !== 'undefined' ? window.location.origin + '/room/' + roomCode : ''
                  )}`}
                  alt="QR Code"
                  className="w-44 h-44"
                />
              </div>
              
              <div className="mb-6">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Room Code</p>
                <p className="text-3xl font-black text-white font-mono tracking-[0.2em]">{roomCode}</p>
              </div>
              
              <Button
                onClick={() => setIsFlyerOpen(false)}
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider h-11"
              >
                Close Flyer
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Pure-frontend Vibe Savior Session Recap Modal */}
        {isRecapOpen && recapData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <h2 className="text-center font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 mb-6 uppercase">
                🏆 Session Recap Awards
              </h2>
              
              <div className="space-y-4">
                {recapData.savior && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0 text-xl font-bold">
                      🏆
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-green-400 font-mono tracking-widest uppercase font-bold">Vibe Savior Award</p>
                      <p className="text-sm font-bold text-white truncate">{recapData.savior.title}</p>
                      <p className="text-xs text-zinc-450 truncate">Final Score: +{recapData.savior.score}</p>
                    </div>
                  </div>
                )}

                {recapData.slayer && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0 text-xl font-bold">
                      💀
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-red-400 font-mono tracking-widest uppercase font-bold">Vibe Slayer Award</p>
                      <p className="text-sm font-bold text-white truncate">{recapData.slayer.title}</p>
                      <p className="text-xs text-zinc-450 truncate">Final Score: {recapData.slayer.score}</p>
                    </div>
                  </div>
                )}

                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-bold mb-1">Session Hype Index</p>
                  <p className="text-4xl font-black text-white font-mono">{recapData.hypeIndex}%</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Calculated using vote frequency and average BPM</p>
                </div>
              </div>

              <Button
                onClick={() => setIsRecapOpen(false)}
                className="w-full mt-6 bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider h-11"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Autoplay Unlock Overlay */}
      {!isAudioUnlocked && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center space-y-6 mx-4 shadow-[0_0_50px_rgba(0,240,255,0.15)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Zap className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-wider text-white">Vibebox Host Ready</h2>
              <p className="text-sm text-zinc-400 font-medium">
                To comply with browser security rules, we need a single click to enable live audio playback for this session.
              </p>
            </div>
            <Button
              onClick={handleUnlockAudio}
              className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Start Session & Enable Audio
            </Button>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
