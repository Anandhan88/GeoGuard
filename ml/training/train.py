import os
import sys
import pickle
import numpy as np
import random

# Force model directory creation
os.makedirs("ml/models", exist_ok=True)

# 1. Check module availability
SKLEARN_AVAILABLE = False
XGBOOST_AVAILABLE = False
TORCH_AVAILABLE = False

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import f1_score
    SKLEARN_AVAILABLE = True
    print("Scikit-Learn is available.")
except ImportError:
    print("Scikit-Learn NOT available. Random Forest will be skipped.")

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
    print("XGBoost is available.")
except ImportError:
    print("XGBoost NOT available. XGBoost will be skipped.")

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import TensorDataset, DataLoader
    TORCH_AVAILABLE = True
    print("PyTorch is available.")
except ImportError:
    print("PyTorch NOT available. LSTM model will be skipped.")


# 2. Generate Synthetic Dataset
def generate_synthetic_data(num_samples=2000):
    """
    Generates synthetic flood risk dataset.
    Features:
      - Rainfall (mm/hr): 0.0 to 120.0
      - Humidity (%): 40.0 to 100.0
      - Temperature (C): 15.0 to 42.0
      - Soil Moisture (%): 10.0 to 100.0
      - River Level (m): 0.5 to 6.0
    """
    np.random.seed(42)
    random.seed(42)
    
    rainfall = np.random.uniform(0.0, 120.0, num_samples)
    humidity = np.random.uniform(40.0, 100.0, num_samples)
    temperature = np.random.uniform(15.0, 42.0, num_samples)
    soil_moisture = np.random.uniform(10.0, 100.0, num_samples)
    river_level = np.random.uniform(0.5, 6.0, num_samples)
    
    X = np.stack([rainfall, humidity, temperature, soil_moisture, river_level], axis=1)
    
    # Define physical rule for flooding with 5% noise
    y = []
    for i in range(num_samples):
        rain = rainfall[i]
        soil = soil_moisture[i]
        river = river_level[i]
        
        # Heavy rain + saturated soil OR critical river mark
        is_flood = False
        if river > 3.5:
            is_flood = True
        elif rain > 65.0 and soil > 75.0:
            is_flood = True
        elif rain > 100.0:
            is_flood = True
            
        # Add noise (flip label with 5% chance)
        if random.random() < 0.05:
            is_flood = not is_flood
            
        y.append(1 if is_flood else 0)
        
    return X, np.array(y)


# PyTorch LSTM Model definition
if TORCH_AVAILABLE:
    class FloodLSTM(nn.Module):
        def __init__(self, input_dim=5, hidden_dim=16, output_dim=1, num_layers=1):
            super(FloodLSTM, self).__init__()
            self.hidden_dim = hidden_dim
            self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
            self.fc = nn.Linear(hidden_dim, output_dim)
            self.sigmoid = nn.Sigmoid()
            
        def forward(self, x):
            # Input shape: (batch_size, seq_len, features)
            # We take the output at the last time step
            lstm_out, _ = self.lstm(x)
            last_time_step = lstm_out[:, -1, :]
            out = self.fc(last_time_step)
            return self.sigmoid(out)


def train_lstm(X_train, y_train, X_val, y_val):
    """Train PyTorch LSTM model. Assumes input represents a time-sequence."""
    # Reshape features to simulate a sequence of length 3 (e.g. 3 time steps of the same event)
    # We copy the features with small variations to form sequence (batch_size, 3, 5)
    seq_len = 3
    num_features = X_train.shape[1]
    
    def create_sequences(X_data):
        seq_data = []
        for row in X_data:
            seq = []
            for t in range(seq_len):
                # Add slight decay/change backward in time
                decay = 0.9 if t == 0 else 0.95 if t == 1 else 1.0
                seq.append(row * decay)
            seq_data.append(seq)
        return np.array(seq_data)
        
    X_train_seq = create_sequences(X_train)
    X_val_seq = create_sequences(X_val)
    
    # Convert to Tensors
    train_dataset = TensorDataset(torch.FloatTensor(X_train_seq), torch.FloatTensor(y_train).unsqueeze(1))
    val_dataset = TensorDataset(torch.FloatTensor(X_val_seq), torch.FloatTensor(y_val).unsqueeze(1))
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    
    model = FloodLSTM(input_dim=num_features)
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    
    # Train Loop
    model.train()
    for epoch in range(15):
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
    # Evaluation
    model.eval()
    with torch.no_grad():
        val_outputs = model(torch.FloatTensor(X_val_seq))
        val_preds = (val_outputs.numpy() > 0.5).astype(int)
        score = f1_score(y_val, val_preds)
        
    return model, score


