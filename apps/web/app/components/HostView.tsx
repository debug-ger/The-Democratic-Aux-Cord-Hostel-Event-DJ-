"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, BarChart2, Bot, AlertTriangle } from "lucide-react";
import { useQueueStore } from "../../store/useQueueStore";

// Beautiful Woofer Cymatics (Dancing Water Particles with Spring Physics & Motion Trails)
function WooferCymatics({ energyState }: { energyState: 'low' | 'high' }) {
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
    
    // Beat timing
    const bpm = energyState === 'high' ? 124 : 85;
    const beatInterval = (60 / bpm) * 1000;
    let lastBeat = Date.now();
    
    // Spring physics states for smooth, high-quality subwoofer suspension bounce
    let speakerScale = 1.0;
    let speakerVelocity = 0.0;
    const springStiffness = 0.08;
    const springDamping = 0.82;
    
    // Saturated Neon colors matching Vibebox's high-quality aesthetic
    const colors = energyState === 'high' 
      ? ['#FF007F', '#FF3300', '#D946EF', '#FF0055', '#FFEA00'] 
      : ['#00F0FF', '#3B82F6', '#00FF66', '#A855F7'];

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = 300;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const createSplashes = (centerX: number, centerY: number, radius: number) => {
      const count = energyState === 'high' ? 25 : 8;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Splash outward with vertical gravity influence
        const speed = (energyState === 'high' ? 4.5 : 2.0) + Math.random() * 3.5;
        particles.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.0,
          vy: Math.sin(angle) * speed - (Math.random() * 5 + 3), // Smooth vertical bounce
          size: Math.random() * 5 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)] || '#FF007F',
          alpha: 1.0,
          decay: Math.random() * 0.015 + 0.01
        });
      }
    };

    const render = () => {
      // High-quality motion trail blur effect: draw semi-transparent black overlay instead of clearRect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 48;
      
      const now = Date.now();
      if (now - lastBeat > beatInterval) {
        lastBeat = now;
        // Add velocity force impulse to spring on beat
        speakerVelocity += energyState === 'high' ? 0.15 : 0.07;
        createSplashes(centerX, centerY, baseRadius * speakerScale);
      }
      
      // Calculate spring physics suspension
      const springForce = (1.0 - speakerScale) * springStiffness;
      speakerVelocity += springForce;
      speakerVelocity *= springDamping;
      speakerScale += speakerVelocity;
      
      // 1. Woofer Ambient Aura Gradient
      const auraGrad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.4, centerX, centerY, baseRadius * speakerScale * 1.9);
      const auraColor = energyState === 'high' ? 'rgba(255, 0, 127, 0.18)' : 'rgba(0, 240, 255, 0.15)';
      auraGrad.addColorStop(0, 'rgba(0,0,0,0)');
      auraGrad.addColorStop(1, auraColor);
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * speakerScale * 2.1, 0, Math.PI * 2);
      ctx.fill();
      
      // 2. High Quality Metal Speaker Frame Outer Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.16 * speakerScale, 0, Math.PI * 2);
      ctx.strokeStyle = '#16161a';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Thin sleek neon trace line around metallic ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.20 * speakerScale, 0, Math.PI * 2);
      ctx.strokeStyle = energyState === 'high' ? 'rgba(255, 0, 127, 0.25)' : 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 3. Main Speaker Cone (Pulsing smoothly with Spring damping)
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * speakerScale, 0, Math.PI * 2);
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = energyState === 'high' ? '#FF007F' : '#00F0FF';
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 25;
      ctx.shadowColor = energyState === 'high' ? '#FF007F' : '#00F0FF';
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow
      
      // 4. Center Rubber Dust Cap
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.38 * speakerScale, 0, Math.PI * 2);
      ctx.fillStyle = '#010101';
      ctx.strokeStyle = energyState === 'high' ? 'rgba(255, 0, 127, 0.5)' : 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      
      // 5. Update & Draw Particles (Leaves glowing smooth trails)
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Dynamic water gravity + air resistance
        p.vy += 0.24; // Gravity pulling drops downward
        p.vx *= 0.98; // Friction
        
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
        
        // Fluid droplet teardrop shape: stretch along moving trajectory
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
  }, [energyState]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

