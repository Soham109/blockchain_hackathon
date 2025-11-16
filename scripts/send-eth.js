import { createWalletClient, createPublicClient, http, parseEther, formatEther, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Define local Hardhat chain with correct chain ID
const localHardhat = defineChain({
  id: 1337,
  name: 'Local Hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
});

// Test account with 10,000 ETH (from Hardhat node)
const senderPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Get recipient address from command line argument
const recipientAddress = process.argv[2];

if (!recipientAddress) {
  console.log('Usage: node scripts/send-eth.js <recipient-address>');
  console.log('\nExample: node scripts/send-eth.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  process.exit(1);
}

// Validate address format (basic check)
if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
  console.error('Error: Invalid Ethereum address format');
  process.exit(1);
}

async function sendETH() {
  try {
    // Create account from private key
    const account = privateKeyToAccount(senderPrivateKey);
    
    // Create public client for reading balances
    const publicClient = createPublicClient({
      chain: localHardhat,
      transport: http('http://127.0.0.1:8545'),
    });

    // Create wallet client for sending transactions
    const walletClient = createWalletClient({
      account,
      chain: localHardhat,
      transport: http('http://127.0.0.1:8545'),
    });

    // Check sender balance
    const senderBalance = await publicClient.getBalance({ address: account.address });
    console.log(`Sender balance: ${formatEther(senderBalance)} ETH`);

    // Amount to send (999 ETH)
    const amount = parseEther('999');

    if (senderBalance < amount) {
      console.error(`Error: Insufficient balance. Need ${formatEther(amount)} ETH, have ${formatEther(senderBalance)} ETH`);
      process.exit(1);
    }

    // Send transaction
    console.log(`\nSending 999 ETH to ${recipientAddress}...`);
    const hash = await walletClient.sendTransaction({
      to: recipientAddress,
      value: amount,
    });

    console.log(`Transaction hash: ${hash}`);
    console.log('Waiting for confirmation...');

    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`\n✅ Transaction confirmed!`);
    console.log(`Block number: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    // Check recipient balance
    const recipientBalance = await publicClient.getBalance({ address: recipientAddress });
    console.log(`\nRecipient balance: ${formatEther(recipientBalance)} ETH`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

sendETH();

