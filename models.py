from django.db import models

class ShareSentiment(models.Model):
    symbol = models.CharField(max_length=10)
    headline = models.TextField()
    sentiment_score = models.FloatField()
    sentiment_label = models.CharField(max_length=20)
    source = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.symbol} - {self.sentiment_label}"
