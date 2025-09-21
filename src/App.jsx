import WalletConnect from './components/WalletConnect'
import WalletMonitor from './components/WalletMonitor'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Wallet Monitor</h1>
      </header>
      
      <main className="app-main">
        <WalletConnect />
        <WalletMonitor />
      </main>
    </div>
  )
}

export default App
