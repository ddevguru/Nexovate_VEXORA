import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import List, Tuple
from app.models.all_models import Event, Anomaly
from app.core.logging import logger

class AnomalyEngineService:
    @staticmethod
    def detect_anomalies(events: List[Event], investigation_id: str) -> List[Anomaly]:
        """
        Runs IsolationForest over extracted statistical features per event
        and generates Anomaly database records.
        """
        if len(events) < 3:
            logger.info("Fewer than 3 events; skipping IsolationForest ML scoring.")
            return []

        # Convert events into feature DataFrame
        data = []
        user_counts = {}
        ip_counts = {}
        
        for e in events:
            usr = e.user or "UNKNOWN"
            ip = e.source_ip or "UNKNOWN"
            user_counts[usr] = user_counts.get(usr, 0) + 1
            ip_counts[ip] = ip_counts.get(ip, 0) + 1

        for e in events:
            usr = e.user or "UNKNOWN"
            ip = e.source_ip or "UNKNOWN"
            ts = e.timestamp
            
            data.append({
                "id": e.id,
                "hour": ts.hour,
                "minute": ts.minute,
                "day_of_week": ts.weekday(),
                "is_auth_fail": 1 if (e.event_type == "AUTHENTICATION" and e.status == "FAILURE") else 0,
                "is_priv_esc": 1 if e.event_type == "PRIVILEGE_ESCALATION" else 0,
                "is_data_transfer": 1 if e.event_type == "DATA_TRANSFER" else 0,
                "user_freq": user_counts.get(usr, 1),
                "ip_freq": ip_counts.get(ip, 1),
                "risk_score": e.risk_score
            })

        df = pd.DataFrame(data)
        feature_cols = ["hour", "day_of_week", "is_auth_fail", "is_priv_esc", "is_data_transfer", "user_freq", "ip_freq", "risk_score"]
        X = df[feature_cols].values

        # Train Isolation Forest
        try:
            model = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
            model.fit(X)
            
            # Decision function returns lower score for anomalies
            raw_scores = model.decision_function(X) # lower = more anomalous
            
            # Min-max scale decision function to [0.0, 1.0] where 1.0 is most anomalous
            min_s, max_s = raw_scores.min(), raw_scores.max()
            if max_s - min_s > 1e-6:
                normalized_scores = 1.0 - ((raw_scores - min_s) / (max_s - min_s))
            else:
                normalized_scores = np.zeros(len(raw_scores))

            anomalies = []
            for idx, event in enumerate(events):
                score = float(normalized_scores[idx])
                
                # Map score range
                if score < 0.40:
                    level = "NORMAL"
                elif score < 0.60:
                    level = "LOW"
                elif score < 0.80:
                    level = "MEDIUM"
                elif score < 0.95:
                    level = "HIGH"
                else:
                    level = "CRITICAL"

                if level != "NORMAL":
                    reason = AnomalyEngineService._generate_explainable_reason(df.iloc[idx], level)
                    anomaly_rec = Anomaly(
                        investigation_id=investigation_id,
                        event_id=event.id,
                        anomaly_score=round(score, 4),
                        risk_level=level,
                        reason=reason,
                        detector="IsolationForest-ML"
                    )
                    anomalies.append(anomaly_rec)

            logger.info(f"IsolationForest detected {len(anomalies)} potential anomalies out of {len(events)} events.")
            return anomalies

        except Exception as e:
            logger.error(f"Anomaly detection execution error: {e}")
            return []

    @staticmethod
    def _generate_explainable_reason(row: pd.Series, level: str) -> str:
        reasons = []
        if row["is_auth_fail"] == 1:
            reasons.append("Unusual authentication failure pattern")
        if row["is_priv_esc"] == 1:
            reasons.append("Administrative privilege elevation sequence")
        if row["is_data_transfer"] == 1:
            reasons.append("Outlier outbound data transfer volume")
        if row["hour"] >= 23 or row["hour"] < 5:
            reasons.append("Statistically rare access hour")

        if not reasons:
            reasons.append("Feature vector distance outlier detected by Isolation Forest model")

        return f"Potential anomaly ({level} risk): " + "; ".join(reasons) + ". Requires investigation."
