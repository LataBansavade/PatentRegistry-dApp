import { Contract, BrowserProvider, JsonRpcProvider } from "ethers";
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESS } from "../Hardhat/Contract/contractAddress";
import { PatentRegistryABI } from "../Hardhat/Contract/PatentRegistry";

// Sepolia RPC URL
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/0396cb651a6841589f2f1e0b44f014a6';

type ContractContextType = {
  contract: Contract | null;
  isConnected: boolean;
  address: string | undefined;
  error: string | null;
  isLoading: boolean;
};

const ContractContext = createContext<ContractContextType>({
  contract: null,
  isConnected: false,
  address: undefined,
  error: null,
  isLoading: true,
});

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    const initContract = async () => {
      setIsLoading(true);
      try {
        console.log('Initializing contract...');

        // Step 1: Read-only provider and contract
        const readOnlyProvider = new JsonRpcProvider(SEPOLIA_RPC_URL, {
          name: 'sepolia',
          chainId: 11155111,
        });

        const readOnlyContract = new Contract(CONTRACT_ADDRESS, PatentRegistryABI, readOnlyProvider);

        // Test read-only connection
        try {
          await readOnlyContract.patentCount();
          console.log('Connected to read-only contract');
        } catch (readError) {
          console.error('Read-only contract test failed:', readError);
          throw new Error('Could not read from the blockchain. Please check your network or RPC endpoint.');
        }

        // Step 2: Check for wallet (MetaMask)
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          console.warn('No Ethereum wallet found');
          setContract(readOnlyContract);
          setError('No Ethereum wallet found. Please install MetaMask.');
          return;
        }

        // Step 3: If wallet connected, create signer-based contract
        if (isConnected && address) {
          try {
            console.log('Setting up write-enabled contract...');
            const provider = new BrowserProvider((window as any).ethereum);
            const network = await provider.getNetwork();

            // Check if on Sepolia
            if (network.chainId !== 11155111n) {
              setContract(readOnlyContract);
              setError('Please switch your wallet to the Sepolia Testnet.');
              return;
            }

            const signer = await provider.getSigner();
            const writeContract = new Contract(CONTRACT_ADDRESS, PatentRegistryABI, signer);

            // Test write contract
            await writeContract.patentCount();
            console.log('Write-enabled contract initialized');
            setContract(writeContract);
            setError(null);
            return;
          } catch (writeError) {
            console.warn('Write-enabled contract setup failed:', writeError);
            // fallback to read-only
          }
        }

        // Step 4: Fallback to read-only
        console.log('Using read-only contract (fallback)');
        setContract(readOnlyContract);
        setError('Write access disabled. Connect your wallet to enable full features.');

      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize smart contract. Please try again later.');
        setContract(null);
      } finally {
        setIsLoading(false);
      }
    };

    initContract();
  }, [isConnected, address]);

  const value: ContractContextType = {
    contract,
    isConnected,
    address,
    error,
    isLoading,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};
