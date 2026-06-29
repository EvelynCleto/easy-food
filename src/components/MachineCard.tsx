/* Backwards-compatible alias — points to new Aurora MachineTile */
import { MachineTile, type MachineTileData } from "./aurora/MachineTile";

export type MachineData = MachineTileData;

export function MachineCard({ m }: { m: MachineData }) {
  return <MachineTile m={m} />;
}
