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
    <div style={{ fontFamily: "Tahoma, 'Verdana', sans-serif", fontSize: "11px" }}>
      {/* Toolbar-style header */}
      <div style={{
        backgroundColor: "#d4d0c8",
        borderBottom: "1px solid #808080",
        padding: "3px 6px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "4px",
      }}>
        <span style={{ fontWeight: "bold", fontSize: "11px" }}>
          Algorithmic FVGs — {asset}/USDT • 15m
        </span>
        <span style={{
          fontSize: "10px",
          color: "#808080",
          border: "1px solid #808080",
          padding: "0 4px",
          backgroundColor: "#ffffff",
        }}>
          {signals.length} active
        </span>
      </div>

      {loading ? (
        <div style={{
          padding: "8px",
          color: "#808080",
          fontStyle: "italic",
          textAlign: "center",
          border: "2px solid",
          borderTopColor: "#808080",
          borderLeftColor: "#808080",
          borderBottomColor: "#ffffff",
          borderRightColor: "#ffffff",
          backgroundColor: "#ffffff",
        }}>
          &#9203; Scanning market data...
        </div>
      ) : signals.length === 0 ? (
        <div style={{
          padding: "8px",
          color: "#808080",
          fontStyle: "italic",
          textAlign: "center",
          border: "2px solid",
          borderTopColor: "#808080",
          borderLeftColor: "#808080",
          borderBottomColor: "#ffffff",
          borderRightColor: "#ffffff",
          backgroundColor: "#ffffff",
        }}>
          Market is balanced — No active FVG signals
        </div>
      ) : (
        <div className="win-listview">
          {/* Header */}
          <div className="win-listview-header" style={{ gridTemplateColumns: "2fr 1fr 2fr" }}>
            <div className="win-listview-header-cell">Signal Type</div>
            <div className="win-listview-header-cell">Time</div>
            <div className="win-listview-header-cell">Zone</div>
          </div>

          {signals.map((sig, index) => {
            const isBullish = sig.type.includes('BULLISH');
            return (
              <div
                key={index}
                className="win-listview-row"
                style={{ gridTemplateColumns: "2fr 1fr 2fr" }}
              >
                <div
                  className="win-listview-cell"
                  style={{
                    color: isBullish ? "#008000" : "#800000",
                    fontWeight: "bold",
                  }}
                >
                  {isBullish ? "▲" : "▼"} {sig.type}
                </div>
                <div className="win-listview-cell" style={{ color: "#808080", fontFamily: "Courier New, monospace" }}>
                  {sig.time ? sig.time.split(' ')[1] || sig.time : "---"}
                </div>
                <div className="win-listview-cell" style={{ fontFamily: "Courier New, monospace" }}>
                  {sig.zone}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status bar */}
      <div className="win-statusbar" style={{ marginTop: "1px" }}>
        <div className="win-status-panel">
          {signals.length} item{signals.length !== 1 ? "s" : ""}
        </div>
        <div className="win-status-panel" style={{ flex: 1 }}>
          {loading ? "Syncing..." : "Ready"}
        </div>
      </div>
    </div>
  );
}
