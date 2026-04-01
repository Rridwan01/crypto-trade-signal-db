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
  const [currentTime, setCurrentTime] = useState(new Date());

  const liveTickerData = useBybitTicker();

  const [botData, setBotData] = useState<BotData | null>(null);
  const [botLoading, setBotLoading] = useState(true);

  interface LogEvent {
    id: number;
    time: string;
    message: string;
    type: "info" | "success" | "alert";
  }
  const [logs, setLogs] = useState<LogEvent[]>([]);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const addLog = (message: string, type: "info" | "success" | "alert" = "info") => {
    setLogs((prev) => {
      const newLog = { id: Date.now(), time: new Date().toLocaleTimeString(), message, type };
      return [newLog, ...prev].slice(0, 15);
    });
  };

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch("https://YOUR-RENDER-URL.onrender.com/api/signals");
        const result = await response.json();
        if (result.status === "success") {
          setBotData(result.data);
          let totalSignals = 0;
          Object.values(result.data).forEach((assetData) => {
            const asset = assetData as BotSignalData;
            totalSignals += asset.active_signals?.length || 0;
          });
          if (totalSignals > 0) {
            addLog(`Sync complete. Found ${totalSignals} active institutional zones.`, "alert");
          } else {
            addLog(`Sync complete. Market is balanced.`, "success");
          }
        }
      } catch {
        // Silent error handling
      } finally {
        setBotLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  const getMergedData = (asset: AssetKey): BotSignalData & { price: string; change: string } => {
    const algoData = botData?.[asset] || FALLBACK_DATA;
    const liveData = liveTickerData[asset];
    return {
      ...algoData,
      price: liveData?.price !== "---" ? liveData?.price : "---",
      change: liveData?.change !== "---" ? liveData?.change : "---",
    };
  };

  const leftData = getMergedData(leftAsset);
  const rightData = getMergedData(rightAsset);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#008080", paddingBottom: "32px" }}>
      {/* ===================== DESKTOP AREA ===================== */}
      <div style={{ padding: "6px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* ---- MAIN APPLICATION WINDOW ---- */}
        <div className="win-window" style={{ marginBottom: "4px" }}>

          {/* Title Bar */}
          <div className="win-titlebar">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* App icon */}
              <div style={{
                width: 14, height: 14, backgroundColor: "#ffcc00",
                border: "1px solid #000", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "8px", fontWeight: "bold", color: "#000"
              }}>$</div>
              <span>SMC Flow - Crypto Supply &amp; Demand Dashboard</span>
            </div>
            <div style={{ display: "flex", gap: "2px" }}>
              <button className="win-titlebar-btn" title="Minimize">_</button>
              <button className="win-titlebar-btn" title="Maximize">&#9633;</button>
              <button
                className="win-titlebar-btn"
                title="Close"
                style={{ marginLeft: "2px", fontWeight: "bold" }}
              >X</button>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="win-menubar">
            <span className="win-menuitem"><u>F</u>ile</span>
            <span className="win-menuitem"><u>V</u>iew</span>
            <span className="win-menuitem"><u>T</u>rading</span>
            <span className="win-menuitem"><u>A</u>lerts</span>
            <span className="win-menuitem"><u>T</u>ools</span>
            <span className="win-menuitem"><u>H</u>elp</span>
          </div>

          {/* Toolbar */}
          <div style={{
            backgroundColor: "#d4d0c8",
            borderBottom: "2px solid #808080",
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}>
            <button className="win-btn">&#9654; Refresh</button>
            <button className="win-btn">&#9632; Stop</button>
            <div className="win-sep" />
            <button className="win-btn">&#9650; Buy Signal</button>
            <button className="win-btn">&#9660; Sell Signal</button>
            <div className="win-sep" />
            <button className="win-btn">&#128200; Chart</button>
            <button className="win-btn">&#9776; Zones</button>
            <div className="win-sep" />
            {/* Status indicator */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "10px", fontFamily: "Tahoma, sans-serif"
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: botLoading ? "#ffcc00" : "#00aa00",
                  border: "1px solid #000",
                  animation: botLoading ? "blink 1s step-end infinite" : "none"
                }} />
                <span>{botLoading ? "SYNCING BACKEND..." : "BACKEND ONLINE"}</span>
              </div>
            </div>
          </div>

          {/* ---- ADDRESS / TICKER STRIP ---- */}
          <div style={{
            backgroundColor: "#d4d0c8",
            borderBottom: "1px solid #808080",
            padding: "2px 6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "10px",
            fontFamily: "Tahoma, sans-serif",
            overflow: "hidden",
          }}>
            <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>LIVE PRICES:</span>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <span style={{ color: "#000080" }}>
                BTC: {liveTickerData.BTC?.price || "---"}
                &nbsp;&nbsp;|&nbsp;&nbsp;
                ETH: {liveTickerData.ETH?.price || "---"}
                &nbsp;&nbsp;|&nbsp;&nbsp;
                SOL: {liveTickerData.SOL?.price || "---"}
              </span>
            </div>
            <span style={{ whiteSpace: "nowrap", color: "#808080" }}>
              {currentTime.toLocaleTimeString()}
            </span>
          </div>

          {/* ===== MAIN CONTENT AREA ===== */}
          <div style={{ padding: "6px", backgroundColor: "#d4d0c8" }}>

            {/* --- TOP ROW: TWO ASSET PANELS --- */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>

              {/* LEFT PANEL */}
              <div className="win-window" style={{ padding: "3px" }}>
                <div className="win-titlebar" style={{ background: "linear-gradient(to right, #000080, #1084d0)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: 10, height: 10, backgroundColor: "#ffcc00", border: "1px solid #000", fontSize: "7px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>A</div>
                    <span>Anchor Asset — Signal Monitor</span>
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button className="win-titlebar-btn">_</button>
                    <button className="win-titlebar-btn">&#9633;</button>
                    <button className="win-titlebar-btn" style={{ fontWeight: "bold" }}>X</button>
                  </div>
                </div>

                <div style={{ padding: "6px", backgroundColor: "#d4d0c8" }}>
                  {/* Asset selector row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", paddingBottom: "6px", borderBottom: "2px solid #808080", borderTop: "none" }}>
                    <label style={{ fontFamily: "Tahoma, sans-serif", fontSize: "11px", whiteSpace: "nowrap" }}>Asset:</label>
                    <select
                      value={leftAsset}
                      onChange={(e) => setLeftAsset(e.target.value as AssetKey)}
                      className="win-select"
                      style={{ flex: 1 }}
                    >
                      <option value="BTC">BTC - Bitcoin / USDT</option>
                      <option value="ETH">ETH - Ethereum / USDT</option>
                      <option value="SOL">SOL - Solana / USDT</option>
                    </select>
                    <div className="win-inset" style={{ padding: "2px 8px", fontFamily: "Tahoma, sans-serif", fontSize: "11px" }}>
                      {leftData.trend === "bullish"
                        ? <span style={{ color: "#008000", fontWeight: "bold" }}>&#9650; BULLISH</span>
                        : <span style={{ color: "#800000", fontWeight: "bold" }}>&#9660; BEARISH</span>
                      }
                    </div>
                  </div>

                  {/* Price display */}
                  <div className="win-groupbox" style={{ marginBottom: "6px", marginTop: "0" }}>
                    <div style={{
                      position: "absolute", top: "-8px", left: "8px",
                      backgroundColor: "#d4d0c8", padding: "0 4px",
                      fontFamily: "Tahoma, sans-serif", fontSize: "11px", fontWeight: "bold"
                    }}>Price Information</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontFamily: "Tahoma, sans-serif", fontSize: "22px", fontWeight: "bold", color: "#000080" }}>
                          {leftData.price}
                        </div>
                        <div style={{ fontFamily: "Tahoma, sans-serif", fontSize: "11px", color: leftData.trend === "bullish" ? "#008000" : "#800000" }}>
                          24h Change: {leftData.change}
                        </div>
                      </div>
                      <div>
                        <div className="win-progress" style={{ width: "100px" }}>
                          <div className="win-progress-fill" style={{ width: leftData.trend === "bullish" ? "70%" : "30%" }} />
                        </div>
                        <div style={{ fontFamily: "Tahoma, sans-serif", fontSize: "9px", textAlign: "center", marginTop: "2px" }}>
                          Trend Strength
                        </div>
                      </div>
                    </div>
                  </div>

                  <SignalBox
                    asset={leftAsset}
                    type={leftData.trend as "bullish" | "bearish"}
                    signalText={leftData.signalText}
                    reasoning={leftData.reasoning}
                    actionText={leftData.actionText}
                    lastUpdate={new Date().toLocaleTimeString()}
                  />

                  <div style={{ marginTop: "6px" }}>
                    <ZonesTable
                      asset={leftAsset}
                      supplyHigh={leftData.zones?.supplyHigh || "---"}
                      supplyLow={leftData.zones?.supplyLow || "---"}
                      demandHigh={leftData.zones?.demandHigh || "---"}
                      demandLow={leftData.zones?.demandLow || "---"}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div className="win-window" style={{ padding: "3px" }}>
                <div className="win-titlebar" style={{ background: "linear-gradient(to right, #000080, #1084d0)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: 10, height: 10, backgroundColor: "#ff6600", border: "1px solid #000", fontSize: "7px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>D</div>
                    <span>Divergent Asset — Signal Monitor</span>
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button className="win-titlebar-btn">_</button>
                    <button className="win-titlebar-btn">&#9633;</button>
                    <button className="win-titlebar-btn" style={{ fontWeight: "bold" }}>X</button>
                  </div>
                </div>

                <div style={{ padding: "6px", backgroundColor: "#d4d0c8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", paddingBottom: "6px", borderBottom: "2px solid #808080" }}>
                    <label style={{ fontFamily: "Tahoma, sans-serif", fontSize: "11px", whiteSpace: "nowrap" }}>Asset:</label>
                    <select
                      value={rightAsset}
                      onChange={(e) => setRightAsset(e.target.value as AssetKey)}
                      className="win-select"
                      style={{ flex: 1 }}
                    >
                      <option value="BTC">BTC - Bitcoin / USDT</option>
                      <option value="ETH">ETH - Ethereum / USDT</option>
                      <option value="SOL">SOL - Solana / USDT</option>
                    </select>
                    <div className="win-inset" style={{ padding: "2px 8px", fontFamily: "Tahoma, sans-serif", fontSize: "11px" }}>
                      {rightData.trend === "bullish"
                        ? <span style={{ color: "#008000", fontWeight: "bold" }}>&#9650; BULLISH</span>
                        : <span style={{ color: "#800000", fontWeight: "bold" }}>&#9660; BEARISH</span>
                      }
                    </div>
                  </div>

                  <div className="win-groupbox" style={{ marginBottom: "6px", marginTop: "0" }}>
                    <div style={{
                      position: "absolute", top: "-8px", left: "8px",
                      backgroundColor: "#d4d0c8", padding: "0 4px",
                      fontFamily: "Tahoma, sans-serif", fontSize: "11px", fontWeight: "bold"
                    }}>Price Information</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontFamily: "Tahoma, sans-serif", fontSize: "22px", fontWeight: "bold", color: "#000080" }}>
                          {rightData.price}
                        </div>
                        <div style={{ fontFamily: "Tahoma, sans-serif", fontSize: "11px", color: rightData.trend === "bullish" ? "#008000" : "#800000" }}>
                          24h Change: {rightData.change}
                        </div>
                      </div>
                      <div>
                        <div className="win-progress" style={{ width: "100px" }}>
                          <div className="win-progress-fill" style={{ width: rightData.trend === "bullish" ? "70%" : "30%" }} />
                        </div>
                        <div style={{ fontFamily: "Tahoma, sans-serif", fontSize: "9px", textAlign: "center", marginTop: "2px" }}>
                          Trend Strength
                        </div>
                      </div>
                    </div>
                  </div>

                  <SignalBox
                    asset={rightAsset}
                    type={rightData.trend as "bullish" | "bearish"}
                    signalText={rightData.signalText}
                    reasoning={rightData.reasoning}
                    actionText={rightData.actionText}
                    lastUpdate={new Date().toLocaleTimeString()}
                  />

                  <div style={{ marginTop: "6px" }}>
                    <ZonesTable
                      asset={rightAsset}
                      supplyHigh={rightData.zones?.supplyHigh || "---"}
                      supplyLow={rightData.zones?.supplyLow || "---"}
                      demandHigh={rightData.zones?.demandHigh || "---"}
                      demandLow={rightData.zones?.demandLow || "---"}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- CHART WINDOW --- */}
            <div className="win-window" style={{ padding: "3px", marginBottom: "6px" }}>
              <div className="win-titlebar">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: 10, height: 10, backgroundColor: "#008080", border: "1px solid #000", fontSize: "7px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>C</div>
                  <span>Live Market Chart — {leftAsset}/USDT • 15m Candlestick</span>
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  <button className="win-titlebar-btn">_</button>
                  <button className="win-titlebar-btn">&#9633;</button>
                  <button className="win-titlebar-btn" style={{ fontWeight: "bold" }}>X</button>
                </div>
              </div>
              <div style={{ padding: "3px", backgroundColor: "#d4d0c8" }}>
                <TradingChart
                  asset={leftAsset}
                  zones={leftData.zones}
                  signals={leftData.active_signals}
                />
              </div>
            </div>

            {/* --- FVG SIGNALS ROW --- */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
              <div className="win-window" style={{ padding: "3px" }}>
                <div className="win-titlebar">
                  <span>Active FVG Signals — {leftAsset}/USDT</span>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button className="win-titlebar-btn">_</button>
                    <button className="win-titlebar-btn">&#9633;</button>
                    <button className="win-titlebar-btn" style={{ fontWeight: "bold" }}>X</button>
                  </div>
                </div>
                <div style={{ padding: "3px", backgroundColor: "#d4d0c8" }}>
                  <SMCSignals asset={leftAsset} loading={botLoading} signals={leftData.active_signals} />
                </div>
              </div>

              <div className="win-window" style={{ padding: "3px" }}>
                <div className="win-titlebar">
                  <span>Active FVG Signals — {rightAsset}/USDT</span>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button className="win-titlebar-btn">_</button>
                    <button className="win-titlebar-btn">&#9633;</button>
                    <button className="win-titlebar-btn" style={{ fontWeight: "bold" }}>X</button>
                  </div>
                </div>
                <div style={{ padding: "3px", backgroundColor: "#d4d0c8" }}>
                  <SMCSignals asset={rightAsset} loading={botLoading} signals={rightData.active_signals} />
                </div>
              </div>
            </div>

            {/* --- SYSTEM LOG WINDOW --- */}
            <div className="win-window" style={{ padding: "3px" }}>
              <div className="win-titlebar">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: 10, height: 10, backgroundColor: "#808080", border: "1px solid #000", fontSize: "7px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>L</div>
                  <span>System Event Log — notepad.exe</span>
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  <button className="win-titlebar-btn">_</button>
                  <button className="win-titlebar-btn">&#9633;</button>
                  <button className="win-titlebar-btn" style={{ fontWeight: "bold" }}>X</button>
                </div>
              </div>

              <div style={{ padding: "6px", backgroundColor: "#d4d0c8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "Tahoma, sans-serif", fontSize: "11px", fontWeight: "bold" }}>System Events</span>
                  <button
                    className="win-btn"
                    onClick={() => setLogs([])}
                  >
                    Clear Log
                  </button>
                </div>

                <div
                  className="win-inset"
                  style={{
                    height: "120px",
                    overflowY: "auto",
                    padding: "4px",
                    fontFamily: "Courier New, monospace",
                    fontSize: "11px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {logs.length === 0 ? (
                    <div style={{ color: "#808080", fontStyle: "italic" }}>
                      &gt; Awaiting system events...
                      <span className="blink">_</span>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} style={{ marginBottom: "2px", lineHeight: "1.4" }}>
                        <span style={{ color: "#808080" }}>[{log.time}]</span>{" "}
                        <span style={{
                          color: log.type === "alert" ? "#800000" : log.type === "success" ? "#008000" : "#000080",
                          fontWeight: log.type === "alert" ? "bold" : "normal"
                        }}>
                          {log.type === "alert" ? "WARN: " : log.type === "success" ? "OK:   " : "INFO: "}
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>{/* end main content */}

          {/* Status Bar */}
          <div className="win-statusbar">
            <div className="win-status-panel">
              {botLoading ? "Connecting to backend..." : "Ready"}
            </div>
            <div className="win-status-panel" style={{ flex: 1 }}>
              SMC Flow v1.0 — Crypto Supply &amp; Demand Dashboard
            </div>
            <div className="win-status-panel" style={{ whiteSpace: "nowrap" }}>
              {currentTime.toLocaleDateString()}
            </div>
            <div className="win-status-panel" style={{ whiteSpace: "nowrap" }}>
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>{/* end main window */}

      </div>{/* end desktop */}

      {/* ===================== TASKBAR ===================== */}
      <div className="win-taskbar">
        <button className="win-start-btn">
          <div style={{
            width: 12, height: 12,
            background: "linear-gradient(135deg, #ff0000 25%, #00ff00 25%, #00ff00 50%, #0000ff 50%, #0000ff 75%, #ffff00 75%)",
            border: "1px solid #000"
          }} />
          <span>Start</span>
        </button>
        <div className="win-sep" style={{ alignSelf: "stretch", margin: "2px 4px" }} />
        {/* Running program button */}
        <button className="win-btn" style={{ minWidth: "160px", textAlign: "left" }}>
          <span>&#128200; SMC Flow Dashboard</span>
        </button>
        <div style={{ flex: 1 }} />
        {/* System tray */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          borderLeft: "1px solid #808080",
          paddingLeft: "6px",
        }}>
          <div className="win-sep" style={{ height: "16px", margin: "0 2px" }} />
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            fontFamily: "Tahoma, sans-serif", fontSize: "10px"
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: botLoading ? "#ffcc00" : "#00cc00",
              border: "1px solid #000"
            }} />
            <span style={{ whiteSpace: "nowrap" }}>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
