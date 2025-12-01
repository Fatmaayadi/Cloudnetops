
# monitoring/routes.py
from flask import Blueprint, request, jsonify
from monitoring.cloudwatch_manager import get_ec2_metrics, get_s3_metrics
import os
import boto3
import app_state  # <-- lire la reco partagée

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ec2_client = boto3.client('ec2', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)

monitor_bp = Blueprint("monitor", __name__)
status_bp = Blueprint("status", __name__)

# ------------------------------
# EC2 METRICS
# ------------------------------

@monitor_bp.route("/metrics/ec2", methods=["POST"])
def metrics_ec2():
    instance_id = request.json.get("instance_id")
    if not instance_id:
        return jsonify({"error": "instance_id manquant"}), 400
    result = get_ec2_metrics(instance_id)
    return jsonify(result)

# ⚠️ Corrige: pas d'entités HTML ici
@monitor_bp.route("/ec2/<instance_id>", methods=["GET"])
def monitor_ec2(instance_id):
    result = get_ec2_metrics(instance_id)
    return jsonify(result)

@monitor_bp.route("/ec2/list", methods=["GET"])
def list_ec2():
    ec2s = ec2_client.describe_instances()
    instances = [
        {
            "instanceId": inst["InstanceId"],
            "state": inst["State"]["Name"],
            "name": next((t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"), None)
        }
        for res in ec2s.get("Reservations", [])
        for inst in res.get("Instances", [])
    ]
    return jsonify({"instances": instances})

# ------------------------------
# S3 METRICS
# ------------------------------

@monitor_bp.route("/metrics/s3", methods=["POST"])
def metrics_s3():
    bucket_name = request.json.get("bucket_name")
    if not bucket_name:
        return jsonify({"error": "bucket_name manquant"}), 400
    result = get_s3_metrics(bucket_name)
    return jsonify(result)

# ⚠️ Corrige: pas d'entités HTML ici
@monitor_bp.route("/s3/<bucket_name>", methods=["GET"])
def monitor_s3(bucket_name):
    result = get_s3_metrics(bucket_name)
    return jsonify(result)

@monitor_bp.route("/s3/list", methods=["GET"])
def list_s3():
    s3s = s3_client.list_buckets()
    buckets = [{"name": b["Name"]} for b in s3s.get("Buckets", [])]
    return jsonify({"buckets": buckets})

# ------------------------------
# STATUS (Dashboard)
# ------------------------------

@status_bp.route("/status", methods=["GET"])
def status():
    return jsonify({
        "status": "ok",
        "last_ai": app_state.last_ai_recommendation  # ✅ lit le store partagé
    })
