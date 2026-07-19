import { Injectable } from '@nestjs/common';
import type { MatchMode } from '@spellbound/shared';
import type { Server, Socket } from 'socket.io';
import { MatchmakingManager } from './MatchmakingManager/MatchmakingManager';

@Injectable()
export class RoomService {
  constructor(private readonly matchmaking: MatchmakingManager) {}

  searchForLobby(
    client: Socket,
    mode: MatchMode,
    withBots: boolean,
    userId: number,
    server: Server,
  ): void {
    if (withBots) {
      this.matchmaking.tryCreateLobbyWithBots(
        {
          socketId: client.id,
          userId: userId,
        },
        mode,
        server,
      );
      return;
    }
    this.matchmaking.addPlayer(
      {
        socketId: client.id,
        userId: userId,
      },
      mode,
      server,
    );
  }

  handleDisconnect(socketId: string, server: Server): void {
    this.matchmaking.handleDisconnect(socketId, server);
  }
}
