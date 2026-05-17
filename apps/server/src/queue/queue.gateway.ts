import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Song, SocketEvents, VotePayload, AddSongPayload } from '@repo/types';

// Auto-skip threshold
const SKIP_THRESHOLD = -3;

interface RoomState {
  queue: Song[];
  hostSocketId: string | null;
  members: Set<string>;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  namespace: '/',
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // In-memory room state for MVP (swap for Redis in production)
  private rooms = new Map<string, RoomState>();

  // Track which room each socket belongs to
  private socketRoomMap = new Map<string, string>();

  // ── Lifecycle ─────────────────────────────────────────────────

  handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const roomCode = this.socketRoomMap.get(client.id);
    if (roomCode) {
      const room = this.rooms.get(roomCode);
      if (room) {
        room.members.delete(client.id);
        this.emitRoomStats(roomCode, room);
      }
      this.socketRoomMap.delete(client.id);
    }
    console.log(`[WS] Client disconnected: ${client.id}`);
  }

  // ── Client → Server Events ────────────────────────────────────

  @SubscribeMessage(SocketEvents.ROOM_JOIN)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; isHost?: boolean },
  ) {
    const { roomCode, isHost } = payload;
    const code = roomCode.toUpperCase();

    client.join(code);
    this.socketRoomMap.set(client.id, code);

    if (!this.rooms.has(code)) {
      this.rooms.set(code, {
        queue: [],
        hostSocketId: isHost ? client.id : null,
        members: new Set(),
      });
    }

    const room = this.rooms.get(code)!;
    room.members.add(client.id);

    if (isHost && !room.hostSocketId) {
      room.hostSocketId = client.id;
    }

    // Send current queue state to the joining user
    client.emit(SocketEvents.QUEUE_UPDATE, room.queue);
    this.emitRoomStats(code, room);
    console.log(`[WS] ${client.id} joined room ${code} (host: ${isHost})`);
  }

  @SubscribeMessage(SocketEvents.ROOM_LEAVE)
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() roomCode: string) {
    const code = roomCode.toUpperCase();
    client.leave(code);
    const room = this.rooms.get(code);
    if (room) {
      room.members.delete(client.id);
      this.emitRoomStats(code, room);
    }
    this.socketRoomMap.delete(client.id);
  }

  @SubscribeMessage(SocketEvents.SONG_ADD)
  handleAddSong(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AddSongPayload,
  ) {
    const code = payload.roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    // Prevent duplicates
    const exists = room.queue.some((s) => s.id === payload.song.id);
    if (!exists) {
      room.queue.push({ ...payload.song, score: 0 });
      this.broadcastQueue(code, room.queue);
      this.broadcastVibeUpdate(code, room.queue);
    }
  }

  @SubscribeMessage(SocketEvents.SONG_VOTE)
  handleVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VotePayload,
  ) {
    const code = payload.roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const songIndex = room.queue.findIndex((s) => s.id === payload.trackId);
    if (songIndex === -1) return;

    room.queue[songIndex].score += payload.delta;

    if (room.queue[songIndex].score <= SKIP_THRESHOLD) {
      // Auto-skip: remove and notify
      const skipped = room.queue.splice(songIndex, 1)[0];
      this.server.to(code).emit(SocketEvents.SONG_SKIP, { song: skipped, reason: 'vote-threshold' });
      console.log(`[WS] Auto-skipped "${skipped.title}" in room ${code}`);
    } else {
      // Re-sort queue by score descending
      room.queue.sort((a, b) => b.score - a.score);
    }

    this.broadcastQueue(code, room.queue);
    this.broadcastVibeUpdate(code, room.queue);
  }

  // ── Helpers ───────────────────────────────────────────────────

  private broadcastQueue(roomCode: string, queue: Song[]) {
    this.server.to(roomCode).emit(SocketEvents.QUEUE_UPDATE, queue);
  }

  private broadcastVibeUpdate(roomCode: string, queue: Song[]) {
    if (queue.length === 0) return;

    // Compute a simple vibe score from avg score of top 5 songs
    const top5 = queue.slice(0, 5);
    const avgScore = top5.reduce((sum, s) => sum + s.score, 0) / top5.length;
    const bpmAverage = top5.reduce((sum, s) => sum + (s.bpm ?? 120), 0) / top5.length;

    let vibeLabel: string;
    if (avgScore > 3) vibeLabel = 'Peak';
    else if (avgScore > 1) vibeLabel = 'Energetic';
    else if (avgScore > -1) vibeLabel = 'Building';
    else vibeLabel = 'Chill';

    this.server.to(roomCode).emit(SocketEvents.VIBE_UPDATE, {
      roomCode,
      bpmAverage: Math.round(bpmAverage),
      vibeScore: Math.max(0, Math.min(100, 50 + avgScore * 10)),
      vibeLabel,
    });
  }

  private emitRoomStats(roomCode: string, room: RoomState) {
    this.server.to(roomCode).emit(SocketEvents.ROOM_STATS, {
      memberCount: room.members.size,
    });
  }
}
