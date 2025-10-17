from flask import Blueprint, request, jsonify, current_app, abort
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from functools import wraps
from models.models import db, User, UserActivityLog
from datetime import timedelta
from sqlalchemy import or_, and_
import json

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
        current_app.logger.info(f"Login attempt for email: {data.get('email') if data else 'No data'}")

        if not data:
            current_app.logger.error("No JSON data received in login request")
            return jsonify({'error': 'Invalid request format'}), 400

        email = data.get('email')
        password = data.get('password')
        captcha_token = data.get('captchaToken')
        remember_me = data.get('rememberMe', False)

        if not email or not password:
            current_app.logger.error("Missing email or password in login request")
            return jsonify({'error': 'Email and password are required'}), 400

        # In production, verify captcha_token here
        # Temporarily disabled for development
        # if not captcha_token:
        #     return jsonify({'error': 'CAPTCHA verification required'}), 400

        current_app.logger.info(f"Querying user: {email}")
        user = User.query.filter_by(email=email).first()

        if not user:
            current_app.logger.warning(f"User not found: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401

        if not user.check_password(password):
            current_app.logger.warning(f"Invalid password for user: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401

        current_app.logger.info(f"Login successful for user: {email} (ID: {user.id})")

        # Set token expiry based on remember_me
        expires_delta = timedelta(days=30) if remember_me else timedelta(hours=24)

        # Ensure user.id is valid
        if user.id is None:
            current_app.logger.error(f"User ID is None for user: {email}")
            return jsonify({'error': 'User ID is invalid'}), 500

        # Update last login
        user.last_login = db.func.now()
        db.session.commit()

        # Log successful login
        log_user_activity(user.id, 'login', None, {
            'email': email,
            'remember_me': remember_me
        })

        # Generate JWT token with role claim
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role},
            expires_delta=expires_delta
        )

        current_app.logger.info(f"JWT token generated for user: {email}")

        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'unidade': user.unidade,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        current_app.logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
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
                abort(403, description=f"{role.title()} role required")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_user_activity(user_id, action, target_user_id=None, details=None, request=None):
    """Log user activity for audit trail"""
    try:
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent')

        activity_log = UserActivityLog(
            user_id=user_id,
            action=action,
            target_user_id=target_user_id,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(activity_log)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Failed to log user activity: {str(e)}")

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_users():
    """Get list of users with pagination and filtering"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role')
        unidade_filter = request.args.get('unidade')
        is_active_filter = request.args.get('is_active')

        # Build query
        query = User.query

        # Apply filters
        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f'%{search}%'),
                    User.name.ilike(f'%{search}%')
                )
            )

        if role_filter:
            query = query.filter(User.role == role_filter)

        if unidade_filter:
            query = query.filter(User.unidade.ilike(f'%{unidade_filter}%'))

        if is_active_filter is not None:
            is_active = is_active_filter.lower() == 'true'
            query = query.filter(User.is_active == is_active)

        # Order by creation date (newest first)
        query = query.order_by(User.created_at.desc())

        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        users = pagination.items

        # Format response
        user_list = []
        for user in users:
            user_list.append({
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'unidade': user.unidade,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_by': user.created_by
            })

        return jsonify({
            'users': user_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting users: {str(e)}")
        return jsonify({'error': 'Failed to retrieve users'}), 500

@auth_bp.route('/users', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_user():
    """Create a new user (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        name = data.get('name', '').strip()
        role = data.get('role', 'viewer')
        unidade = data.get('unidade', '').strip() or None

        # Validation
        if not email or not password or not name:
            return jsonify({'error': 'Email, password, and name are required'}), 400

        if role not in ['admin', 'viewer']:
            return jsonify({'error': 'Invalid role. Must be admin or viewer'}), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'User with this email already exists'}), 400

        # Create user
        user = User(
            email=email,
            name=name,
            role=role,
            unidade=unidade,
            created_by=int(current_user_id)
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Log the action
        log_user_activity(
            int(current_user_id),
            'create_user',
            user.id,
            {
                'email': email,
                'name': name,
                'role': role,
                'unidade': unidade
            },
            request
        )

        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'unidade': user.unidade,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error creating user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user (admin can update any user, users can update themselves)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        claims = get_jwt()

        # Check permissions
        if claims.get('role') != 'admin' and int(current_user_id) != user_id:
            return jsonify({'error': 'Permission denied'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        changes = {}

        # Fields that can be updated
        updatable_fields = ['name', 'role', 'unidade', 'is_active']

        # Validate role changes (only admin can change roles)
        if 'role' in data and claims.get('role') != 'admin':
            return jsonify({'error': 'Only admins can change user roles'}), 403

        if 'role' in data and data['role'] not in ['admin', 'viewer']:
            return jsonify({'error': 'Invalid role. Must be admin or viewer'}), 400

        # Apply updates
        for field in updatable_fields:
            if field in data:
                old_value = getattr(user, field)
                new_value = data[field]
                if old_value != new_value:
                    setattr(user, field, new_value)
                    changes[field] = {'old': old_value, 'new': new_value}

        if changes:
            db.session.commit()

            # Log the action
            log_user_activity(
                int(current_user_id),
                'update_user',
                user.id,
                changes,
                request
            )

        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'unidade': user.unidade,
                'is_active': user.is_active,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update user'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    """Delete user (admin only, soft delete by setting is_active=false)"""
    try:
        current_user_id = get_jwt_identity()

        # Prevent self-deletion
        if int(current_user_id) == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Soft delete - just deactivate
        user.is_active = False
        db.session.commit()

        # Log the action
        log_user_activity(
            int(current_user_id),
            'delete_user',
            user.id,
            {
                'email': user.email,
                'name': user.name,
                'role': user.role
            },
            request
        )

        return jsonify({'message': 'User deactivated successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete user'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'unidade': user.unidade,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting profile: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        changes = {}

        # Fields that users can update in their profile
        allowed_fields = ['name']

        # Apply updates
        for field in allowed_fields:
            if field in data:
                old_value = getattr(user, field)
                new_value = data[field].strip() if isinstance(data[field], str) else data[field]
                if old_value != new_value:
                    setattr(user, field, new_value)
                    changes[field] = {'old': old_value, 'new': new_value}

        if changes:
            db.session.commit()

            # Log the action
            log_user_activity(
                int(current_user_id),
                'update_profile',
                user.id,
                changes,
                request
            )

        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'unidade': user.unidade,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating profile: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change current user's password"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        current_password = data.get('current_password', '').strip()
        new_password = data.get('new_password', '').strip()
        confirm_password = data.get('confirm_password', '').strip()

        # Validation
        if not current_password or not new_password or not confirm_password:
            return jsonify({'error': 'All password fields are required'}), 400

        if new_password != confirm_password:
            return jsonify({'error': 'New passwords do not match'}), 400

        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters long'}), 400

        # Verify current password
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400

        # Update password
        user.set_password(new_password)
        db.session.commit()

        # Log the action
        log_user_activity(
            int(current_user_id),
            'change_password',
            user.id,
            {'password_changed': True},
            request
        )

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Error changing password: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500

@auth_bp.route('/activity-logs', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_activity_logs():
    """Get user activity logs for audit trail (admin only)"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id_filter = request.args.get('user_id', type=int)
        action_filter = request.args.get('action')
        target_user_id_filter = request.args.get('target_user_id', type=int)

        # Build query
        query = UserActivityLog.query

        # Apply filters
        if user_id_filter:
            query = query.filter(UserActivityLog.user_id == user_id_filter)

        if action_filter:
            query = query.filter(UserActivityLog.action == action_filter)

        if target_user_id_filter:
            query = query.filter(UserActivityLog.target_user_id == target_user_id_filter)

        # Order by timestamp (newest first)
        query = query.order_by(UserActivityLog.timestamp.desc())

        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        logs = pagination.items

        # Format response
        log_list = []
        for log in logs:
            log_list.append({
                'id': log.id,
                'user_id': log.user_id,
                'action': log.action,
                'target_user_id': log.target_user_id,
                'details': json.loads(log.details) if log.details else None,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'timestamp': log.timestamp.isoformat() if log.timestamp else None
            })

        return jsonify({
            'logs': log_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting activity logs: {str(e)}")
        return jsonify({'error': 'Failed to retrieve activity logs'}), 500