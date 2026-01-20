import requests
import json
import time
import os

def get_event_data(slug):
    url = f"https://gamma-api.polymarket.com/events?slug={slug}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        print(f"Error fetching event: {response.status_code}")
    except Exception as e:
        print(f"Exception fetching event: {e}")
    return None

def get_price_history(market_id, start_ts):
    url = "https://clob.polymarket.com/prices-history"
    params = {
        "market": market_id,
        "startTs": start_ts,
        "fidelity": 1
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        print(f"Error fetching history for {market_id}: {response.status_code}")
    except Exception as e:
        print(f"Exception fetching history: {e}")
    return None

def main():
    slug = "portugal-presidential-election"
    print(f"Fetching event: {slug}")
    events = get_event_data(slug)

    if not events:
        print("No events found.")
        return

    # Handle list response
    if isinstance(events, list):
        if len(events) == 0:
            print("Empty event list.")
            return
        event = events[0]
    else:
        event = events

    markets = event.get('markets', [])
    print(f"Found {len(markets)} markets.")

    # Filter/Sort markets by volume to find relevant ones
    # Gamma API markets usually have 'volume' or 'volume24h'
    # Let's inspect one market to see fields (based on previous run, we didn't print volume)
    # But usually it's there. We'll try to sort by volume.
    
    # Simple heuristic: "Will [Person] win" usually.
    # We'll fetch history for ALL markets that look like main candidates.
    
    # Create public/data directory if not exists
    os.makedirs("public/data", exist_ok=True)
    
    # Save event metadata
    with open("public/data/event.json", "w") as f:
        json.dump(event, f, indent=2)

    stats = []

    for market in markets:
        question = market.get('question', '')
        print(f"Processing: {question}")
        
        clob_token_ids = market.get('clobTokenIds', [])
        if isinstance(clob_token_ids, str):
            try:
                clob_token_ids = json.loads(clob_token_ids)
            except:
                clob_token_ids = []
        
        if not clob_token_ids:
            print("No clobTokenIds.")
            continue

        # Usually token[0] is YES, token[1] is NO.
        # We want probability of YES.
        # So we fetch history for token[0].
        yes_token_id = clob_token_ids[0]
        
        # 14 days of history to cover pre-election and post-election
        start_ts = int(time.time()) - 14 * 24 * 3600 
        
        history = get_price_history(yes_token_id, start_ts)
        
        if history and 'history' in history:
            points = history['history']
            print(f"  Fetched {len(points)} points.")
            
            # Save market history
            filename = f"public/data/history_{market['id']}.json"
            with open(filename, "w") as f:
                json.dump(history, f)
            
            stats.append({
                "id": market["id"],
                "question": question,
                "token_id": yes_token_id,
                "points": len(points),
                "volume": market.get("volume", 0)
            })
        else:
            print("  No history.")

    # Save summary
    with open("public/data/summary.json", "w") as f:
        json.dump(stats, f, indent=2)

if __name__ == "__main__":
    main()
