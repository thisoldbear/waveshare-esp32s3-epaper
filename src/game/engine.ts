import { GameState, Weapon, Enemy, Item, CombatState, ChestState } from "./types";
import { STARTING_WEAPON, createEnemy, rollChestItem } from "./data";

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollD3(): number {
  return Math.floor(Math.random() * 3) + 1;
}

export function calculateDamage(weaponDamage: number, targetToughness: number): number {
  const reduction = Math.floor(targetToughness / 2);
  return Math.max(1, weaponDamage - reduction);
}

export function createInitialState(): GameState {
  return {
    screen: "title",
    hp: 13,
    maxHp: 13,
    lamps: 0,
    weapon: STARTING_WEAPON,
    potions: 0
  };
}

export function startNextEncounter(state: GameState): void {
  // Check win condition
  if (state.lamps >= 10) {
    state.screen = "victory";
    state.combat = undefined;
    state.chest = undefined;
    return;
  }

  // Roll D6 for encounter type:
  // 1, 2 = Lamp (~33%)
  // 3, 4, 5 = Enemy (~50%)
  // 6 = Chest (~17%)
  const encRoll = rollD6();

  if (encRoll <= 2) {
    // Lamp Encounter
    state.screen = "lamp";
    state.combat = undefined;
    state.chest = undefined;
    state.lampMessage = "A sacred iron lantern hangs from an ancient bough.";
  } else if (encRoll <= 5) {
    // Enemy Encounter
    const enemyRoll = rollD6();
    const enemy = createEnemy(enemyRoll);
    state.screen = "enemy";
    state.chest = undefined;
    state.combat = {
      enemy,
      phase: "encounter",
      logMessage: `A ${enemy.name} emerges from the shadowed mist!`
    };
  } else {
    // Chest Encounter: 1 or 2 items
    const itemCount = rollD6() <= 3 ? 1 : 2;
    const items: Item[] = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(rollChestItem(rollD6()));
    }
    state.screen = "chest";
    state.combat = undefined;
    state.chest = {
      items,
      selectedIndex: 0,
      message: "You find an ancient ironbound chest."
    };
  }
}

export interface InputResult {
  needsFullRefresh: boolean;
}

