import pandas as pd

def traffic_level(x):
    if x > 5000:
        return "high"
    elif x > 3000:
        return "medium"
    else:
        return "low"

def simplify_weather(w):
    w = str(w).lower()
    if w in ["rain", "drizzle", "thunderstorm"]:
        return "rain"
    elif w in ["snow"]:
        return "snow"
    else:
        return "clear"

def create_delay(row):
    score = 0

    if row["traffic"] == "high":
        score += 1
    if row["weather"] in ["rain", "snow"]:
        score += 1
    if row["snow_1h"] > 0:
        score += 1

    return 1 if score >= 2 else 0


def process_data(input_path, output_path):
    df = pd.read_csv(input_path)

    df["traffic"] = df["traffic_volume"].apply(traffic_level)
    df["weather"] = df["weather_main"].apply(simplify_weather)
    df["delay"] = df.apply(create_delay, axis=1)

    df["hour"] = pd.to_datetime(df["date_time"], dayfirst=True).dt.hour

    df_final = df[["weather", "traffic", "temp", "hour", "delay"]]

    df_final.to_csv(output_path, index=False)

    print("✅ Data processed and saved!")

if __name__ == "__main__":
    process_data(
        "../data/raw/Metro_Interstate_Traffic_Volume.csv",
        "../data/processed/processed.csv"
    )    