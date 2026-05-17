import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  Song,
  SocketEvents,
  VibeUpdate,
  AddSongPayload,
  VotePayload,
  HostActionPayload,
  AiSuggestion,
  QueueUpdate,
} from '@repo/types';

interface RoomStats {
  memberCount: number;
}

interface QueueStore {
  // Connection
  socket: Socket | null;
  connected: boolean;
  roomCode: string | null;

  // Queue state
  queue: Song[];
  vibe: VibeUpdate | null;
  roomStats: RoomStats | null;
  aiSuggestion: AiSuggestion | null;

  // Actions
  connect: (roomCode: string, isHost?: boolean) => void;
  disconnect: () => void;
  addSong: (song: Omit<Song, 'score'>) => void;
  voteSong: (trackId: string, delta: 1 | -1) => void;
  nextSong: () => void;
  prevSong: () => void;
  hostAction: (action: 'pin' | 'remove', trackId: string) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

export const useQueueStore = create<QueueStore>((set, get) => ({
  socket: null,
  connected: false,
  roomCode: null,
  queue: [],
  vibe: null,
  roomStats: null,
  aiSuggestion: null,

  connect: (roomCode, isHost = false) => {
    const existing = get().socket;
    if (existing) existing.disconnect();

    const socket = io(WS_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      set({ connected: true });
      socket.emit(SocketEvents.ROOM_JOIN, { roomCode, isHost });
    });

    socket.on('disconnect', () => set({ connected: false }));

    // QUEUE_UPDATE carries { roomCode, queue, aiSuggestion } — always guard queue as array
    socket.on(SocketEvents.QUEUE_UPDATE, (data: QueueUpdate) => {
      if (data.roomCode === roomCode) {
        set({
          queue: Array.isArray(data.queue) ? data.queue : [],
          aiSuggestion: data.aiSuggestion ?? null,
        });
      }
    });

    socket.on(SocketEvents.VIBE_UPDATE, (vibe: VibeUpdate) => set({ vibe }));

    socket.on(SocketEvents.ROOM_STATS, (stats: RoomStats) => set({ roomStats: stats }));

    socket.on(SocketEvents.SONG_SKIP, ({ song }: { song: Song }) => {
      console.log(`[WS] Song auto-skipped: ${song.title}`);
    });

    set({ socket, roomCode });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ socket: null, connected: false, roomCode: null, queue: [], vibe: null, aiSuggestion: null });
  },

  addSong: (song) => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    const payload: AddSongPayload = { roomCode, song };
    socket.emit(SocketEvents.SONG_ADD, payload);
  },

  voteSong: (trackId, delta) => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    const payload: VotePayload = { roomCode, trackId, delta };
    socket.emit(SocketEvents.SONG_VOTE, payload);
  },

  nextSong: () => {
    const { socket, roomCode } = get();
    if (socket && roomCode) socket.emit(SocketEvents.SONG_NEXT, { roomCode });
  },

  prevSong: () => {
    const { socket, roomCode } = get();
    if (socket && roomCode) socket.emit(SocketEvents.SONG_PREV, { roomCode });
  },

  hostAction: (action, trackId) => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    const payload: HostActionPayload = { roomCode, trackId, action };
    socket.emit(SocketEvents.HOST_ACTION, payload);
  },
}));
