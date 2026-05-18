import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async getLibrary(userId: string) {
    return this.prisma.library.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    });
  }

  async addSong(userId: string, data: any) {
    return this.prisma.library.upsert({
      where: { userId_spotifyTrackId: { userId, spotifyTrackId: data.id } },
      update: {},
      create: {
        userId,
        spotifyTrackId: data.id,
        title: data.title,
        artist: data.artist,
        albumArt: data.albumArt,
        durationMs: data.durationMs,
        previewUrl: data.previewUrl,
      },
    });
  }

  async removeSong(userId: string, spotifyTrackId: string) {
    try {
      return await this.prisma.library.delete({
        where: { userId_spotifyTrackId: { userId, spotifyTrackId } },
      });
    } catch (e) {
      return null;
    }
  }
}
