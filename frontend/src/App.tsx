import { useState } from "react";
import { SignalBox } from "./components/SignalBox";
import { ZonesTable } from "./components/ZonesTable";
import SMCSignals from "./components/SMCSignals";
import { useBybitTicker } from "./hooks/useBybitTicker";

const MARKET_DATA = {
  BTC: {
    name: "BITCOIN",
    price: "67,450.25",
    trend: "bullish",
    change: "+1.2%",
    signalText: "LONGS FAVORED",
    reasoning:
      "High conviction. BTC bullish + ETH bullish - classic crypto risk-on alignment confirmed.",
    actionText: "TAKE BTC LONG NOW - macro confirmed, zone + signal aligned",
    zones: {
      supplyHigh: "68,500",
      supplyLow: "67,800",
      demandHigh: "64,200",
      demandLow: "62,650",
    },
  },
  SOL: {
    name: "SOLANA",
    price: "185.30",
    trend: "bearish",
    change: "-0.8%",
    signalText: "SHORTS FAVORED",
    reasoning:
      "Divergence noted. SOL bearish + ETH mixed - specific asset divergence, SOL selling off.",
    actionText:
      "TAKE SOL SHORT NOW - asset weakness confirmed, resistance held",
    zones: {
      supplyHigh: "205.00",
      supplyLow: "198.50",
      demandHigh: "172.00",
      demandLow: "160.00",
    },
  },
  ETH: {
    name: "ETHEREUM",
    price: "3,450.10",
    trend: "bullish",
    change: "+0.5%",
    signalText: "LONGS FAVORED",
    reasoning: "Following BTC structure. Key demand level swept and held.",
    actionText: "TAKE ETH LONG NOW - liquidity sweep confirmed",
    zones: {
      supplyHigh: "3,550",
      supplyLow: "3,480",
      demandHigh: "3,320",
      demandLow: "3,250",
    },
  },
};

type AssetKey = keyof typeof MARKET_DATA;