export function handleInput(state: GameState, button: "BOOT" | "PWR"): InputResult {
  // Handle Game Over or Victory screens
  if (state.screen === "game_over" || state.screen === "victory") {
    const next = createInitialState();
    for (const key in next) {
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        (state as any)[key] = (next as any)[key];
      }
    }
    return { needsFullRefresh: true };
  }

  // Handle Title Screen
  if (state.screen === "title") {
    startNextEncounter(state);
    return { needsFullRefresh: true };
  }

  // Handle Lamp Screen
  if (state.screen === "lamp") {
    if (button === "BOOT" || button === "PWR") {
      state.lamps += 1;
      if (state.lamps >= 10) {
        state.screen = "victory";
        return { needsFullRefresh: true };
      }
      startNextEncounter(state);
      return { needsFullRefresh: true };
    }
  }

  // Handle Enemy Screen
  if (state.screen === "enemy" && state.combat) {
    const combat = state.combat;
    const enemy = combat.enemy;

    if (combat.phase === "encounter") {
      if (button === "BOOT") {
        // [BOOT] Fight -> Priority roll-off
        let pRoll = rollD6();
        let eRoll = rollD6();
        while (pRoll === eRoll) {
          pRoll = rollD6();
          eRoll = rollD6();
        }
        combat.playerPriorityRoll = pRoll;
        combat.enemyPriorityRoll = eRoll;
        const playerWon = pRoll > eRoll;
        combat.playerWinsPriority = playerWon;

        if (playerWon) {
          combat.phase = "player_turn";
          combat.logMessage = `Initiative won! (You:${pRoll} vs ${enemy.name}:${eRoll})`;
          return { needsFullRefresh: false };
        } else {
          // Enemy strikes first!
          const strikeRoll = rollD6();
          combat.lastEnemyRoll = strikeRoll;
          if (strikeRoll >= enemy.skill) {
            const dmg = calculateDamage(enemy.damage, 1);
            state.hp = Math.max(0, state.hp - dmg);
            combat.enemyHit = true;
            combat.enemyDamageDealt = dmg;
            if (state.hp <= 0) {
              state.screen = "game_over";
              state.deathCause = `Slain by ${enemy.name}`;
              return { needsFullRefresh: true };
            }
            combat.phase = "enemy_turn_result";
            combat.logMessage = `${enemy.name} struck first for ${dmg} dmg!`;
          } else {
            combat.enemyHit = false;
            combat.phase = "enemy_turn_result";
            combat.logMessage = `${enemy.name} struck first and missed!`;
          }
          return { needsFullRefresh: false };
        }
      } else if (button === "PWR") {
        // [PWR] Pass -> Avoid combat
        startNextEncounter(state);
        return { needsFullRefresh: true };
      }
    } else if (combat.phase === "enemy_turn_result") {
      if (button === "BOOT" || button === "PWR") {
        combat.phase = "player_turn";
        combat.logMessage = "Your turn: strike or flee!";
        return { needsFullRefresh: false };
      }
    } else if (combat.phase === "player_turn") {
      if (button === "BOOT") {
        // [BOOT] Attack
        const roll = rollD6();
        combat.lastPlayerRoll = roll;
        const hit = roll >= state.weapon.skill;
        combat.playerHit = hit;

        if (hit) {
          const dmg = calculateDamage(state.weapon.damage, enemy.toughness);
          enemy.hp = Math.max(0, enemy.hp - dmg);
          combat.playerDamageDealt = dmg;
          if (enemy.hp <= 0) {
            combat.phase = "enemy_defeated";
            combat.logMessage = `You struck down the ${enemy.name}!`;
            return { needsFullRefresh: false };
          }
          combat.phase = "player_strike_result";
          combat.logMessage = `Hit! Dealt ${dmg} damage to ${enemy.name}.`;
        } else {
          combat.playerDamageDealt = 0;
          combat.phase = "player_strike_result";
          combat.logMessage = `Miss! (Rolled ${roll}, needed ${state.weapon.skill}+)`;
        }
        return { needsFullRefresh: false };
      } else if (button === "PWR") {
        // [PWR] Flee
        const fleeDmg = rollD3();
        state.hp = Math.max(0, state.hp - fleeDmg);
        combat.fleeDamage = fleeDmg;
        if (state.hp <= 0) {
          state.screen = "game_over";
          state.deathCause = `Felled while escaping ${enemy.name}`;
          return { needsFullRefresh: true };
        }
        combat.phase = "fled";
        combat.logMessage = `Fled through thorns! Took ${fleeDmg} dmg.`;
        return { needsFullRefresh: false };
      }
    } else if (combat.phase === "player_strike_result") {
      if (button === "BOOT" || button === "PWR") {
        // Enemy retaliates
        const roll = rollD6();
        combat.lastEnemyRoll = roll;
        const hit = roll >= enemy.skill;
        combat.enemyHit = hit;

        if (hit) {
          const dmg = calculateDamage(enemy.damage, 1);
          state.hp = Math.max(0, state.hp - dmg);
          combat.enemyDamageDealt = dmg;
          if (state.hp <= 0) {
            state.screen = "game_over";
            state.deathCause = `Slain by ${enemy.name}`;
            return { needsFullRefresh: true };
          }
          combat.phase = "enemy_turn_result";
          combat.logMessage = `${enemy.name} clawed you for ${dmg} dmg!`;
        } else {
          combat.enemyDamageDealt = 0;
          combat.phase = "enemy_turn_result";
          combat.logMessage = `${enemy.name} attacked and missed!`;
        }
        return { needsFullRefresh: false };
      }
    } else if (combat.phase === "enemy_defeated" || combat.phase === "fled") {
      if (button === "BOOT" || button === "PWR") {
        startNextEncounter(state);
        return { needsFullRefresh: true };
      }
    }
  }

  // Handle Chest Screen
  if (state.screen === "chest" && state.chest) {
    const chest = state.chest;
    const totalOptions = chest.items.length + 1; // last option is "Leave"

    if (button === "BOOT") {
      // [BOOT] Cycle through items
      chest.selectedIndex = (chest.selectedIndex + 1) % totalOptions;
      return { needsFullRefresh: false };
    } else if (button === "PWR") {
      // [PWR] Select highlighted item or Leave
      if (chest.selectedIndex < chest.items.length) {
        const item = chest.items[chest.selectedIndex];
        if (item.type === "potion" || item.type === "double_potion") {
          const heal = item.heal || 3;
          state.hp = Math.min(state.maxHp, state.hp + heal);
          chest.message = `Drank ${item.name}! (+${heal} HP)`;
        } else if (item.type === "weapon" && item.weapon) {
          state.weapon = item.weapon;
          chest.message = `Equipped ${item.weapon.name}!`;
        }
        // Remove item from chest
        chest.items.splice(chest.selectedIndex, 1);
        chest.selectedIndex = 0;
        if (chest.items.length === 0) {
          startNextEncounter(state);
          return { needsFullRefresh: true };
        }
        return { needsFullRefresh: false };
      } else {
        // Selected "Leave"
        startNextEncounter(state);
        return { needsFullRefresh: true };
      }
    }
  }

  return { needsFullRefresh: false };
}
