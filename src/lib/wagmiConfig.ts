import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { robinhoodChain } from './chains'

const projectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined)?.trim() ||
  // Placeholder — injected wallets still work; set a real WC Cloud ID for WalletConnect.
  '00000000000000000000000000000001'

export const wagmiConfig = getDefaultConfig({
  appName: 'Evee Admin',
  projectId,
  chains: [robinhoodChain],
  transports: {
    [robinhoodChain.id]: http(robinhoodChain.rpcUrls.default.http[0]),
  },
  ssr: false,
})
