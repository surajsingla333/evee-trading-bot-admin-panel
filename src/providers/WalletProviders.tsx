import { useMemo, type ReactNode } from 'react'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { wagmiConfig } from '@/lib/wagmiConfig'
import { useTheme } from '@/hooks/useTheme'
import '@rainbow-me/rainbowkit/styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'

const queryClient = new QueryClient()

const SOLANA_RPC =
  (import.meta.env.VITE_SOLANA_RPC_URL as string | undefined)?.trim() ||
  'https://solana-rpc.publicnode.com'

function RainbowTheme({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return (
    <RainbowKitProvider
      theme={theme === 'dark' ? darkTheme() : lightTheme()}
      modalSize="compact"
      initialChain={wagmiConfig.chains[0]}
    >
      {children}
    </RainbowKitProvider>
  )
}

export function WalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowTheme>
          <ConnectionProvider endpoint={SOLANA_RPC}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowTheme>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
