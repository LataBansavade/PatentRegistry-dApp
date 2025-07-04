import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { FiUpload, FiX, FiFile, FiLoader, FiCheckCircle, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import { useContract } from '../Provider/ContractProvider';
import toast, { Toaster } from 'react-hot-toast';


interface UploadedFile {
  file: File;
  name: string;
  size: number;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  cid?: string;
  url?: string;
}

const CreatePatent = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [patentCreated, setPatentCreated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  
  // Show error toasts when error state changes
  const showErrorToast = (message: string) => {
    // Dismiss any existing error toasts to prevent duplicates
    toast.dismiss();
    toast.error(message, {
      icon: <FiAlertCircle className="text-red-500" />,
      duration: 5000,
      style: {
        background: '#FEE2E2',
        color: '#B91C1C',
        border: '1px solid #FCA5A5',
      },
    });
  };
  
  const contractContext = useContract();
  const {contract, isConnected} = contractContext || {};
  
  const uploadToIPFS = async (file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      // Hardcoded JWT token for Pinata
      const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkNjYxYjgwYy02MjMyLTQzOTktYjE3Zi05ZTNmYjlkMGJjNTAiLCJlbWFpbCI6ImxhdGFiYW5zYXZhZGUyNEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZTEwZThhYmU5ZWQ5ODNjNzhlMDAiLCJzY29wZWRLZXlTZWNyZXQiOiIwNDQxZmQ4MDNlZjVkY2Y2MWFjMWYyZjQxZTM5ZGE3ZWIyZmI2OGVlNDI1YTk2ZmRhMDg4YzQ5NGEzY2UyOWNiIiwiZXhwIjoxNzgyMjk4MDMzfQ.eiF4rWIbmc9kghOxk-T6nA6dYlZ3qJCCP0ZozwNZ_mY";
      
      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = {
        name: file.name,
        keyvalues: {
          description: 'Patent document',
          uploadedBy: 'Patent DApp'
        }
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));
      formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        const errorMsg = `Failed to upload ${file.name}: ${result.error?.details || 'Unknown error'}`;
        toast.error(errorMsg, { 
          id: toastId,
          icon: <FiAlertCircle className="text-red-500" />
        });
        throw new Error(errorMsg);
      }
      
      
      
      return {
        cid: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        pinSize: result.PinSize,
        timestamp: result.Timestamp
      };
    } catch (error) {
      const errorMsg = `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMsg, { 
        id: toastId,
        icon: <FiAlertCircle className="text-red-500" />
      });
      throw new Error(errorMsg);
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      return [];
    }

    setFiles(prevFiles => 
      prevFiles.map(file => ({
        ...file,
        status: 'uploading' as const
      }))
    );

    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          const result = await uploadToIPFS(file.file);
          
          setFiles(prevFiles => 
            prevFiles.map((f, i) => 
              i === index 
                ? { ...f, status: 'uploaded' as const, cid: result.cid, url: result.url }
                : f
            )
          );
          
          return result;
        } catch (error) {
          setFiles(prevFiles => 
            prevFiles.map((f, i) => 
              i === index 
                ? { 
                    ...f, 
                    status: 'error' as const, 
                    error: error instanceof Error ? error.message : 'Upload failed' 
                  }
                : f
            )
          );
          
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      return results.filter((result): result is { 
        cid: string; 
        url: string;
        pinSize: number;
        timestamp: string;
      } => result !== null);
    } catch (error) {
      // console.error('Error in uploadFiles:', error);
      throw new Error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        status: 'pending' as const
      }));
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFiles([]);
    setFilesUploaded(false);
    setPaymentDone(false);
    setPatentCreated(false);
    setTransactionHash(null);
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDone = () => {
    resetForm();
    // Optional: Scroll to top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadFiles = async () => {
    setError(null);
    
    if (files.length === 0) {
      const errorMsg = 'Please upload at least one file';
      setError(errorMsg);
      showErrorToast(errorMsg);
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload files to IPFS
      const uploadedFiles = await uploadFiles();
      const successfulUploads = uploadedFiles.filter(Boolean);
      
      if (successfulUploads.length === 0) {
        throw new Error('Failed to upload files. Please try again.');
      }
      
      setFilesUploaded(true);
      toast.success('Files uploaded successfully!', {
        icon: <FiCheckCircle className="text-green-500" />,
        duration: 3000,
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!isConnected || !contract) {
      const errorMsg = 'Please connect your wallet first';
      setError(errorMsg);
      showErrorToast(errorMsg);
      return;
    }
    
    if (!filesUploaded) {
      const errorMsg = 'Please upload files first';
      setError(errorMsg);
      showErrorToast(errorMsg);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get CIDs of all uploaded files
      const cids = files
        .filter(file => file.status === 'uploaded' && file.cid)
        .map(file => file.cid as string);
      
      if (cids.length === 0) {
        throw new Error('No valid file uploads found');
      }
      
      // Call the smart contract
      const tx = await contract.createPatent(title, description, cids);
      setTransactionHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      setPaymentDone(true);
      setPatentCreated(true);
      
      toast.success('Payment successful! Patent created.', {
        icon: <FiCheckCircle className="text-green-500" />,
        duration: 5000,
        style: {
          background: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
        },
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  console.log("error",error)

  
  return (
    <div className="py-5 min-h-screen bg-black">
      <div className="relative p-10 mx-10 max-w-3xl bg-white rounded-lg shadow-md sm:mx-auto">
        {
          !isConnected && (
            <p className='mb-5 text-xs text-red-500'>** Please connect your wallet to create a patent **</p>
          ) 
        }
        {/* Steps Indicator */}
        <div className="mb-8">
          <h2 className="sr-only">Patent Creation Steps</h2>
          <div className="flex justify-between items-center">
            {/* Step 1: Upload Files */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${filesUploaded ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'} font-semibold`}>
                {filesUploaded ? '✓' : '1'}
              </div>
              <span className={`mt-2 text-sm font-medium ${filesUploaded ? 'text-green-600' : 'text-gray-500'}`}>
                {filesUploaded ? 'Files Uploaded' : 'Upload Files'}
              </span>
            </div>
            
            {/* Connector Line */}
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full ${paymentDone ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: paymentDone ? '100%' : '0%' }}></div>
            </div>
            
            {/* Step 2: Payment */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${paymentDone ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'} font-semibold`}>
                {paymentDone ? '✓' : '2'}
              </div>
              <span className={`mt-2 text-sm font-medium ${paymentDone ? 'text-green-600' : 'text-gray-500'}`}>
                {paymentDone ? 'Payment Done' : 'Confirm Payment'}
              </span>
            </div>
            
            {/* Connector Line */}
            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
              <div className={`h-full ${patentCreated ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: patentCreated ? '100%' : '0%' }}></div>
            </div>
            
            {/* Step 3: View Patent */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${patentCreated ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'} font-semibold`}>
                {patentCreated ? '✓' : '3'}
              </div>
              <a 
                href="/my-patents" 
                className={`mt-2 text-sm font-medium ${patentCreated ? 'text-green-600 hover:underline' : 'text-gray-500'}`}
                style={{ pointerEvents: patentCreated ? 'auto' : 'none' }}
              >
              Create Patent 
              </a>
            </div>
          </div>
        </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-white shadow-lg rounded-lg border border-gray-200',
          success: {
            icon: <FiCheckCircle className="text-green-500" />,
          },
          error: {
            icon: <FiAlertCircle className="text-red-500" />,
          },
          loading: {
            icon: <div className="w-4 h-4 rounded-full border-2 border-blue-500 animate-spin border-t-transparent" />,
          }
        }}
      />
      <h1 className="mb-8 text-3xl font-bold text-gray-800">Create New Patent</h1>
      
      <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-1 text-sm font-medium text-gray-700">
            Patent Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter patent title"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="px-4 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Describe your patent in detail"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Upload Files
          </label>
          <div 
            className="p-8 text-center rounded-lg border-2 border-gray-300 border-dashed transition-colors cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="mx-auto w-12 h-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-green-600">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX, JPG, PNG (Max 50MB)
            </p>
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
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Selected files ({files.length}):</p>
              <div className="overflow-y-auto p-2 space-y-2 max-h-60 rounded-md border">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div className="flex overflow-hidden items-center space-x-2">
                      <div className="flex-shrink-0">
                        {file.status === 'uploading' ? (
                          <FiLoader className="text-blue-500 animate-spin" />
                        ) : file.status === 'uploaded' ? (
                          <FiCheckCircle className="text-green-500" />
                        ) : file.status === 'error' ? (
                          <FiX className="text-red-500" />
                        ) : (
                          <FiFile className="text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {formatFileSize(file.size)}
                          {file.cid && ` • CID: ${file.cid.substring(0, 10)}...`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === 'uploaded' && file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title="View on IPFS"
                        >
                          <FiExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Remove file"
                        disabled={file.status === 'uploading'}
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col pt-4 space-y-4">
         
          {transactionHash && (
            <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">
              Transaction submitted! View on Etherscan:{' '}
              <a 
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-800"
              >
                {transactionHash.substring(0, 20)}...
              </a>
            </div>
          )}
          
          <div className="flex flex-col space-y-4">
            {patentCreated && (
              <div className="p-4 bg-green-50 rounded-md border border-green-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FiCheckCircle className="mr-2 w-5 h-5 text-green-500" />
                    <p className="font-medium text-green-800">Patent created successfully!</p>
                  </div>
                  <a 
                    href="/my-patents"
                    className="px-4 py-2 text-white bg-green-600 rounded-md transition-colors hover:bg-green-700"
                  >
                    View My Patents
                  </a>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={patentCreated ? handleDone : handleCancel}
                className="px-4 py-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                disabled={isUploading || isSubmitting}
              >
                {patentCreated ? 'Done' : 'Cancel'}
              </button>
              {!filesUploaded ? (
                <button
                  type="button"
                  onClick={handleUploadFiles}
                  className="flex items-center px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading || !title || !description || files.length === 0}
                  title={!title ? 'Title is required' : !description ? 'Description is required' : files.length === 0 ? 'Please upload at least one file' : ''}
                >
                  {isUploading && <FiLoader className="mr-2 -ml-1 w-4 h-4 animate-spin" />}
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </button>
              ) : !patentCreated ? (
                <div className="flex flex-col items-end">
                  <button
                    type="button"
                    onClick={handleMakePayment}
                    className="flex items-center px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !isConnected}
                    title={!isConnected ? 'Please connect your wallet' : 'Proceed to payment'}
                  >
                    {isSubmitting && <FiLoader className="mr-2 -ml-1 w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Processing...' : 'Create Patent'}
                  </button>
                 
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </form>
    </div>
    </div>
  );
};

export default CreatePatent;