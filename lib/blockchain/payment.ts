import { parseEther, formatEther } from 'viem';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Payment recipient address (platform wallet)
// Default: Account #0 from local Hardhat/Anvil node
export const PLATFORM_ETH_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_ETH_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
export const PLATFORM_SOL_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_SOL_ADDRESS || '11111111111111111111111111111111';

// Cache for conversion rate (5 minutes)
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fallback rate if API fails (approximate: 1 ETH ≈ 25 SOL)
const FALLBACK_RATE = 0.04;

/**
 * Fetch current ETH/SOL conversion rate from CoinGecko API
 * Returns the rate: 1 ETH = X SOL
 */
export async function getEthToSolRate(): Promise<number> {
  // Check cache first
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate;
  }

  try {
    // Fetch ETH and SOL prices in USD from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ethereum?.usd || !data.solana?.usd) {
      throw new Error('Invalid response from CoinGecko API');
    }

    const ethPrice = data.ethereum.usd;
    const solPrice = data.solana.usd;

    // Calculate rate: 1 ETH = (ETH price / SOL price) SOL
    const rate = ethPrice / solPrice;

    // Cache the result
    cachedRate = {
      rate,
      timestamp: Date.now(),
    };

    return rate;
  } catch (error) {
    console.error('Failed to fetch conversion rate from CoinGecko:', error);
    
    // Use cached rate if available, otherwise fallback
    if (cachedRate) {
      console.warn('Using cached conversion rate');
      return cachedRate.rate;
    }
    
    console.warn('Using fallback conversion rate');
    return FALLBACK_RATE;
  }
}

/**
 * Convert ETH amount to SOL using current market rate
 */
export async function convertEthToSol(ethAmount: string): Promise<string> {
  const eth = parseFloat(ethAmount);
  if (isNaN(eth) || eth <= 0) {
    throw new Error('Invalid ETH amount');
  }

  const rate = await getEthToSolRate();
  const solAmount = eth / rate;
  return solAmount.toFixed(9);
}

/**
 * Convert SOL amount to ETH using current market rate
 */
export async function convertSolToEth(solAmount: string): Promise<string> {
  const sol = parseFloat(solAmount);
  if (isNaN(sol) || sol <= 0) {
    throw new Error('Invalid SOL amount');
  }

  const rate = await getEthToSolRate();
  const ethAmount = sol * rate;
  return ethAmount.toFixed(6);
}

