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
  /** BPM metadata from Spotify (optional, enriched when available) */
  bpm?: number;
  /** User who added the song */
  userId?: string;
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
  userId?: string;
  username?: string;
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

export interface RoomSettingsUpdate {
  skipThreshold: number;
}

export interface LibrarySharedPayload {
  userId: string;
  username: string;
  library: Song[];
}

export interface PlaylistRecommendedPayload {
  userId: string;
  username: string;
  reason: string;
  library: Song[];
}

export interface HostTransferPayload {
  roomCode: string;
  newHostId: string;
}

export interface HostTransferredPayload {
  newHostId: string;
  newHostUsername: string;
}

export interface TopVoter {
  userId: string;
  username: string;
  voteScore: number;
}

export interface TopVotersPayload {
  topVoters: TopVoter[];
}

// WebSocket event name constants
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
  ROOM_SETTINGS_UPDATE: 'room:settings-update',
  HOST_TRANSFER: 'host:transfer',
  HOST_RETRACT: 'host:retract',

  // Server → Client
  QUEUE_UPDATE: 'queue:update',
  VIBE_UPDATE: 'vibe:update',
  HOST_UPDATE: 'host:update',
  SONG_SKIP: 'song:skip',
  ROOM_STATS: 'room:stats',
  LIBRARY_SHARED: 'library:shared',
  PLAYLIST_RECOMMENDED: 'playlist:recommended',
  HOST_TRANSFERRED: 'host:transferred',
  TOP_VOTERS_UPDATE: 'top-voters:update',
} as const;
