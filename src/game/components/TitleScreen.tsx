import { h } from "preact";
import { GameState } from "../types";

export function TitleScreen(props: { state: GameState }) {
  return (
    <screen doubleBorder={true}>
      <header title="THE DARK WOOD" />
      <box x={15} y={30} w={170} h={135} />
      <icon name="lamp" x={100} y={50} />
      <text x={100} y={75} text="THE DARK WOOD" size={14} align="center" />
      <text x={100} y={93} text="A Dice-Rolling RPG" size={10} align="center" />
      <line x1={30} y1={108} x2={170} y2={108} />
      <text x={100} y={116} text="Light 10 lanterns to escape." size={9} align="center" />
      <text x={100} y={129} text="HP: 13 | Weapon: Rusty Dagger" size={9} align="center" />
      <text x={100} y={142} text="Beware wolves & deep horrors..." size={9} align="center" />
      <footer bootLabel="ENTER" pwrLabel="START" />
    </screen>
  );
}
