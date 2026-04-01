import { useState, useEffect } from "react";
import { SignalBox } from "./components/SignalBox";
import { ZonesTable } from "./components/ZonesTable";
import SMCSignals from "./components/SMCSignals";
import TradingChart from "./components/TradingChart";
import { useBybitTicker } from "./hooks/useBybitTicker";

type AssetKey = "BTC" | "SOL" | "ETH";

interface Signal {
  type: string;
  time: string;
  zone: string;
  gap_size: number;
}

interface BotSignalData {
  name: string;
  trend: "bullish" | "bearish";
  signalText: string;
  reasoning: string;
  actionText: string;
  zones: {
    supplyHigh: string;
    supplyLow: string;
    demandHigh: string;
    demandLow: string;
  };
  active_signals: Signal[];
}

interface BotData {
  BTC?: BotSignalData;
  SOL?: BotSignalData;
  ETH?: BotSignalData;
}

// A temporary placeholder while we wait for Python to send the real data
const FALLBACK_DATA: BotSignalData = {
  name: "LOADING...",
  trend: "bullish" as const,
  signalText: "ANALYZING MARKET...",
  reasoning: "Waiting for algorithmic data from Python backend...",
  actionText: "STANDBY",
  zones: {
    supplyHigh: "---",
    supplyLow: "---",
    demandHigh: "---",
    demandLow: "---",
  },
  active_signals: [],
};

