import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  async getLibrary(@Query('userId') userId: string) {
    if (!userId) return [];
    return this.libraryService.getLibrary(userId);
  }

  @Post()
  async addSong(@Body() body: { userId: string; song: any }) {
    if (!body.userId || !body.song) return null;
    return this.libraryService.addSong(body.userId, body.song);
  }

  @Delete(':trackId')
  async removeSong(@Param('trackId') trackId: string, @Query('userId') userId: string) {
    if (!userId) return null;
    return this.libraryService.removeSong(userId, trackId);
  }
}
