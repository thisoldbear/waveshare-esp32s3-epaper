import { h } from "preact";
import { GameState } from "../types";

export function LampScreen(props: { state: GameState }) {
  const state = props.state;
  const currentLamps = state.lamps;
  const targetLamps = 10;

  return (
    <screen border={true}>
      <header title="SACRED LAMP" hp={state.hp} maxHp={state.maxHp} lamps={state.lamps} />
      <box x={14} y={26} w={172} h={140} />
      <icon name="lamp" x={100} y={48} />
      <text x={100} y={70} text="SACRED LAMP FOUND!" size={11} align="center" />
      
      {/* Progress Box */}
      <box x={28} y={85} w={144} h={24} fill={false} />
      <text
        x={100}
        y={92}
        text={`PROGRESS: ${currentLamps} / ${targetLamps} LIT`}
        size={10}
        align="center"
      />

      <line x1={25} y1={118} x2={175} y2={118} />
      <text
        x={100}
        y={126}
        text="Light this lamp to dispel"
        size={9}
        align="center"
      />
      <text
        x={100}
        y={138}
        text="the suffocating black gloom."
        size={9}
        align="center"
      />
      <footer bootLabel="LIGHT" pwrLabel="LIGHT" />
    </screen>
  );
}
