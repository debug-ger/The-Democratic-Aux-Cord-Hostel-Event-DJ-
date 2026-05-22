import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  score: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // In-memory store for the MVP
  private rooms: Record<string, Song[]> = {};

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(client: Socket, roomCode: string) {
    client.join(roomCode);
    console.log(`${client.id} joined room ${roomCode}`);

    // Initialize room if it doesn't exist
    if (!this.rooms[roomCode]) {
      this.rooms[roomCode] = [];
    }

    // Send current queue to the user who just joined
    client.emit('queue:update', this.rooms[roomCode]);
  }

  @SubscribeMessage('song:add')
  handleAddSong(client: Socket, payload: { roomCode: string; song: Omit<Song, 'score'> }) {
    const { roomCode, song } = payload;

    if (!this.rooms[roomCode]) {
      this.rooms[roomCode] = [];
    }

    // Avoid duplicates
    const exists = this.rooms[roomCode].find(s => s.id === song.id);
    if (!exists) {
      this.rooms[roomCode].push({ ...song, score: 0 });
      this.broadcastQueue(roomCode);
    }
  }

  @SubscribeMessage('song:vote')
  handleVote(client: Socket, payload: { trackId: string; delta: number; roomCode: string }) {
    const { roomCode, trackId, delta } = payload;

    if (this.rooms[roomCode]) {
      const songIndex = this.rooms[roomCode].findIndex(s => s.id === trackId);

      if (songIndex !== -1) {
        this.rooms[roomCode][songIndex].score += delta;

        // Auto-skip logic: Remove if score < -3
        if (this.rooms[roomCode][songIndex].score < -3) {
          this.rooms[roomCode].splice(songIndex, 1);
        } else {
          // Sort by score descending
          this.rooms[roomCode].sort((a, b) => b.score - a.score);
        }

        this.broadcastQueue(roomCode);
      }
    }
  }

  private broadcastQueue(roomCode: string) {
    this.server.to(roomCode).emit('queue:update', this.rooms[roomCode]);
  }
}