function App() {
  const [leftAsset, setLeftAsset] = useState<AssetKey>("BTC");
  const [rightAsset, setRightAsset] = useState<AssetKey>("SOL");

  // Call the live WebSocket hook
  const liveTickerData = useBybitTicker();

  // Merge the live prices with our static SMC logic
  const leftData = {
    ...MARKET_DATA[leftAsset],
    price: liveTickerData[leftAsset]?.price || MARKET_DATA[leftAsset].price,
    change: liveTickerData[leftAsset]?.change || MARKET_DATA[leftAsset].change,
    trend: liveTickerData[leftAsset]?.trend || MARKET_DATA[leftAsset].trend,
  };

  const rightData = {
    ...MARKET_DATA[rightAsset],
    price: liveTickerData[rightAsset]?.price || MARKET_DATA[rightAsset].price,
    change:
      liveTickerData[rightAsset]?.change || MARKET_DATA[rightAsset].change,
    trend: liveTickerData[rightAsset]?.trend || MARKET_DATA[rightAsset].trend,
  };

  return (
    // Base background is slightly darker to make the cards pop
    <div className="min-h-screen bg-[#0d0d0d] text-gray-300 p-6 font-mono selection:bg-gray-700">
      <div className="max-w-400 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <header className="lg:col-span-2 flex justify-between items-end pb-2 px-2">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-gray-500">
              SMC FLOW{" "}
              <span className="text-gray-300">/ CRYPTO SD DASHBOARD</span>
            </h1>
          </div>
          <div className="text-xs text-gray-500 tracking-widest">
            SYSTEM ONLINE // {new Date().toLocaleTimeString()}
          </div>
        </header>

        {/* --- LEFT COLUMN CARD --- */}
        <section className="flex flex-col bg-[#161616] border border-gray-700/60 rounded-lg p-6 shadow-2xl h-full">
          {/* Price Header Partition */}
          <div className="flex justify-between items-end border-b border-gray-700/60 pb-4 mb-5">
            <div>
              <select
                value={leftAsset}
                onChange={(e) => setLeftAsset(e.target.value as AssetKey)}
                className="bg-[#0d0d0d] border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded outline-none focus:border-gray-500 cursor-pointer mb-3 block tracking-widest"
              >
                {Object.keys(MARKET_DATA).map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker} - {MARKET_DATA[ticker as AssetKey].name} / USDT
                  </option>
                ))}
              </select>
              <div className="text-5xl font-bold tracking-tight text-white">
                {leftData.price}
              </div>
              <div
                className={`text-sm mt-2 font-bold tracking-wide ${leftData.trend === "bullish" ? "text-emerald-400" : "text-rose-400"}`}
              >
                {leftData.trend === "bullish" ? "▲ BULLISH" : "▼ BEARISH"} (
                {leftData.change})
              </div>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-widest bg-gray-800/40 px-2 py-1 rounded">
              Anchor
            </div>
          </div>

          <div className="flex-1 mb-5">
            <SignalBox
              asset={leftAsset}
              type={leftData.trend as "bullish" | "bearish"}
              signalText={leftData.signalText}
              reasoning={leftData.reasoning}
              actionText={leftData.actionText}
              lastUpdate={new Date().toLocaleTimeString()}
            />
          </div>

          <div className="shrink-0">
            <ZonesTable asset={leftAsset} {...leftData.zones} />
          </div>
        </section>

        {/* --- RIGHT COLUMN CARD --- */}
        <section className="flex flex-col bg-[#161616] border border-gray-700/60 rounded-lg p-6 shadow-2xl h-full">
          {/* Price Header Partition */}
          <div className="flex justify-between items-end border-b border-gray-700/60 pb-4 mb-5">
            <div>
              <select
                value={rightAsset}
                onChange={(e) => setRightAsset(e.target.value as AssetKey)}
                className="bg-[#0d0d0d] border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded outline-none focus:border-gray-500 cursor-pointer mb-3 block tracking-widest"
              >
                {Object.keys(MARKET_DATA).map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker} - {MARKET_DATA[ticker as AssetKey].name} / USDT
                  </option>
                ))}
              </select>
              <div className="text-5xl font-bold tracking-tight text-white">
                {rightData.price}
              </div>
              <div
                className={`text-sm mt-2 font-bold tracking-wide ${rightData.trend === "bullish" ? "text-emerald-400" : "text-rose-400"}`}
              >
                {rightData.trend === "bullish" ? "▲ BULLISH" : "▼ BEARISH"} (
                {rightData.change})
              </div>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-widest bg-gray-800/40 px-2 py-1 rounded">
              Divergent
            </div>
          </div>

          <div className="flex-1 mb-5">
            <SignalBox
              asset={rightAsset}
              type={rightData.trend as "bullish" | "bearish"}
              signalText={rightData.signalText}
              reasoning={rightData.reasoning}
              actionText={rightData.actionText}
              lastUpdate={new Date().toLocaleTimeString()}
            />
          </div>

          <div className="shrink-0">
            <ZonesTable asset={rightAsset} {...rightData.zones} />
          </div>
        </section>

        {/* --- LIVE FVG SIGNALS --- */}
        <div className="lg:col-span-2">
          <SMCSignals />
        </div>

        {/* --- BOTTOM LOG SECTION CARD --- */}
        <section className="lg:col-span-2 bg-[#161616] border border-gray-700/60 rounded-lg p-6 shadow-2xl mt-2">
          <div className="flex justify-between items-center border-b border-gray-700/60 pb-3 mb-4">
            <div className="text-xs text-gray-500 tracking-widest uppercase">
              System Event Log
            </div>
            <button className="text-[10px] text-gray-400 hover:text-white transition-colors uppercase tracking-widest cursor-pointer bg-[#222222] px-3 py-1 border border-gray-600 rounded">
              Clear
            </button>
          </div>
          <div className="font-mono text-xs flex flex-col gap-3">
            <div className="text-gray-300">
              <span className="text-gray-500 w-20 inline-block">10:05:08</span>{" "}
              <span className="text-emerald-400">▲ TAKE LONG</span> - risk-on
              confirmed, BTC bullish + ETH bullish
            </div>
            <div className="text-gray-400">
              <span className="text-gray-500 w-20 inline-block">10:05:00</span>{" "}
              Preview mode - simulated data loaded
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
