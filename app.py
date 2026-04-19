import streamlit as st
from ml.inference.predict import predict_delay

st.set_page_config(page_title="Risk Dashboard", layout="centered")

st.title("🚀 Real-Time Risk Scoring Dashboard")

st.markdown("Predict shipment delay risk based on conditions")

# Inputs
weather = st.selectbox("🌦️ Weather", ["clear", "rain", "snow"])
traffic = st.selectbox("🚦 Traffic", ["low", "medium", "high"])
temp = st.slider("🌡️ Temperature (Kelvin)", 250, 320, 300)
hour = st.slider("🕒 Hour of Day", 0, 23, 12)

# Button
if st.button("🔍 Predict Risk"):
    result = predict_delay(weather, traffic, temp, hour)

    if "error" in result:
        st.error(result["error"])
    else:
        st.subheader("📊 Prediction Result")

        st.metric("Delay Probability", f"{result['delay_probability']}")
        st.metric("Risk Score", f"{result['risk_score']}")

        # Color-coded risk
        if "Low" in result["risk_level"]:
            st.success(result["risk_level"])
        elif "Medium" in result["risk_level"]:
            st.warning(result["risk_level"])
        else:
            st.error(result["risk_level"])