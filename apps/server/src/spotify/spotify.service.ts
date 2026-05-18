import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Song } from '@repo/types';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private configService: ConfigService) {}

  private async getAccessToken(): Promise<string | null> {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) return null;

    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' }),
      });

      if (!response.ok) throw new Error('Failed to fetch Spotify token');

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000; // 1 min buffer
      return this.accessToken;
    } catch (error) {
      this.logger.error('Error fetching Spotify access token', error);
      return null;
    }
  }

  async searchTracks(query: string): Promise<Song[]> {
    const token = await this.getAccessToken();

    // FALLBACK: Use iTunes if Spotify keys are missing or invalid
    if (!token) {
      this.logger.warn('Spotify keys missing/invalid. Falling back to iTunes Mock API.');
      return this.searchItunesMock(query);
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        this.logger.warn(`Spotify search failed with status ${response.status}`);
        return this.searchItunesMock(query);
      }

      const data = await response.json();
      const songs: Song[] = data.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        albumArt: track.album.images[0]?.url || '',
        previewUrl: track.preview_url,
        score: 0,
      }));

      // Blazing-fast parallel fallback for missing preview URLs
      await Promise.all(
        songs.map(async (song) => {
          if (!song.previewUrl) {
            try {
              const fallbackResults = await this.searchItunesMock(`${song.title} ${song.artist}`);
              if (fallbackResults && fallbackResults[0]?.previewUrl) {
                song.previewUrl = fallbackResults[0].previewUrl;
                this.logger.log(`[Spotify Fallback] Loaded iTunes preview for "${song.title}"`);
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              this.logger.warn(`Failed iTunes fallback for "${song.title}": ${msg}`);
            }
          }
        })
      );

      return songs;
    } catch (error) {
      this.logger.error('Spotify search error', error);
      return this.searchItunesMock(query); // Ultimate fallback
    }
  }

  async getRecommendations(seedTrackIds: string[]): Promise<Song[]> {
    const token = await this.getAccessToken();
    if (!token || seedTrackIds.length === 0) return [];

    try {
      const seeds = seedTrackIds.slice(0, 5).join(',');
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${seeds}&limit=8`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      const songs: Song[] = (data.tracks ?? []).map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        albumArt: track.album.images[0]?.url || '',
        previewUrl: track.preview_url,
        score: 0,
      }));

      // iTunes fallback for recommendations
      await Promise.all(
        songs.map(async (song) => {
          if (!song.previewUrl) {
            try {
              const fallbackResults = await this.searchItunesMock(`${song.title} ${song.artist}`);
              if (fallbackResults && fallbackResults[0]?.previewUrl) {
                song.previewUrl = fallbackResults[0].previewUrl;
              }
            } catch {}
          }
        })
      );

      return songs;
    } catch (error) {
      this.logger.error('Spotify recommendations error', error);
      return [];
    }
  }

  // ── Mock Fallback (iTunes) ────────────────────────────────────────────────
  private async searchItunesMock(query: string): Promise<Song[]> {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        query,
      )}&entity=song&limit=6&media=music`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.results ?? []).map((track: any) => ({
        id: track.trackId.toString(),
        title: track.trackName,
        artist: track.artistName,
        albumArt: track.artworkUrl100.replace('100x100', '300x300'),
        previewUrl: track.previewUrl,
        score: 0,
        bpm: 120, // Mock BPM
      }));
    } catch (e) {
      this.logger.error('iTunes mock search error', e);
      return [];
    }
  }
}
