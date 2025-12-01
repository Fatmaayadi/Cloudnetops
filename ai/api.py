
# ai/api.py
from flask import Blueprint, request, jsonify
from ai.model_utils import predict_from_dict
import traceback
import app_state  # <-- store partagé

ai_bp = Blueprint('ai', __name__)

@ai_bp.route("/predict", methods=["POST"])
def predict():
    """
    Reçoit {instance_id, metrics} et renvoie une recommandation.
    Persiste la dernière recommandation pour le Dashboard (/status) dans app_state.
    """
    try:
        data = request.get_json() or {}
        instance_id = data.get("instance_id")
        metrics = data.get("metrics") or {}

        if not instance_id:
            return jsonify({"error": "instance_id manquant"}), 400

        required = ["CPUUtilization", "NetworkIn", "NetworkOut"]
        missing = [k for k in required if k not in metrics]
        if missing:
            return jsonify({"error": f"Métriques manquantes: {', '.join(missing)}"}), 400

        # Appel modèle IA
        try:
            model_out = predict_from_dict(metrics)  # ex: {"recommended_ec2": "...", ...}
        except Exception as m_err:
            traceback.print_exc()
            return jsonify({"error": f"Erreur modèle IA: {str(m_err)}"}), 500

        recommendation = {
            "instance_id": instance_id,
            "metrics": {
                "CPUUtilization": metrics.get("CPUUtilization"),
                "NetworkIn": metrics.get("NetworkIn"),
                "NetworkOut": metrics.get("NetworkOut"),
                "DiskReadOps": metrics.get("DiskReadOps"),
                "DiskWriteOps": metrics.get("DiskWriteOps"),
            },
            "recommendation": model_out
        }

        # ✅ Persistance pour le Dashboard
        app_state.last_ai_recommendation = recommendation

        return jsonify(recommendation), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Erreur IA: {str(e)}"}), 500


@ai_bp.route("/last", methods=["GET"])
def last():
    return jsonify({"last_ai": app_state.last_ai_recommendation})


@ai_bp.route("/", methods=["GET"])
def index():
    return jsonify({"service": "aws-config-recommender", "status": "running"})
