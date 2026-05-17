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
import { SocketEvents } from '@repo/types';
import type { Song, AiSuggestion } from '@repo/types';
import { AiService } from '../ai/ai.service';

// Auto-skip threshold
const SKIP_THRESHOLD = -3;

interface RoomState {
  queue: Song[];
  history: Song[];
  hostSocketId: string | null;
  members: Set<string>;
  lastAiSuggestion?: AiSuggestion | null;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  namespace: '/',
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, RoomState>();
  private socketRoomMap = new Map<string, string>();

  constructor(private aiService: AiService) {}

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
        history: [],
        hostSocketId: isHost ? client.id : null,
        members: new Set(),
      });
    }

    const room = this.rooms.get(code)!;
    room.members.add(client.id);

    if (isHost && !room.hostSocketId) {
      room.hostSocketId = client.id;
    }

    // Send current queue state as QueueUpdate envelope
    client.emit(SocketEvents.QUEUE_UPDATE, {
      roomCode: code,
      queue: room.queue,
      aiSuggestion: room.lastAiSuggestion ?? null,
    });
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
    @MessageBody() payload: any,
  ) {
    const code = (payload.roomCode as string).toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const exists = room.queue.some((s) => s.id === payload.song.id);
    if (!exists) {
      room.queue.push({ ...payload.song, score: 0 });
      this.broadcastQueueWithAi(code, room);
      this.broadcastVibeUpdate(code, room.queue);
    }
  }

  @SubscribeMessage(SocketEvents.SONG_VOTE)
  handleVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const code = (payload.roomCode as string).toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const songIndex = room.queue.findIndex((s) => s.id === payload.trackId);
    if (songIndex === -1) return;

    room.queue[songIndex].score += payload.delta;

    if (room.queue[songIndex].score <= SKIP_THRESHOLD) {
      const skipped = room.queue.splice(songIndex, 1)[0];
      this.server.to(code).emit(SocketEvents.SONG_SKIP, { song: skipped, reason: 'vote-threshold' });
      console.log(`[WS] Auto-skipped "${skipped.title}" in room ${code}`);
    } else {
      room.queue.sort((a, b) => b.score - a.score);
    }

    this.broadcastQueueWithAi(code, room);
    this.broadcastVibeUpdate(code, room.queue);
  }

  @SubscribeMessage(SocketEvents.SONG_NEXT)
  handleNextSong(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const code = (payload.roomCode as string).toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    if (room.queue.length > 0) {
      const finishedSong = room.queue.shift();
      if (finishedSong) {
        room.history.push(finishedSong);
      }
      this.broadcastQueueWithAi(code, room);
      this.broadcastVibeUpdate(code, room.queue);
    }
  }

  @SubscribeMessage(SocketEvents.SONG_PREV)
  handlePrevSong(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const code = (payload.roomCode as string).toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    if (room.history.length > 0) {
      const previousSong = room.history.pop();
      if (previousSong) {
        previousSong.score = 999;
        room.queue.unshift(previousSong);
        this.broadcastQueueWithAi(code, room);
        this.broadcastVibeUpdate(code, room.queue);
      }
    }
  }

  @SubscribeMessage(SocketEvents.HOST_ACTION)
  handleHostAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const code = (payload.roomCode as string).toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    if (room.hostSocketId !== client.id) return;

    const songIndex = room.queue.findIndex((s) => s.id === payload.trackId);
    if (songIndex === -1) return;

    if (payload.action === 'remove') {
      room.queue.splice(songIndex, 1);
    } else if (payload.action === 'pin') {
      const [pinnedSong] = room.queue.splice(songIndex, 1);
      pinnedSong.score = 999;
      room.queue.unshift(pinnedSong);
    }

    this.broadcastQueueWithAi(code, room);
    this.broadcastVibeUpdate(code, room.queue);
  }

  // ── Helpers ───────────────────────────────────────────────────

  private async broadcastQueueWithAi(roomCode: string, room: RoomState) {
    // Broadcast immediately with current AI suggestion
    this.server.to(roomCode).emit(SocketEvents.QUEUE_UPDATE, {
      roomCode,
      queue: room.queue,
      aiSuggestion: room.lastAiSuggestion ?? null,
    });

    // Then compute AI suggestion in background and re-broadcast if available
    if (room.queue.length >= 2) {
      const suggestion = await this.aiService.analyzeVibeTransition(room.queue);
      room.lastAiSuggestion = suggestion;
      this.server.to(roomCode).emit(SocketEvents.QUEUE_UPDATE, {
        roomCode,
        queue: room.queue,
        aiSuggestion: suggestion,
      });
    } else {
      room.lastAiSuggestion = null;
    }
  }

  private broadcastVibeUpdate(roomCode: string, queue: Song[]) {
    if (queue.length === 0) return;

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
