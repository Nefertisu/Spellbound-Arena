#!/usr/bin/env node
/**
 * Spellbound authoritative game server (headless).
 *
 * Same simulation as the client (battle-init + battle-sim), no rendering.
 * Run as a separate Node process — source of truth for a single match.
 *
 * Usage:
 *   npm run game-server --prefix packages/shared -- --lobby-file ./lobby.json
 *   node packages/shared/dist/game-server.js --lobby-file ./lobby.json --session-id match-1
 *
 * CLI:
 *   --lobby-file      Path to JSON Lobby (@spellbound/shared Lobby type). Required.
 *   --session-id      Match id (default: random uuid)
 *   --tick-rate       Sim ticks per second (default: 30)
 *   --bot-difficulty  passive | easy (default: passive)
 *   --base-url        WS path prefix for clients, e.g. ws://host:3001/game
 *
 * stdout — newline-delimited JSON (parent reads and broadcasts to clients):
 *   { "type": "ready", "sessionId", "endpoint", "pid" }
 *   { "type": "started", "endpoint", "state" }
 *   { "type": "state_updated", "tick", "state" }
 *   { "type": "match_finished", "state" }
 *   { "type": "stopped" }
 *   { "type": "error", "message" }
 *
 * stdin — newline-delimited JSON (GameClientMessage from @spellbound/shared):
 *   { "type": "input", "playerId", "input" }
 *   { "type": "buy_skill", "playerId", "skillId" }
 *   { "type": "set_ready", "playerId" }
 *   { "type": "queue_skill", "request": { "entityId", "skill", "aimX", "aimZ" } }
 *   { "type": "continue_after_round" }
 *   { "type": "stop" }
 */

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import type { BotDifficulty } from './types/battle.js';
import type { Lobby } from './types/lobby.js';
import type { GameClientMessage } from './types/game-server.js';
import { createGameSession } from './logic/game-session.js';
import { generateId } from './utils/id.js';

function writeEvent(event: unknown): void {
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

function writeError(message: string): void {
  writeEvent({ type: 'error', message });
}

function loadLobby(path: string): Lobby {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as Lobby;
}

function parseBotDifficulty(value: string): BotDifficulty {
  if (value === 'passive' || value === 'easy') return value;
  throw new Error(`Invalid --bot-difficulty: ${value}`);
}

function run(): void {
  const { values } = parseArgs({
    options: {
      'lobby-file': { type: 'string' },
      'session-id': { type: 'string' },
      'tick-rate': { type: 'string', default: '30' },
      'bot-difficulty': { type: 'string', default: 'passive' },
      'base-url': { type: 'string', default: 'ws://localhost:3001/game' },
    },
  });

  if (!values['lobby-file']) {
    writeError('Missing required --lobby-file');
    process.exit(1);
  }

  const sessionId = values['session-id'] ?? generateId();
  const tickRate = Number(values['tick-rate']);
  const botDifficulty = parseBotDifficulty(values['bot-difficulty'] ?? 'passive');
  const baseUrl = values['base-url'] ?? 'ws://localhost:3001/game';

  if (!Number.isFinite(tickRate) || tickRate <= 0) {
    writeError('Invalid --tick-rate');
    process.exit(1);
  }

  let lobby: Lobby | null = null;
  try {
    lobby = loadLobby(values['lobby-file']);
  } catch (error) {
    writeError(error instanceof Error ? error.message : 'Failed to load lobby file');
    process.exit(1);
  }

  const session = createGameSession(sessionId, baseUrl, {
    lobby: lobby!,
    botDifficulty,
    tickRateHz: tickRate,
  });

  session.subscribe((event) => {
    writeEvent(event);
  });

  session.startLoop(tickRate);

  writeEvent({
    type: 'ready',
    sessionId,
    endpoint: session.endpoint,
    pid: process.pid,
  });

  const rl = createInterface({ input: process.stdin });

  rl.on('line', (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const message = JSON.parse(trimmed) as GameClientMessage | { type: 'stop' };

      if (message.type === 'stop') {
        session.stop();
        rl.close();
        process.exit(0);
        return;
      }

      session.handleClientMessage(message);
    } catch (error) {
      writeError(error instanceof Error ? error.message : 'Invalid stdin message');
    }
  });

  const shutdown = () => {
    session.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

run();
