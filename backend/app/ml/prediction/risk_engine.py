"""
GeoGuard AI - Risk Prediction Engine (Module 1)
Integrates trained Random Forest, XGBoost, and LSTM PyTorch models for flood risk predictions with XAI explainability.
"""
import os
import pickle
import numpy as np
from typing import Dict, Any, List


class RiskEngine:
    def __init__(self):
        self.model_path = "ml/models/best_model.pkl"
        self.model_data = None
        self.lstm_model = None
        
        # Load best trained model if available
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model_data = pickle.load(f)
                print(f"RiskEngine: Successfully loaded model of type '{self.model_data.get('model_type')}'")
                
                # Load weights if LSTM
                if self.model_data.get("model_type") == "lstm":
                    import torch
                    # Define model class matching train.py
                    class FloodLSTM(torch.nn.Module):
                        def __init__(self, input_dim=5, hidden_dim=16, output_dim=1, num_layers=1):
                            super(FloodLSTM, self).__init__()
                            self.lstm = torch.nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
                            self.fc = torch.nn.Linear(hidden_dim, output_dim)
                            self.sigmoid = torch.nn.Sigmoid()
                            
                        def forward(self, x):
                            lstm_out, _ = self.lstm(x)
                            last_time_step = lstm_out[:, -1, :]
                            out = self.fc(last_time_step)
                            return self.sigmoid(out)
                            
                    self.lstm_model = FloodLSTM()
                    self.lstm_model.load_state_dict(torch.load("ml/models/lstm_weights.pt"))
                    self.lstm_model.eval()
            except Exception as e:
                print(f"RiskEngine: Failed to load trained model: {e}. Using heuristics.")
                
        # Heuristic fallbacks for inputs
        self.fallback_weights = {
            "river_level": 0.28,
            "rainfall_intensity": 0.24,
            "soil_saturation": 0.18,
            "drainage_capacity": 0.15,
            "upstream_reservoir": 0.10,
            "tide_level": 0.05
        }
        
        self.thresholds = {
            "river_level": 3.5,          # meters
            "rainfall_intensity": 65.0,   # mm/hr
            "soil_saturation": 80.0,      # percent
            "drainage_capacity": 50.0,    # percent (lower capacity -> higher risk)
            "upstream_reservoir": 85.0,   # percent
            "tide_level": 1.2,            # meters
            "temperature": 32.0,          # degrees C
            "humidity": 85.0              # percent
        }

    def predict_risk(self, inputs: Dict[str, float]) -> Dict[str, Any]:
        """
        Predicts flood risk score (0-100), probability (0-1),
        confidence, and factor contributions using the best ML model.
        """
        # Map frontend metrics to training/inference features
        river_level = inputs.get("river_level", 2.0)
        rainfall_intensity = inputs.get("rainfall_intensity", 15.0)
        soil_saturation = inputs.get("soil_saturation", 50.0)
        drainage_capacity = inputs.get("drainage_capacity", 80.0)
        upstream_reservoir = inputs.get("upstream_reservoir", 60.0)
        tide_level = inputs.get("tide_level", 0.5)
        temperature = inputs.get("temperature", 28.0)
        humidity = inputs.get("humidity", 75.0)

        # Heuristic Normalized Risks (0 to 1) for XAI
        river_risk = min(1.0, max(0.0, (river_level - 1.0) / 4.0))
        rain_risk = min(1.0, max(0.0, rainfall_intensity / 120.0))
        soil_risk = min(1.0, max(0.0, (soil_saturation - 20.0) / 80.0))
        drainage_risk = 1.0 - (min(100.0, max(0.0, drainage_capacity)) / 100.0)
        reservoir_risk = min(1.0, max(0.0, (upstream_reservoir - 40.0) / 60.0))
        tide_risk = min(1.0, max(0.0, tide_level / 2.5))
        temp_risk = min(1.0, max(0.0, (temperature - 20.0) / 20.0))
        humidity_risk = min(1.0, max(0.0, (humidity - 40.0) / 60.0))

        # Check if we have trained ML model loaded
        if self.model_data is not None:
            try:
                # Features list: ["rainfall", "humidity", "temperature", "soil_moisture", "river_level"]
                x_in = np.array([[rainfall_intensity, humidity, temperature, soil_saturation, river_level]])
                
                model_type = self.model_data.get("model_type")
                
                if model_type in ["random_forest", "xgboost"]:
                    model = self.model_data["model"]
                    probability = float(model.predict_proba(x_in)[0][1])
                elif model_type == "lstm" and self.lstm_model is not None:
                    import torch
                    # Create sequence of length 3 (batch_size=1, seq_len=3, num_features=5)
                    x_seq = np.array([[x_in[0] * 0.9, x_in[0] * 0.95, x_in[0]]])
                    with torch.no_grad():
                        out = self.lstm_model(torch.FloatTensor(x_seq))
                        probability = float(out.numpy()[0][0])
                else:
                    raise Exception("Model type not supported")
                
                risk_score = round(probability * 100)
                confidence = float(self.model_data.get("f1_score", 0.95))
                
                # Get Feature Importance weights for XAI scaling
                importances = self.model_data.get("feature_importances", [0.35, 0.10, 0.05, 0.20, 0.30])
                # Normalize importance weights
                imp_sum = sum(importances)
                imp_w = [i / imp_sum for i in importances]
                
                # Map back to XAI factors
                xai_raw = {
                    "rainfall_intensity": (rainfall_intensity, "mm/hr", imp_w[0], rain_risk),
                    "humidity": (humidity, "%", imp_w[1], humidity_risk),
                    "temperature": (temperature, "C", imp_w[2], temp_risk),
                    "soil_saturation": (soil_saturation, "%", imp_w[3], soil_risk),
                    "river_level": (river_level, "m", imp_w[4], river_risk)
                }
                
                contributions = []
                for key, (val, unit, weight, feature_risk) in xai_raw.items():
                    contr_pct = round(feature_risk * weight * 100)
                    contributions.append({
                        "name": key.replace("_", " ").title(),
                        "value": round(val, 1),
                        "unit": unit,
                        "contribution": contr_pct,
                        "threshold": self.thresholds.get(key, 50.0),
                        "trend": "increasing" if feature_risk > 0.5 else "stable"
                    })
                
                # Add extra fields (drainage, reservoir, tide) as secondary contextual features
                for key, val, weight, feature_risk in [
                    ("drainage_capacity", drainage_capacity, 0.05, drainage_risk),
                    ("upstream_reservoir", upstream_reservoir, 0.05, reservoir_risk),
                    ("tide_level", tide_level, 0.05, tide_risk)
                ]:
                    contr_pct = round(feature_risk * weight * 100)
                    contributions.append({
                        "name": key.replace("_", " ").title(),
                        "value": round(val, 1),
                        "unit": "%" if "level" not in key else "m",
                        "contribution": contr_pct,
                        "threshold": self.thresholds.get(key, 50.0),
                        "trend": "increasing" if feature_risk > 0.5 else "stable"
                    })
                
                contributions.sort(key=lambda x: x["contribution"], reverse=True)
                
                return {
                    "risk_score": risk_score,
                    "probability": round(probability, 2),
                    "confidence": round(confidence, 2),
                    "risk_level": "critical" if risk_score >= 80 else "high" if risk_score >= 60 else "medium" if risk_score >= 40 else "low",
                    "factors": contributions
                }
            except Exception as e:
                print(f"RiskEngine: Inference failed: {e}. Falling back to heuristics.")
                
        # Heuristic implementation
        risks = {
            "river_level": river_risk,
            "rainfall_intensity": rain_risk,
            "soil_saturation": soil_risk,
            "drainage_capacity": drainage_risk,
            "upstream_reservoir": reservoir_risk,
            "tide_level": tide_risk
        }
        
        weighted_score = sum(risks[key] * self.fallback_weights[key] for key in self.fallback_weights)
        risk_score = round(weighted_score * 100)
        probability = round(weighted_score, 2)
        confidence = 0.95 if rainfall_intensity <= 150 else 0.85

        contributions = []
        for key, weight in self.fallback_weights.items():
            contr_pct = round(risks[key] * weight * 100)
            contributions.append({
                "name": key.replace("_", " ").title(),
                "value": inputs.get(key, 0.0),
                "unit": "m" if "level" in key or "tide" in key else "mm/hr" if "rainfall" in key else "%",
                "contribution": contr_pct,
                "threshold": self.thresholds[key],
                "trend": "increasing" if risks[key] > 0.5 else "stable"
            })
        
        contributions.sort(key=lambda x: x["contribution"], reverse=True)
        
        return {
            "risk_score": risk_score,
            "probability": probability,
            "confidence": confidence,
            "risk_level": "critical" if risk_score >= 80 else "high" if risk_score >= 60 else "medium" if risk_score >= 40 else "low",
            "factors": contributions
        }
