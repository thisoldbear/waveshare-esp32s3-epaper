import { h } from "preact";
import { GameState } from "../types";

export function TitleScreen(props: { state: GameState }) {
  return (
    <screen doubleBorder={true}>
      <header title="THE DARK WOOD" />
      <box x={15} y={28} w={170} h={138} />
      <icon name="sword" x={100} y={48} />
      <text x={100} y={68} text="THE DARK WOOD" size={13} align="center" />
      <text x={100} y={84} text="A Fantasy Dice RPG" size={10} align="center" />
      <line x1={25} y1={98} x2={175} y2={98} />
      <text x={100} y={106} text="Find & light 10 sacred lamps" size={9} align="center" />
      <text x={100} y={118} text="to banish the deep darkness." size={9} align="center" />
      <text x={100} y={132} text="HP: 13 | Weapon: Rusty Dagger" size={9} align="center" />
      <text x={100} y={146} text="Beware wolves & lurking beasts" size={8} align="center" />
      <footer bootLabel="ENTER" pwrLabel="ENTER" />
    </screen>
  );
}
