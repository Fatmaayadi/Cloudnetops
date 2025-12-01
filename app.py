import os
from flask import Flask, request, jsonify
from extensions import db, jwt
from dotenv import load_dotenv
from prometheus_flask_exporter import PrometheusMetrics
from flask_cors import CORS
load_dotenv()
import app_state

def create_app():
    app = Flask(__name__)

    # --- PROMETHEUS ---
    metrics = PrometheusMetrics(app)

    # --- CORS (development) ---
    # Allow the frontend dev server (and other local origins) to call any API route.
    # In production you should restrict origins to the real domains.
    CORS(app, resources={r"/*": {"origins": "*"}})

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
    from monitoring.routes import status_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(deploy_bp, url_prefix="/deploy")
    app.register_blueprint(monitor_bp, url_prefix="/monitor")
    app.register_blueprint(ai_bp, url_prefix="/ai")   # <---- à ajouter
    app.register_blueprint(status_bp, url_prefix='')
    @app.route("/")
    def home():
        return {"message": "Bienvenue sur CloudNetOps API"}

    @app.route('/status', methods=['GET'])
    def status():
        # Provide a small health/status endpoint consumed by the frontend dashboard.
        # Try returning the most recent AI recommendation if available.
        try:
            from auth.models import Recommendation
            last = Recommendation.query.order_by(Recommendation.id.desc()).first()
            last_ai = last.content if last is not None else None
        except Exception:
            last_ai = None

        return jsonify({
            'status': 'ok',
            'last_ai': last_ai
        })

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
