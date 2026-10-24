export interface Weapon {
  name: string;
  skill: number; // Roll >= skill to hit (e.g., 3 means 3+)
  damage: number;
  desc: string;
}

export type EnemyType = "rat" | "zombie" | "wolf" | "spider";

export interface Enemy {
  name: string;
  type: EnemyType;
  maxHp: number;
  hp: number;
  toughness: number;
  skill: number;
  damage: number;
  desc: string;
}

export type ItemType = "potion" | "weapon" | "double_potion";

export interface Item {
  name: string;
  type: ItemType;
  heal?: number;
  weapon?: Weapon;
  desc: string;
}

export type CombatPhase =
  | "encounter"             // Encountered monster: [BOOT] Fight, [PWR] Pass
  | "priority_roll"         // Rolling for initiative
  | "player_turn"           // [BOOT] Strike, [PWR] Flee
  | "player_strike_result"  // Player attack outcome: [BOOT] Continue
  | "enemy_turn_result"     // Enemy attack outcome: [BOOT] Continue
  | "enemy_defeated"        // Monster slain: [BOOT] Proceed
  | "fled";                 // Fled combat with D3 damage taken: [BOOT] Proceed

export interface CombatState {
  enemy: Enemy;
  phase: CombatPhase;
  playerPriorityRoll?: number;
  enemyPriorityRoll?: number;
  playerWinsPriority?: boolean;
  lastPlayerRoll?: number;
  playerHit?: boolean;
  playerDamageDealt?: number;
  lastEnemyRoll?: number;
  enemyHit?: boolean;
  enemyDamageDealt?: number;
  fleeDamage?: number;
  logMessage: string;
}

export interface ChestState {
  items: Item[];
  selectedIndex: number; // 0, 1, or items.length (Leave)
  message: string;
}

export type GameScreen =
  | "title"
  | "lamp"
  | "enemy"
  | "chest"
  | "victory"
  | "game_over";

export interface GameState {
  screen: GameScreen;
  hp: number;
  maxHp: number;
  lamps: number; // Goal: 10
  weapon: Weapon;
  potions: number;
  combat?: CombatState;
  chest?: ChestState;
  lampMessage?: string;
  deathCause?: string;
}
