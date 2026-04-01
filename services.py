import requests
from utils import analyze_sentiment

NEWS_API_KEY = "YOUR_NEWS_API_KEY"
NEWS_API_URL = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=IBM&apikey=demo&datatype=csv"

def fetch_financial_news(query="stock market", language="en", page_size=10):

    if NEWS_API_KEY == "YOUR_NEWS_API_KEY":
        print("Warning: Please replace 'YOUR_NEWS_API_KEY' in services.py with your actual API key.")
        return []

    params = {
        "q": query,
        "apiKey": NEWS_API_KEY,
        "language": language,
        "sortBy": "publishedAt",
        "pageSize": page_size
    }

    try:
        response = requests.get(NEWS_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        articles = []
        if data.get("status") == "ok":
            for item in data.get("articles", []):
                title = item.get("title", "")
                description = item.get("description", "") or ""
                content = f"{title} {description}"
                
                # Analyze sentiment using the util function
                sentiment_score, sentiment_label = analyze_sentiment(content)
                
                articles.append({
                    "title": title,
                    "description": description,
                    "url": item.get("url"),
                    "published_at": item.get("publishedAt"),
                    "source": item.get("source", {}).get("name"),
                    "sentiment_score": sentiment_score,
                    "sentiment_label": sentiment_label
                })
        
        return articles

    except requests.exceptions.RequestException as e:
        print(f"Error fetching news: {e}")
        return []
