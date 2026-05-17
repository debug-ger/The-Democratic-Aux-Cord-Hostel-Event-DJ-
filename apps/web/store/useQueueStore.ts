import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type Track = {
  id: string;
  title: string;
  artist: string;
  score: number;
  art: string;
  isDead: boolean;
  voteVelocity: number;
};

interface QueueState {
  tracks: Track[];
  activeUsers: number;
  energyState: "low" | "high";
  roomCode: string;
  socket: Socket | null;
  
  // Actions
  initSocket: (roomCode: string) => void;
  disconnectSocket: () => void;
  voteTrack: (trackId: string, delta: number) => void;
  addTrack: (track: Omit<Track, 'score' | 'isDead' | 'voteVelocity'>) => void;
  decayVelocity: () => void;
  setEnergyState: (state: "low" | "high") => void;
}

const initialTracks: Track[] = [
  { id: "1", title: "Starboy", artist: "The Weeknd, Daft Punk", score: 12, art: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop", isDead: false, voteVelocity: 0 },
  { id: "2", title: "Midnight City", artist: "M83", score: 8, art: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop", isDead: false, voteVelocity: 0 },
  { id: "3", title: "Gosh", artist: "Jamie xx", score: 5, art: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop", isDead: false, voteVelocity: 0 },
  { id: "4", title: "Losing It", artist: "FISHER", score: -1, art: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop", isDead: false, voteVelocity: 0 },
];

export const useQueueStore = create<QueueState>((set, get) => ({
  tracks: initialTracks,
  activeUsers: 42,
  energyState: "high",
  roomCode: "AUX7",
  socket: null,

  initSocket: (roomCode: string) => {
    const existingSocket = get().socket;
    if (existingSocket) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    console.log(`Connecting to Socket.IO at ${wsUrl}`);
    const socket = io(wsUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket.IO Connected!');
      socket.emit('room:join', roomCode);
    });

    socket.on('room:stats', (data: { activeUsers: number }) => {
      set({ activeUsers: data.activeUsers });
    });

    socket.on('queue:update', (data: { trackId: string; delta: number }) => {
      console.log('Received queue:update', data);
      const currentTracks = get().tracks;
      const updated = currentTracks.map(t => {
        if (t.id === data.trackId) {
          const nextScore = t.score + data.delta;
          return {
            ...t,
            score: nextScore,
            voteVelocity: Math.min(t.voteVelocity + 1, 5),
            isDead: nextScore <= -3
          };
        }
        return t;
      }).sort((a, b) => b.score - a.score);
      set({ tracks: updated });
    });

    socket.on('vibe:update', (data: { energyState: "low" | "high" }) => {
      set({ energyState: data.energyState });
    });

    set({ socket, roomCode });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  voteTrack: (trackId: string, delta: number) => {
    const { socket, roomCode, tracks } = get();
    
    // Optimistic local update
    const updated = tracks.map(t => {
      if (t.id === trackId) {
        const nextScore = t.score + delta;
        return {
          ...t,
          score: nextScore,
          voteVelocity: Math.min(t.voteVelocity + 1, 5),
          isDead: nextScore <= -3
        };
      }
      return t;
    }).sort((a, b) => b.score - a.score);
    set({ tracks: updated });

    // Send to WebSocket server
    if (socket) {
      socket.emit('song:vote', { trackId, delta, roomCode });
    }
  },

  addTrack: (trackData) => {
    const newTrack: Track = {
      ...trackData,
      score: 0,
      isDead: false,
      voteVelocity: 0,
    };
    
    const updated = [...get().tracks, newTrack].sort((a, b) => b.score - a.score);
    set({ tracks: updated });

    const { socket, roomCode } = get();
    if (socket) {
      socket.emit('song:add', { track: newTrack, roomCode });
    }
  },

  decayVelocity: () => {
    set(state => ({
      tracks: state.tracks.map(t => ({
        ...t,
        voteVelocity: Math.max(t.voteVelocity - 0.5, 0)
      }))
    }));
  },

  setEnergyState: (energyState) => set({ energyState }),
}));
