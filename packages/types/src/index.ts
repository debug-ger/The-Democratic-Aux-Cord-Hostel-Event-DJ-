// ─────────────────────────────────────────────────────────────
// Shared type definitions for Vibebox (used by both web & server)
// ─────────────────────────────────────────────────────────────

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  score: number;
  /** iTunes 30-second preview URL */
  previewUrl?: string;
  /** BPM metadata from Spotify (optional, enriched when available) */
  bpm?: number;
}

export interface Room {
  id: string;
  roomCode: string;
  hostId: string;
  createdAt: string;
}

export interface VotePayload {
  roomCode: string;
  trackId: string;
  /** +1 for upvote, -1 for downvote */
  delta: 1 | -1;
}

export interface AddSongPayload {
  roomCode: string;
  song: Omit<Song, 'score'>;
}

export interface VibeUpdate {
  roomCode: string;
  bpmAverage: number;
  vibeScore: number;
  /** Descriptive label: "Chill" | "Energetic" | "Building" | "Peak" */
  vibeLabel: string;
}

export interface HostActionPayload {
  roomCode: string;
  trackId: string;
  action: 'pin' | 'remove';
}

export interface AiSuggestion {
  message: string;
  isPositive: boolean;
}

export interface QueueUpdate {
  roomCode: string;
  queue: Song[];
  aiSuggestion?: AiSuggestion | null;
}

// WebSocket event name constants
export const SocketEvents = {
  // Client → Server
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  SONG_ADD: 'song:add',
  SONG_VOTE: 'song:vote',
  SONG_NEXT: 'song:next',
  SONG_PREV: 'song:prev',
  HOST_ACTION: 'host:action',

  // Server → Client
  QUEUE_UPDATE: 'queue:update',
  VIBE_UPDATE: 'vibe:update',
  HOST_UPDATE: 'host:update',
  SONG_SKIP: 'song:skip',
  ROOM_STATS: 'room:stats',
} as const;
