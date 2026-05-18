import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { QueueModule } from './queue/queue.module';
import { SpotifyModule } from './spotify/spotify.module';
import { AiModule } from './ai/ai.module';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RoomsModule,
    QueueModule,
    SpotifyModule,
    AiModule,
    LibraryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
