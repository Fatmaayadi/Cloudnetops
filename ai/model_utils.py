# app/model_utils.py
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

_BASE = Path(__file__).resolve().parent
# prefer `models/model_bundle.pkl` next to this file
BUNDLE_PATH = _BASE / "models" / "model_bundle.pkl"
# consider older name
if not BUNDLE_PATH.exists():
    alt = _BASE / "models" / "model.pkl"
    if alt.exists():
        BUNDLE_PATH = alt
# fallback for project layout that nests an inner `app` folder (train.py writes there)
if not BUNDLE_PATH.exists():
    nested = _BASE / "app" / "models" / "model_bundle.pkl"
    if nested.exists():
        BUNDLE_PATH = nested
    else:
        nested_alt = _BASE / "app" / "models" / "model.pkl"
        if nested_alt.exists():
            BUNDLE_PATH = nested_alt

def load_bundle():
    if not BUNDLE_PATH.exists():
        raise FileNotFoundError(f"Model bundle not found: {BUNDLE_PATH}")
    return joblib.load(BUNDLE_PATH)

_bundle = load_bundle()
_scaler = _bundle["scaler"]
_models = _bundle["models"]
_encoders = _bundle["encoders"]
_FEATURES = _bundle["features"]

# mapping for categorical incoming fields (must match training mapping)
JOB_TYPE_MAP = {"service":0, "batch":1, "ai_training":2}
SCHEDULER_MAP = {"fifo":0, "batch":1, "realtime":2}

def _prepare_input(data: dict):
    # ensure order matches FEATURES
    row = []
    for f in _FEATURES:
        v = data.get(f, 0)
        # handle timestamp string
        if f == "timestamp":
            try:
                v = pd.to_datetime(v).timestamp()
            except:
                try:
                    v = float(v)
                except:
                    v = 0.0
        # job_type / scheduler mapping to int
        if f == "job_type":
            v = JOB_TYPE_MAP.get(v, 0)
        if f == "scheduler":
            v = SCHEDULER_MAP.get(v, 0)
        # cast numeric where possible
        try:
            row.append(float(v))
        except:
            row.append(0.0)
    X = np.array([row])
    Xs = _scaler.transform(X)
    return Xs

def predict_from_dict(data: dict):
    """
    Input: dict with keys matching FEATURES (or a subset)
    Output: dict with recommendations
    """
    Xs = _prepare_input(data)
    pred_ec2 = _models["ec2"].predict(Xs)[0]
    pred_storage = _models["storage"].predict(Xs)[0]
    pred_scaling = _models["scaling"].predict(Xs)[0]

    # If encoders are LabelEncoder objects, inverse_transform to strings where applicable
    le_ec2 = _encoders.get("ec2")
    le_storage = _encoders.get("storage")
    le_scaling = _encoders.get("scaling")

    try:
        ec2_label = le_ec2.inverse_transform([pred_ec2])[0]
    except Exception:
        ec2_label = str(pred_ec2)
    try:
        storage_label = le_storage.inverse_transform([pred_storage])[0]
    except Exception:
        storage_label = str(pred_storage)
    try:
        scaling_label = le_scaling.inverse_transform([pred_scaling])[0]
    except Exception:
        scaling_label = str(pred_scaling)

    return {
        "recommended_ec2": ec2_label,
        "recommended_storage": storage_label,
        "recommended_scaling_action": scaling_label
    }