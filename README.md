🤖 SMC Matrix Bot: Institutional Order Flow Terminal
Mission Control for Smart Money Concepts

The SMC Matrix Bot is a proprietary, full-stack algorithmic trading terminal designed to detect, visualize, and alert on institutional order flow in real-time. By bridging high-frequency exchange data with quantitative Python algorithms, the system eliminates emotional trading by mathematically defining market structure, liquidity zones, and trend exhaustion.

⚡ Core Capabilities

The Visual Matrix: A custom-built, ultra-low latency charting engine using TradingView's Lightweight Charts. It streams real-time candlesticks via Bybit WebSockets while painting algorithmic overlays on top of the price action.

Algorithmic Zone Detection: The Python engine continuously analyzes the last 100 periods of market data to mathematically calculate and plot precise Supply (Resistance) and Demand (Support) blocks.

FVG Sniper: Scans for unmitigated Bullish and Bearish Fair Value Gaps (FVGs). When an imbalance is detected, it is instantly pinned to the chart matrix and logged in the system's memory.

Context-Aware Logic: Doesn't just blindly fire signals. The bot measures the exact percentage distance between the current price and the 20-period SMA to gauge momentum, determining if the market is "Strongly Extended," "Trending," or "Drifting."

Automated Telegram Telemetry: Features a memory-safe webhook engine. The millisecond a brand new, unmitigated setup is formed, the bot pushes a formatted markdown alert directly to a mobile Telegram client, allowing for true "set-and-forget" market monitoring.

🛠 The Tech Stack

Frontend (The Glass): React 19, TypeScript, Vite, Tailwind CSS v4, Lightweight Charts v5.

Backend (The Brain): Python, FastAPI, Pandas (Dataframes & Math), CCXT (Exchange routing).

Data Pipeline: Bybit V5 Linear WebSockets (Millisecond price updates) + Bybit REST API (Historical candlestick math).
