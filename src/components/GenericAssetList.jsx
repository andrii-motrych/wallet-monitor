import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits, isAddress } from 'viem';
import { useState, useEffect } from 'react';

// ERC-20 ABI for token detection
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

// Focused token addresses for Base and Optimism
const COMMON_TOKENS = {
  8453: { // Base
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  },
  10: { // Optimism
    '0x4200000000000000000000000000000000000042': { symbol: 'OP', name: 'Optimism', decimals: 18 },
  },
  1: { // Ethereum
    '0xA0b86a33E6441b8C4C8C0e4b8b8C8C0e4b8b8C8C0': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  },
  // avalanche
  43114: { // Avalanche
    '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    '0x60781C2586D68229fde47564546784ab3fACA982': { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
  },
};

// Token symbol to CoinGecko ID mapping
const TOKEN_COINGECKO_IDS = {
  'USDC': 'usd-coin',
  'OP': 'optimism',
  'ETH': 'ethereum',
  'WETH': 'weth'
};

// Fetch token price from CoinGecko API
const fetchTokenPrice = async (tokenSymbol) => {
  try {
    const coingeckoId = TOKEN_COINGECKO_IDS[tokenSymbol] || tokenSymbol.toLowerCase();
    console.log(`Fetching price for ${tokenSymbol} (${coingeckoId})`);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data[coingeckoId]?.usd || 0;
    console.log(`Price for ${tokenSymbol}: $${price}`);
    return price;
  } catch (error) {
    console.error('Error fetching token price for', tokenSymbol, ':', error);
    return 0;
  }
};

// Get token logo from various sources
const getTokenLogo = (symbol, address) => {
  const logos = {
    'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    'OP': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
    'WETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png'
  };
  
  return logos[symbol] || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
};

// Token balance component
function TokenBalance({ contractAddress, tokenInfo, walletAddress, chainId }) {
  const { data: balance } = useReadContract({
    address: contractAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [walletAddress],
    chainId: chainId,
  });

  const { data: price, isLoading: priceLoading } = useQuery({
    queryKey: ['tokenPrice', tokenInfo.symbol],
    queryFn: () => fetchTokenPrice(tokenInfo.symbol),
    staleTime: 60000, // 1 minute
  });

  if (!balance || balance === 0n) return null;

  const formattedBalance = formatUnits(balance, tokenInfo.decimals);
  const usdValue = price ? (parseFloat(formattedBalance) * price) : 0;

  return (
    <div className="token-item">
      <div className="token-info">
        <img 
          src={getTokenLogo(tokenInfo.symbol, contractAddress)} 
          alt={tokenInfo.symbol} 
          className="token-logo"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="token-details">
          <span className="token-name">{tokenInfo.name}</span>
          <span className="token-symbol">{tokenInfo.symbol}</span>
        </div>
      </div>
      <div className="token-balance">
        <div className="token-amount">
          {parseFloat(formattedBalance).toFixed(6)} {tokenInfo.symbol}
        </div>
        <div className="token-usd">
          {priceLoading ? 'Loading...' : `$${usdValue.toFixed(2)}`}
        </div>
      </div>
    </div>
  );
}

export default function GenericAssetList() {
  const { address, isConnected, chainId } = useAccount();
  const { data: ethBalance } = useBalance({
    address: address,
  });

  const { data: ethPrice, isLoading: ethPriceLoading } = useQuery({
    queryKey: ['ethPrice'],
    queryFn: () => fetchTokenPrice('ethereum'),
    staleTime: 60000,
  });

  if (!isConnected) {
    return (
      <div className="asset-list">
        <h3>Wallet Assets</h3>
        <p>Connect your wallet to view assets</p>
      </div>
    );
  }

  const tokens = COMMON_TOKENS[chainId] || {};
  const ethUsdValue = ethPrice && ethBalance ? 
    (parseFloat(ethBalance.formatted) * ethPrice) : 0;

  const networkNames = {
    8453: 'Base',
    10: 'Optimism',
    43114: 'Avalanche',
    1: 'Ethereum'
  };

  return (
    <div className="asset-list">
      <h3>Wallet Assets</h3>
      <div className="network-info">
        <span className="network-name">{networkNames[chainId] || `Chain ${chainId}`}</span>
      </div>
      
      {/* Native ETH Balance */}
      {ethBalance && (
        <div className="token-item native-token">
          <div className="token-info">
            <div className="token-logo eth-logo">Ξ</div>
            <div className="token-details">
              <span className="token-name">Ethereum</span>
              <span className="token-symbol">ETH</span>
            </div>
          </div>
          <div className="token-balance">
            <div className="token-amount">
              {ethBalance.formatted} ETH
            </div>
            <div className="token-usd">
              {ethPriceLoading ? 'Loading...' : `$${ethUsdValue.toFixed(2)}`}
            </div>
          </div>
        </div>
      )}

      {/* ERC-20 Token Balances */}
      {Object.entries(tokens).map(([contractAddress, tokenInfo]) => (
        <TokenBalance
          key={contractAddress}
          contractAddress={contractAddress}
          tokenInfo={tokenInfo}
          walletAddress={address}
          chainId={chainId}
        />
      ))}

      {Object.keys(tokens).length === 0 && (
        <p className="no-tokens">No common tokens detected on this network</p>
      )}
    </div>
  );
}
