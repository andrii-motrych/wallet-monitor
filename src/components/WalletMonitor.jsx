import { useAccount, useBalance, useBlockNumber } from 'wagmi';
import { useQuery } from '@tanstack/react-query';

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
      <h2>Wallet Monitor</h2>
      
      <div className="wallet-stats">
        <div className="stat-card">
          <h3>Current Block</h3>
          <p>{blockNumber ? blockNumber.toString() : 'Loading...'}</p>
        </div>
        
        <div className="stat-card">
          <h3>Wallet Balance</h3>
          <p>
            {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Address</h3>
          <p className="address">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}
          </p>
        </div>
      </div>

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
