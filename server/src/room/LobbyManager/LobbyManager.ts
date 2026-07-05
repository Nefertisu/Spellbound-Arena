import { Injectable } from '@nestjs/common';
import type { MatchMode } from '@spellbound/shared';
import type { Server } from 'socket.io';
import type { QueuePlayer } from '../MatchQueue/MatchQueue';

interface Lobby {
  id: string;
  mode: MatchMode;
  players: QueuePlayer[];
}

@Injectable()
export class LobbyManager {
  private readonly lobbies = new Map<string, Lobby>();

  create(players: QueuePlayer[], mode: MatchMode, server: Server): void {
    const lobbyId = crypto.randomUUID();

    const lobby: Lobby = {
      id: lobbyId,
      mode,
      players,
    };

    this.lobbies.set(lobbyId, lobby);

    for (const player of players) {
      const socket = server.sockets.sockets.get(player.socketId);
      socket?.join(lobbyId);
    }

    server.to(lobbyId).emit('room:created', {
      lobbyId,
      mode,
    });
  }
}
