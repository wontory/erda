import type {
  CharacterItemEquipmentItemEquipmentItem,
  CharacterItemEquipmentTitle,
  CharacterSymbolEquipmentSymbolItem,
} from "@erda/api/generated/model";
import { z } from "zod";

export type InspectorPayload =
  | { kind: "item"; item: CharacterItemEquipmentItemEquipmentItem }
  | {
      kind: "symbol";
      symbol: CharacterSymbolEquipmentSymbolItem;
      level: number;
      growth: number;
      require: number;
      days: number | null;
      maxed: boolean;
    }
  | { kind: "title"; title: CharacterItemEquipmentTitle };

const PAYLOAD_KINDS = ["item", "symbol", "title"];

export const inspectorPayloadSchema = z.custom<InspectorPayload>(
  (v) => typeof v === "object" && v !== null && PAYLOAD_KINDS.includes((v as { kind?: unknown }).kind as string),
);

export function payloadKey(p: InspectorPayload): string {
  switch (p.kind) {
    case "item":
      return `item|${p.item.item_equipment_slot ?? p.item.item_equipment_part}|${p.item.item_name}`;
    case "symbol":
      return `symbol|${p.symbol.symbol_name}`;
    case "title":
      return `title|${p.title.title_name}`;
  }
}
