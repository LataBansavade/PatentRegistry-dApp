# Patent DApp Testing Guide

## 🚀 Quick Start
1. **Install MetaMask** - [Download here](https://metamask.io/download/)
2. **Get Sepolia ETH** - Use a faucet:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Faucet](https://www.infura.io/faucet/sepolia)
   - [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)
3. **Add Sepolia Testnet** to MetaMask (or use the table below)
4. **Connect** to the DApp and start testing!

## 🔗 Network Configuration

| Setting | Value |
|---------|-------|
| Network Name | Sepolia Testnet |
| RPC URL | `https://rpc.sepolia.org` |
| Chain ID | 11155111 |
| Currency | SepoliaETH |
| Block Explorer | https://sepolia.etherscan.io |

## 🧪 Test Cases

### 1. Create a New Patent
- [ ] Connect your wallet
- [ ] Click "Create Patent"
- [ ] Fill in title and description
- [ ] Upload a test file (PDF, DOC, or image)
- [ ] Submit and confirm in MetaMask
- [ ] Verify transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)

### 2. View All Patents
- [ ] Visit the "All Patents" page
- [ ] Verify your new patent appears
- [ ] Check that all fields display correctly

### 3. Edit Patent
- [ ] Go to "My Patents"
- [ ] Click the edit (✏️) icon
- [ ] Update the description
- [ ] Save changes
- [ ] Verify the update is reflected

### 4. Add Files to Patent
- [ ] In "My Patents", find your patent
- [ ] Click "Add File"
- [ ] Select a file to upload
- [ ] Confirm the upload
- [ ] Verify the file appears in the list

### 5. Delete Patent
- [ ] In "My Patents", find your patent
- [ ] Click the delete (🗑️) icon
- [ ] Confirm deletion
- [ ] Verify it's removed from "My Patents"
- [ ] Verify it's no longer in "All Patents"

## ⚠️ Common Issues & Solutions

### Transaction Failing
- **Issue**: Transaction keeps failing
- **Solution**:
  1. Check you have enough Sepolia ETH for gas
  2. Try increasing gas limit by 30%
  3. Make sure you're on Sepolia Testnet

### Can't See My Patent
- **Issue**: Created patent not showing up
- **Solution**:
  1. Wait 15-30 seconds and refresh
  2. Check if the transaction was successful on Etherscan
  3. Clear browser cache and reconnect wallet

### File Upload Issues
- **Issue**: File not uploading
- **Solution**:
  1. Check file size (<10MB recommended)
  2. Try a different file format
  3. Check browser console for errors (F12 > Console)

## 📝 Test Data

### Sample Patent 1
- **Title**: Quantum Computing Breakthrough
- **Description**: Novel approach to qubit stabilization using...
- **File**: [Sample PDF](https://example.com/sample.pdf)

### Sample Patent 2
- **Title**: Renewable Energy Storage System
- **Description**: Efficient energy storage solution for...
- **File**: [Sample DOC](https://example.com/sample.docx)


## 📞 Support

If you encounter any issues:
1. Check the browser console for errors (F12 > Console)
2. Verify your transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)
3. Contact support with:
   - Your wallet address
   - Transaction hash (if any)
   - Screenshot of the issue
   - Steps to reproduce

## 🎯 Testing Goals

- [ ] Test all core functionalities
- [ ] Verify all error messages are user-friendly
- [ ] Test on different screen sizes
- [ ] Verify all links and buttons work
- [ ] Test with multiple file types
- [ ] Verify all wallet connections work
- [ ] Test transaction success/failure cases

Happy Testing! 🎉
