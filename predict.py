from fastapi import FastAPI
from pydantic import BaseModel
from stable_baselines3 import PPO
import pickle
import numpy as np
import asyncio
import websocket

app = FastAPI()

# Load model
model = PPO.load("best_model.zip")

# Load scaler
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)


class MarketData(BaseModel):
    features: list


@app.post("/predict")
def predict(data: MarketData):
    obs = np.array(data.features).reshape(1, -1)
    obs = scaler.transform(obs)

    action, _ = model.predict(obs, deterministic=True)

    action_type = int(action[0])
    position_size = float(action[1])

    actions = ["Hold", "Buy", "Sell"]

    return {
        "action": actions[action_type],
        "position_size": position_size
    }

async def live_trading_loop():
    while True:
        market_data = await get_market_data()

        obs = prepare_observation(market_data)

        action = model.predict(obs)

        if int(action[0])!= 0:
            await execute_trade(action)

        await asyncio.sleep(30)