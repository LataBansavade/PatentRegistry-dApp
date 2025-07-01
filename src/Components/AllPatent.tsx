import { useState, useEffect } from "react";
import {
  FiFile,
  FiClock,
  FiUser,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import Pagination from "./Pagination";
import { useContract } from "../Provider/ContractProvider";
import { formatDistanceToNow } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

interface Patent {
  id: number;
  owner: string;
  title: string;
  description: string;
  ipfsHashes: string[];
  timestamp: number;
  isDeleted: boolean;
}

const ITEMS_PER_PAGE = 10;

const AllPatent = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { contract, isLoading: isContractLoading } = useContract();

  const showErrorToast = (message: string, duration = 3000) => {
    toast.error(message, {
      icon: <FiAlertCircle className="text-yellow-500" />,
      duration,
      style: {
        borderLeft: "4px solid #f59e0b",
      },
    });
  };

  const parsePatentData = (patentData: any, index: number): Patent | null => {
    try {
      if (patentData.isDeleted) {
        return null;
      }

      // Extract and process ipfsHashes
      let ipfsHashes: string[] = [];

      if (Array.isArray(patentData.ipfsHashes)) {
        ipfsHashes = patentData.ipfsHashes.filter(
          (hash: any) => typeof hash === "string" && hash.length > 0
        );
      }

      // Convert the ethers.js response to a plain object with proper typing
      const patent: Patent = {
        id: index,
        owner: patentData.owner || "0x0000000000000000000000000000000000000000",
        title: patentData.title || "Untitled",
        description: patentData.description || "No description",
        ipfsHashes,
        timestamp: patentData.timestamp ? Number(patentData.timestamp) : 0,
        isDeleted: patentData.isDeleted || false,
      };

      return patent;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const fetchPatents = async () => {
      if (isContractLoading) {
        return;
      }

      if (!contract) {
        const errorMsg =
          "Failed to connect to the contract. Please check your internet connection and try again.";
        console.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        showErrorToast(errorMsg);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const patentsData = await contract.getAllPatents();

        // Process, format, and sort the patents by timestamp (newest first)
        const allPatents = patentsData
          .map((patent: any, index: number) => parsePatentData(patent, index))
          .filter(Boolean)
          .sort((a: Patent, b: Patent) => (b.timestamp || 0) - (a.timestamp || 0));

        setPatents(allPatents);
        setCurrentPage(1); // Reset to first page when data changes
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        if (!errorMessage.includes("Patent is deleted")) {
          const fullError = `Failed to load patents: ${errorMessage}`;
          setError(fullError);
          showErrorToast(fullError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatents();
  }, [contract, isContractLoading]);

  const formatAddress = (address?: string | null) => {
    if (!address || typeof address !== "string" || address.length < 10) {
      return "Invalid Address";
    }
    return `${address.substring(0, 6)}...${address.slice(-4)}`;
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get current patents based on pagination
  const getCurrentPatents = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return patents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Handle error state with toast
  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error]);

  // Reset to first page when patents change
  useEffect(() => {
    setCurrentPage(1);
  }, [patents.length]);

  // Show loading state with a subtle animation
  if (isContractLoading || isLoading) {
    return (
      <div className="relative p-10 px-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-500">All Patents</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100"></div>
            <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-t-4 border-blue-500 animate-spin"></div>
          </div>
          <p className="font-medium text-gray-600">
            {isContractLoading
              ? "Connecting to contract..."
              : "Loading patents..."}
          </p>
          <p className="text-sm text-gray-400">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Show error state if contract failed to load
  if (!contract) {
    return (
      <div className="p-8 text-center">
        <div className="p-4 text-red-700 bg-red-100 rounded border border-red-400">
          <p className="font-bold">Connection Error</p>
          <p>
            Failed to connect to the blockchain. Please check your internet
            connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderPatentRow = (patent: Patent) => {
    try {
      const timestamp = patent.timestamp
        ? Number(patent.timestamp) * 1000
        : null;

      return (
        <tr key={patent.id} className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div className="text-sm font-medium text-gray-900">
              {patent.title || "Untitled Patent"}
            </div>
            <div className="mt-1 text-xs text-gray-500 line-clamp-2">
              {patent.description && patent.description.length > 100
                ? `${patent.description.substring(0, 100)}...`
                : patent.description || "No description provided"}
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-500">
            {patent.owner ? formatAddress(patent.owner) : "Unknown"}
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              {patent.ipfsHashes && patent.ipfsHashes.length > 0 ? (
                patent.ipfsHashes.map((hash, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="text-sm font-medium text-gray-700">
                      File {idx + 1}:
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {[
                        // { name: 'IPFS.io', url: `https://ipfs.io/ipfs/${hash}` },
                        {
                          name: "Pinata",
                          url: `https://gateway.pinata.cloud/ipfs/${hash}`,
                        },
                      ].map((gateway, gIdx) => (
                        <a
                          key={gIdx}
                          href={gateway.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          title={`View on ${gateway.name}`}
                        >
                          {gateway.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <span>No files</span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-500">
            {timestamp
              ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
              : "N/A"}
          </td>
        </tr>
      );
    } catch (error) {
      console.error("Error rendering patent:", error);
      return null;
    }
  };

  return (
    <div className="relative p-10 px-20">
      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-white shadow-lg rounded-lg border border-gray-200",
          success: {
            icon: <FiCheckCircle className="text-green-500" />,
          },
          error: {
            icon: <FiAlertCircle className="text-red-500" />,
          },
          loading: {
            icon: (
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 animate-spin border-t-transparent" />
            ),
          },
        }}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-500">All Patents</h1>
      </div>

      {error ? (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded border border-red-400">
          <p className="font-bold">Error loading patents</p>
          <p>{error}</p>
        </div>
      ) : patents.length === 0 ? (
        <div className="py-12 text-center">
          <FiFileText className="mx-auto w-12 h-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No patents found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new patent.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    <FiUser className="inline mr-1" /> Owner
                  </th>
                  <th className="flex flex-wrap px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    <FiFile className="inline mr-1" /> Files
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    <FiClock className="inline mr-1" /> Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentPatents().map(renderPatentRow).filter(Boolean)}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalItems={patents.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPatent;
