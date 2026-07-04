import { create } from 'zustand';

import {

  allPlayersReady,

  computeMaxHp,

  computeMaxMana,

  createBattleFromLobby,

  mergeCharacterStats,

  mergeGearStatBonuses,

  purchaseGear as purchaseGearLogic,

  purchaseSkill as purchaseSkillLogic,

  randomStatBudget,

  ROUND_BONUS_STAT_POINTS,

  sortGearKinds,

  sortEquippedGear,

  startCombatPhase,

  startNextRound,

  tickBattle,

  type BattleState,

  type BotDifficulty,

  type CharacterStats,

  type Lobby,

  type PlayerInput,

  type ShopSkill,

} from '@spellbound/shared';



interface SkillRequest {

  entityId: string;

  skill: ShopSkill;

  aimX: number;

  aimZ: number;

}



const pendingSkillQueue: SkillRequest[] = [];



function drainPendingSkills(): SkillRequest[] {

  if (pendingSkillQueue.length === 0) return [];

  return pendingSkillQueue.splice(0);

}



function clearPendingSkills(): void {

  pendingSkillQueue.length = 0;

}



export const BATTLE_CAMERA_DISTANCE_DEFAULT = 8;

export const BATTLE_CAMERA_DISTANCE_MIN = 4.5;

export const BATTLE_CAMERA_DISTANCE_MAX = 9;



interface BattleStore {

  battle: BattleState | null;

  inputs: Record<string, PlayerInput>;

  cameraForward: { x: number; z: number };

  cameraYaw: number;

  cameraPitch: number;

  cameraDistance: number;



  initBattle: (lobby: Lobby, localPlayerId: string, botDifficulty: BotDifficulty) => void;

  clearBattle: () => void;

  setCameraForward: (x: number, z: number) => void;

  addCameraRotation: (dyaw: number, dpitch: number) => void;

  addCameraZoom: (delta: number) => void;

  setInput: (playerId: string, input: PlayerInput) => void;

  buySkill: (playerId: string, skillId: string) => void;

  buyGear: (playerId: string, gearId: string) => void;

  setRoundStatDraft: (playerId: string, stats: CharacterStats) => void;

  setReady: (playerId: string) => void;

  queueSkill: (entityId: string, skill: ShopSkill, aimX: number, aimZ: number) => void;

  tick: (dt: number, now: number) => void;

  continueAfterRound: () => void;

  autoBuyForBots: () => void;

}



const defaultInput = (): PlayerInput => ({

  moveX: 0,

  moveZ: 0,

  jump: false,

  skillIndex: null,

  aimX: 0,

  aimZ: 1,

});



function tryStartCombat(state: BattleState): BattleState {

  if (!allPlayersReady(state)) return state;

  return startCombatPhase(state);

}



function applyGearToEntity(

  entity: BattleState['entities'][number],

  baseStats: CharacterStats,

  bonusStats: CharacterStats,

  equippedGear: BattleState['players'][number]['equippedGear'],

) {

  const gearStats = mergeGearStatBonuses(equippedGear);

  const combatStats = mergeCharacterStats(baseStats, bonusStats, gearStats);

  const equippedGearSorted = sortEquippedGear(equippedGear);

  const equippedKinds = sortGearKinds(equippedGearSorted.map((g) => g.kind));

  const maxHp = computeMaxHp('player', combatStats);

  const maxMana = computeMaxMana(combatStats);



  return {

    ...entity,

    equippedGearKinds: equippedKinds,

    equippedGear: equippedGearSorted,

    characterStats: combatStats,

    maxHp,

    maxMana,

    hp: maxHp,

    mana: maxMana,

  };

}



