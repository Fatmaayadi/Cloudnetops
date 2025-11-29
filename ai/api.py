# ai/api.py
from flask import Blueprint, request, jsonify
from ai.model_utils import predict_from_dict
import traceback

# Créer un blueprint au lieu d'une app
ai_bp = Blueprint('ai', __name__)

@ai_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({"error":"JSON body must be an object"}), 400
        res = predict_from_dict(data)
        return jsonify(res)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@ai_bp.route("/", methods=["GET"])
def index():
    return jsonify({"service":"aws-config-recommender", "status":"running"})
