import type { Lobby, LobbyResult, LobbySlot, SlotSide } from '../types/lobby.js';
import type { ArenaMapId } from '../types/arena.js';
import type { MatchMode } from '../types/match.js';
import { playersPerTeam } from '../types/match.js';
import type { PlayerProfile } from '../types/player.js';
import { generateId } from '../utils/id.js';
import { createBotProfile } from './player.js';

function buildSlots(mode: MatchMode): LobbySlot[] {
  const count = playersPerTeam(mode);
  const slots: LobbySlot[] = [];

  for (let i = 0; i < count; i++) {
    slots.push({
      id: generateId(),
      side: 'teamA',
      index: i,
      occupant: null,
    });
  }

  for (let i = 0; i < count; i++) {
    slots.push({
      id: generateId(),
      side: 'teamB',
      index: i,
      occupant: null,
    });
  }

  return slots;
}

export function createLobby(mode: MatchMode, hostId: string, mapId: ArenaMapId): Lobby {
  return {
    id: generateId(),
    mode,
    hostId,
    slots: buildSlots(mode),
    status: 'waiting',
    mapId,
    createdAt: Date.now(),
  };
}

export function findSlot(lobby: Lobby, slotId: string): LobbySlot | undefined {
  return lobby.slots.find((s) => s.id === slotId);
}

export function findPlayerSlot(
  lobby: Lobby,
  playerId: string,
): LobbySlot | undefined {
  return lobby.slots.find((s) => s.occupant?.id === playerId);
}

export function getTeamSlots(lobby: Lobby, side: SlotSide): LobbySlot[] {
  return lobby.slots
    .filter((s) => s.side === side)
    .sort((a, b) => a.index - b.index);
}

function isPlayerInLobby(lobby: Lobby, playerId: string): boolean {
  return lobby.slots.some((s) => s.occupant?.id === playerId);
}

function updateSlot(
  lobby: Lobby,
  slotId: string,
  occupant: PlayerProfile | null,
): Lobby {
  return {
    ...lobby,
    slots: lobby.slots.map((s) =>
      s.id === slotId ? { ...s, occupant } : s,
    ),
  };
}

export function joinSlot(
  lobby: Lobby,
  slotId: string,
  player: PlayerProfile,
): LobbyResult {
  const slot = findSlot(lobby, slotId);
  if (!slot) {
    return fail('slot_not_found', 'Slot not found.');
  }
  if (slot.occupant) {
    return fail('slot_occupied', 'This slot is already taken.');
  }
  if (isPlayerInLobby(lobby, player.id)) {
    return fail('player_already_in_lobby', 'You are already in the lobby.');
  }

  return ok(updateSlot(lobby, slotId, player));
}

export function leaveSlot(
  lobby: Lobby,
  slotId: string,
  playerId: string,
): LobbyResult {
  const slot = findSlot(lobby, slotId);
  if (!slot) {
    return fail('slot_not_found', 'Slot not found.');
  }
  if (!slot.occupant) {
    return fail('slot_empty', 'Slot is empty.');
  }
  if (slot.occupant.id !== playerId) {
    return fail('cannot_remove_player', 'You can only leave your own slot.');
  }

  return ok(updateSlot(lobby, slotId, null));
}

export function addBotToSlot(
  lobby: Lobby,
  slotId: string,
  requesterId: string,
): LobbyResult {
  const slot = findSlot(lobby, slotId);
  if (!slot) {
    return fail('slot_not_found', 'Slot not found.');
  }
  if (slot.occupant) {
    return fail('slot_occupied', 'This slot is already taken.');
  }

  const requesterSlot = findPlayerSlot(lobby, requesterId);
  if (requesterSlot && requesterSlot.side === slot.side) {
    return fail('bot_on_own_team', 'Bots can only be placed on the opposing team.');
  }

  return ok(updateSlot(lobby, slotId, createBotProfile()));
}

export function fillLobbyForBotMatch(lobby: Lobby): Lobby {
  let updated = lobby;
  for (const slot of lobby.slots) {
    if (slot.occupant) continue;
    updated = updateSlot(updated, slot.id, createBotProfile());
  }
  return updated;
}

export function removeBotFromSlot(
  lobby: Lobby,
  slotId: string,
  requesterId: string,
): LobbyResult {
  const slot = findSlot(lobby, slotId);
  if (!slot) {
    return fail('slot_not_found', 'Slot not found.');
  }
  if (!slot.occupant?.isBot) {
    return fail('cannot_remove_player', 'Only bots can be removed this way.');
  }

  if (requesterId !== lobby.hostId) {
    return fail('not_host', 'Only the host can remove bots.');
  }

  return ok(updateSlot(lobby, slotId, null));
}

export function canStartMatch(lobby: Lobby): boolean {
  const allFilled = lobby.slots.every((s) => s.occupant !== null);
  const hasHuman = lobby.slots.some((s) => s.occupant && !s.occupant.isBot);
  return allFilled && hasHuman;
}

export function getLobbyReadiness(lobby: Lobby): {
  filled: number;
  total: number;
  canStart: boolean;
} {
  const filled = lobby.slots.filter((s) => s.occupant !== null).length;
  return {
    filled,
    total: lobby.slots.length,
    canStart: canStartMatch(lobby),
  };
}

function ok(data: Lobby): LobbyResult {
  return { success: true, data };
}

function fail(
  code: import('../types/lobby.js').LobbyErrorCode,
  message: string,
): LobbyResult {
  return { success: false, error: { code, message } };
}
