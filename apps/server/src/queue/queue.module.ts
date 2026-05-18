import { Module } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [QueueGateway],
})
export class QueueModule {}
