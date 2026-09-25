/**
 * Real facilitator on-chain addresses (Base chain).
 * Source: https://github.com/Merit-Systems/x402scan/tree/main/packages/external/facilitators
 * Snapshot date: 2026-09-25.
 *
 * x402scan indexes `Transfer` events of USDC where `transaction_from` is one
 * of these addresses (i.e. the facilitator EOA that submits the tx). The
 * facilitator itself never appears as the token from/to — see
 * src/lib/indexer/blockscout-sync.ts.
 */
import { getUSDCAddress } from "@/lib/chains/config";

export interface FacilitatorAddressEntry {
  facilitatorId: string;
  chain: string;
  address: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  deprecated: boolean;
  firstSeenAt: Date;
}

interface RawAddressEntry {
  /** address */
  a: string;
  /** deprecated */
  dep: boolean;
  /** date of first transaction (ISO date) */
  d: string;
}

/**
 * Real Base addresses per facilitator, sourced from x402scan open-source repo.
 * `dep` marks addresses x402scan no longer considers active for that
 * facilitator; `d` is the date of the facilitator's first transaction from
 * that address.
 */
const BASE_ADDRESSES: Record<string, RawAddressEntry[]> = {
  402104: [{ a: "0x73b2b8df52fbe7c40fe78db52e3dffdd5db5ad07", dep: false, d: "2025-10-29" }],
  anyspend: [{ a: "0x179761d9eed0f0d1599330cc94b0926e68ae87f1", dep: false, d: "2025-11-03" }],
  aurracloud: [
    { a: "0x222c4367a2950f3b53af260e111fc3060b0983ff", dep: false, d: "2025-10-05" },
    { a: "0xb70c4fe126de09bd292fe3d1e40c6d264ca6a52a", dep: false, d: "2025-10-27" },
    { a: "0xd348e724e0ef36291a28dfeccf692399b0e179f8", dep: false, d: "2025-10-29" },
  ],
  bitrefill: [{ a: "0x15e2e2da7539ef1f652aa3c1d6142a535aa3d7ea", dep: false, d: "2026-02-14" }],
  cascade: [{ a: "0x2bb201f1bb056eb738718bd7a3ad1bef24b883bb", dep: false, d: "2026-03-05" }],
  codenut: [
    { a: "0x8d8fa42584a727488eeb0e29405ad794a105bb9b", dep: false, d: "2025-10-13" },
    { a: "0x87af99356d774312b73018b3b6562e1ae0e018c9", dep: false, d: "2025-10-31" },
    { a: "0x65058cf664d0d07f68b663b0d4b4f12a5e331a38", dep: false, d: "2025-10-31" },
    { a: "0x88e13d4c764a6c840ce722a0a3765f55a85b327e", dep: false, d: "2025-10-31" },
  ],
  coinbase: [
    { a: "0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6", dep: true, d: "2025-05-05" },
    { a: "0x9aae2b0d1b9dc55ac9bab9556f9a26cb64995fb9", dep: true, d: "2025-10-31" },
    { a: "0x3a70788150c7645a21b95b7062ab1784d3cc2104", dep: true, d: "2025-10-31" },
    { a: "0x708e57b6650a9a741ab39cae1969ea1d2d10eca1", dep: true, d: "2025-10-31" },
    { a: "0xce82eeec8e98e443ec34fda3c3e999cbe4cb6ac2", dep: true, d: "2025-10-31" },
    { a: "0x7f6d822467df2a85f792d4508c5722ade96be056", dep: true, d: "2025-10-31" },
    { a: "0x001ddabba5782ee48842318bd9ff4008647c8d9c", dep: true, d: "2025-10-31" },
    { a: "0x9c09faa49c4235a09677159ff14f17498ac48738", dep: true, d: "2025-10-31" },
    { a: "0xcbb10c30a9a72fae9232f41cbbd566a097b4e03a", dep: true, d: "2025-10-31" },
    { a: "0x9fb2714af0a84816f5c6322884f2907e33946b88", dep: true, d: "2025-10-31" },
    { a: "0x47d8b3c9717e976f31025089384f23900750a5f4", dep: true, d: "2025-11-11" },
    { a: "0x94701e1df9ae06642bf6027589b8e05dc7004813", dep: true, d: "2025-11-11" },
    { a: "0x552300992857834c0ad41c8e1a6934a5e4a2e4ca", dep: true, d: "2025-11-11" },
    { a: "0xd7469bf02d221968ab9f0c8b9351f55f8668ac4f", dep: true, d: "2025-11-11" },
    { a: "0x88800e08e20b45c9b1f0480cf759b5bf2f05180c", dep: true, d: "2025-11-11" },
    { a: "0x6831508455a716f987782a1ab41e204856055cc2", dep: true, d: "2025-11-11" },
    { a: "0xdc8fbad54bf5151405de488f45acd555517e0958", dep: true, d: "2025-11-11" },
    { a: "0x91d313853ad458addda56b35a7686e2f38ff3952", dep: true, d: "2025-11-11" },
    { a: "0xadd5585c776b9b0ea77e9309c1299a40442d820f", dep: true, d: "2025-11-11" },
    { a: "0x4ffeffa616a1460570d1eb0390e264d45a199e91", dep: true, d: "2025-11-11" },
    { a: "0x8f5cb67b49555e614892b7233cfddebfb746e531", dep: false, d: "2025-12-16" },
    { a: "0x67b9ce703d9ce658d7c4ac3c289cea112fe662af", dep: false, d: "2025-12-16" },
    { a: "0x68a96f41ff1e9f2e7b591a931a4ad224e7c07863", dep: false, d: "2025-12-16" },
    { a: "0x97acce27d5069544480bde0f04d9f47d7422a016", dep: false, d: "2025-12-16" },
    { a: "0xa32ccda98ba7529705a059bd2d213da8de10d101", dep: false, d: "2025-12-16" },
    { a: "0x2a89407a98a0732b7fd578c4e156b7166540eb5a", dep: false, d: "2026-06-15" },
    { a: "0xe72f0af4cf41356d433723547f1412ca27fbb1b8", dep: false, d: "2026-06-12" },
    { a: "0xca5e87f82b3fa093800e6ad67d621a427d79c70d", dep: false, d: "2026-06-12" },
    { a: "0x4c934c63c786157fefd990945b25ea60a0fb0205", dep: false, d: "2026-06-12" },
    { a: "0x64cc42b1ce598e3abcfbb64df4688521ddbf1f0a", dep: false, d: "2026-06-12" },
    { a: "0xe74817f4cdc15844314812b2271276e64e890fae", dep: false, d: "2026-06-12" },
    { a: "0x625d8a65134079f8faaac39a7947c73d93c6ac39", dep: false, d: "2026-06-12" },
    { a: "0x14fda13953fc30428938e6bf950d036e77214e52", dep: false, d: "2026-06-12" },
    { a: "0x68efafe862d89ce66dd3d7b07d5a3747a0871164", dep: false, d: "2026-06-12" },
    { a: "0x59b7ebc67a3d627fabaf06768c818638452ae704", dep: false, d: "2026-06-12" },
    { a: "0x42dd53906b49c202e8e934b059dc019e04634b00", dep: false, d: "2026-06-12" },
    { a: "0xb87e1a2cc2b4643f2892768e80e41167f17c5860", dep: false, d: "2026-06-12" },
    { a: "0x8cda367232d78c067116e3260da881d2da8ffa39", dep: false, d: "2026-06-12" },
    { a: "0x93f6601151ccb08f333ab4b1cccfb1e188c0be44", dep: false, d: "2026-06-12" },
    { a: "0x772003a2e9c2ccc8af956870a37a66f64f8cec38", dep: false, d: "2026-06-12" },
  ],
  corbits: [{ a: "0x06f0bfd2c8f36674df5cde852c1eed8025c268c9", dep: false, d: "2025-09-22" }],
  daydreams: [
    { a: "0x279e08f711182c79ba6d09669127a426228a4653", dep: false, d: "2025-10-16" },
    { a: "0x1363c7ff51ccce10258a7f7bddd63baab6aaf678", dep: false, d: "2026-01-16" },
  ],
  dexter: [
    { a: "0x402feee072d655b85e08f1751af9ddbcd249521f", dep: false, d: "2026-04-10" },
    { a: "0x40272e2eac848ea70db07fd657d799bd309329c4", dep: true, d: "2025-12-25" },
  ],
  fluxa: [
    { a: "0x7f72a02c682e908d46a5677fe937cdb612d94a3b", dep: false, d: "2025-10-28" },
    { a: "0xc67b555b4a9d340ed7c5d87743163c31a75f2254", dep: false, d: "2025-10-28" },
    { a: "0xaa0df01e4d11decf2ad2c459c81d3a495e4f1925", dep: false, d: "2025-10-28" },
    { a: "0xb5d25e1fa0718bf3e1bf698f96791d4e93632ec8", dep: false, d: "2025-10-28" },
    { a: "0x24d4f332d8e886fc005bb4a103bad21d9ebc2b7f", dep: false, d: "2025-10-28" },
    { a: "0xd2f74a14522d40e4a1d7fbb62aa97ce99fa1a7e5", dep: false, d: "2025-10-28" },
  ],
  heurist: [
    { a: "0xb578b7db22581507d62bdbeb85e06acd1be09e11", dep: false, d: "2025-11-07" },
    { a: "0x021cc47adeca6673def958e324ca38023b80a5be", dep: false, d: "2025-11-07" },
    { a: "0x3f61093f61817b29d9556d3b092e67746af8cdfd", dep: false, d: "2025-11-07" },
    { a: "0x290d8b8edcafb25042725cb9e78bcac36b8865f8", dep: false, d: "2025-11-07" },
    { a: "0x612d72dc8402bba997c61aa82ce718ea23b2df5d", dep: false, d: "2025-11-07" },
    { a: "0x1fc230ee3c13d0d520d49360a967dbd1555c8326", dep: false, d: "2025-11-10" },
    { a: "0x48ab4b0af4ddc2f666a3fcc43666c793889787a3", dep: false, d: "2025-11-10" },
    { a: "0xd97c12726dcf994797c981d31cfb243d231189fb", dep: false, d: "2025-11-10" },
    { a: "0x90d5e567017f6c696f1916f4365dd79985fce50f", dep: true, d: "2025-11-10" },
  ],
  meridian: [
    { a: "0x8e7769d440b3460b92159dd9c6d17302b036e2d6", dep: true, d: "2025-11-26" },
    { a: "0x3210d7b21bfe1083c9dddbe17e8f947c9029a584", dep: false, d: "2025-11-26" },
  ],
  mogami: [{ a: "0xfe0920a0a7f0f8a1ec689146c30c3bbef439bf8a", dep: false, d: "2025-10-24" }],
  obol: [{ a: "0xd744494e28b01073514ebc89987b305001ed257a", dep: false, d: "2026-06-07" }],
  openfacilitator: [{ a: "0x7c766f5fd9ab3dc09acad5ecfacc99c4781efe29", dep: false, d: "2026-01-05" }],
  openmid: [{ a: "0x16e47d275198ed65916a560bab4af6330c36ae09", dep: false, d: "2025-12-14" }],
  openx402: [
    { a: "0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8", dep: false, d: "2025-10-16" },
    { a: "0x97db9b5291a218fc77198c285cefdc943ef74917", dep: true, d: "2025-10-16" },
  ],
  payai: [
    { a: "0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63", dep: false, d: "2025-05-18" },
    { a: "0xb2bd29925cbbcea7628279c91945ca5b98bf371b", dep: false, d: "2025-10-29" },
    { a: "0x25659315106580ce2a787ceec5efb2d347b539c9", dep: true, d: "2025-10-29" },
    { a: "0xb8f41cb13b1f213da1e94e1b742ec1323235c48f", dep: false, d: "2025-10-29" },
    { a: "0xe575fa51af90957d66fab6d63355f1ed021b887b", dep: true, d: "2025-10-29" },
    { a: "0x03a3f7ce8e21e6f8d9fa14c67d8876b2470dc2f1", dep: true, d: "2025-12-08" },
    { a: "0x675707bc7d03089f820c1b7d49f7480083e8f4df", dep: true, d: "2025-12-08" },
    { a: "0xf46833d4ac4f0f1405cc05c30edfd86770f721c9", dep: true, d: "2025-12-08" },
    { a: "0x2daaef6f941de214bf7d6daf322bc6bc7406accb", dep: true, d: "2025-12-08" },
    { a: "0x2fae4026a31f19183947f0a6045ef975ebfa9ca8", dep: true, d: "2025-12-08" },
    { a: "0xe299c486066739c4a31609e1268d93229632dd47", dep: true, d: "2025-12-08" },
    { a: "0x6ccf245c883f9f3c6caee0687aa61daf7bc96e32", dep: true, d: "2025-12-08" },
    { a: "0xaf990eef9846b63d896056050fdc0b28bca9c24b", dep: true, d: "2025-12-08" },
    { a: "0x489c40fc3c2a19ad8cb275b7dd6aa194e9219c4f", dep: true, d: "2025-12-08" },
    { a: "0x9df61a719ddae27c20a63a417271cc2c704654bd", dep: true, d: "2025-12-08" },
  ],
  polymer: [{ a: "0x66c40946b0dffd04be467e18309857307ecd37cb", dep: false, d: "2025-10-27" }],
  primer: [{ a: "0x37dfb4033d5dd98fd335f24d0d42e8fe68d587d6", dep: false, d: "2025-12-14" }],
  questflow: [
    { a: "0x724efafb051f17ae824afcdf3c0368ae312da264", dep: false, d: "2025-10-29" },
    { a: "0xa9a54ef09fc8b86bc747cec6ef8d6e81c38c6180", dep: false, d: "2025-10-29" },
    { a: "0x4638bc811c93bf5e60deed32325e93505f681576", dep: false, d: "2025-10-29" },
    { a: "0xd7d91a42dfadd906c5b9ccde7226d28251e4cd0f", dep: false, d: "2025-10-29" },
    { a: "0x4544b535938b67d2a410a98a7e3b0f8f68921ca7", dep: false, d: "2025-10-29" },
    { a: "0x59e8014a3b884392fbb679fe461da07b18c1ff81", dep: false, d: "2025-10-29" },
    { a: "0xe6123e6b389751c5f7e9349f3d626b105c1fe618", dep: false, d: "2025-10-29" },
    { a: "0xf70e7cb30b132fab2a0a5e80d41861aa133ea21b", dep: false, d: "2025-10-29" },
    { a: "0x90da501fdbec74bb0549100967eb221fed79c99b", dep: false, d: "2025-10-29" },
    { a: "0xce7819f0b0b871733c933d1f486533bab95ec47b", dep: false, d: "2025-10-29" },
  ],
  relai: [{ a: "0x1892f72fdb3a966b2ad8595aa5f7741ef72d6085", dep: false, d: "2026-01-23" }],
  thirdweb: [
    { a: "0x80c08de1a05df2bd633cf520754e40fde3c794d3", dep: false, d: "2025-10-07" },
    { a: "0xaaca1ba9d2627cbc0739ba69890c30f95de046e4", dep: true, d: "2025-11-20" },
    { a: "0xa1822b21202a24669eaf9277723d180cd6dae874", dep: true, d: "2025-11-20" },
    { a: "0xec10243b54df1a71254f58873b389b7ecece89c2", dep: true, d: "2025-11-20" },
    { a: "0x052aaae3cad5c095850246f8ffb228354c56752a", dep: true, d: "2025-11-20" },
    { a: "0x91ddea05f741b34b63a7548338c90fc152c8631f", dep: true, d: "2025-11-20" },
    { a: "0xea52f2c6f6287f554f9b54c5417e1e431fe5710e", dep: true, d: "2025-11-20" },
    { a: "0x3a5ca1c6aa6576ae9c1c0e7fa2b4883346bc5aa0", dep: true, d: "2025-11-20" },
    { a: "0x7e20b62bf36554b704774afb0fcc0ae8f899213b", dep: true, d: "2025-11-20" },
    { a: "0xd88a9a58806b895ff06744082c6a20b9d7184b0f", dep: true, d: "2025-11-20" },
  ],
  treasure: [{ a: "0xe07e9cbf9a55d02e3ac356ed4706353d98c5a618", dep: false, d: "2025-11-06" }],
  ultravioletadao: [{ a: "0x103040545ac5031a11e8c03dd11324c7333a13c7", dep: false, d: "2025-10-30" }],
  virtuals: [{ a: "0x80735b3f7808e2e229ace880dbe85e80115631ca", dep: false, d: "2025-11-05" }],
  x402jobs: [{ a: "0x51fec16843e49b99aaf9814e525aee1756e66a62", dep: false, d: "2025-12-11" }],
  x402rs: [
    { a: "0xd8dfc729cbd05381647eb5540d756f4f8ad63eec", dep: true, d: "2024-12-05" },
    { a: "0x76eee8f0acabd6b49f1cc4e9656a0c8892f3332e", dep: true, d: "2025-10-26" },
    { a: "0x97d38aa5de015245dcca76305b53abe6da25f6a5", dep: false, d: "2025-10-24" },
    { a: "0x0168f80e035ea68b191faf9bfc12778c87d92008", dep: false, d: "2025-10-24" },
    { a: "0x5e437bee4321db862ac57085ea5eb97199c0ccc5", dep: false, d: "2025-10-24" },
    { a: "0xc19829b32324f116ee7f80d193f99e445968499a", dep: false, d: "2025-10-26" },
  ],
  xecho: [{ a: "0x3be45f576696a2fd5a93c1330cd19f1607ab311d", dep: false, d: "2025-10-30" }],
};

export function getFacilitatorAddresses(chain: string): FacilitatorAddressEntry[] {
  const tokenAddress = getUSDCAddress(chain);
  if (!tokenAddress) return [];

  const list: FacilitatorAddressEntry[] = [];
  for (const [facilitatorId, addresses] of Object.entries(BASE_ADDRESSES)) {
    for (const entry of addresses) {
      list.push({
        facilitatorId,
        chain,
        address: entry.a.toLowerCase(),
        tokenAddress: tokenAddress.toLowerCase(),
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        deprecated: entry.dep,
        firstSeenAt: new Date(entry.d),
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
