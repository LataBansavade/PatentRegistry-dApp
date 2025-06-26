import { createAppKit } from "@reown/appkit/react";

import { cookieStorage, createStorage, WagmiProvider } from "wagmi";
import { sepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { ReactNode } from "react";

const projectId = '9ae66a3a5795776468024f08e1ba4ace'

if (!projectId) {
    throw new Error("Missing a project id");
}

const queryClient = new QueryClient();
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia];


const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    networks,
    projectId,
    ssr: true,
});

export const AppkitProvider = ({ children }: { children: ReactNode }) => {
  
    createAppKit({
        adapters: [wagmiAdapter],
        networks,
        defaultNetwork: sepolia,
        projectId,
        features: {
            analytics: true,
            email: false,
            socials: false,
        },
        themeMode: "dark",
        debug: true,
        themeVariables: {
            "--w3m-border-radius-master": "0rem",
        }
    });

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
};