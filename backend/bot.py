from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import ccxt.async_support as ccxt
import pandas as pd
import asyncio
import urllib.request
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
ALERTED_SIGNALS = set()

def send_telegram_alert(asset, signal_type, zone, gap_size):
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN":
        return

    icon = "🟢" if "BULLISH" in signal_type else "🔴"
    # Formatting with Markdown for clean bold text
    text = f"{icon} *{signal_type} DETECTED* {icon}\n*Asset:* {asset}/USDT\n*Zone:* {zone}\n*Gap Size:* {gap_size} points\n_Awaiting mitigation for entry._"
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "Markdown"
    }).encode('utf-8')
    
    try:
        req = urllib.request.Request(url, data=payload, method='POST')
        req.add_header('Content-Type', 'application/json')
        urllib.request.urlopen(req)
    except Exception as e:
        print(f"🔴 Failed to send Telegram alert: {e}")

# The bot's sniper memory for zones waiting to be tapped
PENDING_ZONES = {} 

def send_telegram_entry_alert(asset, signal_type, zone_str):
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN":
        return

    icon = "🎯"
    action = "LONG" if "BULLISH" in signal_type else "SHORT"
    
    text = f"{icon} *PRECISE ENTRY TRIGGERED* {icon}\n*Asset:* {asset}/USDT\n*Action:* {action}\n*Mitigating Zone:* {zone_str}\n_The algorithmic FVG has been tapped!_"
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "Markdown"
    }).encode('utf-8')
    
    try:
        req = urllib.request.Request(url, data=payload, method='POST')
        req.add_header('Content-Type', 'application/json')
        urllib.request.urlopen(req)
    except Exception as e:
        print(f"🔴 Failed to send Entry alert: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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
                    'time': str(c2['timestamp']),
                    'zone': f"{bottom:,.2f} to {top:,.2f}",
                    'gap_size': round(top - bottom, 2)
                })

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
                    'zone': f"{bottom:,.2f} to {top:,.2f}",
                    'gap_size': round(top - bottom, 2)
                })
    return signals

def analyze_market_structure(df, asset_key):
    """Calculates Trend, Logic, and Supply/Demand Zones dynamically."""
    df['sma_20'] = df['close'].rolling(window=20).mean()
    current_close = df.iloc[-1]['close']
    current_sma = df.iloc[-1]['sma_20']
    
    # Calculate percentage distance from SMA to measure momentum
    distance_from_sma = ((current_close - current_sma) / current_sma) * 100

    if current_close > current_sma:
        trend = "bullish"
        if distance_from_sma > 1.5:
            signal_text = "STRONG LONGS FAVORED"
            reasoning = f"Extreme momentum. {asset_key} is heavily extended +{distance_from_sma:.2f}% above the 20-SMA. Watch for minor pullbacks into demand."
            action_text = f"BUY DIPS - wait for FVG mitigation"
        else:
            signal_text = "LONGS FAVORED"
            reasoning = f"Steady structure. {asset_key} is holding +{distance_from_sma:.2f}% above the 20-SMA. Institutional order flow remains bullish."
            action_text = f"TAKE {asset_key} LONG - macro confirmed"
    else:
        trend = "bearish"
        if distance_from_sma < -1.5:
            signal_text = "STRONG SHORTS FAVORED"
            reasoning = f"Heavy sell-off. {asset_key} is deeply extended {distance_from_sma:.2f}% below the 20-SMA. Sellers are aggressively trapping liquidity."
            action_text = f"SELL RALLIES - wait for premium supply"
        else:
            signal_text = "SHORTS FAVORED"
            reasoning = f"Weak structure. {asset_key} is drifting {distance_from_sma:.2f}% below the 20-SMA. Buyers failing to break market structure."
            action_text = f"TAKE {asset_key} SHORT - resistance held"

    highest_candle = df.loc[df['high'].idxmax()]
    lowest_candle = df.loc[df['low'].idxmin()]

    return {
        "name": asset_key,
        "trend": trend,
        "signalText": signal_text,
        "reasoning": reasoning,
        "actionText": action_text,
        "zones": {
            "supplyHigh": f"{highest_candle['high']:,.2f}",
            "supplyLow": f"{max(highest_candle['open'], highest_candle['close']):,.2f}",
            "demandHigh": f"{min(lowest_candle['open'], lowest_candle['close']):,.2f}",
            "demandLow": f"{lowest_candle['low']:,.2f}"
        }
    }

