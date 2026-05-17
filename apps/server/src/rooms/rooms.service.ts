import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Simple 4-char room code generator
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(hostId: string) {
    let roomCode: string;
    let exists = true;

    // Ensure unique code
    do {
      roomCode = generateRoomCode();
      const existing = await this.prisma.room.findUnique({ where: { roomCode } });
      exists = !!existing;
    } while (exists);

    // Upsert anonymous user if needed
    await this.prisma.user.upsert({
      where: { id: hostId },
      update: {},
      create: { id: hostId, username: `DJ_${roomCode}` },
    });

    const room = await this.prisma.room.create({
      data: { roomCode, hostId },
    });

    return room;
  }

  async findRoom(roomCode: string) {
    return this.prisma.room.findUnique({ where: { roomCode } });
  }
}
