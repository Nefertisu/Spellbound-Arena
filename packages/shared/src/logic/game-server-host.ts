import type { Lobby } from "../types/lobby.js";
import type {
  GameServerEndpoint,
  GameSessionSnapshot,
  SpawnGameSessionOptions,
} from "../types/game-server.js";
import { generateId } from "../utils/id.js";
import { createGameSession, GameSession } from "./game-session.js";

export interface GameSessionHandle {
  sessionId: string;
  endpoint: GameServerEndpoint;
  session: GameSession;
}

export class GameServerHost {
  private readonly sessions = new Map<string, GameSession>();
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  spawn(options: SpawnGameSessionOptions): GameSessionHandle {
    const sessionId = options.sessionId ?? generateId();
    const session = createGameSession(sessionId, this.baseUrl, {
      lobby: options.lobby,
      botDifficulty: options.botDifficulty,
      tickRateHz: options.tickRateHz,
    });

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      endpoint: session.endpoint,
      session,
    };
  }

  spawnFromLobby(lobby: Lobby, baseUrl?: string): GameSessionHandle {
    return this.spawn({
      lobby,
      baseUrl: baseUrl ?? this.baseUrl,
    });
  }

  get(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  getEndpoint(sessionId: string): GameServerEndpoint | undefined {
    return this.sessions.get(sessionId)?.endpoint;
  }

  list(): GameSessionSnapshot[] {
    return [...this.sessions.values()].map((session) => ({
      sessionId: session.id,
      status: session.getStatus(),
      tick: session.getTick(),
      state: session.getPublicState(),
      endpoint: session.endpoint,
    }));
  }

  destroy(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.stop();
    this.sessions.delete(sessionId);
    return true;
  }

  destroyAll(): void {
    for (const session of this.sessions.values()) {
      session.stop();
    }
    this.sessions.clear();
  }
}

export function createGameServerHost(baseUrl: string): GameServerHost {
  return new GameServerHost(baseUrl);
}

export function runGameSession(
  options: SpawnGameSessionOptions,
): GameSessionHandle {
  const host = createGameServerHost(options.baseUrl);
  const handle = host.spawn(options);
  handle.session.startLoop(options.tickRateHz ?? 30);
  return handle;
}
