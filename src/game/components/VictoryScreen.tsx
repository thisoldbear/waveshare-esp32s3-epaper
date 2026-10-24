import { h } from "preact";
import { GameState } from "../types";

export function VictoryScreen(props: { state: GameState }) {
  const { state } = props;

  return (
    <screen doubleBorder={true}>
      <header title="VICTORY" hp={state.hp} maxHp={state.maxHp} lamps={10} />
      <box x={15} y={30} w={170} h={135} />
      <icon name="lamp" x={100} y={55} />
      <text x={100} y={80} text="DARK WOOD CONQUERED" size={12} align="center" />
      <line x1={30} y1={98} x2={170} y2={98} />
      <text
        x={100}
        y={106}
        text="All 10 lanterns shine in harmony!"
        size={9}
        align="center"
      />
      <text
        x={100}
        y={120}
        text="The ancient curse is shattered."
        size={8}
        align="center"
      />
      <text
        x={100}
        y={136}
        text={`Final HP: ${state.hp}/${state.maxHp}`}
        size={10}
        align="center"
      />
      <footer bootLabel="AGAIN" pwrLabel="AGAIN" />
    </screen>
  );
}
