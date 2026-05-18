import { Controller, Get, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { Song } from '@repo/types';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('search')
  async search(@Query('q') query: string): Promise<Song[]> {
    if (!query) return [];
    return this.spotifyService.searchTracks(query);
  }

  @Get('recommendations')
  async recommendations(@Query('seeds') seeds: string): Promise<Song[]> {
    if (!seeds) return [];
    const seedTrackIds = seeds.split(',').filter(Boolean);
    return this.spotifyService.getRecommendations(seedTrackIds);
  }

  @Get('genre-recommendations')
  async genreRecommendations(@Query('genre') genre: string, @Query('limit') limit?: string): Promise<Song[]> {
    if (!genre) return [];
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.spotifyService.getGenreRecommendations(genre, limitNum);
  }
}
