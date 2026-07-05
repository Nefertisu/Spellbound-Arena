import { Injectable } from '@nestjs/common';
import type { MatchMode } from '@spellbound/shared';
import type { Server } from 'socket.io';
import { LobbyManager } from '../LobbyManager/LobbyManager';
import { MatchQueue, type QueuePlayer } from '../MatchQueue/MatchQueue';

const REQUIRED_PLAYERS: Record<MatchMode, number> = {
  '1v1': 2,
  '2v2': 4,
  '3v3': 6,
};

@Injectable()
export class MatchmakingManager {
  private readonly queues: Record<MatchMode, MatchQueue> = {
    '1v1': new MatchQueue(),
    '2v2': new MatchQueue(),
    '3v3': new MatchQueue(),
  };

  private readonly queueBySocket = new Map<string, MatchMode>();

  constructor(private readonly lobbyManager: LobbyManager) {}

  addPlayer(
    player: QueuePlayer,
    mode: MatchMode,
    withBots: boolean,
    server: Server,
  ): void {
    void withBots;

    this.removeFromQueue(player.socketId);

    const queue = this.queues[mode];
    queue.add(player);
    this.queueBySocket.set(player.socketId, mode);

    const socket = server.sockets.sockets.get(player.socketId);
    socket?.emit('room:queue-joined', {
      mode,
      queueSize: queue.size(),
      requiredPlayers: REQUIRED_PLAYERS[mode],
    });

    this.tryCreateLobby(mode, server);
  }

  handleDisconnect(socketId: string): void {
    this.removeFromQueue(socketId);
  }

  private tryCreateLobby(mode: MatchMode, server: Server): void {
    const queue = this.queues[mode];
    const need = REQUIRED_PLAYERS[mode];

    if (queue.size() < need) {
      return;
    }

    const players = queue.pop(need);
    for (const matchedPlayer of players) {
      this.queueBySocket.delete(matchedPlayer.socketId);
    }

    this.lobbyManager.create(players, mode, server);
  }

  private removeFromQueue(socketId: string): void {
    const mode = this.queueBySocket.get(socketId);
    if (!mode) return;

    this.queues[mode].removeBySocketId(socketId);
    this.queueBySocket.delete(socketId);
  }
}
