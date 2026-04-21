import pandas as pd
from ml.utils import preprocessing

# Paths
input_path = "data/sample_input.csv"
processed_path = "data/sample_processed.csv"

# 1. Data Preprocessing
print("Processing sample data...")
preprocessing.process_data(input_path, processed_path)

# 2. Load processed data and show
print("\nProcessed Data Preview:")
df = pd.read_csv(processed_path)
print(df.head())

# 3. (Optional) Predict delay for first row if model and encoders are available
try:
    from ml.inference import predict
    row = df.iloc[0]
    pred = predict.predict_delay(row['weather'], row['traffic'], row['temp'], row['hour'])
    print(f"\nPredicted delay for first row: {pred}")
except Exception as e:
    print("\nPrediction step skipped (model/encoders not available):", e)
