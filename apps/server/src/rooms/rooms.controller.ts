import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async createRoom(@Body() body: { hostId?: string }) {
    if (!body.hostId) throw new BadRequestException('hostId is required');
    return this.roomsService.createRoom(body.hostId);
  }

  @Get(':code')
  async getRoom(@Param('code') code: string) {
    const room = await this.roomsService.findRoom(code.toUpperCase());
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    return room;
  }
}
