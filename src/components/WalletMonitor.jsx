import { useAccount, useBalance, useBlockNumber } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import GenericAssetList from './GenericAssetList';

export default function WalletMonitor() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const { data: blockNumber } = useBlockNumber();

  // Example: Fetch transaction history (you'll need to implement this)
  const { data: transactions } = useQuery({
    queryKey: ['transactions', address],
    queryFn: async () => {
      if (!address) return [];
      // This is a placeholder - you'll implement actual transaction fetching
      return [];
    },
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <div className="wallet-monitor">
        <p>Please connect your wallet to monitor it</p>
      </div>
    );
  }

  return (
    <div className="wallet-monitor">      
      <GenericAssetList />
      <div className="transactions">
        <h3>Recent Transactions</h3>
        {transactions && transactions.length > 0 ? (
          <ul>
            {transactions.map((tx, index) => (
              <li key={index}>{tx.hash}</li>
            ))}
          </ul>
        ) : (
          <p>No transactions found</p>
        )}
      </div>
    </div>
  );
}
