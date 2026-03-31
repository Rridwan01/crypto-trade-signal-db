from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import ccxt.async_support as ccxt
import pandas as pd

app = FastAPI()

# IMPORTANT: This allows your React app (running on a different port) to talk to Python safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, you'd restrict this to your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_unmitigated_fvgs(df):
    """Scans for unmitigated Fair Value Gaps."""
    signals = []
    for i in range(2, len(df)):
        c1 = df.iloc[i-2]
        c2 = df.iloc[i-1] 
        c3 = df.iloc[i]

        # 🟢 Bullish FVG
        if c1['high'] < c3['low'] and c2['close'] > c2['open']:
            top = c3['low']
            bottom = c1['high']
            mitigated = False
            for _, future_candle in df.iloc[i+1:].iterrows():
                if future_candle['low'] <= top: 
                    mitigated = True
                    break
            if not mitigated:
                signals.append({
                    'type': 'BULLISH FVG',
                    'time': str(c2['timestamp']), # Converted to string for JSON compatibility
                    'zone': f"{bottom} to {top}",
                    'gap_size': round(top - bottom, 2)
                })

        # 🔴 Bearish FVG
        elif c1['low'] > c3['high'] and c2['close'] < c2['open']:
            top = c1['low']
            bottom = c3['high']
            mitigated = False
            for _, future_candle in df.iloc[i+1:].iterrows():
                if future_candle['high'] >= bottom: 
                    mitigated = True
                    break
            if not mitigated:
                signals.append({
                    'type': 'BEARISH FVG',
                    'time': str(c2['timestamp']),
                    'zone': f"{bottom} to {top}",
                    'gap_size': round(top - bottom, 2)
                })
    return signals

# This creates an API endpoint at http://localhost:8000/api/signals
@app.get("/api/signals")
async def get_signals():
    exchange = ccxt.bybit({'enableRateLimit': True})
    try:
        # Fetch fresh data the moment React asks for it
        candles = await exchange.fetch_ohlcv('BTC/USDT', '15m', limit=50)
        df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        signals = find_unmitigated_fvgs(df)
        
        return {
            "status": "success",
            "symbol": "BTC/USDT",
            "timeframe": "15m",
            "active_signals": signals
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        await exchange.close()