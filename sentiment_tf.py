import os
import json

try:
    import numpy as np
    import tensorflow as tf
    from tensorflow.keras.models import load_model
except ModuleNotFoundError as e:
    missing = e.name
    raise ModuleNotFoundError(
        f"{missing} is not installed. Please run: pip install tensorflow numpy\n" 
        "If you are on a constrained CPU environment use tensorflow-cpu instead: pip install tensorflow-cpu numpy"
    ) from e

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best_model.keras")

CLASS_LABELS = {
    0: "very negative",
    1: "negative",
    2: "neutral",
    3: "positive",
    4: "very positive",
}


def load_sentiment_model(path=MODEL_PATH):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found at {path}")
    return load_model(path)


def preprocess_text(text):
    """Placeholder text preprocessing.

    Replace this with your tokenizer + padding pipeline to match training.
    """
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Input text must be a non-empty string")

    # Example dummy conversion (must align with training preprocessing):
    # - tokenize
    # - convert tokens to indices
    # - pad/truncate to max length
    # Here we return a dummy 2D float array to let code run.
    # TODO: use the real tokenizer saved from training.
    return np.zeros((1, 128), dtype=np.float32)


def predict_sentiment(text, model=None):
    if model is None:
        model = load_sentiment_model()

    x = preprocess_text(text)
    preds = model.predict(x)

    if preds.ndim == 2 and preds.shape[1] >= 5:
        label_index = int(np.argmax(preds, axis=1)[0])
        score = float(np.max(preds, axis=1)[0])
    else:
        raise ValueError("Unexpected model output shape: {}".format(preds.shape))

    return {
        "label": CLASS_LABELS.get(label_index, "unknown"),
        "class": label_index,
        "score": score,
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        text = sys.argv[1]
        try:
            model = load_sentiment_model()
            result = predict_sentiment(text, model=model)
            print(json.dumps(result))
        except Exception as err:
            print(json.dumps({"error": str(err)}))
            sys.exit(1)
    else:
        try:
            model = load_sentiment_model()
            sample_text = "शेयर बजारमा राम्रो वृद्धि भएको छ"
            result = predict_sentiment(sample_text, model=model)
            print("Input:", sample_text)
            print("Sentiment:", result)
        except Exception as err:
            print("Error running TensorFlow sentiment prediction:", err)
