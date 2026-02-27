# x402 Monitor - 链上 x402 支付监控平台

## 项目定位

构建一个 x402 支付生态的链上监控 + 分析平台，对标 x402scan.com，但在 **Agent 行为分析** 和 **链上实时数据** 维度做出差异化。

### 与 x402scan 的差异化策略

| 维度 | x402scan | 本项目 |
|------|----------|--------|
| 数据来源 | 仅通过 facilitator API 发现资源 + CDP API 查 Transfer 事件 | **同样的链上数据 + 更深的 Agent 分析** |
| 核心卖点 | 服务目录 + 交易量 | **Agent 排行 + 信用评分 + 资金流图谱** |
| 实时性 | 每 5 分钟同步 | **每 1 分钟同步 + WebSocket 推送** |
| AI 集成 | 有 Composer 聊天 | **Agent 监控告警** |

---

## 技术栈

| 层面 | 技术 | 理由 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | SSR + API Routes 一体 |
| 语言 | TypeScript | 全栈统一 |
| 样式 | Tailwind CSS + shadcn/ui | 快速出活 |
| 数据库 | Supabase (PostgreSQL) | 免费 tier 够用，有 realtime |
| ORM | Prisma | 类型安全 |
| 链上交互 | viem | 轻量、类型好 |
| 图表 | Recharts 或 Tremor | React 生态 |
| 部署 | Vercel (前端) + Railway/Render (Indexer) | GitHub 集成 |
| 定时任务 | node-cron 或 Vercel Cron | 简单够用 |
| 包管理 | pnpm | 快 |

---

## 核心架构

```
用户浏览器
    │
    ▼
┌─────────────────────────────────────┐
│  Next.js App (Vercel)               │
│  ├── pages/ (Dashboard UI)          │
│  ├── app/api/ (REST API)            │
│  └── app/api/cron/ (定时同步)        │
└──────────────┬──────────────────────┘
               │ Prisma
               ▼
┌─────────────────────────────────────┐
│  Supabase PostgreSQL                │
│  ├── transfer_events (链上转账)      │
│  ├── agents (买方地址)               │
│  ├── sellers (卖方/服务商)           │
│  ├── facilitators (facilitator)     │
│  ├── resources (x402 服务目录)       │
│  └── daily_stats (聚合统计)          │
└──────────────▲──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│  Indexer Worker (Railway/Render)    │
│  ├── chain-sync (链上事件同步)       │
│  ├── discovery-sync (服务发现同步)   │
│  └── stats-aggregator (统计聚合)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  数据源                              │
│  ├── Coinbase CDP API (Base 链)     │
│  ├── Alchemy RPC (备用/实时)         │
│  └── Facilitator Discovery APIs     │
└─────────────────────────────────────┘
```

---

## x402 协议核心知识（开发必读）

### x402 是什么

x402 是一个基于 HTTP 402 状态码的支付协议。当 client 请求一个付费 API 时：

1. Server 返回 `402 Payment Required` + `PAYMENT-REQUIRED` header（含支付要求）
2. Client 用 ERC-3009 签名一笔 USDC 转账授权
3. Client 重新请求，带上 `PAYMENT-SIGNATURE` header
4. Server 把签名发给 facilitator 的 `/settle` 端点
5. Facilitator 在链上调用 `USDC.transferWithAuthorization()` 完成转账
6. Server 返回 200 + 内容 + `PAYMENT-RESPONSE` header（含 tx hash）

### 链上识别 x402 支付的关键

**x402 支付在链上就是普通的 USDC 转账**，没有专属合约或事件标记。

识别方法：**通过已知 facilitator 地址过滤**。
- Facilitator 是 `transferWithAuthorization` 的 `msg.sender`（它代付 gas）
- 所以：`transaction_from = facilitator_address` + `token = USDC` = x402 支付

### 关键合约地址

| 链 | USDC 合约 | Chain ID |
|----|-----------|----------|
| Base Mainnet | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 8453 |
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 84532 |
| Ethereum | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 1 |
| Polygon | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | 137 |

Permit2 代理合约（Base）：
- `x402ExactPermit2Proxy`: `0x4020615294c913F045dc10f0a5cdEbd86c280001`
- `x402UptoPermit2Proxy`: `0x4020633461b2895a48930Ff97eE8fCdE8E520002`

### ERC-3009 事件签名（链上监听用）

