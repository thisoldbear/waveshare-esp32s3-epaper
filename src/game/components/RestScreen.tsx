import { h } from "preact";
import { GameState } from "../types";

export function RestScreen(props: { state: GameState }) {
  const state = props.state;
  const heal = state.restHeal || 1;

  return (
    <screen border={true}>
      <header title="SANCTUARY" hp={state.hp} maxHp={state.maxHp} lamps={state.lamps} />
      <box x={14} y={26} w={172} h={140} />
      <icon name="lamp" x={100} y={48} />
      <text x={100} y={68} text="YOU REST BY THE LIGHT" size={11} align="center" />

      {/* Progress banner */}
      <box x={28} y={82} w={144} h={24} fill={false} />
      <text
        x={100}
        y={89}
        text={`LAMP ${state.lamps} OF 10 IGNITED!`}
        size={10}
        align="center"
      />

      <line x1={25} y1={112} x2={175} y2={112} />
      <text
        x={100}
        y={118}
        text={`Recovered +${heal} HP! (HP: ${state.hp}/${state.maxHp})`}
        size={9}
        align="center"
      />
      <text
        x={100}
        y={132}
        text="The holy flame keeps beasts at bay."
        size={9}
        align="center"
      />
      <text
        x={100}
        y={146}
        text="Warmth returns to your limbs."
        size={8}
        align="center"
      />
      <footer bootLabel="PROCEED" pwrLabel="PROCEED" />
    </screen>
  );
}
