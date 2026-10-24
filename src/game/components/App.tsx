import { h } from "preact";
import { GameState } from "../types";
import { TitleScreen } from "./TitleScreen";
import { LampScreen } from "./LampScreen";
import { EnemyScreen } from "./EnemyScreen";
import { ChestScreen } from "./ChestScreen";
import { GameOverScreen } from "./GameOverScreen";
import { VictoryScreen } from "./VictoryScreen";

export function App(props: { state: GameState }) {
  const state = props.state;

  switch (state.screen) {
    case "title":
      return <TitleScreen state={state} />;
    case "lamp":
      return <LampScreen state={state} />;
    case "enemy":
      return <EnemyScreen state={state} />;
    case "chest":
      return <ChestScreen state={state} />;
    case "game_over":
      return <GameOverScreen state={state} />;
    case "victory":
      return <VictoryScreen state={state} />;
    default:
      return <TitleScreen state={state} />;
  }
}
