import { useState, useEffect } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
const Navbar = () => {
  const { address, isConnected } = useAccount();
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const { open } = useAppKit();

  const handleWalletConnect = () => {
    open();
    if(isConnected){
      setIsWalletConnected(true);
      setWalletAddress(address || "");
    }
  };

  useEffect(() => {
    if (address) {
      setWalletAddress(address);
      setIsWalletConnected(true);
    } else {
      setWalletAddress("");
      setIsWalletConnected(false);
    }
  }, [address]);

  // Format wallet address for display
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav className="flex sticky top-0 z-50 justify-between items-center px-6 py-4 text-white bg-black shadow-md md:px-20">
    {/* App Title with gradient text */}
    <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      Patent Registry
    </div>

   <div>
    <Link to="/" className="mr-4 text-white hover:text-gray-300">All Patents</Link>
    <Link to="/create" className="mr-4 text-white hover:text-gray-300">Create Patent</Link>
    <Link to="/my-patents" className="mr-4 text-white hover:text-gray-300">My Patents</Link>
    <Link to="/web3Uploader" className="mr-4 text-white hover:text-gray-300">Web3 Uploader</Link>
   </div>
  
    {/* Wallet Button */}
    <div>
      <button
        onClick={handleWalletConnect}
        className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-md border border-transparent shadow-md transition-all duration-300 hover:from-pink-500 hover:to-yellow-500"
      >
        {isWalletConnected ? (
          <div className="flex gap-2 items-center font-medium text-white">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {formatAddress(walletAddress)}
          </div>
        ) : (
          <span className="font-medium text-white">Connect Wallet</span>
        )}
      </button>
    </div>
  </nav>
  
  );
};

export default Navbar;