export const useBattleStore = create<BattleStore>((set, get) => ({

  battle: null,

  inputs: {},

  cameraForward: { x: 0, z: 1 },

  cameraYaw: 0,

  cameraPitch: 0.35,

  cameraDistance: BATTLE_CAMERA_DISTANCE_DEFAULT,



  initBattle: (lobby, localPlayerId, botDifficulty) => {

    clearPendingSkills();

    const battle = createBattleFromLobby(lobby, localPlayerId, botDifficulty);

    const inputs: Record<string, PlayerInput> = {};

    battle.players.forEach((p) => {

      inputs[p.playerId] = defaultInput();

    });

    set({

      battle,

      inputs,

      cameraYaw: 0,

      cameraPitch: 0.35,

      cameraForward: { x: 0, z: 1 },

      cameraDistance: BATTLE_CAMERA_DISTANCE_DEFAULT,

    });

    get().autoBuyForBots();

  },



  clearBattle: () => {

    clearPendingSkills();

    set({

      battle: null,

      inputs: {},

      cameraForward: { x: 0, z: 1 },

      cameraYaw: 0,

      cameraPitch: 0.35,

      cameraDistance: BATTLE_CAMERA_DISTANCE_DEFAULT,

    });

  },



  setCameraForward: (x, z) => set({ cameraForward: { x, z } }),



  addCameraRotation: (dyaw, dpitch) =>

    set((s) => ({

      cameraYaw: s.cameraYaw + dyaw,

      cameraPitch: Math.max(-0.35, Math.min(1.15, s.cameraPitch + dpitch)),

    })),



  addCameraZoom: (delta) =>

    set((s) => ({

      cameraDistance: Math.max(

        BATTLE_CAMERA_DISTANCE_MIN,

        Math.min(BATTLE_CAMERA_DISTANCE_MAX, s.cameraDistance + delta),

      ),

    })),



  setInput: (playerId, input) => {

    set((s) => ({

      inputs: { ...s.inputs, [playerId]: input },

    }));

  },



  buySkill: (playerId, skillId) => {

    const { battle } = get();

    if (!battle || battle.phase !== 'shop') return;



    const skill = battle.shopOffers.find((s) => s.id === skillId);

    if (!skill) return;



    const players = battle.players.map((p) => {

      if (p.playerId !== playerId) return p;

      const result = purchaseSkillLogic(p.gold, p.equippedSkills, skill);

      if (!result.success) return p;

      return {

        ...p,

        gold: result.gold,

        equippedSkills: [...p.equippedSkills, result.skill],

        isReady: false,

      };

    });



    set({ battle: { ...battle, players } });

  },



  buyGear: (playerId, gearId) => {

    const { battle } = get();

    if (!battle || battle.phase !== 'shop') return;



    const gear = battle.gearOffers.find((g) => g.id === gearId);

    if (!gear) return;



    const players = battle.players.map((p) => {

      if (p.playerId !== playerId) return p;

      const result = purchaseGearLogic(p.gold, p.equippedGear, gear);

      if (!result.success) return p;

      return {

        ...p,

        gold: result.gold,

        equippedGear: result.ownedGear,

        isReady: false,

      };

    });



    const playerMeta = players.find((p) => p.playerId === playerId);

    const entities = battle.entities.map((entity) => {

      if (entity.playerId !== playerId || !playerMeta) return entity;

      return applyGearToEntity(

        entity,

        playerMeta.baseStats,

        playerMeta.bonusStats,

        playerMeta.equippedGear,

      );

    });



    set({ battle: { ...battle, players, entities } });

  },



  setRoundStatDraft: (playerId, stats) => {

    const { battle } = get();

    if (!battle || battle.phase !== 'shop' || battle.round <= 1) return;



    const players = battle.players.map((p) =>

      p.playerId === playerId ? { ...p, roundStatDraft: stats, isReady: false } : p,

    );



    set({ battle: { ...battle, players } });

  },



  setReady: (playerId) => {

    const { battle } = get();

    if (!battle || battle.phase !== 'shop') return;



    const players = battle.players.map((p) =>

      p.playerId === playerId ? { ...p, isReady: true } : p,

    );

    let next = { ...battle, players };

    next = tryStartCombat(next);

    set({ battle: next });

  },



  queueSkill: (entityId, skill, aimX, aimZ) => {

    pendingSkillQueue.push({ entityId, skill, aimX, aimZ });

  },



  tick: (dt, now) => {

    const { battle, inputs } = get();

    if (!battle || battle.phase !== 'combat') return;



    const cappedDt = Math.min(dt, 0.05);

    const pendingSkills = drainPendingSkills();

    const next = tickBattle(battle, cappedDt, inputs, pendingSkills, now);



    const clearedInputs: Record<string, PlayerInput> = {};

    for (const [id, input] of Object.entries(inputs)) {

      clearedInputs[id] = { ...input, jump: false };

    }



    set({ battle: next, inputs: clearedInputs });

  },



  continueAfterRound: () => {

    const { battle } = get();

    if (!battle) return;



    if (battle.phase === 'round_end') {

      const next = startNextRound(battle);

      if (next) {

        set({ battle: next });

        clearPendingSkills();

        get().autoBuyForBots();

      }

    }

  },



  autoBuyForBots: () => {

    const { battle } = get();

    if (!battle || battle.phase !== 'shop') return;



    let next = { ...battle };

    for (const player of next.players) {

      const entity = next.entities.find((e) => e.playerId === player.playerId);

      if (!entity?.isBot) continue;



      let gold = player.gold;

      let equippedSkills = [...player.equippedSkills];

      let equippedGear = [...player.equippedGear];

      let roundStatDraft = player.roundStatDraft;



      if (next.round > 1) {

        roundStatDraft = randomStatBudget(ROUND_BONUS_STAT_POINTS);

      }



      for (const skill of next.shopOffers) {

        if (gold < skill.price) continue;

        if (Math.random() > 0.55) continue;

        const result = purchaseSkillLogic(gold, equippedSkills, skill);

        if (!result.success) continue;

        gold = result.gold;

        equippedSkills = [...equippedSkills, result.skill];

        if (equippedSkills.length >= 2) break;

      }



      for (const gear of next.gearOffers) {

        const hasKind = equippedGear.some((owned) => owned.kind === gear.kind);

        if (hasKind) continue;

        if (Math.random() > 0.45) continue;

        const gearResult = purchaseGearLogic(gold, equippedGear, gear);

        if (!gearResult.success) continue;

        gold = gearResult.gold;

        equippedGear = gearResult.ownedGear;

      }



      const updatedEntity = applyGearToEntity(

        entity,

        player.baseStats,

        player.bonusStats,

        equippedGear,

      );



      next = {

        ...next,

        entities: next.entities.map((e) =>

          e.playerId === player.playerId ? updatedEntity : e,

        ),

        players: next.players.map((p) =>

          p.playerId === player.playerId

            ? {

                ...p,

                gold,

                equippedSkills,

                equippedGear,

                roundStatDraft,

                isReady: true,

              }

            : p,

        ),

      };

    }



    next = tryStartCombat(next);

    set({ battle: next });

  },

}));

