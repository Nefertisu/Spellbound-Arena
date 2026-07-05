import { Module } from '@nestjs/common';
import { LobbyManager } from './LobbyManager/LobbyManager';
import { MatchmakingManager } from './MatchmakingManager/MatchmakingManager';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';

@Module({
  providers: [RoomGateway, RoomService, MatchmakingManager, LobbyManager],
})
export class RoomModule {}
