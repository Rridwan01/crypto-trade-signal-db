interface Signal {
  type: string;
  time: string;
  zone: string;
  gap_size: number;
}

interface SMCSignalsProps {
  signals?: Signal[];
  loading: boolean;
  asset: string;
}

export default function SMCSignals({ signals = [], loading, asset }: SMCSignalsProps) {
  return (
    <div className="p-6 bg-[#161616] rounded-lg border border-gray-700/60 text-gray-300 shadow-2xl h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-gray-500">Active Algorithmic FVGs</h2>
        <span className="text-xs font-medium px-2 py-1 bg-gray-800 rounded text-gray-400">
          {asset}/USDT • 15m
        </span>
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-sm italic p-4 text-center">Scanning market data...</div>
      ) : signals.length === 0 ? (
        <div className="text-gray-500 text-sm italic bg-gray-800/30 p-4 rounded text-center">
          ⚖️ Market is balanced. No active signals.
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((sig, index) => (
            <div 
              key={index} 
              className={`p-3 rounded border flex flex-col gap-1 ${
                sig.type.includes('BULLISH') 
                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' 
                  : 'bg-rose-950/20 border-rose-900/50 text-rose-400'
              }`}
            >
              <div className="flex justify-between font-bold text-xs tracking-widest">
                <span>{sig.type.includes('BULLISH') ? '🟢' : '🔴'} {sig.type}</span>
                <span className="opacity-75">{sig.time.split(' ')[1]}</span>
              </div>
              <div className="text-sm font-mono text-gray-300 mt-1">
                Zone: <span className="text-white">{sig.zone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}