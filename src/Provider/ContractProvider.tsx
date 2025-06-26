import { Contract, BrowserProvider, JsonRpcProvider } from "ethers";
import {  createContext, useContext,  useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESS } from "../Hardhat/Contract/contractAddress";
import { PatentRegistryABI } from "../Hardhat/Contract/PatentRegistry";

// Sepolia RPC URL
const SEPOLIA_RPC_URL ='https://sepolia.infura.io/v3/0396cb651a6841589f2f1e0b44f014a6';

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
      try {
        setIsLoading(true);
        
        // Always create a read-only contract first
        const readOnlyProvider = new JsonRpcProvider(SEPOLIA_RPC_URL, {
            name: 'sepolia',
            chainId: 11155111 
          });
        let contract = new Contract(CONTRACT_ADDRESS, PatentRegistryABI, readOnlyProvider);
        
        // If wallet is connected, upgrade to a write-enabled contract
        if (isConnected && address && (window as any).ethereum) {
          const provider = new BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          contract = contract.connect(signer) as Contract;
        }
        
        setContract(contract);
        setError(null);
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize contract');
      } finally {
        setIsLoading(false);
      }
    };

    initContract();
  }, [isConnected, address]);

  const value = {
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
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};