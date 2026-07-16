import { useMockData } from '@/config/env'
import { trades as mockTrades } from '@/data/mock'
import { api, assertLiveApi } from '@/lib/api'
import { mapNormalizedTrade, type NormalizedTrade } from '@/services/users'

export type { NormalizedTrade }

export interface TradesResult {
  items: NormalizedTrade[]
  total: number
  page: number
  totalPages: number
}

export interface GetTradesParams {
  page: number
  limit?: number
  type?: '' | 'buy' | 'sell'
  status?: '' | 'pending' | 'completed' | 'failed'
  chain?: '' | 'solana' | 'robinhood'
  tokenAddress?: string
  sortDirection?: 'asc' | 'desc'
}

const PAGE_SIZE = 20

export async function getTrades(params: GetTradesParams): Promise<TradesResult> {
  if (useMockData) {
    let items: NormalizedTrade[] = mockTrades.map((t) => ({
      id: t.id,
      chain: 'solana' as const,
      type: t.type,
      tokenAddress: t.token,
      tokenSymbol: t.tokenSymbol,
      tokenName: t.token,
      amount: t.amount,
      nativeAmount: 0,
      nativeUnit: 'SOL' as const,
      priceUsd: t.price,
      status:
        t.status === 'failed'
          ? 'failed'
          : t.status === 'pending'
            ? 'pending'
            : 'completed',
      provider: t.provider,
      txHash: t.txHash,
      pnl: t.pnl,
      pnlPercentage: null,
      timestamp: t.time,
    }))

    if (params.type) items = items.filter((t) => t.type === params.type)
    if (params.status) items = items.filter((t) => t.status === params.status)
    if (params.chain) items = items.filter((t) => t.chain === params.chain)
    if (params.tokenAddress) {
      const q = params.tokenAddress.toLowerCase()
      items = items.filter(
        (t) =>
          t.tokenAddress.toLowerCase().includes(q) ||
          (t.tokenSymbol || '').toLowerCase().includes(q) ||
          (t.tokenName || '').toLowerCase().includes(q),
      )
    }

    return { items, total: items.length, page: 1, totalPages: 1 }
  }

  assertLiveApi()
  const res = await api.get('/api/v1/trades', {
    params: {
      page: params.page,
      limit: params.limit ?? PAGE_SIZE,
      sortDirection: params.sortDirection ?? 'desc',
      ...(params.type ? { type: params.type } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.chain ? { chain: params.chain } : {}),
      ...(params.tokenAddress ? { tokenAddress: params.tokenAddress } : {}),
    },
  })

  return {
    items: (res.data.items || []).map(mapNormalizedTrade),
    total: res.data.pagination?.total ?? res.data.items?.length ?? 0,
    page: res.data.pagination?.page ?? params.page,
    totalPages: res.data.pagination?.totalPages ?? 1,
  }
}
