/**
 * Chain config: RPC, Chain ID, USDC contract addresses.
 * See CURSOR.md "关键合约地址".
 */
export const CHAINS = {
  base: {
    chainId: 8453,
    name: "Base Mainnet",
    slug: "base",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
    rpcEnvKey: "BASE_RPC_URL",
  },
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    slug: "base_sepolia",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const,
    rpcEnvKey: "BASE_RPC_URL",
  },
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    slug: "ethereum",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
    rpcEnvKey: "ETHEREUM_RPC_URL",
  },
  polygon: {
    chainId: 137,
    name: "Polygon",
    slug: "polygon",
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as const,
    rpcEnvKey: "POLYGON_RPC_URL",
  },
} as const;

export type ChainSlug = keyof typeof CHAINS;

export function getUSDCAddress(chain: string): string {
  const c = CHAINS[chain as ChainSlug];
  return c?.usdc ?? "";
}

export function getChainsForSync(): ChainSlug[] {
  return ["base"];
}
