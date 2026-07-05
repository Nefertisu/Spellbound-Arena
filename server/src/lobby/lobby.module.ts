import { Module } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { LobbyController } from './lobby.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [LobbyController],
  providers: [LobbyService, PrismaService],
})
export class LobbyModule {}
