import { Module } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AiModule, PrismaModule],
  providers: [QueueGateway],
})
export class QueueModule {}
