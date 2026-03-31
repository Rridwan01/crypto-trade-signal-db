import { useState, useEffect, useRef } from 'react';

export interface LiveTickerData {
  price: string;
  change: string;
  trend: 'bullish' | 'bearish';
}

export function useBybitTicker() {
  const [liveData, setLiveData] = useState<Record<string, LiveTickerData>>({
    BTC: { price: "---", change: "---", trend: "bullish" },
    SOL: { price: "---", change: "---", trend: "bearish" },
    ETH: { price: "---", change: "---", trend: "bullish" }
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let pingInterval: ReturnType<typeof setInterval>;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      // Close existing connection if any
      if (wsRef.current) wsRef.current.close();

      const ws = new WebSocket('wss://stream.bytick.com/v5/public/linear');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🟢 Connected to Bybit WebSocket");
        
        // 1. Subscribe to the data
        ws.send(JSON.stringify({
          op: 'subscribe',
          args: ['tickers.BTCUSDT', 'tickers.SOLUSDT', 'tickers.ETHUSDT']
        }));

        // 2. Start the Heartbeat (Ping every 20 seconds)
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ req_id: "ping_001", op: "ping" }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);

        // Ignore pong responses
        if (response.op === 'pong') return;

        if (response.topic && response.topic.startsWith('tickers.')) {
          const data = response.data;
          const asset = data.symbol.replace('USDT', '');

          if (data.lastPrice || data.price24hPcnt) {
            setLiveData((prev) => {
              const prevData = prev[asset];
              const newPrice = data.lastPrice 
                  ? parseFloat(data.lastPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                  : prevData.price;

              const rawChange = data.price24hPcnt ? parseFloat(data.price24hPcnt) * 100 : parseFloat(prevData.change);
              const formattedChange = (rawChange > 0 ? "+" : "") + rawChange.toFixed(2) + "%";
              const newTrend = rawChange >= 0 ? 'bullish' : 'bearish';

              return {
                ...prev,
                [asset]: { price: newPrice, change: formattedChange, trend: newTrend }
              };
            });
          }
        }
      };

      ws.onerror = (error) => {
        console.error("🔴 WebSocket Error: ", error);
        // Do not attempt to reconnect here, let onclose handle it
      };

      ws.onclose = () => {
        console.log("🟡 WebSocket Disconnected. Reconnecting in 3s...");
        clearInterval(pingInterval);
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return liveData;
}