function App() {
  const [leftAsset, setLeftAsset] = useState<AssetKey>("BTC");
  const [rightAsset, setRightAsset] = useState<AssetKey>("SOL");

  // 1. Live Prices from Bybit
  const liveTickerData = useBybitTicker();

  // 2. Live Algorithms from Python Backend
  const [botData, setBotData] = useState<BotData | null>(null);
  const [botLoading, setBotLoading] = useState(true);

  interface LogEvent {
    id: number;
    time: string;
    message: string;
    type: "info" | "success" | "alert";
  }
  const [logs, setLogs] = useState<LogEvent[]>([]);

  const addLog = (
    message: string,
    type: "info" | "success" | "alert" = "info",
  ) => {
    setLogs((prev) => {
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        message,
        type,
      };
      return [newLog, ...prev].slice(0, 15); // Keep only the latest 15 logs
    });
  };

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/signals");
        const result = await response.json();
        if (result.status === "success") {
          setBotData(result.data);

          // Generate logs based on what the bot found!
          let totalSignals = 0;
          Object.values(result.data).forEach((assetData) => {
            const asset = assetData as BotSignalData;
            totalSignals += asset.active_signals?.length || 0;
          });

          if (totalSignals > 0) {
            addLog(
              `Matrix sync complete. Found ${totalSignals} active institutional zones.`,
              "alert",
            );
          } else {
            addLog(`Matrix sync complete. Market is balanced.`, "success");
          }
        }
      } catch {
        // Silent error handling - signal sync failed, app continues with fallback data
      } finally {
        setBotLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  // 3. Merge them together!
  const getMergedData = (
    asset: AssetKey,
  ): BotSignalData & { price: string; change: string } => {
    const algoData = botData?.[asset] || FALLBACK_DATA;
    const liveData = liveTickerData[asset];

    return {
      name: algoData.name,
      trend: algoData.trend,
      signalText: algoData.signalText,
      reasoning: algoData.reasoning,
      actionText: algoData.actionText,
      zones: algoData.zones,
      active_signals: algoData.active_signals,
      price: liveData?.price !== "---" ? liveData?.price : "---",
      change: liveData?.change !== "---" ? liveData?.change : "---",
    };
  };

  const leftData = getMergedData(leftAsset);
  const rightData = getMergedData(rightAsset);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-300 p-6 font-mono selection:bg-gray-700">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <header className="lg:col-span-2 flex justify-between items-end pb-2 px-2">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-gray-500">
              SMC FLOW{" "}
              <span className="text-gray-300">/ CRYPTO SD DASHBOARD</span>
            </h1>
          </div>
          <div
            className={`text-xs tracking-widest ${botLoading ? "text-yellow-500 animate-pulse" : "text-emerald-500"}`}
          >
            {botLoading
              ? "PYTHON BACKEND: SYNCING..."
              : `SYSTEM ONLINE // ${new Date().toLocaleTimeString()}`}
          </div>
        </header>

        {/* --- LEFT COLUMN MAIN CARD --- */}
        <section className="flex flex-col bg-[#161616] border border-gray-700/60 rounded-lg p-6 shadow-2xl h-full">
          <div className="flex justify-between items-end border-b border-gray-700/60 pb-4 mb-5">
            <div>
              <select
                value={leftAsset}
                onChange={(e) => setLeftAsset(e.target.value as AssetKey)}
                className="bg-[#0d0d0d] border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded outline-none focus:border-gray-500 cursor-pointer mb-3 block tracking-widest"
              >
                <option value="BTC">BTC - BITCOIN / USDT</option>
                <option value="ETH">ETH - ETHEREUM / USDT</option>
                <option value="SOL">SOL - SOLANA / USDT</option>
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
            <ZonesTable
              asset={leftAsset}
              supplyHigh={leftData.zones?.supplyHigh || "---"}
              supplyLow={leftData.zones?.supplyLow || "---"}
              demandHigh={leftData.zones?.demandHigh || "---"}
              demandLow={leftData.zones?.demandLow || "---"}
            />
          </div>
        </section>

        {/* --- RIGHT COLUMN MAIN CARD --- */}
        <section className="flex flex-col bg-[#161616] border border-gray-700/60 rounded-lg p-6 shadow-2xl h-full">
          <div className="flex justify-between items-end border-b border-gray-700/60 pb-4 mb-5">
            <div>
              <select
                value={rightAsset}
                onChange={(e) => setRightAsset(e.target.value as AssetKey)}
                className="bg-[#0d0d0d] border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded outline-none focus:border-gray-500 cursor-pointer mb-3 block tracking-widest"
              >
                <option value="BTC">BTC - BITCOIN / USDT</option>
                <option value="ETH">ETH - ETHEREUM / USDT</option>
                <option value="SOL">SOL - SOLANA / USDT</option>
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
            <ZonesTable
              asset={rightAsset}
              supplyHigh={rightData.zones?.supplyHigh || "---"}
              supplyLow={rightData.zones?.supplyLow || "---"}
              demandHigh={rightData.zones?.demandHigh || "---"}
              demandLow={rightData.zones?.demandLow || "---"}
            />
          </div>
        </section>

        {/* --- THE VISUAL MATRIX (CHART) --- */}
        <div className="lg:col-span-2 mt-2 mb-2">
          <TradingChart
            asset={leftAsset}
            zones={leftData.zones}
            signals={leftData.active_signals}
          />
        </div>

        {/* --- LIVE FVG SIGNALS (LEFT COLUMN) --- */}
        <div>
          <SMCSignals
            asset={leftAsset}
            loading={botLoading}
            signals={leftData.active_signals}
          />
        </div>

        {/* --- LIVE FVG SIGNALS (RIGHT COLUMN) --- */}
        <div>
          <SMCSignals
            asset={rightAsset}
            loading={botLoading}
            signals={rightData.active_signals}
          />
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
          <div className="font-mono text-xs flex flex-col gap-3 h-32 overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic bg-gray-800/30 p-3 rounded text-center">
                Awaiting live system events...
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="text-gray-300 border-b border-gray-800/50 pb-2 last:border-0"
                >
                  <span className="text-gray-500 w-24 inline-block">
                    {log.time}
                  </span>
                  <span
                    className={`${
                      log.type === "alert"
                        ? "text-rose-400 font-bold"
                        : log.type === "success"
                          ? "text-emerald-400"
                          : "text-gray-400"
                    }`}
                  >
                    {log.type === "alert"
                      ? "⚠ "
                      : log.type === "success"
                        ? "✓ "
                        : "ℹ "}
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
