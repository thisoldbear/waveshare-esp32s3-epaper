import { h } from "preact";
import { GameState } from "../types";

export function ChestScreen(props: { state: GameState }) {
  const state = props.state;
  const chest = state.chest;
  if (!chest) return <screen />;

  const items = chest.items;
  const selected = chest.selectedIndex;

  return (
    <screen border={true}>
      <header title="CHEST" hp={state.hp} maxHp={state.maxHp} lamps={state.lamps} />
      <icon name="chest" x={100} y={38} />
      <text x={100} y={52} text="WOODLAND CHEST" size={11} align="center" />
      <line x1={15} y1={65} x2={185} y2={65} />

      {/* Item list */}
      {items.map((item, idx) => {
        const isSelected = selected === idx;
        const yPos = 69 + idx * 30;
        return (
          <box
            key={idx}
            x={10}
            y={yPos}
            w={180}
            h={26}
            fill={isSelected}
            border={!isSelected}
            color={0}
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
        const yPos = 69 + leaveIdx * 30;
        return (
          <box
            x={10}
            y={yPos}
            w={180}
            h={22}
            fill={isSelected}
            border={!isSelected}
            color={0}
          >
            <text
              x={16}
              y={yPos + 4}
              text={`${isSelected ? "> " : "  "}Leave Chest`}
              size={10}
              color={isSelected ? 1 : 0}
            />
          </box>
        );
      })()}

      {items[0] && items[0].type === "weapon" ? (
        <box x={10} y={126} w={180} h={40} fill={false} border={true}>
          <text
            x={100}
            y={132}
            text={`Replaces: ${state.weapon.name}`}
            size={9}
            align="center"
          />
          <text
            x={100}
            y={148}
            text={`Current: Skill ${state.weapon.skill}+, Dmg ${state.weapon.damage}`}
            size={9}
            align="center"
          />
        </box>
      ) : (
        <text
          x={100}
          y={142}
          text={chest.message}
          size={8}
          align="center"
        />
      )}

      <footer
        bootLabel="CYCLE"
        pwrLabel={selected < items.length ? "TAKE" : "LEAVE"}
      />
    </screen>
  );
}
