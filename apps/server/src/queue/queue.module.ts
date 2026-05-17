import { Module } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';

@Module({
  providers: [QueueGateway],
})
export class QueueModule {}
