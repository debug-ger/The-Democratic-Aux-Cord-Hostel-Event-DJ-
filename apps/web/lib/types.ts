// ─────────────────────────────────────────────────────────────
// Shared type definitions for Vibebox (inlined for Vercel deployment)
// ─────────────────────────────────────────────────────────────

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  score: number;
  previewUrl?: string;
  bpm?: number;
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
  SESSION_END: 'session:end',

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
  SESSION_ENDED: 'session:ended',
} as const;
