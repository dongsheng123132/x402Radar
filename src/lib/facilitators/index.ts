/**
 * Facilitator registry (id, name, metadata).
 * See CURSOR.md "已知 Facilitator 列表".
 */
export interface FacilitatorMeta {
  id: string;
  name: string;
  imageUrl?: string;
  docsUrl?: string;
  color?: string;
}

export const FACILITATORS: FacilitatorMeta[] = [
  { id: "coinbase", name: "Coinbase" },
  { id: "thirdweb", name: "ThirdWeb" },
  { id: "aurracloud", name: "Aurra Cloud" },
  { id: "mogami", name: "Mogami" },
  { id: "heurist", name: "Heurist" },
  { id: "virtuals", name: "Virtuals" },
  { id: "payai", name: "PayAI" },
  { id: "openx402", name: "OpenX402" },
  { id: "x402rs", name: "x402-rs" },
  { id: "corbits", name: "Corbits" },
  { id: "dexter", name: "Dexter" },
  { id: "daydreams", name: "Daydreams" },
  { id: "402104", name: "402104" },
  { id: "questflow", name: "Questflow" },
  { id: "xecho", name: "Xecho" },
  { id: "codenut", name: "Codenut" },
  { id: "ultravioletadao", name: "UltravioletDAO" },
  { id: "treasure", name: "Treasure" },
  { id: "anyspend", name: "AnySpend" },
  { id: "polymer", name: "Polymer" },
  { id: "meridian", name: "Meridian" },
  { id: "openmid", name: "OpenMid" },
  { id: "primer", name: "Primer" },
  { id: "x402jobs", name: "x402Jobs" },
  { id: "openfacilitator", name: "OpenFacilitator" },
  { id: "relai", name: "Relai" },
];

export function getFacilitatorById(id: string): FacilitatorMeta | undefined {
  return FACILITATORS.find((f) => f.id === id);
}
