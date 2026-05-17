import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  score: number;
}

interface QueueStore {
  socket: Socket | null;
  roomCode: string | null;
  queue: Song[];
  connect: (roomCode: string) => void;
  disconnect: () => void;
  addSong: (song: Omit<Song, 'score'>) => void;
  voteSong: (trackId: string, delta: number) => void;
}

// In MVP, backend usually runs on 3001 locally
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const useQueueStore = create<QueueStore>((set, get) => ({
  socket: null,
  roomCode: null,
  queue: [],

  connect: (roomCode: string) => {
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.disconnect();
    }

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      socket.emit('room:join', roomCode);
    });

    socket.on('queue:update', (updatedQueue: Song[]) => {
      set({ queue: updatedQueue });
    });

    set({ socket, roomCode });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, roomCode: null, queue: [] });
    }
  },

  addSong: (song) => {
    const { socket, roomCode } = get();
    if (socket && roomCode) {
      socket.emit('song:add', { roomCode, song });
    }
  },

  voteSong: (trackId, delta) => {
    const { socket, roomCode } = get();
    if (socket && roomCode) {
      socket.emit('song:vote', { roomCode, trackId, delta });
    }
  },
}));
