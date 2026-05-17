import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = 0;

  handleConnection(client: Socket) {
    this.activeUsers++;
    console.log(`Client connected: ${client.id}`);
    this.server.emit('room:stats', { activeUsers: this.activeUsers });
  }

  handleDisconnect(client: Socket) {
    this.activeUsers = Math.max(0, this.activeUsers - 1);
    console.log(`Client disconnected: ${client.id}`);
    this.server.emit('room:stats', { activeUsers: this.activeUsers });
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(client: Socket, roomCode: string) {
    client.join(roomCode);
    console.log(`${client.id} joined room ${roomCode}`);
  }

  @SubscribeMessage('song:vote')
  handleVote(client: Socket, payload: { trackId: string; delta: number; roomCode: string }) {
    // Broadcast the vote to everyone in the room
    this.server.to(payload.roomCode).emit('queue:update', payload);
  }
}
