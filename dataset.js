const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeNepse() {
    const url = "https://www.nepalstock.com";

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let stocks = [];

    $("table tbody tr").each((i, el) => {
        const cols = $(el).find("td");

        stocks.push({
            symbol: $(cols[1]).text(),
            price: $(cols[2]).text()
        });
    });

    return stocks;
};

const dataset = [
  // POSITIVE (7)
  { text: "NABIL reports record profit growth", label: "positive" },
  { text: "Hydropower stocks surge in NEPSE", label: "positive" },
  { text: "Banking sector shows strong recovery", label: "positive" },
  { text: "NTC revenue increases due to data usage", label: "positive" },
  { text: "Investor confidence rises in market", label: "positive" },
  { text: "Dividend announcements boost stocks", label: "positive" },
  { text: "NEPSE index hits new high", label: "positive" },

  // NEGATIVE (7)
  { text: "Market crashes due to political instability", label: "negative" },
  { text: "Hydropower sector faces losses", label: "negative" },
  { text: "Banking stocks decline sharply", label: "negative" },
  { text: "Low trading volume concerns investors", label: "negative" },
  { text: "Company reports unexpected losses", label: "negative" },
  { text: "Share prices fall across sectors", label: "negative" },
  { text: "Investor panic leads to sell-off", label: "negative" },

  // NEUTRAL (7)
  { text: "Market remains stable today", label: "neutral" },
  { text: "No major change in stock prices", label: "neutral" },
  { text: "Trading volume remains average", label: "neutral" },
  { text: "NEPSE index shows slight fluctuation", label: "neutral" },
  { text: "Investors await new policies", label: "neutral" },
  { text: "Stock movement remains sideways", label: "neutral" },
  { text: "Mixed performance across sectors", label: "neutral" }
];