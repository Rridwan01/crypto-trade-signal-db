interface ZonesTableProps {
  asset: string;
  supplyHigh: string;
  supplyLow: string;
  demandHigh: string;
  demandLow: string;
}

function ZonesTable({ asset, supplyHigh, supplyLow, demandHigh, demandLow }: ZonesTableProps) {
  return (
    <div style={{ fontFamily: "Tahoma, 'Verdana', sans-serif", fontSize: "11px" }}>

      {/* Section label */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "4px",
      }}>
        <span style={{ fontWeight: "bold", fontSize: "11px" }}>{asset} Zone Levels</span>
        <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }}>
          Recalculate
        </button>
      </div>

      {/* ListView-style table */}
      <div className="win-listview">
        {/* Header */}
        <div className="win-listview-header" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="win-listview-header-cell">Zone Type</div>
          <div className="win-listview-header-cell">Level</div>
          <div className="win-listview-header-cell">Value</div>
        </div>

        {/* Supply High */}
        <div className="win-listview-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="win-listview-cell" style={{ color: "#800000", fontWeight: "bold" }}>
            &#9650; Supply
          </div>
          <div className="win-listview-cell">HIGH</div>
          <div className="win-listview-cell" style={{ fontFamily: "Courier New, monospace", fontWeight: "bold" }}>
            {supplyHigh}
          </div>
        </div>

        {/* Supply Low */}
        <div className="win-listview-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="win-listview-cell" style={{ color: "#800000", fontWeight: "bold" }}>
            &#9650; Supply
          </div>
          <div className="win-listview-cell">LOW</div>
          <div className="win-listview-cell" style={{ fontFamily: "Courier New, monospace", fontWeight: "bold" }}>
            {supplyLow}
          </div>
        </div>

        {/* Demand High */}
        <div className="win-listview-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="win-listview-cell" style={{ color: "#008000", fontWeight: "bold" }}>
            &#9660; Demand
          </div>
          <div className="win-listview-cell">HIGH</div>
          <div className="win-listview-cell" style={{ fontFamily: "Courier New, monospace", fontWeight: "bold" }}>
            {demandHigh}
          </div>
        </div>

        {/* Demand Low */}
        <div className="win-listview-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="win-listview-cell" style={{ color: "#008000", fontWeight: "bold" }}>
            &#9660; Demand
          </div>
          <div className="win-listview-cell">LOW</div>
          <div className="win-listview-cell" style={{ fontFamily: "Courier New, monospace", fontWeight: "bold" }}>
            {demandLow}
          </div>
        </div>

      </div>

      {/* Status bar for table */}
      <div className="win-statusbar" style={{ marginTop: "1px" }}>
        <div className="win-status-panel">4 objects</div>
        <div className="win-status-panel" style={{ flex: 1 }}>
          Supply: red&nbsp;&nbsp;|&nbsp;&nbsp;Demand: green
        </div>
      </div>
    </div>
  );
}

export { ZonesTable };