```solidity
// 核心事件 - USDC 转账时触发
event Transfer(address indexed from, address indexed to, uint256 value);
// topic0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef

// ERC-3009 专属事件 - transferWithAuthorization 成功时触发
event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
// topic0: 0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5

// transferWithAuthorization 函数选择器
// selector: 0xe3ee160e
```

### Facilitator 端点

| 环境 | URL |
|------|-----|
| Mainnet (CDP) | `https://api.cdp.coinbase.com/platform/v2/x402` |
| Testnet | `https://www.x402.org/facilitator` |

服务发现 API：
```
GET https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=100&offset=0
```

### 已知 Facilitator 列表（26 个）

这是 x402 生态中所有已知的 facilitator，每个都有链上地址用于过滤交易：

| ID | 名称 | 链 |
|----|------|-----|
| coinbase | Coinbase | Base, Solana |
| thirdweb | ThirdWeb | Base |
| aurracloud | Aurra Cloud | Base |
| mogami | Mogami | Base |
| heurist | Heurist | Base |
| virtuals | Virtuals | Base |
| payai | PayAI | Base |
| openx402 | OpenX402 | Base |
| x402rs | x402-rs | Base |
| corbits | Corbits | Base |
| dexter | Dexter | Base |
| daydreams | Daydreams | Base |
| 402104 | 402104 | Base |
| questflow | Questflow | Base |
| xecho | Xecho | Base |
| codenut | Codenut | Base |
| ultravioletadao | UltravioletDAO | Base |
| treasure | Treasure | Base |
| anyspend | AnySpend | Base |
| polymer | Polymer | Base |
| meridian | Meridian | Base |
| openmid | OpenMid | Base |
| primer | Primer | Base |
| x402jobs | x402Jobs | Base |
| openfacilitator | OpenFacilitator | Base |
| relai | Relai | Base |

> **重要**：每个 facilitator 在链上有多个地址。Coinbase 有 25 个 Base 地址 + 6 个 Solana 地址。
> 这些地址需要从 x402scan 的开源 facilitator 包获取，或自行维护。
> npm 包：`facilitators`（来自 @x402scan）

---

## 项目结构

```
x402-monitor/
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                    # 环境变量
├── prisma/
│   └── schema.prisma             # 数据库 schema
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 首页 Dashboard
│   │   ├── agents/
│   │   │   ├── page.tsx          # Agent 排行榜
│   │   │   └── [address]/
│   │   │       └── page.tsx      # Agent 详情页
│   │   ├── sellers/
│   │   │   ├── page.tsx          # Seller 排行榜
│   │   │   └── [address]/
│   │   │       └── page.tsx      # Seller 详情页
│   │   ├── facilitators/
│   │   │   ├── page.tsx          # Facilitator 排行榜
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Facilitator 详情页
│   │   ├── transactions/
│   │   │   └── page.tsx          # 交易列表
│   │   ├── resources/
│   │   │   └── page.tsx          # 服务目录
│   │   └── api/
│   │       ├── stats/
│   │       │   └── route.ts      # 全局统计 API
│   │       ├── agents/
│   │       │   └── route.ts      # Agent 数据 API
│   │       ├── sellers/
│   │       │   └── route.ts      # Seller 数据 API
│   │       ├── facilitators/
│   │       │   └── route.ts      # Facilitator 数据 API
│   │       ├── transactions/
│   │       │   └── route.ts      # 交易数据 API
│   │       ├── resources/
│   │       │   └── route.ts      # 服务目录 API
│   │       └── cron/
│   │           ├── sync-transfers/
│   │           │   └── route.ts  # 链上转账同步（每分钟）
│   │           ├── sync-resources/
│   │           │   └── route.ts  # 服务发现同步（每小时）
│   │           └── aggregate-stats/
│   │               └── route.ts  # 统计聚合（每 10 分钟）
│   ├── lib/
│   │   ├── db.ts                 # Prisma client
│   │   ├── indexer/
│   │   │   ├── chain-sync.ts     # 链上事件同步逻辑
│   │   │   ├── discovery-sync.ts # 服务发现同步逻辑
│   │   │   └── stats-aggregator.ts # 统计聚合逻辑
│   │   ├── facilitators/
│   │   │   ├── index.ts          # facilitator 注册表
│   │   │   └── addresses.ts      # 所有 facilitator 链上地址
│   │   ├── chains/
│   │   │   └── config.ts         # 链配置（RPC、合约地址）
│   │   └── utils/
│   │       └── format.ts         # 格式化工具
│   └── components/
│       ├── ui/                   # shadcn/ui 组件
│       ├── layout/
│       │   ├── navbar.tsx
│       │   ├── sidebar.tsx
│       │   └── footer.tsx
│       ├── dashboard/
│       │   ├── stats-cards.tsx       # 顶部统计卡片
│       │   ├── volume-chart.tsx      # 交易量趋势图
│       │   ├── top-agents.tsx        # 热门 Agent 榜
│       │   ├── top-sellers.tsx       # 热门 Seller 榜
│       │   └── recent-transactions.tsx # 最新交易
│       ├── agents/
│       │   ├── agent-table.tsx       # Agent 排行表格
│       │   ├── agent-profile.tsx     # Agent 详情卡片
│       │   └── agent-flow-graph.tsx  # Agent 资金流向图
│       ├── transactions/
│       │   └── transaction-table.tsx  # 交易列表
│       └── charts/
│           ├── line-chart.tsx
│           ├── bar-chart.tsx
│           └── pie-chart.tsx
└── worker/                       # 独立 indexer 进程（如果不用 Vercel Cron）
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts              # 主进程入口
```

