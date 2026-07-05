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
    userId: number | undefined,
    server: Server,
  ): void {
    this.matchmaking.addPlayer(
      {
        socketId: client.id,
        userId: userId ?? 0,
      },
      mode,
      withBots,
      server,
    );
  }

  handleDisconnect(socketId: string): void {
    this.matchmaking.handleDisconnect(socketId);
  }
}
