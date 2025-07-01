import { useState, useEffect } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = () => {
  const { address, isConnected } = useAccount();
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { open } = useAppKit();

  // Close mobile menu when route changes
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
      setIsWalletConnected(true);
    } else {
      setWalletAddress("");
      setIsWalletConnected(false);
    }
  }, [address]);

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => setIsMenuOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const handleWalletConnect = () => {
    open();
    if (isConnected) {
      setIsWalletConnected(true);
      setWalletAddress(address || "");
    }
  };

  // Format wallet address for display
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-black shadow-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and mobile menu button */}
          <div className="flex items-center">
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                Patent Registry
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block md:ml-10">
              <div className="flex space-x-4">
                <NavLink to="/" text="All Patents" />
                <NavLink to="/create" text="Create Patent" />
                <NavLink to="/my-patents" text="My Patents" />
                <NavLink to="/web3Uploader" text="Web3 Uploader" />
              </div>
            </div>
          </div>

          {/* Desktop Wallet Button */}
          <div className="hidden md:block">
            <WalletButton
              isConnected={isWalletConnected}
              walletAddress={walletAddress}
              formatAddress={formatAddress}
              onClick={handleWalletConnect}
            />
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-white hover:bg-gray-700 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <FiX className="block w-6 h-6" />
              ) : (
                <FiMenu className="block w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink to="/" text="All Patents" />
            <MobileNavLink to="/create" text="Create Patent" />
            <MobileNavLink to="/my-patents" text="My Patents" />
            <MobileNavLink to="/web3Uploader" text="Web3 Uploader" />
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex items-center px-5">
                <WalletButton
                  isConnected={isWalletConnected}
                  walletAddress={walletAddress}
                  formatAddress={formatAddress}
                  onClick={handleWalletConnect}
                  isMobile={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

// Reusable NavLink component for desktop
const NavLink = ({ to, text }: { to: string; text: string }) => (
  <Link
    to={to}
    className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-900 hover:text-gray-300"
  >
    {text}
  </Link>
);

// Mobile NavLink component
const MobileNavLink = ({ to, text }: { to: string; text: string }) => (
  <Link
    to={to}
    className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-gray-900 hover:text-gray-300"
  >
    {text}
  </Link>
);

// Wallet button component
const WalletButton = ({
  isConnected,
  walletAddress,
  formatAddress,
  onClick,
  isMobile = false
}: {
  isConnected: boolean;
  walletAddress: string;
  formatAddress: (addr: string) => string;
  onClick: () => void;
  isMobile?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full ${
      isMobile ? 'px-4 py-2' : 'px-4 py-2'
    } bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-md border border-transparent shadow-md transition-all duration-300 hover:from-pink-500 hover:to-yellow-500`}
  >
    {isConnected ? (
      <div className="flex items-center justify-center gap-2 font-medium text-white">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        {formatAddress(walletAddress)}
      </div>
    ) : (
      <span className="font-medium text-white">Connect Wallet</span>
    )}
  </button>
);

export default Navbar;