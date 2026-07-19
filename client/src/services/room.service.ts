import type { BotDifficulty, Character, MatchMode } from '@spellbound/shared';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import {
  connectRoomSocket,
  disconnectRoomSocket,
  getRoomSocket,
  waitForRoomConnection,
} from './room.socket';
import {
  mapRoomCreatedToLobby,
  type RoomCreatedPayload,
} from '../utils/mapRoomCreatedLobby';

const EVENTS = {
  SEARCH_GAME: 'room:search-game',
  QUEUE_JOINED: 'room:queue-joined',
  ROOM_CREATED: 'room:created',
} as const;

interface SearchGamePayload {
  mode: MatchMode;
  withBots: boolean;
  userId?: number;
}

interface QueueJoinedPayload {
  mode: MatchMode;
  queueSize: number;
  requiredPlayers: number;
}

type ActiveSearch = {
  resolve: () => void;
  reject: (error: Error) => void;
  userId: string;
  character: Character;
  botDifficulty: BotDifficulty;
};

let activeSearch: ActiveSearch | null = null;
let listenersAttached = false;

function handleRoomCreated(payload: RoomCreatedPayload): void {
  const authUserId = useAuthStore.getState().user?.id ?? '0';
  const localUserId = activeSearch?.userId ?? authUserId;
  const localCharacter = activeSearch?.character ?? null;
  const botDifficulty =
    activeSearch?.botDifficulty ?? useGameStore.getState().botDifficulty;

  const lobby = mapRoomCreatedToLobby(payload, {
    localUserId,
    localCharacter,
  });

  useGameStore.getState().enterMatchLobby(lobby, botDifficulty);

  if (activeSearch) {
    activeSearch.resolve();
    activeSearch = null;
  }
}

function ensureListeners(): void {
  const socket = getRoomSocket();
  if (!socket || listenersAttached) return;

  listenersAttached = true;

  socket.on(EVENTS.QUEUE_JOINED, (payload: QueueJoinedPayload) => {
    useGameStore.getState().setQueueStatus(payload.queueSize, payload.requiredPlayers);
  });

  socket.on(EVENTS.ROOM_CREATED, (payload: RoomCreatedPayload) => {
    handleRoomCreated(payload);
  });
}

export function initRoomService(): void {
  connectRoomSocket();
  ensureListeners();
}

export function shutdownRoomService(): void {
  activeSearch?.reject(new Error('Disconnected'));
  activeSearch = null;
  listenersAttached = false;
  disconnectRoomSocket();
}

export async function searchGame(options: {
  mode: MatchMode;
  withBots: boolean;
  userId: string;
  character: Character;
  botDifficulty: BotDifficulty;
}): Promise<void> {
  const socket = await waitForRoomConnection();

  return new Promise((resolve, reject) => {
    activeSearch = {
      resolve,
      reject,
      userId: options.userId,
      character: options.character,
      botDifficulty: options.botDifficulty,
    };

    const payload: SearchGamePayload = {
      mode: options.mode,
      withBots: options.withBots,
      userId: Number(options.userId),
    };

    socket.emit(EVENTS.SEARCH_GAME, payload);
  });
}
