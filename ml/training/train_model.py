import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


# Load data
print("Loading dataset...")
df = pd.read_csv("../data/processed/processed.csv")
print("Dataset loaded successfully!")


# Encode categorical columns
le_weather = LabelEncoder()
le_traffic = LabelEncoder()

df["weather"] = le_weather.fit_transform(df["weather"])
df["traffic"] = le_traffic.fit_transform(df["traffic"])


# Features & target
X = df[["weather", "traffic", "temp", "hour"]]
y = df["delay"]


# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)


# Evaluate
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)

print(f"✅ Accuracy: {acc:.2f}")


# 🔥 Feature importance (important for demo)
feature_names = X.columns
importances = model.feature_importances_

print("\n📊 Feature Importance:")
for name, score in zip(feature_names, importances):
    print(f"{name}: {score:.3f}")


# Save model + encoders
with open("models/model.pkl", "wb") as f:
    pickle.dump((model, le_weather, le_traffic), f)

print("\n✅ Model saved!")