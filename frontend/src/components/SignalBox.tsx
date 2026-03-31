interface SignalBoxProps {
  asset: string;
  type: 'bullish' | 'bearish';
  signalText: string;
  reasoning: string;
  actionText: string;
  lastUpdate: string;
}

function SignalBox({
  asset,
  type,
  signalText,
  reasoning,
  actionText,
  lastUpdate
}: SignalBoxProps) {
  
  const isBullish = type === 'bullish';
  
  const baseColor = isBullish ? 'text-emerald-400' : 'text-rose-400';
  const borderColor = isBullish ? 'border-emerald-900/60' : 'border-rose-900/60';
  const bgColor = isBullish ? 'bg-emerald-950/10' : 'bg-rose-950/10';
  const icon = isBullish ? '▲' : '▼';

  return (
    <div className={`border border-gray-700/60 bg-[#121212] rounded p-4 flex flex-col justify-between font-mono h-full`}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-gray-700/60 pb-2">
          <div className="text-[10px] text-gray-500 tracking-widest uppercase">{asset} TRADE SIGNAL</div>
        </div>

        {/* The tinted signal box inside the card */}
        <div className={`border ${borderColor} ${bgColor} p-3 rounded-sm`}>
          <div className={`text-lg font-bold tracking-widest ${baseColor} mb-2`}>
            {signalText}
          </div>
          <div className="text-xs text-gray-400 flex items-start gap-2 leading-relaxed">
            <span className="text-gray-600 mt-0.5">✓</span>
            <p>{reasoning}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col mt-4">
        <div className={`py-2 px-3 border ${borderColor} ${baseColor} text-xs font-bold flex items-center gap-2 bg-[#0d0d0d] rounded-sm`}>
          <span>{icon}</span> {actionText}
        </div>

        <div className="text-[10px] text-gray-600 mt-3 uppercase tracking-widest px-1">
          LAST UPDATE: {lastUpdate}
        </div>
      </div>
    </div>
  );
}

export { SignalBox };