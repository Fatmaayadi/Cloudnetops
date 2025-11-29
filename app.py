import os
from flask import Flask, request, jsonify
from extensions import db, jwt
from dotenv import load_dotenv
from prometheus_flask_exporter import PrometheusMetrics
load_dotenv()


def create_app():
    app = Flask(__name__)

    # --- PROMETHEUS ---
    metrics = PrometheusMetrics(app)

    # --- DATABASE LOCATION ---
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DB_PATH = os.path.join(BASE_DIR, "instance", "cloudnetops.db")

    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DB_PATH}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'cloudnetops_secret'

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    print("JWT header:", app.config.get('JWT_HEADER_NAME', 'Authorization'))
    print("JWT type:", app.config.get('JWT_HEADER_TYPE', 'Bearer'))

    # Register blueprints
    from auth.routes import auth_bp
    from deploy.routes import deploy_bp
    from monitoring.routes import monitor_bp
    from ai.api import ai_bp           # <---- à ajouter pour IA

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(deploy_bp, url_prefix="/deploy")
    app.register_blueprint(monitor_bp, url_prefix="/monitor")
    app.register_blueprint(ai_bp, url_prefix="/ai")   # <---- à ajouter

    @app.route("/")
    def home():
        return {"message": "Bienvenue sur CloudNetOps API"}

    return app


if __name__ == "__main__":
    app = create_app()

    with app.app_context():
        db_path = app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")

        if not os.path.exists(db_path):
            print("Database not found → Creating database...")
            db.create_all()
        else:
            print("Database already exists → OK")

    app.run(host="0.0.0.0", port=5000)
