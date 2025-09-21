import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism, base, sepolia, avalanche } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Wallet Monitor',
  projectId: 'demo-project-id', // Demo ID for development
  chains: [mainnet, base, optimism, avalanche],
  ssr: false,
});
