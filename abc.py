import pickle

# Load model & vectorizer
with open("model/sentiment_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("model/vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

def predict_sentiment(text):
    text_vec = vectorizer.transform([text])
    return model.predict(text_vec)[0]

# Example
print(predict_sentiment("This share analysis portal is amazing"))
