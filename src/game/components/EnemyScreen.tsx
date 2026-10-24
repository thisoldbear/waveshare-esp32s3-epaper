import { h } from "preact";
import { GameState } from "../types";

export function EnemyScreen(props: { state: GameState }) {
  const state = props.state;
  const combat = state.combat;
  if (!combat) return <screen />;

  const enemy = combat.enemy;
  const phase = combat.phase;

  // Bestiary Icon
  const iconName = enemy.type;

  return (
    <screen border={true}>
      <header title="COMBAT" hp={state.hp} maxHp={state.maxHp} lamps={state.lamps} />

      {/* Enemy Info Banner (y=26..66) */}
      <box x={8} y={26} w={184} h={40} />
      <icon name={iconName} x={28} y={45} />
      <text x={50} y={32} text={enemy.name.toUpperCase()} size={12} />
      <text
        x={50}
        y={48}
        text={`HP: ${enemy.hp}/${enemy.maxHp} | Toughness: ${enemy.toughness}`}
        size={9}
      />

      {/* Middle Interaction / Combat Action Area (y=72..168) */}
      {phase === "encounter" && (
        <box x={8} y={72} w={184} h={96}>
          <text x={100} y={85} text="A monster blocks the trail!" size={11} align="center" />
          <text x={100} y={105} text={enemy.desc} size={9} align="center" />
          <line x1={20} y1={120} x2={180} y2={120} />
          <text
            x={100}
            y={128}
            text={`Your Weapon: ${state.weapon.name}`}
            size={9}
            align="center"
          />
          <text
            x={100}
            y={140}
            text={`Hits on ${state.weapon.skill}+ | Damage: ${state.weapon.damage}`}
            size={9}
            align="center"
          />
          <footer bootLabel="FIGHT" pwrLabel="PASS" />
        </box>
      )}

      {phase === "player_turn" && (
        <box x={8} y={72} w={184} h={96}>
          <text x={100} y={82} text="YOUR TURN TO STRIKE!" size={12} align="center" />
          <text
            x={100}
            y={102}
            text={`Weapon: ${state.weapon.name} (${state.weapon.skill}+ to Hit)`}
            size={10}
            align="center"
          />
          <text
            x={100}
            y={118}
            text={`Damage: ${state.weapon.damage} vs T:${enemy.toughness}`}
            size={9}
            align="center"
          />
          <line x1={20} y1={132} x2={180} y2={132} />
          <text
            x={100}
            y={140}
            text="Fleeing inflicts 1-3 damage."
            size={9}
            align="center"
          />
          <footer bootLabel="STRIKE" pwrLabel="FLEE" />
        </box>
      )}

      {phase === "player_strike_result" && (
        <box x={8} y={72} w={184} h={96}>
          <text x={100} y={78} text="PLAYER ATTACK" size={11} align="center" />
          <dicebox
            x={50}
            y={95}
            roll={combat.lastPlayerRoll || 1}
            label="D6 Roll"
            hit={combat.playerHit}
          />
          <text
            x={100}
            y={136}
            text={combat.logMessage}
            size={9}
            align="center"
          />
          <text
            x={100}
            y={150}
            text={`Enemy HP remaining: ${enemy.hp}/${enemy.maxHp}`}
            size={9}
            align="center"
          />
          <footer bootLabel="CONTINUE" pwrLabel="CONTINUE" />
        </box>
      )}

      {phase === "enemy_turn_result" && (
        <box x={8} y={72} w={184} h={96}>
          <text x={100} y={78} text={`${enemy.name.toUpperCase()} ATTACKS`} size={11} align="center" />
          <dicebox
            x={50}
            y={95}
            roll={combat.lastEnemyRoll || 1}
            label="D6 Roll"
            hit={combat.enemyHit}
          />
          <text
            x={100}
            y={136}
            text={combat.logMessage}
            size={9}
            align="center"
          />
          <text
            x={100}
            y={150}
            text={`Your HP: ${state.hp}/${state.maxHp}`}
            size={9}
            align="center"
          />
          <footer bootLabel="CONTINUE" pwrLabel="CONTINUE" />
        </box>
      )}

      {phase === "enemy_defeated" && (
        <box x={8} y={72} w={184} h={96}>
          <icon name="skull" x={100} y={90} />
          <text x={100} y={112} text="VICTORY!" size={13} align="center" />
          <text
            x={100}
            y={128}
            text={`The ${enemy.name} was slain.`}
            size={9}
            align="center"
          />
          <text
            x={100}
            y={142}
            text={`Recovered +${combat.healAmount || 1} HP! (HP: ${state.hp}/${state.maxHp})`}
            size={9}
            align="center"
          />
          <footer bootLabel="PROCEED" pwrLabel="PROCEED" />
        </box>
      )}

      {phase === "fled" && (
        <box x={8} y={72} w={184} h={96}>
          <text x={100} y={85} text="FLED COMBAT" size={12} align="center" />
          <text
            x={100}
            y={106}
            text={`You broke away, taking ${combat.fleeDamage || 1} damage.`}
            size={9}
            align="center"
          />
          <line x1={30} y1={124} x2={170} y2={124} />
          <text
            x={100}
            y={136}
            text={`Current HP: ${state.hp}/${state.maxHp}`}
            size={10}
            align="center"
          />
          <footer bootLabel="PROCEED" pwrLabel="PROCEED" />
        </box>
      )}
    </screen>
  );
}