@app.get("/")
async def root():
    return {"status": "online", "system": "SMC Matrix Backend Active"}

@app.get("/api/signals")
async def get_signals():
    exchange = ccxt.bybit({'enableRateLimit': True})
    
    # We will fetch data for all three dashboard assets
    symbols = ['BTC/USDT', 'SOL/USDT', 'ETH/USDT']
    market_data = {}

    try:
        for symbol in symbols:
            asset_key = symbol.split('/')[0] # Extracts 'BTC', 'SOL', or 'ETH'
            
            # Fetch 50 candles on the 15-minute timeframe
            candles = await exchange.fetch_ohlcv(symbol, '15m', limit=50)
            df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')

            # Run our algorithmic scanners
            active_signals = find_unmitigated_fvgs(df)
            structure = analyze_market_structure(df, asset_key)
            
            # Get the live price extremes from the current unclosed candle
            current_high = float(df.iloc[-1]['high'])
            current_low = float(df.iloc[-1]['low'])

            # --- 1. LOG NEW GAPS INTO SNIPER MEMORY ---
            for sig in active_signals:
                unique_sig_id = f"{asset_key}_{sig['time']}"
                
                if unique_sig_id not in ALERTED_SIGNALS:
                    ALERTED_SIGNALS.add(unique_sig_id)
                    
                    # Optional: You can comment this out if you ONLY want entry alerts, 
                    # not the "FVG Detected" alerts anymore.
                    send_telegram_alert(
                        asset=asset_key, signal_type=sig['type'], 
                        zone=sig['zone'], gap_size=sig['gap_size']
                    )
                    
                    # Parse the zone coordinates (e.g. "65000.50 - 64800.00")
                    try:
                        prices = [float(p.replace(',', '')) for p in sig['zone'].split(" - ")]
                        PENDING_ZONES[unique_sig_id] = {
                            'asset': asset_key,
                            'type': sig['type'],
                            'top': max(prices),
                            'bottom': min(prices)
                        }
                    except Exception as e:
                        print(f"Could not parse zone coordinates: {e}")

            # --- 2. DETECT MITIGATION (THE PRECISE ENTRY) ---
            mitigated_keys = []
            for sig_id, zone_data in PENDING_ZONES.items():
                if zone_data['asset'] == asset_key:
                    is_mitigated = False
                    
                    if "BULLISH" in zone_data['type']:
                        # If price drops down and taps the top of the Bullish FVG
                        if current_low <= zone_data['top']:
                            is_mitigated = True
                            
                    elif "BEARISH" in zone_data['type']:
                        # If price pushes up and taps the bottom of the Bearish FVG
                        if current_high >= zone_data['bottom']:
                            is_mitigated = True
                            
                    if is_mitigated:
                        zone_str = f"{zone_data['top']} - {zone_data['bottom']}"
                        send_telegram_entry_alert(asset_key, zone_data['type'], zone_str)
                        # Queue this zone to be deleted so we don't spam the alert
                        mitigated_keys.append(sig_id)
            
            # --- 3. CLEAN UP MEMORY ---
            for key in mitigated_keys:
                del PENDING_ZONES[key]
            
            # Bundle the FVG signals into the structure object
            structure["active_signals"] = active_signals
            market_data[asset_key] = structure

        return {
            "status": "success",
            "data": market_data
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        await exchange.close()