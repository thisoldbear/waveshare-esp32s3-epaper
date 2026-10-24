import { h } from "preact";
import { GameState } from "../types";

export function GameOverScreen(props: { state: GameState }) {
  const { state } = props;

  return (
    <screen doubleBorder={true}>
      <header title="GAME OVER" lamps={state.lamps} />
      <box x={15} y={30} w={170} h={135} />
      <icon name="skull" x={100} y={55} />
      <text x={100} y={80} text="YOU HAVE FALLEN" size={13} align="center" />
      <line x1={30} y1={98} x2={170} y2={98} />
      <text
        x={100}
        y={106}
        text={state.deathCause || "Consumed by the dark wood."}
        size={9}
        align="center"
      />
      <text
        x={100}
        y={124}
        text={`Lanterns Lit: ${state.lamps} / 10`}
        size={10}
        align="center"
      />
      <text
        x={100}
        y={140}
        text="Press either button to restart."
        size={8}
        align="center"
      />
      <footer bootLabel="RESTART" pwrLabel="RESTART" />
    </screen>
  );
}
