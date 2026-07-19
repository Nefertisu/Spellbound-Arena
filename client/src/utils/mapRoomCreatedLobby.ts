import {
  createEmptyStats,
  createLobby as createLobbyState,
  createPlayerProfile,
  getTeamSlots,
  joinSlot,
  type ArenaMapId,
  type Character,
  type CharacterAttributes,
  type Lobby,
  type MatchMode,
  type SlotSide,
} from "@spellbound/shared";

export interface RoomCreatedTeamPlayer {
  name: string;
  attributes: CharacterAttributes;
  userId?: number | string;
}

export interface RoomCreatedPayload {
  lobbyId: string;
  mode: MatchMode;
  players: {
    teamA: RoomCreatedTeamPlayer[];
    teamB: RoomCreatedTeamPlayer[];
  };
  map: ArenaMapId;
}

function toCharacterStats(attributes: CharacterAttributes): Character["stats"] {
  return { ...createEmptyStats(), ...attributes };
}

function mapTeamPlayers(
  lobby: Lobby,
  side: SlotSide,
  players: RoomCreatedTeamPlayer[],
  localUserId: string,
  localCharacter: Character | null,
): Lobby {
  const slots = getTeamSlots(lobby, side);
  let current = lobby;

  for (const [index, player] of players.entries()) {
    const slot = slots[index];
    if (!slot) continue;

    const isLocalPlayer =
      localCharacter != null &&
      (player.userId != null
        ? String(player.userId) === localUserId
        : player.name === localCharacter.name);

    const playerId = isLocalPlayer
      ? localUserId
      : player.userId != null
        ? String(player.userId)
        : `${side}-${index}`;

    const character: Character = isLocalPlayer
      ? localCharacter
      : {
          id: `${playerId}-character`,
          ownerId: playerId,
          name: player.name,
          stats: toCharacterStats(player.attributes),
          createdAt: 0,
        };

    const profile = createPlayerProfile(playerId, character);
    const joined = joinSlot(current, slot.id, profile);
    if (joined.success) {
      current = joined.data;
    }
  }

  return current;
}

export function mapRoomCreatedToLobby(
  payload: RoomCreatedPayload,
  options: {
    localUserId: string;
    localCharacter?: Character | null;
  },
): Lobby {
  const firstTeamA = payload.players.teamA[0];
  const hostId =
    firstTeamA?.userId != null
      ? String(firstTeamA.userId)
      : options.localUserId;

  const base: Lobby = {
    ...createLobbyState(payload.mode, hostId, payload.map),
    id: payload.lobbyId,
    mapId: payload.map,
  };

  let lobby = mapTeamPlayers(
    base,
    "teamA",
    payload.players.teamA,
    options.localUserId,
    options.localCharacter ?? null,
  );

  lobby = mapTeamPlayers(
    lobby,
    "teamB",
    payload.players.teamB,
    options.localUserId,
    options.localCharacter ?? null,
  );

  return lobby;
}
