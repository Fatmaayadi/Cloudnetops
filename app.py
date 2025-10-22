from flask import Flask
from extensions import db, jwt

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cloudnetops.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'cloudnetops_secret'

    db.init_app(app)
    jwt.init_app(app)

    from auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    @app.route('/')
    def home():
        return {"message": "Bienvenue sur CloudNetOps API"}

    return app

# ✅ Add this block below
if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        from auth.models import User
        print("🗂️ Creating database if not exists...")
        db.create_all()
    print("✅ Database initialized successfully.")
    app.run(debug=True)
