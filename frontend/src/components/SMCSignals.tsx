import { useState, useEffect } from 'react';

interface Signal {
  type: string;
  time: string;
  zone: string;
  gap_size: number;
}

export default function SMCSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        // Ping our Python API
        const response = await fetch('http://127.0.0.1:8000/api/signals');
        const data = await response.json();
        
        if (data.status === 'success') {
          setSignals(data.active_signals);
        }
      } catch (error) {
        console.error("🔴 Error fetching SMC signals from Python:", error);
      } finally {
        setLoading(false);
      }
    };

    // 1. Fetch immediately when the component loads
    fetchSignals();

    // 2. Set an interval to fetch fresh data every 60 seconds
    const interval = setInterval(fetchSignals, 60000);
    
    // Cleanup the interval if the user navigates away
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 text-white max-w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-tight">Active FVGs</h2>
        <span className="text-xs font-medium px-2 py-1 bg-gray-800 rounded text-gray-400">
          BTC/USDT • 15m
        </span>
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-sm">Scanning market data...</div>
      ) : signals.length === 0 ? (
        <div className="text-gray-500 text-sm italic bg-gray-800/50 p-4 rounded-lg text-center">
          ⚖️ Market is balanced. No active signals.
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((sig, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border flex flex-col gap-1 ${
                sig.type.includes('BULLISH') 
                  ? 'bg-green-900/20 border-green-800/50 text-green-400' 
                  : 'bg-red-900/20 border-red-800/50 text-red-400'
              }`}
            >
              <div className="flex justify-between font-semibold">
                <span>{sig.type.includes('BULLISH') ? '🟢' : '🔴'} {sig.type}</span>
                <span className="text-xs opacity-75">{sig.time.split(' ')[1]}</span>
              </div>
              <div className="text-sm font-mono text-gray-300">
                Zone: <span className="text-white">{sig.zone}</span>
              </div>
              <div className="text-xs opacity-70">
                Gap Size: {sig.gap_size} points
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}