interface SignalBoxProps {
  asset: string;
  type: 'bullish' | 'bearish';
  signalText: string;
  reasoning: string;
  actionText: string;
  lastUpdate: string;
}

function SignalBox({ asset, type, signalText, reasoning, actionText, lastUpdate }: SignalBoxProps) {
  const isBullish = type === 'bullish';

  return (
    <div style={{ fontFamily: "Tahoma, 'Verdana', sans-serif", fontSize: "11px" }}>
      {/* Signal header row */}
      <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{
          fontFamily: "Tahoma, sans-serif",
          fontSize: "11px",
          fontWeight: "bold",
          color: isBullish ? "#008000" : "#800000",
          padding: "1px 4px",
          border: `1px solid ${isBullish ? "#008000" : "#800000"}`,
          backgroundColor: isBullish ? "#e0ffe0" : "#ffe0e0",
        }}>
          {isBullish ? "▲" : "▼"} {asset} TRADE SIGNAL
        </div>
        <div style={{ fontSize: "9px", color: "#808080" }}>Updated: {lastUpdate}</div>
      </div>

      {/* The tinted signal box - Win2K GroupBox style */}
      <div className="win-groupbox" style={{ marginTop: "0", position: "relative" }}>
        <div style={{
          position: "absolute", top: "-8px", left: "8px",
          backgroundColor: "#d4d0c8", padding: "0 4px",
          fontFamily: "Tahoma, sans-serif", fontSize: "11px", fontWeight: "bold",
          color: isBullish ? "#008000" : "#800000"
        }}>
          {signalText}
        </div>

        <div style={{ display: "flex", gap: "4px", alignItems: "flex-start", marginTop: "4px" }}>
          <span style={{ color: "#808080", flexShrink: 0 }}>&#9658;</span>
          <p style={{ margin: 0, color: "#000000", lineHeight: "1.5", fontSize: "11px" }}>
            {reasoning}
          </p>
        </div>
      </div>

      {/* Action Button - classic Win2K raised style */}
      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          className="win-btn"
          style={{
            backgroundColor: isBullish ? "#d4edd4" : "#edd4d4",
            borderTopColor: isBullish ? "#aaffaa" : "#ffaaaa",
            borderLeftColor: isBullish ? "#aaffaa" : "#ffaaaa",
            fontWeight: "bold",
            color: isBullish ? "#004400" : "#440000",
            minWidth: "120px",
          }}
        >
          {isBullish ? "▲" : "▼"} {actionText}
        </button>
        <div style={{ fontSize: "10px", color: "#808080", fontStyle: "italic" }}>
          Click to set alert
        </div>
      </div>
    </div>
  );
}

export { SignalBox };
