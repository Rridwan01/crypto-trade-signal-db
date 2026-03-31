interface ZonesTableProps {
  asset: string;
  supplyHigh: string;
  supplyLow: string;
  demandHigh: string;
  demandLow: string;
}

function ZonesTable({
  asset,
  supplyHigh,
  supplyLow,
  demandHigh,
  demandLow
}: ZonesTableProps) {
  return (
    <div className="w-full font-mono text-sm">
      <div className="flex justify-between items-center mb-2 px-1">
         <div className="text-[10px] text-emerald-400 tracking-widest uppercase">{asset} ZONES</div>
         <div className="text-[10px] text-gray-500 uppercase tracking-widest">ZONE LEVELS</div>
      </div>
      
      {/* Partitioned Data Box */}
      <div className="border border-gray-700/60 rounded bg-[#0d0d0d] overflow-hidden">
        {/* Divide X creates the vertical center line, Divide Y creates the horizontal lines */}
        <div className="grid grid-cols-2 divide-x divide-gray-700/60">
          
          {/* Top Left: Supply High */}
          <div className="p-3 flex flex-col gap-1 border-b border-gray-700/60">
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">SUPPLY HIGH</div>
            <div className="text-gray-200 text-sm">e.g. {supplyHigh}</div>
          </div>

          {/* Top Right: Supply Low */}
          <div className="p-3 flex flex-col gap-1 border-b border-gray-700/60">
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">SUPPLY LOW</div>
            <div className="text-gray-200 text-sm">e.g. {supplyLow}</div>
          </div>

          {/* Bottom Left: Demand High */}
          <div className="p-3 flex flex-col gap-1">
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">DEMAND HIGH</div>
            <div className="text-gray-200 text-sm">e.g. {demandHigh}</div>
          </div>

          {/* Bottom Right: Demand Low */}
          <div className="p-3 flex flex-col gap-1">
            <div className="text-gray-500 text-[10px] uppercase tracking-widest">DEMAND LOW</div>
            <div className="text-gray-200 text-sm">e.g. {demandLow}</div>
          </div>

        </div>
      </div>
      
      <div className="flex justify-end mt-2 px-1">
        <button className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest cursor-pointer">
          Recalc
        </button>
      </div>
    </div>
  );
}

export { ZonesTable };