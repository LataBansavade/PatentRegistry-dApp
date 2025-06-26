import { http, createConfig } from '@wagmi/core'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

const projectId = '9ae66a3a5795776468024f08e1ba4ace'

export const config = createConfig({
  chains: [mainnet, sepolia],
    connectors: [
    injected(),
    walletConnect({ projectId }),
    metaMask(),
    safe(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
