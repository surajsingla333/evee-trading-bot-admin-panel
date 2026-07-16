import { useMockData } from '@/config/env'
import { wallets as mockWallets } from '@/data/mock'
import { api, assertLiveApi } from '@/lib/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WalletAsset {
  symbol: string
  name: string
  amount: number
  value: number
  change24h: number
}

export interface WalletRow {
  id: string
  address: string
  nickname: string
  balance: number
  type: string
  status: 'active' | 'inactive'
  userId: string
  chain: 'solana' | 'robinhood'
  pnl: number
  assets: WalletAsset[]
}

export interface WalletsResult {
  items: WalletRow[]
  total: number
  page: number
  totalPages: number
}

export interface GetWalletsParams {
  page: number
  limit?: number
  search?: string
  status?: '' | 'active' | 'inactive'
  chain?: '' | 'solana' | 'robinhood'
  type?: string
}

const PAGE_SIZE = 20

function mapWallet(raw: any): WalletRow {
  const statusRaw = (raw.status || '').toLowerCase()
  const status: WalletRow['status'] =
    statusRaw === 'inactive' || statusRaw === 'locked' ? 'inactive' : 'active'

  const chainRaw = (raw.chain || '').toLowerCase()
  const chain: WalletRow['chain'] = chainRaw === 'robinhood' ? 'robinhood' : 'solana'

  return {
    id: raw.id ?? raw._id ?? '',
    address: raw.address ?? raw.publicKey ?? '',
    nickname: raw.nickname ?? raw.label ?? '',
    balance: Number(raw.balance ?? 0),
    type: raw.type ?? 'trading',
    status,
    userId: String(raw.userId ?? ''),
    chain,
    pnl: Number(raw.pnl ?? 0),
    assets: (raw.assets || []).map((a: any) => ({
      symbol: a.symbol ?? '???',
      name: a.name ?? a.symbol ?? '',
      amount: Number(a.amount ?? 0),
      value: Number(a.value ?? 0),
      change24h: Number(a.change24h ?? 0),
    })),
  }
}

export async function getWallets(params: GetWalletsParams): Promise<WalletsResult> {
  if (useMockData) {
    let items: WalletRow[] = mockWallets.map((w) =>
      mapWallet({
        ...w,
        chain: 'solana',
        status: w.status === 'active' ? 'active' : 'inactive',
      }),
    )

    const q = (params.search || '').toLowerCase()
    if (q) {
      items = items.filter(
        (w) =>
          w.address.toLowerCase().includes(q) ||
          w.nickname.toLowerCase().includes(q) ||
          w.userId.toLowerCase().includes(q),
      )
    }
    if (params.status) items = items.filter((w) => w.status === params.status)
    if (params.chain) items = items.filter((w) => w.chain === params.chain)
    if (params.type) items = items.filter((w) => w.type === params.type)

    return { items, total: items.length, page: 1, totalPages: 1 }
  }

  assertLiveApi()
  const res = await api.get('/api/v1/wallets', {
    params: {
      page: params.page,
      limit: params.limit ?? PAGE_SIZE,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.chain ? { chain: params.chain } : {}),
      ...(params.type ? { type: params.type } : {}),
    },
  })

  return {
    items: (res.data.items || []).map(mapWallet),
    total: res.data.pagination?.total ?? res.data.items?.length ?? 0,
    page: res.data.pagination?.page ?? params.page,
    totalPages: res.data.pagination?.totalPages ?? 1,
  }
}
