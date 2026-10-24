import { h } from "preact";
import { GameState } from "../types";

export function ChestScreen(props: { state: GameState }) {
  const { state } = props;
  const chest = state.chest;
  if (!chest) return <screen />;

  const items = chest.items;
  const selected = chest.selectedIndex;

  return (
    <screen border={true}>
      <header title="CHEST" hp={state.hp} maxHp={state.maxHp} lamps={state.lamps} />
      <icon name="chest" x={100} y={40} />
      <text x={100} y={54} text="WOODLAND CHEST" size={11} align="center" />
      <line x1={15} y1={66} x2={185} y2={66} />

      {/* Item list (y=72..145) */}
      {items.map((item, idx) => {
        const isSelected = selected === idx;
        const yPos = 72 + idx * 30;
        return (
          <box
            key={idx}
            x={10}
            y={yPos}
            w={180}
            h={26}
            fill={isSelected}
            border={!isSelected}
            color={isSelected ? 0 : 0}
          >
            <text
              x={16}
              y={yPos + 4}
              text={`${isSelected ? "> " : "  "}${item.name}`}
              size={10}
              color={isSelected ? 1 : 0}
            />
            <text
              x={20}
              y={yPos + 15}
              text={item.desc}
              size={8}
              color={isSelected ? 1 : 0}
            />
          </box>
        );
      })}

      {/* Leave Chest Option */}
      {(() => {
        const leaveIdx = items.length;
        const isSelected = selected === leaveIdx;
        const yPos = 72 + leaveIdx * 30;
        return (
          <box
            x={10}
            y={yPos}
            w={180}
            h={24}
            fill={isSelected}
            border={!isSelected}
            color={isSelected ? 0 : 0}
          >
            <text
              x={16}
              y={yPos + 5}
              text={`${isSelected ? "> " : "  "}Leave Chest`}
              size={10}
              color={isSelected ? 1 : 0}
            />
          </box>
        );
      })()}

      <text
        x={100}
        y={155}
        text={chest.message}
        size={8}
        align="center"
      />

      <footer
        bootLabel="CYCLE"
        pwrLabel={selected < items.length ? "TAKE" : "LEAVE"}
      />
    </screen>
  );
}
