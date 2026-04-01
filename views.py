from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import ShareSentiment
from .serializers import ShareSentimentSerializer
from .services import fetch_share_news
from .utils import analyze_sentiment

@api_view(['POST'])
def analyze_share_sentiment(request):
    symbol = request.data.get("symbol")

    if not symbol:
        return Response({"error": "Share symbol required"}, status=400)

    articles = fetch_share_news(symbol)
    results = []

    for article in articles:
        headline = article.get("title", "")
        source = article.get("source", {}).get("name", "Unknown")

        score, label = analyze_sentiment(headline)

        record = ShareSentiment.objects.create(
            symbol=symbol.upper(),
            headline=headline,
            sentiment_score=score,
            sentiment_label=label,
            source=source
        )

        results.append(record)

    serializer = ShareSentimentSerializer(results, many=True)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
