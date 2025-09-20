import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  return (
    <div className="wallet-connect">
      <ConnectButton />
      
      {isConnected && (
        <div className="wallet-info">
          <h3>Wallet Connected!</h3>
          <p><strong>Address:</strong> {address}</p>
          {balance && (
            <p><strong>Balance:</strong> {balance.formatted} {balance.symbol}</p>
          )}
        </div>
      )}
    </div>
  );
}