---

## 数据库 Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 链上转账事件（核心数据表）
// ============================================
model TransferEvent {
  id              String   @id @default(uuid())
  txHash          String   @map("tx_hash")
  logIndex        Int?     @map("log_index")
  chain           String                          // "base", "polygon", "solana"
  tokenAddress    String   @map("token_address")  // USDC 合约地址
  sender          String                          // 付款方（agent/用户）
  recipient       String                          // 收款方（seller）
  amount          Float                           // 金额（已转换为人类可读，如 0.01）
  amountRaw       String   @map("amount_raw")     // 原始金额（wei/base units）
  decimals        Int      @default(6)
  facilitatorId   String   @map("facilitator_id") // 关联的 facilitator
  txFrom          String   @map("tx_from")        // 交易发起者（facilitator 地址）
  blockNumber     BigInt?  @map("block_number")
  blockTimestamp  DateTime @map("block_timestamp")
  createdAt       DateTime @default(now()) @map("created_at")

  facilitator Facilitator @relation(fields: [facilitatorId], references: [id])

  @@unique([txHash, logIndex, chain])
  @@index([sender])
  @@index([recipient])
  @@index([facilitatorId])
  @@index([blockTimestamp])
  @@index([chain])
  @@map("transfer_events")
}

// ============================================
// Facilitator（支付中介）
// ============================================
model Facilitator {
  id          String   @id                        // "coinbase", "thirdweb" 等
  name        String
  imageUrl    String?  @map("image_url")
  docsUrl     String?  @map("docs_url")
  color       String?                             // 品牌色
  createdAt   DateTime @default(now()) @map("created_at")

  addresses   FacilitatorAddress[]
  transfers   TransferEvent[]
  stats       FacilitatorStats[]

  @@map("facilitators")
}

// ============================================
// Facilitator 链上地址
// ============================================
model FacilitatorAddress {
  id              String   @id @default(uuid())
  facilitatorId   String   @map("facilitator_id")
  chain           String                          // "base", "polygon", "solana"
  address         String                          // 链上地址
  tokenAddress    String   @map("token_address")  // 处理的 token 合约
  tokenSymbol     String   @map("token_symbol")   // "USDC"
  tokenDecimals   Int      @map("token_decimals") // 6
  firstSeenAt     DateTime @map("first_seen_at")  // 第一笔交易时间
  lastSyncedAt    DateTime? @map("last_synced_at") // 上次同步时间

  facilitator Facilitator @relation(fields: [facilitatorId], references: [id])

  @@unique([chain, address, tokenAddress])
  @@index([chain])
  @@index([address])
  @@map("facilitator_addresses")
}

// ============================================
// Agent（付款方，即调用 x402 API 的 agent 或用户）
// ============================================
model Agent {
  id              String   @id @default(uuid())
  address         String   @unique               // 钱包地址
  label           String?                         // 可选的已知名称
  firstSeenAt     DateTime @map("first_seen_at")
  lastSeenAt      DateTime @map("last_seen_at")
  totalSpent      Float    @default(0) @map("total_spent")     // 累计花费 (USD)
  totalTxCount    Int      @default(0) @map("total_tx_count")  // 累计交易数
  score           Float?                          // 信用评分（v2）
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([totalSpent])
  @@index([totalTxCount])
  @@index([lastSeenAt])
  @@map("agents")
}

