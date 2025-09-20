import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { useState, useEffect } from 'react';

// Common ERC-20 token contracts
const TOKEN_CONTRACTS = {
  // Ethereum mainnet tokens
  1: {
    '0xA0b86a33E6441b8C4C8C0e4b8b8C8C0e4b8b8C8C0': { // USDC
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
    },
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': { // USDT
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
    },
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': { // DAI
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png'
    },
    '0x514910771AF9Ca656af840dff83E8264EcF986CA': { // LINK
      name: 'Chainlink',
      symbol: 'LINK',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
    },
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': { // UNI
      name: 'Uniswap',
      symbol: 'UNI',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png'
    }
  }
};

// ERC-20 ABI for balanceOf function
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

// Fetch token price from CoinGecko API
const fetchTokenPrice = async (tokenId) => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[tokenId]?.usd || 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
  }
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
    queryFn: () => fetchTokenPrice(tokenInfo.coingeckoId || 'ethereum'),
    staleTime: 60000, // 1 minute
  });

  if (!balance || balance === 0n) return null;

  const formattedBalance = formatUnits(balance, tokenInfo.decimals);
  const usdValue = price ? (parseFloat(formattedBalance) * price) : 0;

  return (
    <div className="token-item">
      <div className="token-info">
        <img 
          src={tokenInfo.logo} 
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

export default function AssetList() {
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

  const tokens = TOKEN_CONTRACTS[chainId] || {};
  const ethUsdValue = ethPrice && ethBalance ? 
    (parseFloat(ethBalance.formatted) * ethPrice) : 0;

  return (
    <div className="asset-list">
      <h3>Wallet Assets</h3>
      
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

