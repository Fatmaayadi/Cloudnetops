# deployment/routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from deploy.aws_manager import (
    create_ec2_instance,
    terminate_ec2_instance,
    create_s3_bucket,
    delete_s3_bucket
)
import os
import boto3

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

ec2_client = boto3.client('ec2', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)

deploy_bp = Blueprint('deploy', __name__)

# ------------------------------
# EC2 ROUTES
# ------------------------------

@deploy_bp.route('/ec2/create', methods=['POST', 'OPTIONS'])
@jwt_required()
def deploy_ec2():
    if request.method == "OPTIONS":
        return '', 200  # preflight CORS

    identity = get_jwt_identity()
    if not identity or identity.get('role') != 'admin':
        return jsonify({"error": "Accès réservé aux administrateurs"}), 403

    instance_id = create_ec2_instance()

    # Si c'est un dict avec "error" mais instance_id existe, renvoyer quand même
    if isinstance(instance_id, dict):
        if "error" in instance_id and "instance_id" in instance_id:
            return jsonify({
                "message": "Instance EC2 créée malgré un warning",
                "instance_id": instance_id["instance_id"],
                "warning": instance_id["error"]
            }), 200
        elif "error" in instance_id:
            return jsonify({"error": instance_id["error"]}), 500

    # Cas normal
    return jsonify({"message": "Instance EC2 créée avec succès", "instance_id": instance_id}), 200




@deploy_bp.route('/ec2/terminate', methods=['POST'])
@jwt_required()
def terminate_ec2():
    identity = get_jwt_identity()
    if not identity or identity.get('role') != 'admin':
        return jsonify({"error": "Accès réservé aux administrateurs"}), 403

    data = request.get_json(silent=True) or {}
    instance_id = data.get('instance_id')
    if not instance_id:
        return jsonify({"error": "instance_id manquant"}), 400

    try:
        resp = terminate_ec2_instance(instance_id)
        if isinstance(resp, dict) and "error" in resp:
            return jsonify(resp), 400
        return jsonify({"message": "Instance EC2 terminée", "details": resp})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------------------
# S3 ROUTES
# ------------------------------

@deploy_bp.route('/s3/create', methods=['POST'])
@jwt_required()
def s3_create():
    data = request.get_json(silent=True) or {}
    bucket_name = data.get('bucket_name')
    if not bucket_name:
        return jsonify({"error": "bucket_name manquant"}), 400

    try:
        resp = create_s3_bucket(bucket_name)
        if isinstance(resp, dict) and "error" in resp:
            return jsonify(resp), 400
        return jsonify({"message": f"Bucket S3 '{bucket_name}' créé", "details": resp})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@deploy_bp.route('/s3/delete', methods=['POST'])
@jwt_required()
def s3_delete():
    data = request.get_json(silent=True) or {}
    bucket_name = data.get('bucket_name')
    force = data.get('force', False)
    if not bucket_name:
        return jsonify({"error": "bucket_name manquant"}), 400

    try:
        resp = delete_s3_bucket(bucket_name, force=force)
        if isinstance(resp, dict) and "error" in resp:
            return jsonify(resp), 400
        return jsonify({"message": f"Bucket S3 '{bucket_name}' supprimé", "details": resp})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@deploy_bp.route('/summary', methods=['GET'])
@jwt_required(optional=True)
def deploy_summary():
    ec2s = ec2_client.describe_instances()
    running_instances = [
        inst for res in ec2s['Reservations']
        for inst in res['Instances']
        if inst['State']['Name'] == 'running'
    ]
    ec2_count = len(running_instances)

    s3s = s3_client.list_buckets()
    s3_count = len(s3s['Buckets'])

    return jsonify({"ec2": ec2_count, "s3": s3_count})

