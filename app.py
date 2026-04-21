import streamlit as st
import matplotlib.pyplot as plt
import random
from utils.weather import get_weather
from ml.inference.predict import predict_delay
from utils.route import get_route
import datetime
import pandas as pd

st.set_page_config(page_title="Supply Chain Risk Dashboard", layout="centered")

# -------------------------------
# 🎯 Title
# -------------------------------
st.title("🚀 Real-Time Risk Dashboard")
st.markdown("Predict shipment delay risk using **weather + traffic conditions**")

st.divider()

# -------------------------------
# 🧾 Input Section
# -------------------------------
st.subheader("📍 Shipment Details")

col1, col2 = st.columns(2)

with col1:
    source = st.text_input("Source City", "Delhi")

with col2:
    destination = st.text_input("Destination City", "Mumbai")

traffic = st.selectbox("🚗 Traffic Level", ["low", "medium", "high"])

st.divider()

# -------------------------------
# 🔘 Button Action
# -------------------------------
if st.button("🔍 Analyze Risk"):

    with st.spinner("Fetching data & analyzing risk..."):

        # 🌦️ Weather API
        weather, temp, dest_lat, dest_lon = get_weather(destination)
        _, _, src_lat, src_lon = get_weather(source)

        # 🗺️ Route (distance + duration only)
        route = None
        if src_lat is not None and dest_lat is not None:
            route = get_route([src_lon, src_lat], [dest_lon, dest_lat])

        # ⏰ Current hour
        hour = datetime.datetime.now().hour

        # 🤖 ML Prediction
        result = predict_delay(weather.lower(), traffic, temp, hour)

    st.divider()

    # -------------------------------
    # 🗺️ Map (ONLY points)
    # -------------------------------
    if src_lat is not None and dest_lat is not None:
        st.subheader("🗺️ Route Map")

        map_data = pd.DataFrame({
            "lat": [src_lat, dest_lat],
            "lon": [src_lon, dest_lon]
        })

        st.map(map_data)
    else:
        st.warning("⚠️ Map unavailable (invalid locations)")

    # -------------------------------
    # 📊 Risk Analysis
    # -------------------------------
    st.subheader("📊 Risk Analysis")

    col1, col2, col3 = st.columns(3)

    col1.metric("🌦️ Weather", weather)
    col2.metric("🌡️ Temp (°C)", round(temp, 2))
    col3.metric("⚠️ Risk Score", result["risk_score"])

    st.progress(result["risk_score"] / 100)

    st.write("🧠 Model Base Probability:", round(result["delay_probability"], 2))

    if result["risk_score"] < 30:
        st.success("🟢 Low Risk - Shipment likely on time")
    elif result["risk_score"] < 70:
        st.warning("🟡 Medium Risk - Possible minor delay")
    else:
        st.error("🔴 High Risk - Delay expected!")

    # -------------------------------
    # 🗺️ Route Info
    # -------------------------------
    if route:
        distance, duration = route

        st.subheader("🗺️ Route Information")

        col1, col2 = st.columns(2)

        col1.metric("📏 Distance (km)", round(distance, 2))
        col2.metric("⏱️ Duration (min)", round(duration, 2))
    else:
        st.warning("⚠️ Route data unavailable")

    # -------------------------------
    # 📌 Contributing Factors
    # -------------------------------
    st.subheader("📌 Contributing Factors")

    st.write(f"- 🌦️ Weather condition: **{weather}**")
    st.write(f"- 🚗 Traffic level: **{traffic}**")
    st.write(f"- ⏰ Time of day: **{hour}:00 hrs**")

    # -------------------------------
    # 🚨 Alert
    # -------------------------------
    if result["risk_score"] > 70:
        st.error("⚠️ Shipment may be delayed by ~2–3 hours")

    # -------------------------------
    # 🧭 Decision Layer
    # -------------------------------
    st.subheader("🧭 Recommended Action")

    if result["risk_score"] < 30:
        st.success("✅ Safe to proceed with shipment")
    elif result["risk_score"] < 70:
        st.warning("⚠️ Moderate risk — monitor conditions")
    else:
        st.error("🚨 Consider delaying or rerouting")

    # -------------------------------
    # 📈 Risk Trend
    # -------------------------------
    st.subheader("📈 Risk Trend")

    past_risks = [random.randint(20, 60) for _ in range(3)]
    risk_history = past_risks + [result["risk_score"]]

    fig = plt.figure()
    plt.plot(risk_history, marker='o')
    plt.title("Risk Trend Over Time")
    plt.xlabel("Time Step")
    plt.ylabel("Risk Score")

    st.pyplot(fig)