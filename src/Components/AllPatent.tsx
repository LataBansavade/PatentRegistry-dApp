import { useState, useEffect } from "react";
import {
  FiFile,
  FiClock,
  FiUser,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
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

type RawPatent = {
  owner: string;
  title: string;
  description: string;
  ipfsHashes: string[] | { [key: string]: string };
  timestamp: number | bigint;
  isDeleted: boolean;
};

const AllPatent = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { contract, isLoading: isContractLoading } = useContract();

  

  const showErrorToast = (message: string, duration = 5000) => {
    toast.error(message, {
      icon: <FiAlertCircle className="text-yellow-500" />,
      duration,
      style: {
        borderLeft: "4px solid #f59e0b",
      },
    });
  };

  const showLoadingToast = (message: string) => {
    return toast.loading(message);
  };

  const parsePatentData = (patentData: RawPatent, index: number): Patent => {
    try {
      // Extract and process ipfsHashes
      let ipfsHashes: string[] = [];

      if (Array.isArray(patentData.ipfsHashes)) {
        // If it's already an array, use it directly
        ipfsHashes = patentData.ipfsHashes.filter(
          (hash): hash is string => typeof hash === "string" && hash.length > 0
        );
      } else if (
        patentData.ipfsHashes &&
        typeof patentData.ipfsHashes === "object"
      ) {
        // If it's an object, convert values to array
        ipfsHashes = Object.values(patentData.ipfsHashes).filter(
          (hash): hash is string => typeof hash === "string" && hash.length > 0
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
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error parsing data: ${errorMsg}`, {
        icon: <FiAlertCircle className="text-red-500" />,
      });
      return {
        id: index,
        owner: "0x0000000000000000000000000000000000000000",
        title: "Error Loading Patent",
        description: "Could not load patent data",
        ipfsHashes: [],
        timestamp: 0,
        isDeleted: false,
      };
    }
  };

  useEffect(() => {
    const fetchPatents = async () => {
      if (isContractLoading) {
        return;
      }
      if (!contract) {
        const errorMsg =
          "Failed to connect to the contract. Please check your wallet connection.";
        setError(errorMsg);
        setLoading(false);
        showErrorToast(errorMsg);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Used getAllPatents to get all non-deleted patents in a single call
        const allPatents = await contract.getAllPatents();
        // console.log("Raw patents data from contract:", allPatents);

        // Process the received patents
        const formattedPatents = allPatents
          .map((patent: any, index: number) => {
            try {
              // Parse each patent data
              const formatted = parsePatentData(patent, index);
              return formatted;
            } catch (error) {
              // console.error(`Error parsing patent at index ${index}:`, error);
              return null;
            }
          })
          .filter((patent: Patent | null): patent is Patent => patent !== null);

        // console.log("Formatted patents:", formattedPatents);
        setPatents(formattedPatents);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const fullError = `Failed to load patents: ${errorMessage}`;
        setError(fullError);
        showErrorToast(fullError);
      } finally {
        setLoading(false);
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

  // Handle loading and error states with toasts
  useEffect(() => {
    if (isContractLoading) {
      const loadingToast = showLoadingToast("Connecting to blockchain...");
      return () => toast.dismiss(loadingToast);
    }
  }, [isContractLoading]);

  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error]);

  if (isContractLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-green-500 animate-spin"></div>
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
                  <div key={idx} className="flex items-center space-x-2">
                    <span>File {idx + 1}:</span>
                    <a
                      href={`https://ipfs.io/ipfs/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View File {idx + 1}
                    </a>
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
                {patents.map(renderPatentRow).filter(Boolean)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPatent;
