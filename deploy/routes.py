# deployment/routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from deploy.aws_manager import (
    create_ec2_instance,
    terminate_ec2_instance,
    create_s3_bucket,
    delete_s3_bucket
)


deploy_bp = Blueprint('deploy', __name__)

@deploy_bp.route('/ec2/create', methods=['POST'])
@jwt_required()
def deploy_ec2():
    identity = get_jwt_identity()
    if not identity or identity.get('role') != 'admin':
        return jsonify({"error": "Accès réservé aux administrateurs"}), 403
    instance_id = create_ec2_instance()
    return jsonify({"message": "Instance EC2 créée", "instance_id": instance_id})

@deploy_bp.route('/ec2/terminate', methods=['POST'])
@jwt_required()
def terminate_ec2():
    data = request.get_json()
    instance_id = data.get('instance_id')
    resp = terminate_ec2_instance(instance_id)
    return jsonify({"message": "Terminé", "details": resp})

@deploy_bp.route('/s3/create', methods=['POST'])
@jwt_required()
def s3_create():
    data = request.get_json()
    bucket_name = data.get('bucket_name')
    resp = create_s3_bucket(bucket_name)
    return jsonify(resp)

@deploy_bp.route('/s3/delete', methods=['POST'])
@jwt_required()
def s3_delete():
    data = request.get_json()
    bucket_name = data.get('bucket_name')
    force = data.get('force', False)
    resp = delete_s3_bucket(bucket_name, force=force)
    return jsonify(resp)
