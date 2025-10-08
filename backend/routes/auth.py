from flask import Blueprint, request, jsonify, current_app, abort
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from functools import wraps
from models.models import db, User
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        captcha_token = data.get('captchaToken')

        if not email or not password or not name:
            return jsonify({'error': 'Email, password, and name are required'}), 400

        # In production, verify captcha_token here
        # Temporarily disabled for development
        # if not captcha_token:
        #     return jsonify({'error': 'CAPTCHA verification required'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'User already exists'}), 400

        user = User(email=email, name=name, role='viewer')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return jsonify({'message': 'User registered successfully'}), 201

    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        captcha_token = data.get('captchaToken')
        remember_me = data.get('rememberMe', False)

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        # In production, verify captcha_token here
        # Temporarily disabled for development
        # if not captcha_token:
        #     return jsonify({'error': 'CAPTCHA verification required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Set token expiry based on remember_me
        expires_delta = timedelta(days=30) if remember_me else timedelta(hours=24)

        # Ensure user.id is valid
        if user.id is None:
            return jsonify({'error': 'User ID is invalid'}), 500

        # Generate JWT token with role claim
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role},
            expires_delta=expires_delta
        )

        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        email = data.get('email')
        captcha_token = data.get('captchaToken')

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        # In production, verify captcha_token here
        # Temporarily disabled for development
        # if not captcha_token:
        #     return jsonify({'error': 'CAPTCHA verification required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if user exists or not for security
            return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200

        # In a real application, generate a reset token and send email
        # For now, just return success
        return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200

    except Exception as e:
        current_app.logger.error(f"Forgot password error: {str(e)}")
        return jsonify({'error': 'Failed to process request'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout (client-side token removal)"""
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_token():
    """Validate JWT token"""
    try:
        # If JWT is valid, this endpoint will be reached
        return jsonify({'valid': True, 'message': 'Token is valid'}), 200
    except Exception as e:
        current_app.logger.error(f"Token validation error: {str(e)}")
        return jsonify({'valid': False, 'error': 'Token validation failed'}), 401

def role_required(role):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') != role:
                abort(403, description=f"Admin role required")
            return f(*args, **kwargs)
        return decorated_function
    return decorator