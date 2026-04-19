import pickle
import pandas as pd


# Load model + encoders (once at startup)
with open("ml/models/model.pkl", "rb") as f:
    model, le_weather, le_traffic = pickle.load(f)


def get_risk_level(score):
    if score < 30:
        return "Low 🟢"
    elif score < 70:
        return "Medium 🟡"
    else:
        return "High 🔴"


def predict_delay(weather, traffic, temp, hour):
    try:
        # 🔹 Encode categorical inputs
        weather_encoded = le_weather.transform([weather])[0]
        traffic_encoded = le_traffic.transform([traffic])[0]

        # 🔹 Create DataFrame (avoids sklearn warning)
        X = pd.DataFrame([{
            "weather": weather_encoded,
            "traffic": traffic_encoded,
            "temp": temp,
            "hour": hour
        }])

        # 🔹 Predict probability
        delay_prob = model.predict_proba(X)[0][1]

        # 🔹 Convert to usable outputs
        delay_prob = float(round(delay_prob, 2))
        risk_score = int(delay_prob * 100)
        risk_level = get_risk_level(risk_score)

        return {
            "delay_probability": delay_prob,
            "risk_score": risk_score,
            "risk_level": risk_level
        }

    except Exception as e:
        return {
            "error": str(e)
        }