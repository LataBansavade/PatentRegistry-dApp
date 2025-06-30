import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  FiUpload,
  FiX,
  FiFile,
  FiLoader,
  FiCheckCircle,
 
} from "react-icons/fi";
import { useContract } from "../Provider/ContractProvider";
import toast, { Toaster } from "react-hot-toast";
import * as Client from "@web3-storage/w3up-client";

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  preview: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  cid?: string;
  url: string;
  urls?: string[];
  error?: string;
}

const Web3Uploader = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client.Client | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { contract, isConnected } = useContract() || {};

  const initializeClient = async () => {
    if (!userEmail) {
      toast.error("Please enter your email to authenticate.");
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const c = await Client.create();
      await handleLogin(c);
    } catch (err) {
      const msg = "Failed to initialize Web3.Storage client.";
      console.error(msg, err);
      toast.error(msg);
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogin = async (c: Client.Client) => {
    const toastId = toast.loading("Authenticating with Web3.Storage...");

    try {
      await c.login(userEmail as `${string}@${string}`);

      toast.loading("Setting up storage space...", { id: toastId });

      const spaces = await c.spaces();

      let space;
      if (spaces.length > 0) {
        space = spaces[0];
      } else {
        space = await c.createSpace("patent-registry-space");
        const recovery = `did:mailto:${userEmail}` as const;
        await space.createRecovery(recovery);
      }

      await c.setCurrentSpace(space.did());

      setClient(c);
      setIsAuthenticated(true);

      toast.success("Connected to Web3.Storage!", { id: toastId });
    } catch (err) {
      const msg = "Authentication failed. Please try again.";
      console.error(msg, err);
      toast.error(msg, { id: toastId });
      setError(msg);
    }
  };

  const uploadToIPFS = async (file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      if (!client) throw new Error("Web3 client not initialized");

      const rootCid = await client.uploadFile(file);
      const cid = rootCid.toString();

      await new Promise((r) => setTimeout(r, 1000));

      const urls = [
        `https://ipfs.io/ipfs/${cid}/${encodeURIComponent(file.name)}`,
        `https://${cid}.ipfs.dweb.link/${encodeURIComponent(file.name)}`,
        `https://gateway.pinata.cloud/ipfs/${cid}/${encodeURIComponent(file.name)}`,
        `https://${cid}.ipfs.cf-ipfs.com/${encodeURIComponent(file.name)}`,
      ];

      toast.success(`Uploaded ${file.name}`, { id: toastId });

      return { cid, url: urls[0], urls, pinSize: 0, timestamp: new Date().toISOString() };
    } catch (err) {
      const msg = `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`;
      toast.error(msg, { id: toastId });
      throw new Error(msg);
    }
  };

  const uploadFiles = async () => {
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: "uploading",
      }))
    );

    const uploaded = await Promise.all(
      files.map(async (f, index) => {
        try {
          const res = await uploadToIPFS(f.file);
          const updated = {
            ...f,
            status: "uploaded" as const, 
            cid: res.cid,
            url: res.url,
            urls: res.urls,
          };
          

          setFiles((prev) => prev.map((x, i) => (i === index ? updated : x)));

          return res;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload error";
          setFiles((prev) =>
            prev.map((x, i) =>
              i === index
                ? {
                    ...x,
                    status: "error",
                    error: msg,
                  }
                : x
            )
          );
          return null;
        }
      })
    );

    return uploaded.filter(Boolean) as {
      cid: string;
      url: string;
      urls: string[];
      pinSize: number;
      timestamp: string;
    }[];
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file): UploadedFile => ({
        file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        status: "pending",
        url: "#",
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setTransactionHash(null);

    if (!isConnected || !contract) {
      toast.error("Please connect your wallet first.", {
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#ef4444',
          backgroundColor: '#fef2f2',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      });
      return;
    }

    if (!client) {
      toast.error("Please authenticate with Web3.Storage first.");
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    const toastId = toast.loading("Uploading and submitting patent...");

    try {
      setIsUploading(true);
      setIsSubmitting(true);

      const uploaded = await uploadFiles();
      if (uploaded.length === 0) {
        throw new Error("No files uploaded.");
      }

      const tx = await contract.createPatent(
        title,
        description,
        uploaded.map((f) => f.cid)
      );
      setTransactionHash(tx.hash);

      await tx.wait();

      toast.success("Patent created successfully!", { id: toastId });
      setTitle("");
      setDescription("");
      setFiles([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error(msg, { id: toastId });
      setError(msg);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-5 min-h-screen text-black bg-black">
      <div className="p-10 mx-auto max-w-3xl bg-white rounded-lg shadow-md">
        <Toaster position="top-right" />
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Create New Patent</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="px-4 py-2 w-full rounded-md border"
              placeholder="your@email.com"
              required
            />
            <button
              type="button"
              className="px-4 py-2 mt-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              onClick={initializeClient}
              disabled={isInitializing || isAuthenticated}
            >
              {isAuthenticated ? "Authenticated" : isInitializing ? "Connecting..." : "Connect to Web3.Storage"}
            </button>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Patent Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-2 w-full rounded-md border"
              placeholder="Enter title"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="px-4 py-2 w-full rounded-md border"
              placeholder="Describe your patent"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Upload Files</label>
            <div
              className="p-6 text-center rounded-md border-2 border-dashed cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload className="mx-auto w-8 h-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Click or drag & drop</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          {files.length > 0 && (
            <div className="overflow-y-auto p-3 mt-4 space-y-2 max-h-60 rounded-md border">
              {files.map((file, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 truncate">
                    {file.status === "uploaded" ? (
                      <FiCheckCircle className="text-green-500" />
                    ) : file.status === "error" ? (
                      <FiX className="text-red-500" />
                    ) : file.status === "uploading" ? (
                      <FiLoader className="text-blue-500 animate-spin" />
                    ) : (
                      <FiFile />
                    )}
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={file.status === "uploading"}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}

          {transactionHash && (
            <div className="p-2 text-sm text-green-700 bg-green-100 rounded-md">
              View on Etherscan:{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {transactionHash.slice(0, 20)}...
              </a>
            </div>
          )}

          {error && <div className="p-2 text-red-700 bg-red-100 rounded-md">{error}</div>}

          <button
            type="submit"
            disabled={(!title || !description || isSubmitting || isUploading)}
            className="px-6 py-2 w-full text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isUploading || isSubmitting ? "Processing..." : "Create Patent"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Web3Uploader;
