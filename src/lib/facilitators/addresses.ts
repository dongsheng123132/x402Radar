/**
 * Facilitator on-chain addresses per chain.
 * Used by chain-sync to filter x402 transfers (transaction_from = facilitator).
 * Replace placeholders with addresses from @x402scan/facilitators or facilitators.x402.watch.
 */
import { getUSDCAddress } from "@/lib/chains/config";

export interface FacilitatorAddressEntry {
  facilitatorId: string;
  chain: string;
  address: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

// Placeholder Base addresses for MVP. In production, load from x402scan facilitators package.
// Each facilitator may have multiple addresses on Base.
const BASE_PLACEHOLDER_ADDRESSES: Record<string, string[]> = {
  coinbase: ["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"],
  thirdweb: ["0x742d35Cc6634C0532925a3b844Bc454e4438f44f"],
  payai: ["0x101c35c2e8b2c10e2d8e8f3a4b5c6d7e8f9a0b1c"],
  questflow: ["0x202d36c3e9c3d3e4f4a5b6c7d8e9f0a1b2c3d4e"],
  virtuals: ["0x303e47d4f0d4e5f5b6c8d9e0f1a2b3c4d5e6f7a"],
  openx402: ["0x404f58e5f1e6f6c9d0e1f2a3b4c5d6e7f8a9b0c"],
  openfacilitator: ["0x505069f6f2f7f7d1e2f3a4b5c6d7e8f9a0b1c2d"],
};

export function getFacilitatorAddresses(chain: string): FacilitatorAddressEntry[] {
  const tokenAddress = getUSDCAddress(chain);
  if (!tokenAddress) return [];

  const list: FacilitatorAddressEntry[] = [];
  const addrs = BASE_PLACEHOLDER_ADDRESSES;
  for (const [facilitatorId, addresses] of Object.entries(addrs)) {
    for (const address of addresses) {
      list.push({
        facilitatorId,
        chain,
        address: address.toLowerCase(),
        tokenAddress: tokenAddress.toLowerCase(),
        tokenSymbol: "USDC",
        tokenDecimals: 6,
      });
    }
  }
  return list;
}

export function getAllFacilitatorAddressesByChain(): Map<string, FacilitatorAddressEntry[]> {
  const map = new Map<string, FacilitatorAddressEntry[]>();
  for (const chain of ["base"]) {
    map.set(chain, getFacilitatorAddresses(chain));
  }
  return map;
}
