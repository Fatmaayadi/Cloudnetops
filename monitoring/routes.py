from flask import Blueprint, request, jsonify
from monitoring.cloudwatch_manager import get_ec2_metrics, get_s3_metrics

monitor_bp = Blueprint("monitor", __name__)

# ------------------------------
# EC2 METRICS
# ------------------------------

# POST /monitor/metrics/ec2  → envoie JSON {"instance_id": "..."}
@monitor_bp.route("/metrics/ec2", methods=["POST"])
def metrics_ec2():
    instance_id = request.json.get("instance_id")
    if not instance_id:
        return jsonify({"error": "instance_id manquant"}), 400
    result = get_ec2_metrics(instance_id)
    return jsonify(result)


# GET /monitor/ec2/<instance_id>
@monitor_bp.route("/ec2/<instance_id>", methods=["GET"])
def monitor_ec2(instance_id):
    result = get_ec2_metrics(instance_id)
    return jsonify(result)


# ------------------------------
# S3 METRICS
# ------------------------------

# POST /monitor/metrics/s3 → envoie JSON {"bucket_name": "..."}
@monitor_bp.route("/metrics/s3", methods=["POST"])
def metrics_s3():
    bucket_name = request.json.get("bucket_name")
    if not bucket_name:
        return jsonify({"error": "bucket_name manquant"}), 400
    result = get_s3_metrics(bucket_name)
    return jsonify(result)


# GET /monitor/s3/<bucket_name>
@monitor_bp.route("/s3/<bucket_name>", methods=["GET"])
def monitor_s3(bucket_name):
    result = get_s3_metrics(bucket_name)
    return jsonify(result)