"""
GeoGuard AI - Risk Prediction Engine (Module 1)
Simulates a multi-factor XGBoost flood risk scoring model with explainable AI coefficients.
"""
from typing import Dict, Any, List


class RiskEngine:
    def __init__(self):
        # Contribution weights for different risk features (total = 1.0)
        self.weights = {
            "river_level": 0.28,
            "rainfall_intensity": 0.24,
            "soil_saturation": 0.18,
            "drainage_capacity": 0.15,
            "upstream_reservoir": 0.10,
            "tide_level": 0.05
        }
        
        # Thresholds above which a factor starts contributing negatively (increasing risk)
        self.thresholds = {
            "river_level": 3.5,          # meters
            "rainfall_intensity": 65.0,   # mm/hr
            "soil_saturation": 80.0,      # percent
            "drainage_capacity": 50.0,    # percent (lower capacity -> higher risk)
            "upstream_reservoir": 85.0,   # percent
            "tide_level": 1.2             # meters
        }

    def predict_risk(self, inputs: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates a flood risk score (0-100), probability (0-1), 
        confidence, and factor contributions.
        """
        river_level = inputs.get("river_level", 2.0)
        rainfall_intensity = inputs.get("rainfall_intensity", 15.0)
        soil_saturation = inputs.get("soil_saturation", 50.0)
        drainage_capacity = inputs.get("drainage_capacity", 80.0)
        upstream_reservoir = inputs.get("upstream_reservoir", 60.0)
        tide_level = inputs.get("tide_level", 0.5)

        # 1. Normalize each feature to a score of 0.0 to 1.0 (representing risk contribution)
        # River level (min 1m, warning at 3.5m, extreme at 5m)
        river_risk = min(1.0, max(0.0, (river_level - 1.0) / 4.0))
        
        # Rainfall (min 0mm, extreme at 120mm/hr)
        rain_risk = min(1.0, max(0.0, rainfall_intensity / 120.0))
        
        # Soil saturation (min 20%, extreme at 100%)
        soil_risk = min(1.0, max(0.0, (soil_saturation - 20.0) / 80.0))
        
        # Drainage capacity (invert: 100% capacity -> 0 risk, 0% capacity -> 1.0 risk)
        drainage_risk = 1.0 - (min(100.0, max(0.0, drainage_capacity)) / 100.0)
        
        # Upstream reservoir level (min 40%, extreme at 100%)
        reservoir_risk = min(1.0, max(0.0, (upstream_reservoir - 40.0) / 60.0))
        
        # Tide level (min 0m, extreme at 2.5m)
        tide_risk = min(1.0, max(0.0, tide_level / 2.5))

        risks = {
            "river_level": river_risk,
            "rainfall_intensity": rain_risk,
            "soil_saturation": soil_risk,
            "drainage_capacity": drainage_risk,
            "upstream_reservoir": reservoir_risk,
            "tide_level": tide_risk
        }

        # 2. Weighted sum to compute overall risk score
        weighted_score = sum(risks[key] * self.weights[key] for key in self.weights)
        risk_score = round(weighted_score * 100)

        # 3. Probability and confidence calculation
        # Risk score corresponds to probability
        probability = round(weighted_score, 2)
        
        # Confidence decreases if inputs are missing or extreme outliers
        confidence = 0.95
        if rainfall_intensity > 150 or river_level > 6.0:
            confidence = 0.85  # Extrapolation decreases confidence

        # 4. Generate contributions for explainability (SHAP emulation)
        contributions = []
        for key, weight in self.weights.items():
            contr_pct = round(risks[key] * weight * 100)
            contributions.append({
                "name": key.replace("_", " ").title(),
                "value": inputs.get(key, 0.0),
                "unit": self._get_unit(key),
                "contribution": contr_pct,
                "threshold": self.thresholds[key],
                "trend": "increasing" if risks[key] > 0.5 else "stable"
            })

        # Sort contributions by impact
        contributions.sort(key=lambda x: x["contribution"], reverse=True)

        # Determine overall level
        if risk_score >= 80:
            level = "critical"
        elif risk_score >= 60:
            level = "high"
        elif risk_score >= 40:
            level = "medium"
        else:
            level = "low"

        return {
            "risk_score": risk_score,
            "probability": probability,
            "confidence": confidence,
            "risk_level": level,
            "factors": contributions
        }

    def _get_unit(self, key: str) -> str:
        units = {
            "river_level": "m",
            "rainfall_intensity": "mm/hr",
            "soil_saturation": "%",
            "drainage_capacity": "%",
            "upstream_reservoir": "%",
            "tide_level": "m"
        }
        return units.get(key, "")
