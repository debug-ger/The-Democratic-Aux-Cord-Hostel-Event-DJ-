import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Song, AiSuggestion } from '@repo/types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async analyzeVibeTransition(queue: Song[]): Promise<AiSuggestion | null> {
    if (queue.length < 2) return null;

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    // FALLBACK: Use mock AI suggestion if OpenAI key is missing
    if (!apiKey) {
      this.logger.warn('OpenAI key missing. Falling back to Mock AI Suggestion.');
      return this.mockVibeTransition(queue);
    }

    const topSongs = queue.slice(0, 5).map(s => `${s.title} by ${s.artist}`).join(', ');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert DJ. Analyze the upcoming songs in the queue and provide a short, punchy 1-sentence assessment of the vibe transition (e.g. "Smooth transition from pop to hip-hop", or "Warning: Jarring drop in energy coming up"). Also output a boolean "isPositive" indicating if the transition is good. Respond in JSON format: {"message": string, "isPositive": boolean}.',
            },
            {
              role: 'user',
              content: `Queue: ${topSongs}`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch OpenAI suggestion');

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      return {
        message: content.message,
        isPositive: content.isPositive,
      };
    } catch (error) {
      this.logger.error('OpenAI analysis error', error);
      return this.mockVibeTransition(queue);
    }
  }

  // ── Mock Fallback ─────────────────────────────────────────────────────────
  private mockVibeTransition(queue: Song[]): AiSuggestion {
    if (!queue || queue.length === 0) {
      return { message: "Queue is empty. Add songs to build the vibe!", isPositive: true };
    }
    if (queue.length === 1) {
      return { message: "Single track playing. Add another song to prepare a smooth transition!", isPositive: true };
    }
    const first = queue[0];
    const second = queue[1];
    if (!first || !second) {
      return { message: "Smooth transition ahead. The vibe remains steady.", isPositive: true };
    }
    const score1 = first.score ?? 0;
    const score2 = second.score ?? 0;
    const avgScore = (score1 + score2) / 2;

    if (avgScore > 2) {
      return { message: "The crowd loves this sequence! Energy is peaking.", isPositive: true };
    } else if (Math.abs(score1 - score2) > 3) {
      return { message: "Warning: Potential vibe clash detected in the next transition.", isPositive: false };
    } else {
      return { message: "Smooth transition ahead. The vibe remains steady.", isPositive: true };
    }
  }
}