// ============================================
// Seller（收款方，即提供 x402 服务的 API）
// ============================================
model Seller {
  id              String   @id @default(uuid())
  address         String   @unique               // 收款钱包地址
  label           String?                         // 可选的已知名称
  origin          String?                         // 关联的域名（如 api.example.com）
  firstSeenAt     DateTime @map("first_seen_at")
  lastSeenAt      DateTime @map("last_seen_at")
  totalReceived   Float    @default(0) @map("total_received")    // 累计收入 (USD)
  totalTxCount    Int      @default(0) @map("total_tx_count")    // 累计交易数
  uniqueAgents    Int      @default(0) @map("unique_agents")     // 独立 agent 数
  createdAt       DateTime @default(now()) @map("created_at")

  resources Resource[]

  @@index([totalReceived])
  @@index([totalTxCount])
  @@index([origin])
  @@map("sellers")
}

// ============================================
// Resource（x402 服务/API 端点）
// ============================================
model Resource {
  id              String   @id @default(uuid())
  url             String   @unique               // 完整 API URL
  origin          String                          // 域名
  path            String                          // 路径
  description     String?
  scheme          String   @default("exact")      // "exact" 或 "upto"
  network         String                          // "eip155:8453" 等 CAIP-2
  maxAmount       String   @map("max_amount")     // 最大收费金额（base units）
  payTo           String   @map("pay_to")         // 收款地址
  asset           String                          // token 合约地址
  sellerId        String?  @map("seller_id")
  lastSyncedAt    DateTime? @map("last_synced_at")
  createdAt       DateTime @default(now()) @map("created_at")

  seller Seller? @relation(fields: [sellerId], references: [id])

  @@index([origin])
  @@index([payTo])
  @@map("resources")
}

// ============================================
// Facilitator 统计（预聚合，定时计算）
// ============================================
model FacilitatorStats {
  id              String   @id @default(uuid())
  facilitatorId   String   @map("facilitator_id")
  chain           String
  period          String                          // "1d", "7d", "30d", "all"
  totalVolume     Float    @map("total_volume")
  totalTxCount    Int      @map("total_tx_count")
  uniqueBuyers    Int      @map("unique_buyers")
  uniqueSellers   Int      @map("unique_sellers")
  calculatedAt    DateTime @map("calculated_at")

  facilitator Facilitator @relation(fields: [facilitatorId], references: [id])

  @@unique([facilitatorId, chain, period])
  @@map("facilitator_stats")
}

// ============================================
// 每日全局统计
// ============================================
model DailyStats {
  id              String   @id @default(uuid())
  date            DateTime @unique @db.Date
  chain           String
  totalVolume     Float    @map("total_volume")
  totalTxCount    Int      @map("total_tx_count")
  uniqueBuyers    Int      @map("unique_buyers")
  uniqueSellers   Int      @map("unique_sellers")
  newAgents       Int      @map("new_agents")
  newSellers      Int      @map("new_sellers")
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([date, chain])
  @@index([date])
  @@map("daily_stats")
}

// ============================================
// 同步游标（记录每个数据源的同步进度）
// ============================================
model SyncCursor {
  id              String   @id @default(uuid())
  source          String                          // "cdp:base:coinbase", "cdp:base:thirdweb" 等
  chain           String
  lastSyncedAt    DateTime @map("last_synced_at") // 上次同步到的链上时间
  lastBlockNumber BigInt?  @map("last_block_number")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([source, chain])
  @@map("sync_cursors")
}
```

---

## Indexer 实现

### 方案 A：Vercel Cron（推荐 MVP）

用 Vercel 的 cron jobs 调 API Route 触发同步。

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-transfers",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/sync-resources",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/aggregate-stats",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

> **注意**：Vercel Hobby 计划的 cron 最小间隔是每天一次。需要 Pro ($20/月) 才能用分钟级 cron。
> 替代方案：用 Railway 跑一个 node-cron worker，约 $5/月。

### 方案 B：独立 Worker（推荐生产）

在 Railway/Render 上跑一个 Node.js 进程，用 node-cron 每分钟触发同步。

### 链上数据获取 - CDP API（主要）

x402scan 使用 Coinbase CDP API 查询链上 Transfer 事件，这是最可靠的方式：

```typescript
// src/lib/indexer/chain-sync.ts

import { prisma } from '../db';

const CDP_API_BASE = 'https://api.cdp.coinbase.com';

interface CDPTransferEvent {
  sender: string;
  recipient: string;
  amount: string;
  tx_hash: string;
  block_timestamp: string;
  transaction_from: string;
  log_index: number;
  block_number: string;
}

