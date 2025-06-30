import {
    FallbackProvider,
    JsonRpcProvider,
    BrowserProvider,
    JsonRpcSigner,
  } from "ethers";
  import { useMemo } from "react";
  import type { Account, Chain, Client, Transport } from "viem";
  import { type Config, useClient, useConnectorClient } from "wagmi";
  
  /** Convert viem Client to ethers.js Provider */
  export function clientToProvider(client: Client<Transport, Chain>) {

    
    const { chain, transport } = client;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
  
    if (transport.type === "fallback") {
      const providers = (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new JsonRpcProvider(value?.url, network)
      );
      return providers.length === 1 ? providers[0] : new FallbackProvider(providers);
    }
  
    return new JsonRpcProvider(transport.url, network);
  }
  
  /** Convert viem Wallet Client to ethers.js Signer */
  export function clientToSigner(client: Client<Transport, Chain, Account>) {
    const { account, chain, transport } = client;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new BrowserProvider(transport, network);
    return new JsonRpcSigner(provider, account.address);
  }
  
  /** Hook to get ethers.js Provider from viem Client */
  export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
    const client = useClient<Config>({ chainId });
    return useMemo(() => (client ? clientToProvider(client) : undefined), [client]);
  }
  
  /** Hook to get ethers.js Signer from viem Wallet Client */
  export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: client } = useConnectorClient<Config>({ chainId });
    return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
  }
  