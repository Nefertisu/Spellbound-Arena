import { Injectable } from '@nestjs/common';
import type { MatchMode } from '@spellbound/shared';
import type { Server } from 'socket.io';
import type { QueuePlayer } from '../MatchQueue/MatchQueue';
import { PrismaService } from 'src/prisma/prisma.service';
import { shuffle } from './utils';

interface Lobby {
  id: string;
  mode: MatchMode;
  players: QueuePlayer[];
  map: 'lava_pit' | 'crystal_rift';
}

type Maps = 'lava_pit' | 'crystal_rift';

const AVAILABLE_MAPS: Maps[] = ['lava_pit', 'crystal_rift'];

@Injectable()
export class LobbyManager {
  private readonly lobbies = new Map<string, Lobby>();

  constructor(private readonly prisma: PrismaService) {}

  async create(
    players: QueuePlayer[],
    mode: MatchMode,
    server: Server,
  ): Promise<void> {
    const lobbyId = crypto.randomUUID();

    const lobby: Lobby = {
      id: lobbyId,
      mode,
      players,
      map: shuffle(AVAILABLE_MAPS).at(0)!,
    };

    this.lobbies.set(lobbyId, lobby);

    for (const player of players) {
      const socket = server.sockets.sockets.get(player.socketId);
      socket?.join(lobbyId);
    }

    // TODO FIX LATER
    const notFlatChars = await this.prisma.user.findMany({
      where: {
        id: {
          in: players.map((data) => data.userId),
        },
      },
      select: {
        selectedCharacter: {
          include: {
            attributes: true,
          },
        },
      },
    });

    const flatChars = shuffle(
      notFlatChars.flatMap((user) =>
        user.selectedCharacter ? [user.selectedCharacter] : [],
      ),
    );

    const middle = flatChars.length / 2;

    server.to(lobbyId).emit('room:created', {
      lobbyId,
      mode,
      players: {
        teamA: flatChars.slice(0, middle),
        teamB: flatChars.slice(middle),
      },
      map: lobby.map,
    });
  }
}
