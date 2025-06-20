import pickle

import pandas as pd

# --- 1. Load the Model ---
model_filename = "t20i_batsmen_model.pkl"  # Or your model's filename
try:
    loaded_model = pickle.load(open(model_filename, 'rb'))
    print("Model loaded successfully!")
except FileNotFoundError:
    print(f"Error: Model file '{model_filename}' not found. Make sure you have trained and saved the model.")
    exit()
except Exception as e:
    print(f"Error loading model: {e}")
    exit()

# --- 2. Create Dummy Data ---
features = [
    "Early Overs Average", "Early Overs Strike Rate",
    "Middle Overs Average", "Middle Overs Strike Rate",
    "Death Overs Average", "Death Overs Strike Rate"
]


dummy_data = pd.DataFrame({
    "Early Overs Average": [30, 40, 50, 25, 35],
    "Early Overs Strike Rate": [120, 130, 140, 110, 125],
    "Middle Overs Average": [40, 50, 60, 30, 45],
    "Middle Overs Strike Rate": [130, 140, 150, 120, 135],
    "Death Overs Average": [20, 30, 40, 15, 25],
    "Death Overs Strike Rate": [150, 160, 170, 140, 155]
})

dummy_data = dummy_data[features]

# --- 3. Make Predictions ---
try:
    predictions = loaded_model.predict(dummy_data)
    print("Predictions:")
    print(predictions)

except Exception as e:
    print(f"Error making predictions: {e}")

try:
    ridge_model_filename = "t20i_batsmen_ridge_model.pkl"
    loaded_ridge_model = pickle.load(open(ridge_model_filename, 'rb'))
    ridge_predictions = loaded_ridge_model.predict(dummy_data)
    print("\nRidge Regression Predictions:")
    print(ridge_predictions)
except FileNotFoundError:
    print(f"Warning: Ridge model file '{ridge_model_filename}' not found.")
except Exception as e:
    print(f"Error loading ridge model: {e}")

try:
    rf_model_filename = "t20i_batsmen_rf_model.pkl"
    loaded_rf_model = pickle.load(open(rf_model_filename, 'rb'))
    rf_predictions = loaded_rf_model.predict(dummy_data)
    print("\nRandom Forest Predictions:")
    print(rf_predictions)
except FileNotFoundError:
    print(f"Warning: Random Forest model file '{rf_model_filename}' not found.")
except Exception as e:
    print(f"Error loading Random Forest model: {e}")
