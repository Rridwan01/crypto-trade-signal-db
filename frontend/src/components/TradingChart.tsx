import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from "lightweight-charts";

// --- STRICT INTERFACES ---
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
  time: string; // lightweight-charts expects ISO date string like '2024-01-15'
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
  
  // Track lines so we can safely delete old ones before drawing new ones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceLinesRef = useRef<any[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);

  // ==========================================
  // EFFECT 1: INITIALIZE CHART & FETCH DATA
  // ==========================================
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#161616" }, textColor: "#9ca3af" },
      grid: { vertLines: { color: "#2a2a2a" }, horzLines: { color: "#2a2a2a" } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { borderColor: "#2a2a2a", timeVisible: true },
      rightPriceScale: { borderColor: "#2a2a2a" },
    });

    chartRef.current = chart;

    // ✨ THE V5 FIX: No more hacks! We pass CandlestickSeries natively into addSeries
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981", downColor: "#f43f5e", borderVisible: false,
      wickUpColor: "#10b981", wickDownColor: "#f43f5e",
    });
    
    seriesRef.current = candleSeries;

    let isMounted = true;

    const fetchCandles = async () => {
      try {
        const response = await fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${asset}USDT&interval=15&limit=100`);
        const data = await response.json();

        if (!isMounted || data.retCode !== 0 || !data.result?.list || data.result.list.length === 0) return;

        const formatted: CandleData[] = data.result.list.reverse().map((d: string[]) => {
          const timeInSeconds = Math.floor(Number(d[0]) / 1000);
          const date = new Date(timeInSeconds * 1000);
          const isoDate = date.toISOString().split('T')[0]; // Convert to 'YYYY-MM-DD'
          return {
            time: isoDate,
            open: Number(d[1]), high: Number(d[2]), low: Number(d[3]), close: Number(d[4]),
          };
        });

        const uniqueData = formatted.filter((v: CandleData, i: number, a: CandleData[]) => a.findIndex((t) => t.time === v.time) === i);

        if (uniqueData.length > 0) {
          candleSeries.setData(uniqueData);
          setCandleData(uniqueData);
        }
      } catch (error) {
        console.error("🔴 Chart fetch failed:", error);
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
      try { chart.remove(); } catch { /* Ignore */ }
    };
  }, [asset]);

  // ==========================================
  // EFFECT 2: DRAW ZONES AND FVG MARKERS
  // ==========================================
  useEffect(() => {
    if (!seriesRef.current || candleData.length === 0) return;

    try {
      // 1. Clean up old lines
      priceLinesRef.current.forEach(line => {
        try { seriesRef.current?.removePriceLine(line); } catch { /* Ignore */ }
      });
      priceLinesRef.current = [];

      // 2. Draw FVG Markers Safely
      const rawMarkers = signals.filter(sig => sig.time).map((sig) => {
          const isBullish = sig.type.includes("BULLISH");
          const timeInSeconds = Math.floor(new Date(sig.time!).getTime() / 1000);
          return {
            time: timeInSeconds as import('lightweight-charts').Time,
            position: isBullish ? "belowBar" : "aboveBar",
            color: isBullish ? "#10b981" : "#f43f5e",
            shape: isBullish ? "arrowUp" : "arrowDown",
            text: "FVG",
          };
      });

      rawMarkers.sort((a, b) => (a.time as number) - (b.time as number));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueMarkers: any[] = [];
      const seenTimes = new Set();
      for (const m of rawMarkers) {
        const timeExistsInChart = candleData.some(c => c.time === m.time);
        if (!seenTimes.has(m.time) && timeExistsInChart) {
          seenTimes.add(m.time);
          uniqueMarkers.push(m);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (seriesRef.current as any).setMarkers(uniqueMarkers);

      // 3. Draw Supply/Demand Lines
      if (zones && zones.supplyHigh && zones.supplyHigh !== "---") {
        const sHigh = parseFloat(zones.supplyHigh.replace(/,/g, ""));
        const sLow = parseFloat(zones.supplyLow.replace(/,/g, ""));
        const dHigh = parseFloat(zones.demandHigh.replace(/,/g, ""));
        const dLow = parseFloat(zones.demandLow.replace(/,/g, ""));

        const l1 = seriesRef.current.createPriceLine({ price: sHigh, color: "#f43f5e", lineWidth: 1, lineStyle: 2, title: "Supply H" });
        const l2 = seriesRef.current.createPriceLine({ price: sLow, color: "#f43f5e", lineWidth: 2, title: "Supply L" });
        const l3 = seriesRef.current.createPriceLine({ price: dHigh, color: "#10b981", lineWidth: 2, title: "Demand H" });
        const l4 = seriesRef.current.createPriceLine({ price: dLow, color: "#10b981", lineWidth: 1, lineStyle: 2, title: "Demand L" });

        priceLinesRef.current.push(l1, l2, l3, l4);
      }
    } catch (err) {
      console.warn("Skipping zone draw:", err);
    }
  }, [zones, signals, candleData]);

  return (
    <div className="w-full h-full min-h-100 rounded-lg overflow-hidden border border-gray-700/60 shadow-2xl flex flex-col">
      <div className="bg-[#121212] border-b border-gray-700/60 p-3 flex justify-between items-center">
        <div className="text-xs tracking-widest text-gray-400 font-bold uppercase">
          Live Market Matrix • {asset}/USDT
        </div>
        <div className="flex gap-2">
            <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 border border-red-900/50 rounded">Supply Zone</span>
            <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 border border-green-900/50 rounded">Demand Zone</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full flex-1 min-h-90" />
    </div>
  );
}