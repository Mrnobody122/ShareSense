const express = require("express");
const router = express.Router();
const { shares } = require("./data/dummyData");

const HF_MODEL = "robinGiri2024/nepse-sentiment-analyzer";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_API_TOKEN = process.env.HF_API_TOKEN || "";

async function analyzeTextWithHuggingFace(text) {
    if (!text || typeof text !== "string" || !text.trim()) {
        return { label: "neutral", score: 0 };
    }

    const payload = { inputs: text };
    const headers = {
        "Content-Type": "application/json",
    };

    if (HF_API_TOKEN) {
        headers["Authorization"] = `Bearer ${HF_API_TOKEN}`;
    }

    const response = await fetch(HF_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const message = json.error || `Hugging Face API error (${response.status})`;
        throw new Error(message);
    }

    const data = await response.json();

    // expected shape: [{label: "Positive", score: 0.9}, ...]
    if (Array.isArray(data) && data.length > 0) {
        const best = data[0];
        return { label: best.label.toLowerCase(), score: best.score };
    }

    return { label: "neutral", score: 0 };
}

router.get("/", (req, res) => {
    res.json(shares);
});
router.get("/:symbol", (req, res) => {

    const share = shares.find(
        s => s.symbol.toLowerCase() === req.params.symbol.toLowerCase()
    );

    if (!share) {
        return res.status(404).json({ message: "Share not found" });
    }

    res.json(share);
});

router.post("/analyze", async (req, res) => {
    const { symbol } = req.body;

    if (!symbol) {
        return res.status(400).json({ message: "symbol is required" });
    }

    const share = shares.find(
        (s) => s.symbol.toLowerCase() === symbol.toLowerCase()
    );

    if (!share) {
        return res.status(404).json({ message: "Share not found" });
    }

    const text = share.news || `${share.symbol} news sentiment`; // fallback text

    try {
        const sentiment = await analyzeTextWithHuggingFace(text);
        return res.json({
            symbol: share.symbol,
            sentiment: sentiment.label,
            score: sentiment.score,
            insight: share.news,
        });
    } catch (err) {
        console.error("Hugging Face sentiment error:", err.message);
        // fallback to existing local sentiment if available
        return res.json({
            symbol: share.symbol,
            sentiment: share.sentiment || "unknown",
            score: 0,
            insight: share.news,
            warning: "Hugging Face API unavailable, returned fallback sentiment",
        });
    }
});

router.post("/sentiment", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: "text is required for sentiment analysis" });
    }

    try {
        const sentiment = await analyzeTextWithHuggingFace(text);
        res.json({ text, sentiment });
    } catch (err) {
        console.error("Hugging Face sentiment error:", err.message);
        res.status(500).json({ message: "Unable to analyze sentiment", error: err.message });
    }
});

router.post("/sentiment/tf", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: "text is required for TensorFlow sentiment analysis" });
    }

    try {
        const { spawn } = require("child_process");
        const pythonProcess = spawn("py", ["-3", "sentiment_tf.py", text], { cwd: __dirname });

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                console.error("Python error:", errorOutput);
                return res.status(500).json({ message: "TensorFlow analysis failed", error: errorOutput });
            }

            try {
                const result = JSON.parse(output.trim());
                res.json({ text, sentiment: result });
            } catch (parseErr) {
                res.status(500).json({ message: "Failed to parse TensorFlow output", error: parseErr.message });
            }
        });
    } catch (err) {
        console.error("TensorFlow sentiment error:", err.message);
        res.status(500).json({ message: "Unable to analyze sentiment with TensorFlow", error: err.message });
    }
});

const safeFetch = async (url) => {
    const fetchFn = global.fetch || (await import('node-fetch')).default;
    const response = await fetchFn(url);
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`External API request failed with status ${response.status}: ${body}`);
    }
    return response.json();
};

router.get('/external/price-history', async (req, res) => {
    const symbol = req.query.symbol || 'RSDC';
    const pageSize = req.query.pageSize || 10;
    const url = `https://sharehubnepal.com/data/api/v1/price-history?pageSize=${pageSize}&symbol=${symbol}`;
    try {
        const result = await safeFetch(url);
        return res.json(result);
    } catch (err) {
        console.error('External price-history error', err.message);
        return res.status(502).json({ message: 'Failed to fetch price history', error: err.message });
    }
});

router.get('/external/floorsheet', async (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const page = req.query.page || 1;
    const size = req.query.size || 500;
    const url = `https://chukul.com/api/data/v2/floorsheet/bydate/?date=${date}&page=${page}&size=${size}`;
    try {
        const result = await safeFetch(url);
        return res.json(result);
    } catch (err) {
        console.error('External floorsheet error', err.message);
        return res.status(502).json({ message: 'Failed to fetch floorsheet data', error: err.message });
    }
});

module.exports = router;
