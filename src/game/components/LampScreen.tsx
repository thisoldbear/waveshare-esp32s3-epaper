import { h } from "preact";
import { GameState } from "../types";

export function LampScreen(props: { state: GameState }) {
  const { state } = props;
  const currentLamps = state.lamps;
  const targetLamps = 10;

  return (
    <screen border={true}>
      <header title="LANTERN" hp={state.hp} maxHp={state.maxHp} lamps={state.lamps} />
      <box x={15} y={30} w={170} h={135} />
      <icon name="lamp" x={100} y={55} />
      <text x={100} y={85} text="SACRED LANTERN" size={13} align="center" />
      <text
        x={100}
        y={105}
        text={`Lanterns Lit: ${currentLamps} / ${targetLamps}`}
        size={11}
        align="center"
      />
      <line x1={30} y1={122} x2={170} y2={122} />
      <text
        x={100}
        y={130}
        text="Light this lantern to banish"
        size={9}
        align="center"
      />
      <text
        x={100}
        y={142}
        text="the suffocating gloom."
        size={9}
        align="center"
      />
      <footer bootLabel="LIGHT" pwrLabel="LIGHT" />
    </screen>
  );
}
