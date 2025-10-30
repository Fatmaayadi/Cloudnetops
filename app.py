from flask import Flask, request, jsonify
from extensions import db, jwt

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cloudnetops.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'cloudnetops_secret'

    db.init_app(app)
    jwt.init_app(app)

    # print which header/name/type the JWT extension will look for
    print("JWT header name:", app.config.get('JWT_HEADER_NAME', 'Authorization'))
    print("JWT header type:", app.config.get('JWT_HEADER_TYPE', 'Bearer'))

    from auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    from deploy.routes import deploy_bp
    app.register_blueprint(deploy_bp, url_prefix='/deploy')

    @app.route('/debug/headers', methods=['GET','POST'])
    def debug_headers():
        # echo request headers so you can verify Authorization reaches the server
        return jsonify({k: v for k, v in request.headers.items()})

    @app.route('/')
    def home():
        return {"message": "Bienvenue sur CloudNetOps API"}

    return app


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        from auth.models import User
        print(" Creating database if not exists...")
        db.create_all()
    print(" Database initialized successfully.")
    app.run(debug=True)


