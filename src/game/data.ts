import { Weapon, Enemy, Item } from "./types";

export const STARTING_WEAPON: Weapon = {
  name: "Rusty Dagger",
  skill: 3, // Hits on 3+
  damage: 2,
  desc: "A pitted blade, but swift."
};

export function createEnemy(roll: number): Enemy {
  // D6 Table:
  // 1 = Dire Rat
  // 2, 3 = Zombie (common)
  // 4, 5 = Shadow Wolf
  // 6 = Giant Spider (rare)
  if (roll === 1) {
    return {
      name: "Dire Rat",
      type: "rat",
      maxHp: 2,
      hp: 2,
      toughness: 1,
      skill: 4, // Hits on 4+
      damage: 1,
      desc: "A quick, rabid vermin."
    };
  } else if (roll === 2 || roll === 3) {
    return {
      name: "Zombie",
      type: "zombie",
      maxHp: 4,
      hp: 4,
      toughness: 1,
      skill: 4, // Hits on 4+
      damage: 2,
      desc: "A decaying forest thrall."
    };
  } else if (roll === 4 || roll === 5) {
    return {
      name: "Shadow Wolf",
      type: "wolf",
      maxHp: 6,
      hp: 6,
      toughness: 1,
      skill: 3, // Hits on 3+
      damage: 3,
      desc: "A savage nocturnal stalker."
    };
  } else {
    return {
      name: "Giant Spider",
      type: "spider",
      maxHp: 8,
      hp: 8,
      toughness: 2,
      skill: 3, // Hits on 3+
      damage: 4,
      desc: "A lethal webbed monstrosity."
    };
  }
}

export function rollChestItem(roll: number): Item {
  switch (roll) {
    case 1:
      return {
        name: "Elixir of Life",
        type: "potion",
        heal: 3,
        desc: "Restores +3 HP."
      };
    case 2:
      return {
        name: "Spiked Club",
        type: "weapon",
        weapon: {
          name: "Spiked Club",
          skill: 4,
          damage: 3,
          desc: "Crude but heavy."
        },
        desc: "Weapon: Skill 4+, Dmg 3"
      };
    case 3:
      return {
        name: "Hunting Spear",
        type: "weapon",
        weapon: {
          name: "Hunting Spear",
          skill: 3,
          damage: 3,
          desc: "Keeps foes at bay."
        },
        desc: "Weapon: Skill 3+, Dmg 3"
      };
    case 4:
      return {
        name: "Broadsword",
        type: "weapon",
        weapon: {
          name: "Broadsword",
          skill: 4,
          damage: 5,
          desc: "Devastating heavy steel."
        },
        desc: "Weapon: Skill 4+, Dmg 5"
      };
    case 5:
      return {
        name: "Silver Rapier",
        type: "weapon",
        weapon: {
          name: "Silver Rapier",
          skill: 3,
          damage: 4,
          desc: "Fierce finesse blade."
        },
        desc: "Weapon: Skill 3+, Dmg 4"
      };
    case 6:
    default:
      return {
        name: "Double Draught",
        type: "double_potion",
        heal: 6,
        desc: "Potent tonic! Restores +6 HP."
      };
  }
}
