import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from "lightweight-charts";

export interface Signal {
  type: string;
  time?: string;
  zone?: string;
  gap_size?: number;
}

export interface ZoneData {
  supplyHigh: string;
  supplyLow: string;
  demandHigh: string;
  demandLow: string;
}

interface TradingChartProps {
  asset: string;
  zones?: ZoneData;
  signals?: Signal[];
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function TradingChart({
  asset,
  zones = { supplyHigh: "---", supplyLow: "---", demandHigh: "---", demandLow: "---" },
  signals = [],
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceLinesRef = useRef<any[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Win2K chart colors: light background, dark grid lines
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#000000",
        fontFamily: "Tahoma, Verdana, Arial, sans-serif",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#d0d0d0" },
        horzLines: { color: "#d0d0d0" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: "#808080",
        timeVisible: true,
      },
      rightPriceScale: { borderColor: "#808080" },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#008000",
      downColor: "#800000",
      borderVisible: false,
      wickUpColor: "#008000",
      wickDownColor: "#800000",
    });

    seriesRef.current = candleSeries;

    let isMounted = true;

    const fetchCandles = async () => {
      try {
        const response = await fetch(
          `https://api.bybit.com/v5/market/kline?category=linear&symbol=${asset}USDT&interval=15&limit=100`
        );
        const data = await response.json();

        if (!isMounted || data.retCode !== 0 || !data.result?.list || data.result.list.length === 0) return;

        const formatted: CandleData[] = data.result.list.reverse().map((d: string[]) => {
          const timeInSeconds = Math.floor(Number(d[0]) / 1000);
          const date = new Date(timeInSeconds * 1000);
          const isoDate = date.toISOString().split("T")[0];
          return {
            time: isoDate,
            open: Number(d[1]),
            high: Number(d[2]),
            low: Number(d[3]),
            close: Number(d[4]),
          };
        });

        const uniqueData = formatted.filter(
          (v: CandleData, i: number, a: CandleData[]) =>
            a.findIndex((t) => t.time === v.time) === i
        );

        if (uniqueData.length > 0) {
          candleSeries.setData(uniqueData);
          setCandleData(uniqueData);
        }
      } catch {
        // Silent error
      }
    };

    fetchCandles();

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      chart.applyOptions({ width: entries[0].contentRect.width });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      try {
        chart.remove();
      } catch {
        /* Ignore */
      }
    };
  }, [asset]);

  useEffect(() => {
    if (!seriesRef.current || candleData.length === 0) return;

    try {
      priceLinesRef.current.forEach((line) => {
        try {
          seriesRef.current?.removePriceLine(line);
        } catch {
          /* Ignore */
        }
      });
      priceLinesRef.current = [];

      const rawMarkers = signals
        .filter((sig) => sig.time)
        .map((sig) => {
          const isBullish = sig.type.includes("BULLISH");
          const timeInSeconds = Math.floor(new Date(sig.time!).getTime() / 1000);
          return {
            time: timeInSeconds as import("lightweight-charts").Time,
            position: isBullish ? "belowBar" : "aboveBar",
            color: isBullish ? "#008000" : "#800000",
            shape: isBullish ? "arrowUp" : "arrowDown",
            text: "FVG",
          };
        });

      rawMarkers.sort((a, b) => (a.time as number) - (b.time as number));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueMarkers: any[] = [];
      const seenTimes = new Set();
      for (const m of rawMarkers) {
        const timeExistsInChart = candleData.some((c) => c.time === m.time);
        if (!seenTimes.has(m.time) && timeExistsInChart) {
          seenTimes.add(m.time);
          uniqueMarkers.push(m);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (seriesRef.current as any).setMarkers(uniqueMarkers);

      if (zones && zones.supplyHigh && zones.supplyHigh !== "---") {
        const sHigh = parseFloat(zones.supplyHigh.replace(/,/g, ""));
        const sLow = parseFloat(zones.supplyLow.replace(/,/g, ""));
        const dHigh = parseFloat(zones.demandHigh.replace(/,/g, ""));
        const dLow = parseFloat(zones.demandLow.replace(/,/g, ""));

        const l1 = seriesRef.current.createPriceLine({ price: sHigh, color: "#800000", lineWidth: 1, lineStyle: 2, title: "Supply H" });
        const l2 = seriesRef.current.createPriceLine({ price: sLow, color: "#800000", lineWidth: 2, title: "Supply L" });
        const l3 = seriesRef.current.createPriceLine({ price: dHigh, color: "#008000", lineWidth: 2, title: "Demand H" });
        const l4 = seriesRef.current.createPriceLine({ price: dLow, color: "#008000", lineWidth: 1, lineStyle: 2, title: "Demand L" });

        priceLinesRef.current.push(l1, l2, l3, l4);
      }
    } catch {
      // Silent error
    }
  }, [zones, signals, candleData]);

  return (
    <div style={{ width: "100%", fontFamily: "Tahoma, 'Verdana', sans-serif", fontSize: "11px" }}>
      {/* Chart toolbar */}
      <div style={{
        backgroundColor: "#d4d0c8",
        borderBottom: "2px solid #808080",
        padding: "2px 6px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "4px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }}>15m</button>
          <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }}>1H</button>
          <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }}>4H</button>
          <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }}>1D</button>
          <div className="win-sep" style={{ height: "16px", alignSelf: "center" }} />
          <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }}>Candle</button>
          <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }}>Line</button>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "10px" }}>
          <span style={{
            color: "#800000",
            border: "1px solid #800000",
            padding: "0 4px",
            backgroundColor: "#ffe0e0",
            fontSize: "10px",
          }}>
            &#9650; Supply Zone
          </span>
          <span style={{
            color: "#008000",
            border: "1px solid #008000",
            padding: "0 4px",
            backgroundColor: "#e0ffe0",
            fontSize: "10px",
          }}>
            &#9660; Demand Zone
          </span>
        </div>
      </div>

      {/* Chart area — Win2K inset sunken look */}
      <div
        style={{
          borderTop: "2px solid #808080",
          borderLeft: "2px solid #808080",
          borderBottom: "2px solid #ffffff",
          borderRight: "2px solid #ffffff",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <div ref={chartContainerRef} style={{ width: "100%", minHeight: "360px" }} />
      </div>

      {/* Status bar */}
      <div className="win-statusbar">
        <div className="win-status-panel">
          {asset}/USDT
        </div>
        <div className="win-status-panel">
          15m Candlestick
        </div>
        <div className="win-status-panel" style={{ flex: 1 }}>
          Bybit Live Data
        </div>
      </div>
    </div>
  );
}
