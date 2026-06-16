"""
GeoGuard AI - Explainable AI (XAI) Layer (Module 10)
Uses SHAP-like values to describe feature contributions in natural language.
"""
from typing import Dict, Any, List


class XAIEngine:
    def __init__(self):
        pass

    @staticmethod
    def generate_natural_language_explanation(
        risk_score: float,
        confidence: float,
        factors: List[Dict[str, Any]]
    ) -> str:
        """
        Generates a clear, human-readable paragraph explaining the prediction and its drivers.
        """
        if not factors:
            return f"Flood risk is estimated at {risk_score}%. Insufficient factor data to provide details."

        # Find the highest positive contributors
        top_factors = sorted(factors, key=lambda f: f["contribution"], reverse=True)
        primary = top_factors[0]
        
        explanation = f"Flood Risk is evaluated at {risk_score}% ({'Critical' if risk_score >= 80 else 'High' if risk_score >= 60 else 'Medium' if risk_score >= 40 else 'Low'}). "
        
        if risk_score >= 40:
            explanation += f"This elevated risk is driven primarily by {primary['name'].lower()} "
            explanation += f"which measures {primary['value']}{primary['unit']} (contributing +{primary['contribution']}% to the score). "
            
            if len(top_factors) > 1 and top_factors[1]["contribution"] > 10:
                secondary = top_factors[1]
                explanation += f"Secondary drivers include {secondary['name'].lower()} "
                explanation += f"at {secondary['value']}{secondary['unit']} (+{secondary['contribution']}% impact). "
            
            # Check for specific threshold breaches
            breaches = [f for f in factors if f["contribution"] > 15 and f["value"] > f["threshold"]]
            if breaches:
                breached_names = ", ".join([b["name"].lower() for b in breaches])
                explanation += f"Critical thresholds have been exceeded for: {breached_names}. "
        else:
            explanation += "Factors indicate environmental metrics are within safe thresholds. "
            explanation += f"The leading factor is {primary['name'].lower()} at {primary['value']}{primary['unit']}, which does not threaten local capacity. "

        explanation += f"The AI model expresses {int(confidence * 100)}% confidence in this assessment based on historical matches."
        return explanation

    @staticmethod
    def get_waterfall_chart_data(factors: List[Dict[str, Any]], base_value: float = 15.0) -> List[Dict[str, Any]]:
        """
        Formats contributions for a waterfall chart starting from a baseline risk of 15.0.
        """
        chart_data = [{"name": "Baseline Risk", "value": base_value}]
        running_total = base_value
        
        for f in factors:
            # Scale contribution to add up to the final score from base
            val = round(f["contribution"] * 0.85, 1)  # scaled
            if val > 0:
                chart_data.append({
                    "name": f["name"],
                    "value": val,
                    "type": "addition"
                })
                running_total += val

        chart_data.append({
            "name": "Final Risk Score",
            "value": round(running_total, 1),
            "type": "total"
        })
        return chart_data
