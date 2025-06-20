import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression  # You can change this
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import pickle

# 1. Data Loading and Preparation
try:
    df = pd.read_csv("t20i_batsmen_stats.csv")
except FileNotFoundError:
    print("Error: t20i_batsmen_stats.csv not found. Make sure it's in the same directory.")
    exit()  # Or handle differently

features = [
    "Early Overs Average", "Early Overs Strike Rate",
    "Middle Overs Average", "Middle Overs Strike Rate",
    "Death Overs Average", "Death Overs Strike Rate"
]
target = "Overall Average"

X = df[features]
y = df[target]

# Feature Scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_scaled_df = pd.DataFrame(X_scaled, columns=X.columns)  # Convert back to DataFrame

X_train, X_test, y_train, y_test = train_test_split(X_scaled_df, y, test_size=0.2, random_state=42)


model = LinearRegression()
model.fit(X_train, y_train)

# 3. Model Evaluation
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Mean Squared Error: {mse}")
print(f"R-squared: {r2}")

# 4. Save Model and Scaler
model_filename = "t20i_batsmen_model.pkl"
scaler_filename = "t20i_batsmen_scaler.pkl"

try:
    with open(model_filename, 'wb') as f:
        pickle.dump(model, f)
    with open(scaler_filename, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"Model saved to {model_filename}")
    print(f"Scaler saved to {scaler_filename}")
except Exception as e:
    print(f"Error saving model or scaler: {e}")

print("Training Complete!")