export default function HostView() {
  const energyState = useQueueStore((state) => state.energyState);
  const activeUsers = useQueueStore((state) => state.activeUsers);
  const roomCode = useQueueStore((state) => state.roomCode);
  const initSocket = useQueueStore((state) => state.initSocket);
  const disconnectSocket = useQueueStore((state) => state.disconnectSocket);
  const setEnergyState = useQueueStore((state) => state.setEnergyState);

  useEffect(() => {
    initSocket(roomCode);
    return () => disconnectSocket();
  }, [roomCode, initSocket, disconnectSocket]);

  useEffect(() => {
    const socket = useQueueStore.getState().socket;
    if (!socket || !socket.connected) {
      const interval = setInterval(() => {
        setEnergyState(useQueueStore.getState().energyState === "high" ? "low" : "high");
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [setEnergyState]);

  return (
    <div className="h-full flex flex-col p-6 pt-12 overflow-y-auto bg-black text-white">
      {/* Title with sleek tracking */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-white">Host Dashboard</h1>
          <p className="text-xs text-muted font-mono tracking-widest uppercase mt-1">Real-time room telemetry</p>
        </div>
        <div className="px-4 py-1.5 rounded-full border border-white/5 bg-white/5 font-mono text-xs text-muted tracking-wider">
          Room: <span className="text-white font-bold">{roomCode}</span>
        </div>
      </div>

      {/* Crowd Energy Meter & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Dynamic Cymatics Speaker Card with Premium Matte styling */}
        <div className="glass-panel glass-border rounded-3xl p-8 flex flex-col items-center justify-center relative min-h-[340px] bg-gradient-to-b from-white/[0.03] to-transparent shadow-[0_4px_30px_rgba(0,0,0,0.8)] overflow-hidden border border-white/5">
          <h3 className="absolute top-6 left-6 text-xs font-mono text-muted tracking-widest uppercase">Crowd Energy</h3>
          
          <div className="w-full h-64 flex items-center justify-center">
            <WooferCymatics energyState={energyState} />
          </div>

          <div className="absolute bottom-6 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${energyState === 'high' ? 'bg-primary-start animate-ping' : 'bg-primary-end'}`} />
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
              {energyState === 'high' ? 'Woofer suspension: active cymatics' : 'Woofer suspension: idle'}
            </span>
          </div>
        </div>

        {/* Metrics Sidebar */}
        <div className="flex flex-col gap-4">
          <MetricCard icon={<Activity className="text-positive" />} label="Avg BPM" value={energyState === "high" ? "124" : "85"} trend="+2 from last track" />
          <MetricCard icon={<Zap className="text-primary-start" />} label="Vote Velocity" value={energyState === "high" ? "+4.2 v/min" : "+0.8 v/min"} trend="High Engagement" />
          <MetricCard icon={<BarChart2 className="text-primary-end" />} label="Active Voters" value={`${Math.floor(activeUsers * 0.9)} / ${activeUsers}`} trend="90% participation" />
        </div>
      </div>

      {/* AI Transition Analytics Widget */}
      <h3 className="text-xs font-mono text-muted tracking-widest uppercase mb-4">Vibe Continuity Engine</h3>
      <div className="glass-panel glass-border rounded-2xl p-6 relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          
          {/* Track A */}
          <div className="flex-1 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop" className="w-10 h-10 rounded shadow-md object-cover border border-white/10" alt="Track A" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted mb-0.5 uppercase tracking-wider font-mono">Playing</p>
              <p className="text-sm font-bold truncate text-white">Paint The Town Red</p>
              <p className="text-[10px] text-muted truncate">90 BPM • Hip-Hop</p>
            </div>
          </div>

          {/* The Bridge */}
          <div className="flex-1 flex flex-col items-center justify-center relative px-2">
            <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
              <motion.div 
                className={`absolute inset-y-0 left-0 ${energyState === "low" ? 'bg-critical' : 'bg-primary-start'} w-full`}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            {energyState === "low" ? (
              <div className="mt-2 text-critical flex items-center gap-1 bg-critical/10 px-2 py-0.5 rounded text-[10px] font-mono border border-critical/20 uppercase whitespace-nowrap tracking-wider">
                <AlertTriangle className="w-3 h-3 animate-pulse" />
                Vibe Whiplash Detected
              </div>
            ) : (
              <div className="mt-2 text-primary-start flex items-center gap-1 bg-primary-start/10 px-2 py-0.5 rounded text-[10px] font-mono border border-primary-start/20 uppercase whitespace-nowrap tracking-wider">
                Smooth Transition (88%)
              </div>
            )}
          </div>

          {/* Track B */}
          <div className="flex-1 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop" className="w-10 h-10 rounded shadow-md object-cover border border-white/10" alt="Track B" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted mb-0.5 uppercase tracking-wider font-mono">Up Next</p>
              <p className="text-sm font-bold truncate text-white">Gosh</p>
              <p className="text-[10px] text-muted truncate">118 BPM • Electronic</p>
            </div>
          </div>
        </div>

        {/* AI Action */}
        <AnimatePresence>
          {energyState === "low" && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center"
            >
              <p className="text-xs text-muted max-w-[60%]">
                <span className="text-critical font-bold uppercase tracking-wider font-mono mr-1">Warning:</span> 28 BPM jump detected. This will kill the room's momentum.
              </p>
              <button className="bg-white text-black font-bold text-xs tracking-wider uppercase px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg active:scale-95 border border-white/10">
                <Bot className="w-4 h-4 text-primary-start" />
                Smooth with AI Filler
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="glass-panel glass-border rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all duration-300 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 shadow-md">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-muted font-mono uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold font-mono mt-0.5 text-white">{value}</p>
        <p className="text-[10px] text-muted mt-0.5">{trend}</p>
      </div>
    </div>
  );
}
