from flask import Blueprint, request, jsonify
from extensions import db
from auth.models import User
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'dev')

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Utilisateur déjà existant"}), 400

    user = User(username=username, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Utilisateur créé avec succès"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Identifiants invalides"}), 401

    token = create_access_token(identity={"username": user.username, "role": user.role})
    return jsonify({"token": token})
