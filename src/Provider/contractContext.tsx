
import { createContext, useContext } from "react";
import { Contract } from "ethers";

export const ContractContext = createContext<{
    contract: Contract;
    token: Contract;
} | null>(null);

export const useContract = () => {
    const context = useContext(ContractContext);
    if (!context) {
        throw new Error("useContract must be used within a ContractProvider");
    }
    return context;
};
