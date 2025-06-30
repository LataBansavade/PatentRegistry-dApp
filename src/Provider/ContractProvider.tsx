import {
  Contract,
  JsonRpcProvider,
} from "ethers";
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESS } from "../Hardhat/Contract/contractAddress";
import { PatentRegistryABI } from "../Hardhat/Contract/PatentRegistry";
import { useEthersSigner } from "../utils/etherAdapter";

const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/0396cb651a6841589f2f1e0b44f014a6";

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
  const signer = useEthersSigner();
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  
  
  console.log('Wallet State:', { 
    isConnected, 
    address, 
    hasSigner: !!signer
  });

  useEffect(() => {
    let isMounted = true;
  
    const initContract = async () => {
      if (!isMounted) return;
  
      setIsLoading(true);
      console.log("Initializing contract...");
  
      try {
        const readOnlyProvider = new JsonRpcProvider(SEPOLIA_RPC_URL, {
          name: "sepolia",
          chainId: 11155111,
        });
  
        const readOnlyContract = new Contract(CONTRACT_ADDRESS, PatentRegistryABI, readOnlyProvider);
        await readOnlyContract.patentCount(); // Test connection
        console.log("Read-only contract connected");
  
        // If wallet is connected but no signer, wait a bit and retry
        if (isConnected && !signer) {
          console.log("Wallet is connected but no signer, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
          if (!isMounted) return;
        }
  
        if (!signer) {
          console.log("Using read-only mode - no signer available");
          setContract(readOnlyContract);
          setError("Connect your wallet to enable write access");
          return;
        }
  
        // Try to get signer address
        try {
          const signerAddress = await signer.getAddress();
          console.log("Signer address:", signerAddress);
          
          const network = await signer.provider?.getNetwork();
          console.log("Network:", network);
  
          if (network?.chainId !== 11155111n) {
            const msg = `Please switch to Sepolia Testnet (chainId: 11155111)`;
            console.warn(msg);
            setError(msg);
            setContract(readOnlyContract);
            return;
          }
  
          const writeContract = new Contract(CONTRACT_ADDRESS, PatentRegistryABI, signer);
          await writeContract.patentCount(); // Test write access
          console.log("Write access enabled");
          
          setContract(writeContract);
          setError(null);
        } catch (signerErr) {
          console.error("Signer error:", signerErr);
          setContract(readOnlyContract);
          setError("Failed to initialize signer. Using read-only mode.");
        }
      } catch (err) {
        console.error("Contract initialization error:", err);
        setError("Failed to connect to the blockchain");
        setContract(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
  
    initContract();
  
    return () => {
      isMounted = false;
    };
  }, [signer, isConnected]); // Remove address from deps as it's not used

  return (
    <ContractContext.Provider
      value={{ contract, isConnected, address, error, isLoading }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within ContractProvider");
  }
  return context;
};
