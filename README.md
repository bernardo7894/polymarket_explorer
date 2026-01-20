# Polymarket Investigation Dashboard

This tool allows you to investigate "Portugal Presidential Election" market data for potential insider trading patterns.

## Features
- **Minute-by-minute granularity**: View high-resolution price history.
- **Top Candidates**: Automatically sorts markets by volume.
- **Interactive Chart**: Zoomable timeline (using the brush at the bottom).
- **Dark Mode**: Premium aesthetics.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Fetch Data** (Optional, detailed data already included):
    ```bash
    python scripts/fetch_data.py
    ```
    This script fetches data from Polymarket API and effectively snapshots it into `public/data`.

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Investigation Tips
- Use the **slider** at the bottom of the chart to zoom into specific timeframes (e.g., Jan 15-16).
- Look for sudden price jumps (vertical lines) that precede major news or poll releases.
- Compare trading volume (total) to identify liquid markets.
# polymarket_explorer
