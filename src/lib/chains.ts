import { defineChain } from 'viem'

/** Robinhood Chain mainnet (EVM) — used by RainbowKit / wagmi for ETH payouts. */
export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.chain.robinhood.com/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
})

export const ROBINHOOD_CHAIN_ID = robinhoodChain.id
export const ROBINHOOD_EXPLORER = robinhoodChain.blockExplorers.default.url