/**
 * 从 CDP API 获取指定 facilitator 地址的 USDC Transfer 事件
 *
 * CDP API 提供链上事件的 SQL 查询接口
 * 文档: https://docs.cdp.coinbase.com
 */
export async function syncTransfersFromCDP(
  facilitatorAddress: string,
  facilitatorId: string,
  chain: string,
  sinceTimestamp: Date
): Promise<number> {
  const usdcAddress = getUSDCAddress(chain);

  // CDP API SQL 查询 - 查 USDC Transfer 事件中 transaction_from 是 facilitator 的记录
  const query = `
    SELECT
      "from" as sender,
      "to" as recipient,
      value as amount,
      transaction_hash as tx_hash,
      block_timestamp,
      transaction_from,
      log_index,
      block_number
    FROM ${chain}.events
    WHERE
      event_signature = 'Transfer(address,address,uint256)'
      AND contract_address = '${usdcAddress}'
      AND transaction_from = '${facilitatorAddress}'
      AND block_timestamp > '${sinceTimestamp.toISOString()}'
    ORDER BY block_timestamp ASC
    LIMIT 1000
  `;

  const response = await fetch(`${CDP_API_BASE}/platform/v2/data/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CDP_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  const events: CDPTransferEvent[] = data.results || [];

  if (events.length === 0) return 0;

  // 批量写入数据库
  const transfers = events.map(e => ({
    txHash: e.tx_hash,
    logIndex: e.log_index,
    chain,
    tokenAddress: usdcAddress,
    sender: e.sender.toLowerCase(),
    recipient: e.recipient.toLowerCase(),
    amount: parseFloat(e.amount) / 1e6, // USDC 6 decimals
    amountRaw: e.amount,
    decimals: 6,
    facilitatorId,
    txFrom: e.transaction_from.toLowerCase(),
    blockNumber: BigInt(e.block_number),
    blockTimestamp: new Date(e.block_timestamp),
  }));

  // skipDuplicates 避免重复写入
  const result = await prisma.transferEvent.createMany({
    data: transfers,
    skipDuplicates: true,
  });

  // 更新同步游标
  const lastEvent = events[events.length - 1];
  await prisma.syncCursor.upsert({
    where: { source_chain: { source: `cdp:${chain}:${facilitatorId}`, chain } },
    update: { lastSyncedAt: new Date(lastEvent.block_timestamp) },
    create: {
      source: `cdp:${chain}:${facilitatorId}`,
      chain,
      lastSyncedAt: new Date(lastEvent.block_timestamp),
    },
  });

  return result.count;
}

function getUSDCAddress(chain: string): string {
  const addresses: Record<string, string> = {
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  };
  return addresses[chain] || '';
}
```

### 备用方案 - viem 直接监听 RPC

如果不想用 CDP API（需要 API key），可以直接用 viem 监听 RPC 事件：

```typescript
// src/lib/indexer/rpc-sync.ts

import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL), // Alchemy/QuickNode
});

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

/**
 * 获取指定区块范围内的 USDC Transfer 事件
 * 然后通过 facilitator 地址过滤
 */
export async function getTransferEvents(
  fromBlock: bigint,
  toBlock: bigint,
  facilitatorAddresses: string[]
) {
  const logs = await client.getLogs({
    address: USDC_BASE,
    event: parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ),
    fromBlock,
    toBlock,
  });

  // 获取每个 log 的交易详情，检查 tx.from 是否是 facilitator
  const facilitatorSet = new Set(
    facilitatorAddresses.map(a => a.toLowerCase())
  );

  const x402Transfers = [];
  for (const log of logs) {
    const tx = await client.getTransaction({ hash: log.transactionHash });
    if (facilitatorSet.has(tx.from.toLowerCase())) {
      x402Transfers.push({
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        sender: log.args.from,
        recipient: log.args.to,
        amount: log.args.value,
        blockNumber: log.blockNumber,
        txFrom: tx.from,
      });
    }
  }

  return x402Transfers;
}
```

> **注意**：RPC 方式需要为每个 Transfer log 额外查询 transaction 来获取 tx.from，
> 这会消耗大量 RPC 调用。CDP API 方式更高效，推荐用于生产环境。

### 服务发现同步

```typescript
// src/lib/indexer/discovery-sync.ts

/**
 * 从 facilitator 的 discovery API 拉取已注册的 x402 服务
 * CDP facilitator 的发现端点: GET /discovery/resources
 */
export async function syncResourcesFromFacilitator(
  facilitatorUrl: string,
  facilitatorId: string
) {
  let offset = 0;
  const limit = 100;
  let total = Infinity;

  while (offset < total) {
    const url = `${facilitatorUrl}/discovery/resources?limit=${limit}&offset=${offset}&type=http`;
    const response = await fetch(url);
    const data = await response.json();

    total = data.pagination?.total ?? data.items?.length ?? 0;

    for (const item of data.items || []) {
      const resourceUrl = item.resource;
      const origin = new URL(resourceUrl).origin;

      for (const accept of item.accepts || []) {
        await prisma.resource.upsert({
          where: { url: resourceUrl },
          update: {
            description: item.metadata?.description,
            scheme: accept.scheme,
            network: accept.network,
            maxAmount: accept.maxAmountRequired,
            payTo: accept.payTo,
            asset: accept.asset,
            lastSyncedAt: new Date(),
          },
          create: {
            url: resourceUrl,
            origin,
            path: new URL(resourceUrl).pathname,
            description: item.metadata?.description,
            scheme: accept.scheme,
            network: accept.network,
            maxAmount: accept.maxAmountRequired,
            payTo: accept.payTo,
            asset: accept.asset,
          },
        });
      }
    }

    offset += limit;
  }
}
```

### 统计聚合

```typescript
// src/lib/indexer/stats-aggregator.ts

/**
 * 定时计算各维度的聚合统计
 * 更新 agents, sellers, facilitator_stats, daily_stats
 */
export async function aggregateStats() {
  const now = new Date();

  // 1. 更新 Agent 统计
  await prisma.$executeRaw`
    INSERT INTO agents (id, address, first_seen_at, last_seen_at, total_spent, total_tx_count, created_at)
    SELECT
      gen_random_uuid(),
      sender,
      MIN(block_timestamp),
      MAX(block_timestamp),
      SUM(amount),
      COUNT(*),
      NOW()
    FROM transfer_events
    GROUP BY sender
    ON CONFLICT (address) DO UPDATE SET
      last_seen_at = EXCLUDED.last_seen_at,
      total_spent = EXCLUDED.total_spent,
      total_tx_count = EXCLUDED.total_tx_count
  `;

  // 2. 更新 Seller 统计
  await prisma.$executeRaw`
    INSERT INTO sellers (id, address, first_seen_at, last_seen_at, total_received, total_tx_count, unique_agents, created_at)
    SELECT
      gen_random_uuid(),
      recipient,
      MIN(block_timestamp),
      MAX(block_timestamp),
      SUM(amount),
      COUNT(*),
      COUNT(DISTINCT sender),
      NOW()
    FROM transfer_events
    GROUP BY recipient
    ON CONFLICT (address) DO UPDATE SET
      last_seen_at = EXCLUDED.last_seen_at,
      total_received = EXCLUDED.total_received,
      total_tx_count = EXCLUDED.total_tx_count,
      unique_agents = EXCLUDED.unique_agents
  `;

  // 3. 更新 Facilitator 统计（按时间段）
  for (const period of ['1d', '7d', '30d', 'all']) {
    const since = period === 'all'
      ? new Date(0)
      : new Date(now.getTime() - parsePeriod(period));

    await prisma.$executeRaw`
      INSERT INTO facilitator_stats (id, facilitator_id, chain, period, total_volume, total_tx_count, unique_buyers, unique_sellers, calculated_at)
      SELECT
        gen_random_uuid(),
        facilitator_id,
        chain,
        ${period},
        COALESCE(SUM(amount), 0),
        COUNT(*),
        COUNT(DISTINCT sender),
        COUNT(DISTINCT recipient),
        NOW()
      FROM transfer_events
      WHERE block_timestamp >= ${since}
      GROUP BY facilitator_id, chain
      ON CONFLICT (facilitator_id, chain, period) DO UPDATE SET
        total_volume = EXCLUDED.total_volume,
        total_tx_count = EXCLUDED.total_tx_count,
        unique_buyers = EXCLUDED.unique_buyers,
        unique_sellers = EXCLUDED.unique_sellers,
        calculated_at = EXCLUDED.calculated_at
    `;
  }

  // 4. 更新每日统计
  await prisma.$executeRaw`
    INSERT INTO daily_stats (id, date, chain, total_volume, total_tx_count, unique_buyers, unique_sellers, new_agents, new_sellers, created_at)
    SELECT
      gen_random_uuid(),
      DATE(block_timestamp),
      chain,
      SUM(amount),
      COUNT(*),
      COUNT(DISTINCT sender),
      COUNT(DISTINCT recipient),
      0, 0,
      NOW()
    FROM transfer_events
    WHERE block_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(block_timestamp), chain
    ON CONFLICT (date, chain) DO UPDATE SET
      total_volume = EXCLUDED.total_volume,
      total_tx_count = EXCLUDED.total_tx_count,
      unique_buyers = EXCLUDED.unique_buyers,
      unique_sellers = EXCLUDED.unique_sellers
  `;
}

function parsePeriod(period: string): number {
  const map: Record<string, number> = {
    '1d': 86400000,
    '7d': 604800000,
    '30d': 2592000000,
  };
  return map[period] || 0;
}
```

---

## 页面设计

### 首页 Dashboard (`/`)

```
┌─────────────────────────────────────────────────────────┐
│  x402 Monitor                     [Search] [Connect]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 总交易量  │ │ 总交易数  │ │ 活跃Agent│ │活跃Seller│   │
│  │ $1.2M    │ │ 45,231   │ │ 1,234    │ │ 456      │   │
│  │ +12.5%   │ │ +8.3%    │ │ +15.2%   │ │ +6.7%    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │         交易量趋势图 (30 天)                      │    │
│  │  📈 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │    │
│  │     [1D] [7D] [30D] [ALL]                       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────┐  ┌────────────────────────┐     │
│  │ Top Agents (消费)   │  │ Top Sellers (收入)     │     │
│  │ 1. 0xabc.. $12,345 │  │ 1. api.foo  $45,678   │     │
│  │ 2. 0xdef.. $10,234 │  │ 2. api.bar  $23,456   │     │
│  │ 3. 0x123.. $8,765  │  │ 3. api.baz  $12,345   │     │
│  │ [View All →]       │  │ [View All →]           │     │
│  └────────────────────┘  └────────────────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Latest Transactions                              │    │
│  │ Hash     | From    | To      | Amount | Time    │    │
│  │ 0xab..23 | 0xde..  | 0x12..  | $0.01  | 2m ago  │    │
│  │ 0xcd..45 | 0xef..  | 0x34..  | $0.05  | 3m ago  │    │
│  │ 0xef..67 | 0x12..  | 0x56..  | $1.00  | 5m ago  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Agent 排行榜 (`/agents`)

```
┌─────────────────────────────────────────────────────────┐
│  Agent Leaderboard                [1D] [7D] [30D] [ALL] │
├─────────────────────────────────────────────────────────┤
│  Rank | Address    | Label  | Spent    | Txns | Score  │
│  #1   | 0xabc..12  | Bot-A  | $12,345  | 432  | 95    │
│  #2   | 0xdef..34  | -      | $10,234  | 389  | 88    │
│  #3   | 0x123..56  | Agent3 | $8,765   | 256  | 82    │
│  ...                                                    │
│                    [Load More]                          │
└─────────────────────────────────────────────────────────┘
```

### Agent 详情页 (`/agents/[address]`)

```
┌─────────────────────────────────────────────────────────┐
│  Agent: 0xabc...1234                                    │
│  Label: Bot-A | Score: 95/100 | First Seen: 2025-06-01 │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ 总花费    │ │ 交易数    │ │ 常用服务  │                │
│  │ $12,345  │ │ 432      │ │ 15       │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ 消费趋势图            │  │ 常购买的 Seller         │   │
│  │ 📈 ~~~~~~~~~~~~~~~~ │  │ 1. api.llm.com  $5,000 │   │
│  └─────────────────────┘  │ 2. api.data.io  $3,000 │   │
│                            └─────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 交易历史                                         │    │
│  │ ...                                              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## API Routes 规范

### `GET /api/stats`

返回全局统计概览。

```typescript
// 响应
{
  totalVolume: number;         // 总交易量 (USD)
  totalTransactions: number;   // 总交易数
  activeAgents: number;        // 活跃 agent 数（30天内有交易）
  activeSellers: number;       // 活跃 seller 数
  volumeChange24h: number;     // 24h 交易量变化百分比
  dailyVolumes: Array<{        // 每日交易量（图表数据）
    date: string;
    volume: number;
    txCount: number;
  }>;
}
```

### `GET /api/agents?sort=spent&period=7d&page=1&limit=20`

返回 Agent 排行榜。

### `GET /api/agents/[address]`

返回单个 Agent 详情 + 交易历史。

### `GET /api/sellers?sort=received&period=7d&page=1&limit=20`

返回 Seller 排行榜。

### `GET /api/facilitators`

返回 Facilitator 列表及统计。

### `GET /api/transactions?page=1&limit=50&chain=base`

返回交易列表（分页）。

### `GET /api/resources?search=&page=1&limit=20`

返回 x402 服务目录。

---

## 环境变量

```env
# 数据库
DATABASE_URL=postgresql://...  # Supabase PostgreSQL 连接串

# CDP API（链上数据查询）
CDP_API_KEY=...                # Coinbase Developer Platform API Key

# RPC（备用链上查询）
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
# 或
BASE_RPC_URL=https://base-mainnet.quiknode.pro/YOUR_KEY

# Cron 安全（防止外部调用 cron endpoint）
CRON_SECRET=your-random-secret

# 可选
NEXT_PUBLIC_BASE_URL=https://your-domain.com
POSTHOG_KEY=...               # 可选：用户分析
```

---

## 部署流程

### 1. GitHub 仓库初始化

```bash
pnpm create next-app x402-monitor --typescript --tailwind --app --use-pnpm
cd x402-monitor
pnpm add prisma @prisma/client viem
pnpm add -D @types/node
npx prisma init
```

### 2. Supabase 设置

1. 创建 Supabase 项目 (https://supabase.com)
2. 拿到 PostgreSQL 连接串
3. 填入 `.env.local` 的 `DATABASE_URL`
4. 运行 `npx prisma db push` 建表

### 3. Vercel 部署

1. 推送到 GitHub
2. Vercel 导入项目
3. 设置环境变量
4. 部署

### 4. Indexer Worker（如果用独立进程）

1. Railway 或 Render 创建 Node.js 服务
2. 连接同一个 Supabase 数据库
3. 运行 node-cron 定时同步

---

## 费用明细

### MVP 阶段（月费用）

| 项目 | 方案 | 费用 |
|------|------|------|
| 数据库 | Supabase Free (500MB) | $0 |
| 前端部署 | Vercel Hobby | $0 |
| RPC 节点 | Alchemy Free (3亿CU) | $0 |
| CDP API | 1000 免费请求/月，之后 $0.001/请求 | ~$0 |
| Indexer | Railway ($5 credit) | $0-5 |
| 域名 | 自选 | ~$12/年 |
| **合计** | | **$0-5/月** |

### 增长阶段

| 项目 | 方案 | 费用 |
|------|------|------|
| Supabase Pro | 8GB, 无限行 | $25/月 |
| Vercel Pro | 分钟级 Cron | $20/月 |
| Alchemy Growth | 更多 CU | $49/月 |
| Railway Pro | 更大机器 | $20/月 |
| **合计** | | **~$114/月** |

---

## 开发优先级

### Phase 1 - MVP（必须做，1-2 周）

1. 项目初始化 (Next.js + Prisma + Supabase + shadcn/ui)
2. 数据库 schema 建表
3. Facilitator 地址配置（从 x402scan 开源包获取）
4. 链上同步 indexer (CDP API 方式)
5. 首页 Dashboard（统计卡片 + 交易列表）
6. Agent 排行榜 + Seller 排行榜
7. Vercel 部署

### Phase 2 - 差异化（2-4 周）

8. Agent 详情页（消费趋势 + 常用服务）
9. Seller 详情页（收入趋势 + 客户分布）
10. 交易量趋势图（Recharts）
11. 服务发现同步（拉 facilitator discovery API）
12. 服务目录页面
13. 搜索功能
14. 多链支持（加 Polygon、Solana）

### Phase 3 - 护城河（1-2 月）

15. Agent 信用评分算法
16. Agent-to-Seller 流向关系图（可视化）
17. 告警订阅（大额交易通知）
18. 开放 API（供其他项目查询）
19. MCP Server（供 AI Agent 查询）

---

## 关键提醒

1. **facilitator 地址是核心数据资产** - 没有这些地址就无法从链上识别 x402 交易。优先从 x402scan 的开源 `facilitators` npm 包获取，然后建立自己的维护机制。

2. **不要尝试监听所有 USDC Transfer** - Base 链上每天有海量 USDC 转账，你只需要过滤 facilitator 发起的那些。

3. **CDP API 有速率限制** - 1000 免费请求/月。如果超出，用 Alchemy RPC 的 `eth_getLogs` 作为备用。但 RPC 方式需要额外查 tx 详情来获取 tx.from，效率较低。

4. **先 Base 链，再扩展** - Base 是 x402 最活跃的链（Coinbase 主推），90%+ 的 x402 交易发生在 Base 上。

5. **聚合统计不要实时算** - 用定时任务预计算，页面直接读预聚合表，否则数据量大了会很慢。