def main():
    print("Loading synthetic datasets...")
    X, y = generate_synthetic_data()
    
    # Split
    if SKLEARN_AVAILABLE:
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        # manual split if sklearn not available
        split_idx = int(0.8 * len(X))
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
    results = {}
    models = {}
    
    # 1. Random Forest
    if SKLEARN_AVAILABLE:
        print("\nTraining Random Forest model...")
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X_train, y_train)
        preds = rf.predict(X_val)
        rf_f1 = f1_score(y_val, preds)
        print(f"Random Forest F1-Score: {rf_f1:.4f}")
        results["random_forest"] = rf_f1
        models["random_forest"] = rf
        
    # 2. XGBoost
    if XGBOOST_AVAILABLE and SKLEARN_AVAILABLE:
        print("\nTraining XGBoost model...")
        xgb_model = xgb.XGBClassifier(n_estimators=100, max_depth=4, random_state=42, eval_metric="logloss")
        xgb_model.fit(X_train, y_train)
        preds = xgb_model.predict(X_val)
        xgb_f1 = f1_score(y_val, preds)
        print(f"XGBoost F1-Score: {xgb_f1:.4f}")
        results["xgboost"] = xgb_f1
        models["xgboost"] = xgb_model
        
    # 3. PyTorch LSTM
    if TORCH_AVAILABLE:
        print("\nTraining PyTorch LSTM model...")
        lstm_model, lstm_f1 = train_lstm(X_train, y_train, X_val, y_val)
        print(f"LSTM F1-Score: {lstm_f1:.4f}")
        results["lstm"] = lstm_f1
        models["lstm"] = lstm_model
        
    # Select Best Model
    if not results:
        print("\nNo ML libraries available. Creating a fallback heuristic model...")
        fallback_model = {
            "type": "heuristic",
            "weights": {"rainfall": 0.35, "soil_moisture": 0.25, "river_level": 0.40}
        }
        with open("ml/models/best_model.pkl", "wb") as f:
            pickle.dump(fallback_model, f)
        print("Fallback model saved.")
        return
        
    best_name = max(results, key=results.get)
    best_score = results[best_name]
    print(f"\nWinner: {best_name} with F1-Score of {best_score:.4f}")
    
    # Save the best model
    best_model_data = {
        "model_type": best_name,
        "features": ["rainfall", "humidity", "temperature", "soil_moisture", "river_level"],
        "f1_score": best_score
    }
    
    if best_name in ["random_forest", "xgboost"]:
        best_model_data["model"] = models[best_name]
        # Save feature importances
        best_model_data["feature_importances"] = list(models[best_name].feature_importances_)
    elif best_name == "lstm":
        # Save PyTorch state dict and model configuration
        torch.save(models["lstm"].state_dict(), "ml/models/lstm_weights.pt")
        best_model_data["model_type"] = "lstm"
        best_model_data["feature_importances"] = [0.35, 0.10, 0.05, 0.20, 0.30] # approximation
        
    with open("ml/models/best_model.pkl", "wb") as f:
        pickle.dump(best_model_data, f)
        
    print(f"Successfully saved {best_name} as 'ml/models/best_model.pkl'.")


if __name__ == "__main__":
    main()
