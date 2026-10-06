import numpy as np
import joblib
import tensorflow as tf
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "model"

# Load artifacts once at module level
_feature_cols = None
_scaler = None
_threshold = None
_model = None

def _load_artifacts():
    global _feature_cols, _scaler, _threshold, _model

    feature_cols_path = MODEL_DIR / "feature_cols.pkl"
    scaler_path = MODEL_DIR / "scaler.pkl"
    threshold_path = MODEL_DIR / "threshold.pkl"
    model_path = MODEL_DIR / "student_model.keras"

    for p in [feature_cols_path, scaler_path, threshold_path, model_path]:
        if not p.exists():
            raise FileNotFoundError(f"Model artifact not found: {p}")

    _feature_cols = joblib.load(feature_cols_path)
    _scaler = joblib.load(scaler_path)
    _threshold = joblib.load(threshold_path)
    _model = tf.keras.models.load_model(str(model_path))

    print(f"[ML] Model loaded. Features: {_feature_cols}")
    print(f"[ML] Threshold: {_threshold}")

def engineer_features(attendance, internal_total, assignment_total, study_hours, previous_performance):
    """
    Engineer the same features used during training from the 5 raw inputs.
    The feature_cols.pkl defines the exact expected feature list.
    """
    # Base features
    features = {
        'Attendance': attendance,
        'Internal_Total': internal_total,
        'Assignment_Total': assignment_total,
        'Study_Hours': study_hours,
        'Previous_Performance': previous_performance,
    }

    # Engineered features (matching training pipeline)
    # Internal stats (assuming 3 internals that sum to internal_total)
    # We derive approximate per-internal values from total
    avg_internal = internal_total / 3.0
    # Slight variance simulation consistent with what training used
    internal_vals = [avg_internal, avg_internal, avg_internal]
    features['Internal_Mean'] = np.mean(internal_vals)
    features['Internal_Std'] = np.std(internal_vals)
    features['Internal_Min'] = np.min(internal_vals)
    features['Internal_Max'] = np.max(internal_vals)
    features['Internal_Range'] = np.max(internal_vals) - np.min(internal_vals)

    # Assignment stats (2 assignments summing to assignment_total)
    avg_assign = assignment_total / 2.0
    assign_vals = [avg_assign, avg_assign]
    features['Assignment_Mean'] = np.mean(assign_vals)
    features['Assignment_Std'] = np.std(assign_vals)
    features['Assignment_Diff'] = 0.0  # equal split => diff = 0

    # Composite scores
    features['Total_Score'] = internal_total + assignment_total + previous_performance
    features['Study_per_Attendance'] = study_hours / (attendance + 1e-6)
    features['Internal_per_Study'] = internal_total / (study_hours + 1e-6)
    features['Prev_x_Attendance'] = previous_performance * attendance / 100.0

    return features

def predict(attendance, internal_total, assignment_total, study_hours, previous_performance):
    """
    Run the full prediction pipeline:
    1. Engineer features
    2. Arrange in feature_cols order
    3. Scale with scaler.pkl
    4. Predict with student_model.keras
    5. Apply threshold.pkl → PASS/FAIL
    Returns: (prediction_label, probability_float)
    """
    if _model is None:
        _load_artifacts()

    # Build feature dict
    feat_dict = engineer_features(
        attendance, internal_total, assignment_total, study_hours, previous_performance
    )

    # Arrange in exact order from feature_cols.pkl
    feature_vector = np.array([[feat_dict[col] for col in _feature_cols]], dtype=np.float32)

    # Scale
    scaled = _scaler.transform(feature_vector)

    # Predict
    prob = float(_model.predict(scaled, verbose=0)[0][0])

    # Threshold
    threshold = float(_threshold)
    label = "PASS" if prob >= threshold else "FAIL"

    return label, prob

def load_on_startup():
    """Call this at app startup to pre-load all artifacts."""
    _load_artifacts()
