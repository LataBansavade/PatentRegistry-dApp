import { useState, useEffect } from "react";
import {
  FiFile,
  FiClock,
  FiFileText,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUpload,
} from "react-icons/fi";
import { useContract } from "../Provider/ContractProvider";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

interface Patent {
  id: number;
  title: string;
  owner: string;
  description: string;
  ipfsHashes: string[];
  timestamp: number;
  isDeleted: boolean;
}

const MyPatents = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { contract, address, isConnected } = useContract();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newDescription, setNewDescription] = useState("");

  const [uploadingHash, setUploadingHash] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<
    Record<number, File | null>
  >({});

  const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkNjYxYjgwYy02MjMyLTQzOTktYjE3Zi05ZTNmYjlkMGJjNTAiLCJlbWFpbCI6ImxhdGFiYW5zYXZhZGUyNEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZTEwZThhYmU5ZWQ5ODNjNzhlMDAiLCJzY29wZWRLZXlTZWNyZXQiOiIwNDQxZmQ4MDNlZjVkY2Y2MWFjMWYyZjQxZTM5ZGE3ZWIyZmI2OGVlNDI1YTk2ZmRhMDg4YzQ5NGEzY2UyOWNiIiwiZXhwIjoxNzgyMjk4MDMzfQ.eiF4rWIbmc9kghOxk-T6nA6dYlZ3qJCCP0ZozwNZ_mY';

  
  
  const fetchMyPatents = async () => {
    if (!contract || !address || !isConnected) {
      setLoading(false);
      toast.error("Please connect your wallet to view your patents");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const myPatentIds = await contract.getMyPatents();
      const patentPromises = myPatentIds.map(async (id: bigint) => {
        const patentData = await contract.getPatent(Number(id));
        return {
          id: Number(id),
          owner: patentData.owner,
          title: patentData.title,
          description: patentData.description,
          ipfsHashes: Array.isArray(patentData.ipfsHashes)
            ? patentData.ipfsHashes
            : Object.values(patentData.ipfsHashes || {}),
          timestamp: Number(patentData.timestamp),
          isDeleted: patentData.isDeleted,
        };
      });

      const myPatents = await Promise.all(patentPromises);
      setPatents(myPatents.filter((p) => !p.isDeleted));
    } catch (err) {
      console.error("Error fetching patents:", err);
      setError("Failed to load patents. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected || !address || !contract) {
      setPatents([]);  // Clear patents when wallet disconnects
      setLoading(false);
      if (!isConnected) {
        toast.error(" Please connect your wallet to view your patents");
      }
      return;
    }
    fetchMyPatents();
  }, [contract, address, isConnected]);

  const handleEdit = (patentId: number, currentDescription: string) => {
    setEditingId(patentId);
    setNewDescription(currentDescription);
  };

  const handleSaveEdit = async (patentId: number) => {
    if (!contract || !newDescription.trim()) {
      toast.error("Please enter a valid description");
      return;
    }

    try {
      const tx = await contract.updateDescription(patentId, newDescription);
      await tx.wait();

      // Update local state
      setPatents((prev) =>
        prev.map((patent) =>
          patent.id === patentId
            ? { ...patent, description: newDescription }
            : patent
        )
      );

      toast.success("Description updated successfully");
      setEditingId(null);
    } catch (err) {
      console.error("Error updating description:", err);
      toast.error("Failed to update description. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewDescription("");
  };

  const handleDelete = async (patentId: number) => {
    if (
      !contract ||
      !window.confirm(
        "Are you sure you want to delete this patent? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingId(patentId);
      const tx = await contract.deletePatent(patentId);
      await tx.wait();
      setPatents((prev) => prev.filter((p) => p.id !== patentId));
      toast.success("Patent deleted successfully");
    } catch (err) {
      console.error("Error deleting patent:", err);
      toast.error("Failed to delete patent. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-green-500 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-md">{error}</div>;
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    patentId: number
  ) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles((prev) => ({
        ...prev,
        [patentId]: e.target.files![0],
      }));
    }
  };

  const handleAddIPFSHash = async (patentId: number) => {
    const file = selectedFiles[patentId];
    if (!contract || !file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploadingHash(patentId);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // First, upload to IPFS via Pinata
      
            
      const uploadRes = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: formData,
      }
      );

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || "Failed to upload to IPFS");
      }

      const result = await uploadRes.json();
      const ipfsHash = result.IpfsHash;

      // Then add the hash to the patent
      const tx = await contract.addIPFSHash(patentId, ipfsHash);
      await tx.wait();

      // Update local state
      setPatents((prev) =>
        prev.map((patent) =>
          patent.id === patentId
            ? {
                ...patent,
                ipfsHashes: [...patent.ipfsHashes, ipfsHash],
              }
            : patent
        )
      );

      toast.success("File added successfully");
setSelectedFiles(prev => ({
  ...prev,
  [patentId]: null
}));
    } catch (err) {
      console.error("Error adding file:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to add file. Please try again."
      );
    } finally {
      setUploadingHash(null);
    }
  };

  return (
    <div className="p-10 mx-10 max-w-6xl bg-white rounded-lg shadow-md sm:mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Patents</h1>
      </div>

      {patents.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <FiFileText className="mx-auto w-12 h-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No patents found
          </h3>
          <p className="mt-1 text-gray-500">
            You haven't created any patents yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <FiFile className="inline mr-1" /> Files
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <FiClock className="inline mr-1" /> Submitted
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patents.map((patent) => (
                  <tr key={patent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {patent.title || "Untitled Patent"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {editingId === patent.id ? (
                          <div className="mt-1">
                            <textarea
                              value={newDescription}
                              onChange={(e) =>
                                setNewDescription(e.target.value)
                              }
                              className="p-2 w-full text-xs rounded border"
                              rows={3}
                              placeholder="Enter description"
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                onClick={() => handleSaveEdit(patent.id)}
                                className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              handleEdit(patent.id, patent.description)
                            }
                          >
                            {patent.description || "No description"}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {patent.ipfsHashes?.map((hash, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2"
                          >
                            <a
                              href={`https://ipfs.io/ipfs/${hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-blue-500 hover:underline"
                            >
                              <FiFile className="mr-1" /> File {idx + 1}
                            </a>
                          </div>
                        ))}

                        <div className="relative">
                          {uploadingHash === patent.id ? (
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="mr-2 w-4 h-4 rounded-full border-t-2 border-blue-500 border-solid animate-spin"></div>
                              Uploading...
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-2">
                              <label className="flex items-center text-xs text-blue-500 cursor-pointer hover:underline">
                                <FiPlus className="mr-1" />
                                Add File
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleFileChange(e, patent.id)
                                  }
                                  data-patent-id={patent.id.toString()}
                                />
                              </label>
                              {selectedFiles[patent.id] && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-600 truncate max-w-[120px]">
                                    {selectedFiles[patent.id]?.name}
                                  </span>
                                  <button
                                    onClick={() => handleAddIPFSHash(patent.id)}
                                    className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                                    disabled={!selectedFiles[patent.id]}
                                  >
                                    <FiUpload className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {patent.timestamp
                        ? formatDistanceToNow(
                            new Date(patent.timestamp * 1000),
                            { addSuffix: true }
                          )
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            handleEdit(patent.id, patent.description)
                          }
                          disabled={
                            deletingId === patent.id || editingId === patent.id
                          }
                          className="p-2 text-blue-600 rounded-full transition-colors duration-200 hover:bg-blue-50 disabled:opacity-50"
                          title="Edit Description"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patent.id)}
                          disabled={
                            deletingId === patent.id || editingId === patent.id
                          }
                          className="p-2 text-red-600 rounded-full transition-colors duration-200 hover:bg-red-50 disabled:opacity-50"
                          title="Delete Patent"
                        >
                          {deletingId === patent.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-red-600 animate-spin border-t-transparent"></div>
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPatents;
