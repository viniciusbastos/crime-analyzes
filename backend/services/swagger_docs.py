from flask_restx import Api, Resource, fields, reqparse
from flask import Blueprint, request
from werkzeug.datastructures import FileStorage
from backend.models.models import db, Crime
from backend.services.chat_service import chat_service
from backend.services.cache_service import CacheManager
from datetime import datetime
import json

# Create API documentation blueprint
swagger_bp = Blueprint('swagger', __name__, url_prefix='/api/docs')

# Initialize Flask-RESTX API
api = Api(
    swagger_bp,
    version='1.0',
    title='Crime Analysis API',
    description='Comprehensive API for crime data analysis, visualization, and AI-powered insights',
    doc='/',
    contact_email='admin@crimeanalysis.com',
    license='MIT',
    license_url='https://opensource.org/licenses/MIT'
)

# Define namespaces for better organization
auth_ns = api.namespace('auth', description='Authentication and user management')
crime_ns = api.namespace('crimes', description='Crime data operations')
analysis_ns = api.namespace('analysis', description='Data analysis and insights')
trends_ns = api.namespace('trends', description='Crime trend analysis and forecasting')
locations_ns = api.namespace('locations', description='Location-based crime data')
chat_ns = api.namespace('chat', description='AI-powered chat and analysis')
system_ns = api.namespace('system', description='System status and utilities')

# Define models for request/response documentation
crime_model = api.model('Crime', {
    'id': fields.Integer(description='Crime record ID'),
    'crime_type': fields.String(description='Type of crime'),
    'date_time': fields.DateTime(description='Date and time of incident'),
    'latitude': fields.Float(description='Latitude coordinate'),
    'longitude': fields.Float(description='Longitude coordinate'),
    'address': fields.String(description='Incident address'),
    'city': fields.String(description='City where incident occurred'),
    'severity': fields.String(description='Crime severity level'),
    'description': fields.String(description='Additional crime details'),
    'category_parent': fields.String(description='Parent category of crime type')
})

crime_summary_model = api.model('CrimeSummary', {
    'total_crimes': fields.Integer(description='Total number of crimes'),
    'date_range': fields.Raw(description='Date range of data'),
    'crime_types': fields.List(fields.Raw, description='Crime type distribution'),
    'severity_distribution': fields.List(fields.Raw, description='Severity breakdown'),
    'top_locations': fields.List(fields.Raw, description='Most common locations')
})

temporal_analysis_model = api.model('TemporalAnalysis', {
    'hourly': fields.List(fields.Raw, description='Hourly crime distribution'),
    'daily': fields.List(fields.Raw, description='Daily crime patterns'),
    'monthly': fields.List(fields.Raw, description='Monthly crime trends'),
    'weekday_weekend': fields.Raw(description='Weekday vs weekend comparison'),
    'monthly_by_year': fields.Raw(description='Monthly crime counts organized by year')
})

chat_request_model = api.model('ChatRequest', {
    'query': fields.String(required=True, description='User question about crime data'),
    'filters': fields.Raw(description='Optional filters to apply to the analysis')
})

chat_response_model = api.model('ChatResponse', {
    'query': fields.String(description='Original user query'),
    'response': fields.String(description='AI-generated analysis response'),
    'thinking': fields.String(description='AI reasoning process'),
    'timestamp': fields.DateTime(description='Response timestamp'),
    'filters_applied': fields.Raw(description='Filters used in analysis')
})

cache_stats_model = api.model('CacheStats', {
    'cache_type': fields.String(description='Type of cache (redis/simple)'),
    'status': fields.String(description='Cache connection status'),
    'connected_clients': fields.Integer(description='Number of connected clients'),
    'used_memory_human': fields.String(description='Memory usage'),
    'keyspace_hits': fields.Integer(description='Cache hits'),
    'keyspace_misses': fields.Integer(description='Cache misses'),
    'total_commands_processed': fields.Integer(description='Total cache operations')
})

# Additional models for new endpoints
semester_comparison_model = api.model('SemesterComparison', {
    'period': fields.String(description='Time period (e.g., "2023 S1")'),
    'current_year': fields.String(description='Current year'),
    'previous_year': fields.String(description='Previous year for comparison'),
    'semester': fields.String(description='Semester (S1 or S2)'),
    'current_count': fields.Integer(description='Crime count for current period'),
    'previous_count': fields.Integer(description='Crime count for previous period'),
    'change': fields.Integer(description='Absolute change'),
    'change_percent': fields.Float(description='Percentage change'),
    'semester_name': fields.String(description='Semester name (Jan-Jun or Jul-Dec)')
})

heatmap_data_model = api.model('HeatmapData', {
    'data': fields.List(fields.Raw, description='Heatmap data points'),
    'count': fields.Integer(description='Total number of data points')
})

density_data_model = api.model('DensityData', {
    'contours': fields.List(fields.Raw, description='Density contour data'),
    'points': fields.List(fields.Raw, description='Individual crime points')
})

year_over_year_model = api.model('YearOverYear', {
    'years': fields.List(fields.Raw, description='Yearly crime counts'),
    'growth_rates': fields.List(fields.Raw, description='Year-over-year growth rates'),
    'average_growth': fields.Float(description='Average annual growth rate')
})

growth_rates_model = api.model('GrowthRates', {
    'monthly': fields.List(fields.Raw, description='Monthly growth rates'),
    'quarterly': fields.List(fields.Raw, description='Quarterly growth rates'),
    'yearly': fields.List(fields.Raw, description='Yearly growth rates')
})

trend_analysis_model = api.model('TrendAnalysis', {
    'moving_averages': fields.List(fields.Raw, description='Moving average data'),
    'trend_direction': fields.String(description='Overall trend direction'),
    'slope': fields.Float(description='Trend slope coefficient')
})

forecast_model = api.model('Forecast', {
    'historical': fields.List(fields.Raw, description='Historical data points'),
    'forecast': fields.List(fields.Raw, description='Forecasted data points'),
    'confidence_intervals': fields.List(fields.Raw, description='Confidence intervals')
})

city_stats_model = api.model('CityStats', {
    'city': fields.String(description='City name'),
    'yearly_data': fields.Raw(description='Crime counts by year'),
    'total_crimes': fields.Integer(description='Total crime count'),
    'percentage': fields.Float(description='Percentage of total crimes'),
    'years': fields.List(fields.Raw, description='Yearly breakdown')
})

spatial_analysis_model = api.model('SpatialAnalysis', {
    'clusters': fields.List(fields.Raw, description='Spatial clusters'),
    'centroids': fields.List(fields.Raw, description='Cluster centroids'),
    'cluster_stats': fields.List(fields.Raw, description='Cluster statistics')
})

upload_response_model = api.model('UploadResponse', {
    'message': fields.String(description='Upload status message'),
    'records_processed': fields.Integer(description='Number of records processed'),
    'errors': fields.List(fields.String, description='Any processing errors')
})

crud_response_model = api.model('CRUDResponse', {
    'id': fields.Integer(description='Record ID'),
    'message': fields.String(description='Operation status message')
})

upload_log_model = api.model('UploadLog', {
    'filename': fields.String(description='Name of uploaded file'),
    'upload_time': fields.DateTime(description='Time of upload'),
    'records_processed': fields.Integer(description='Number of records processed'),
    'records_loaded': fields.Integer(description='Number of records successfully loaded'),
    'duplicates_skipped': fields.Integer(description='Number of duplicate records skipped'),
    'message': fields.String(description='Upload status message')
})

cache_clear_response_model = api.model('CacheClearResponse', {
    'message': fields.String(description='Cache operation status message'),
    'status': fields.String(description='Operation status')
})

metrics_model = api.model('Metrics', {
    'total_queries': fields.Integer(description='Total number of chat queries processed'),
    'successful_responses': fields.Integer(description='Number of successful responses'),
    'error_responses': fields.Integer(description='Number of error responses'),
    'average_response_time': fields.Float(description='Average response time in seconds'),
    'rag_enabled': fields.Boolean(description='Whether RAG is enabled'),
    'model_name': fields.String(description='Name of the AI model being used')
})

# Authentication models
register_request_model = api.model('RegisterRequest', {
    'email': fields.String(required=True, description='User email address'),
    'password': fields.String(required=True, description='User password'),
    'name': fields.String(required=True, description='User full name'),
    'captchaToken': fields.String(description='CAPTCHA verification token')
})

login_request_model = api.model('LoginRequest', {
    'email': fields.String(required=True, description='User email address'),
    'password': fields.String(required=True, description='User password'),
    'captchaToken': fields.String(description='CAPTCHA verification token'),
    'rememberMe': fields.Boolean(description='Remember login for 30 days')
})

user_model = api.model('User', {
    'id': fields.Integer(description='User ID'),
    'email': fields.String(description='User email address'),
    'name': fields.String(description='User full name'),
    'role': fields.String(description='User role (admin/viewer)')
})

login_response_model = api.model('LoginResponse', {
    'token': fields.String(description='JWT access token'),
    'user': fields.Nested(user_model, description='User information')
})

auth_response_model = api.model('AuthResponse', {
    'message': fields.String(description='Response message')
})

forgot_password_request_model = api.model('ForgotPasswordRequest', {
    'email': fields.String(required=True, description='User email address'),
    'captchaToken': fields.String(description='CAPTCHA verification token')
})

token_validation_response_model = api.model('TokenValidationResponse', {
    'valid': fields.Boolean(description='Whether the token is valid'),
    'message': fields.String(description='Validation message')
})

# Request parsers for query parameters
crime_filter_parser = reqparse.RequestParser()
crime_filter_parser.add_argument('crime_type', type=str, help='Filter by crime type')
crime_filter_parser.add_argument('start_date', type=str, help='Start date (YYYY-MM-DD or ISO format)')
crime_filter_parser.add_argument('end_date', type=str, help='End date (YYYY-MM-DD or ISO format)')
crime_filter_parser.add_argument('city', type=str, help='Filter by city name')
crime_filter_parser.add_argument('category_parent', type=str, help='Filter by parent category')
crime_filter_parser.add_argument('time_range', type=str, help='Time range (00-06, 06-12, 12-18, 18-24)')
crime_filter_parser.add_argument('day_of_week', type=str, help='Day of week filter (weekdays, weekends, monday, tuesday, wednesday, thursday, friday, saturday, sunday)')
crime_filter_parser.add_argument('month', type=str, help='Month filter (01-12)')
crime_filter_parser.add_argument('limit', type=int, help='Maximum number of records to return (default: 1000)')

export_parser = reqparse.RequestParser()
export_parser.add_argument('format', type=str, choices=['json', 'csv', 'excel'],
                          default='json', help='Export format')

upload_parser = reqparse.RequestParser()
upload_parser.add_argument('file', type=FileStorage, location='files', required=True,
                          help='Crime data file (CSV, XLSX, XLS)')

spatial_parser = reqparse.RequestParser()
spatial_parser.add_argument('algorithm', type=str, choices=['dbscan', 'kmeans'],
                           default='dbscan', help='Clustering algorithm to use')
spatial_parser.add_argument('n_clusters', type=int, help='Number of clusters for k-means algorithm')

heatmap_html_parser = reqparse.RequestParser()
heatmap_html_parser.add_argument('center_lat', type=float, default=40.7128, help='Map center latitude')
heatmap_html_parser.add_argument('center_lng', type=float, default=-74.0060, help='Map center longitude')
heatmap_html_parser.add_argument('zoom', type=int, default=10, help='Map zoom level')

# Crime data endpoints
@crime_ns.route('/')
class CrimeList(Resource):
    @crime_ns.doc('get_crimes',
                  params={'limit': 'Maximum number of records to return (default: 1000)'})
    @crime_ns.expect(crime_filter_parser)
    @crime_ns.marshal_list_with(crime_model)
    def get(self):
        """Get list of crimes with optional filtering"""
        args = crime_filter_parser.parse_args()

        # Apply filters using the enhanced filter function
        from routes.routes import apply_enhanced_filters
        query = Crime.query
        query = apply_enhanced_filters(query)

        limit = int(request.args.get('limit', 1000))
        crimes = query.limit(limit).all()

        return [{
            'id': c.id,
            'crime_type': c.crime_type,
            'date_time': c.date_time.isoformat(),
            'latitude': c.latitude,
            'longitude': c.longitude,
            'address': c.address,
            'severity': c.severity
        } for c in crimes]

@crime_ns.route('/heatmap')
class CrimeHeatmap(Resource):
    @crime_ns.doc('get_heatmap_data',
                  description='Get crime data formatted for heatmap visualization')
    @crime_ns.expect(crime_filter_parser)
    def get(self):
        """Get heatmap data for crime visualization"""
        from routes.routes import apply_enhanced_filters
        query = Crime.query
        query = apply_enhanced_filters(query)

        crimes = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).all()

        heatmap_data = [{
            'latitude': c.latitude,
            'longitude': c.longitude,
            'crime_type': c.crime_type,
            'date_time': c.date_time.isoformat()
        } for c in crimes]

        return {'data': heatmap_data, 'count': len(heatmap_data)}

# Analysis endpoints
@analysis_ns.route('/summary')
class CrimeSummary(Resource):
    @analysis_ns.doc('get_summary',
                     description='Get comprehensive crime statistics and summary')
    @analysis_ns.expect(crime_filter_parser)
    @analysis_ns.marshal_with(crime_summary_model)
    def get(self):
        """Get crime summary statistics"""
        from routes.routes import apply_enhanced_filters
        query = Crime.query
        query = apply_enhanced_filters(query)

        crimes = query.all()

        if not crimes:
            return {
                'total_crimes': 0,
                'date_range': {'start': None, 'end': None},
                'crime_types': [],
                'severity_distribution': [],
                'top_locations': []
            }

        # Calculate summary statistics
        total_crimes = len(crimes)

        # Crime types distribution
        crime_types_count = {}
        for crime in crimes:
            crime_types_count[crime.crime_type] = crime_types_count.get(crime.crime_type, 0) + 1

        crime_types = [
            {'type': crime_type, 'count': count, 'percentage': round(count/total_crimes*100, 1)}
            for crime_type, count in sorted(crime_types_count.items(), key=lambda x: x[1], reverse=True)
        ]

        # Date range
        dates = [c.date_time for c in crimes if c.date_time]
        date_range = {
            'start': min(dates).isoformat() if dates else None,
            'end': max(dates).isoformat() if dates else None
        }

        return {
            'total_crimes': total_crimes,
            'date_range': date_range,
            'crime_types': crime_types,
            'severity_distribution': [],  # Could be implemented
            'top_locations': []  # Could be implemented
        }

@analysis_ns.route('/temporal')
class TemporalAnalysis(Resource):
    @analysis_ns.doc('get_temporal_analysis',
                     description='Get temporal patterns and trends in crime data')
    @analysis_ns.expect(crime_filter_parser)
    @analysis_ns.marshal_with(temporal_analysis_model)
    def get(self):
        """Get temporal analysis of crime patterns"""
        from backend.routes.routes import apply_enhanced_filters
        query = Crime.query
        query = apply_enhanced_filters(query)

        crimes = query.all()

        if not crimes:
            return {
                'hourly': [],
                'daily': [],
                'monthly': [],
                'weekday_weekend': {'weekdays': 0, 'weekends': 0}
            }

        # Hourly distribution
        hourly_count = {}
        weekday_count = 0
        weekend_count = 0

        for crime in crimes:
            if crime.date_time:
                hour = crime.date_time.hour
                hourly_count[hour] = hourly_count.get(hour, 0) + 1

                # Weekday vs weekend (0=Sunday, 6=Saturday)
                dow = crime.date_time.weekday()
                if dow < 5:  # Monday-Friday
                    weekday_count += 1
                else:  # Saturday-Sunday
                    weekend_count += 1

        hourly = [{'hour': hour, 'count': count} for hour, count in sorted(hourly_count.items())]

        return {
            'hourly': hourly,
            'daily': [],  # Could be implemented for day-of-month patterns
            'monthly': [],  # Could be implemented for monthly patterns
            'weekday_weekend': {
                'weekdays': weekday_count,
                'weekends': weekend_count
            }
        }

@analysis_ns.route('/semester-comparison')
class SemesterComparison(Resource):
    @analysis_ns.doc('get_semester_comparison',
                     description='Get semester-over-semester crime comparison data')
    @analysis_ns.expect(crime_filter_parser)
    @analysis_ns.marshal_list_with(semester_comparison_model)
    def get(self):
        """Get semester comparison data"""
        # Implementation would be in routes
        return []

@analysis_ns.route('/heatmap')
class Heatmap(Resource):
    @analysis_ns.doc('get_heatmap',
                     description='Get crime data formatted for heatmap visualization')
    @analysis_ns.expect(crime_filter_parser)
    @analysis_ns.marshal_with(heatmap_data_model)
    def get(self):
        """Get heatmap data"""
        return {'data': [], 'count': 0}

@analysis_ns.route('/density')
class Density(Resource):
    @analysis_ns.doc('get_density',
                     description='Get crime density contour data for mapping')
    @analysis_ns.expect(crime_filter_parser)
    @analysis_ns.marshal_with(density_data_model)
    def get(self):
        """Get density data"""
        return {'contours': [], 'points': []}

@analysis_ns.route('/spatial')
class Spatial(Resource):
    @analysis_ns.doc('get_spatial_analysis',
                     description='Get spatial clustering analysis of crime data')
    @analysis_ns.expect(crime_filter_parser)
    @analysis_ns.expect(spatial_parser)
    @analysis_ns.marshal_with(spatial_analysis_model)
    def get(self):
        """Get spatial analysis"""
        return {'clusters': [], 'centroids': [], 'cluster_stats': []}

@analysis_ns.route('/heatmap/html')
class HeatmapHTML(Resource):
    @analysis_ns.doc('get_heatmap_html',
                     description='Get interactive heatmap as HTML page')
    @analysis_ns.expect(crime_filter_parser)
    @analysis_ns.expect(heatmap_html_parser)
    def get(self):
        """Get heatmap HTML"""
        return "<html><body>Heatmap HTML would be generated here</body></html>"

# Trends endpoints
@trends_ns.route('/year-over-year')
class YearOverYear(Resource):
    @trends_ns.doc('get_year_over_year',
                   description='Get year-over-year crime trend analysis')
    @trends_ns.expect(crime_filter_parser)
    @trends_ns.marshal_with(year_over_year_model)
    def get(self):
        """Get year-over-year analysis"""
        return {'years': [], 'growth_rates': [], 'average_growth': 0.0}

@trends_ns.route('/growth-rates')
class GrowthRates(Resource):
    @trends_ns.doc('get_growth_rates',
                   description='Calculate crime growth rates over time')
    @trends_ns.expect(crime_filter_parser)
    @trends_ns.marshal_with(growth_rates_model)
    def get(self):
        """Get growth rates analysis"""
        return {'monthly': [], 'quarterly': [], 'yearly': []}

@trends_ns.route('/moving-averages')
class MovingAverages(Resource):
    @trends_ns.doc('get_moving_averages',
                   description='Get moving average trend analysis')
    @trends_ns.expect(crime_filter_parser)
    @trends_ns.marshal_with(trend_analysis_model)
    def get(self):
        """Get moving averages analysis"""
        return {'moving_averages': [], 'trend_direction': 'stable', 'slope': 0.0}

@trends_ns.route('/weekly-moving-averages')
class WeeklyMovingAverages(Resource):
    @trends_ns.doc('get_weekly_moving_averages',
                   description='Get weekly moving average trend analysis')
    @trends_ns.expect(crime_filter_parser)
    @trends_ns.marshal_with(trend_analysis_model)
    def get(self):
        """Get weekly moving averages analysis"""
        return {'moving_averages': [], 'trend_direction': 'stable', 'slope': 0.0}

@trends_ns.route('/forecast')
class Forecast(Resource):
    @trends_ns.doc('get_forecast',
                   description='Get crime trend forecasting data')
    @trends_ns.expect(crime_filter_parser)
    @trends_ns.marshal_with(forecast_model)
    def get(self):
        """Get forecast data"""
        return {'historical': [], 'forecast': [], 'confidence_intervals': []}

# Authentication endpoints
@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.doc('register_user',
                 description='Register a new user account')
    @auth_ns.expect(register_request_model)
    @auth_ns.marshal_with(auth_response_model, code=201)
    def post(self):
        """Register a new user"""
        return {'message': 'User registered successfully'}

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.doc('login_user',
                 description='Authenticate user and return JWT token')
    @auth_ns.expect(login_request_model)
    @auth_ns.marshal_with(login_response_model, code=200)
    def post(self):
        """Login with email and password"""
        return {'token': 'jwt_token_here', 'user': {'id': 1, 'email': 'user@example.com', 'name': 'User Name', 'role': 'viewer'}}

@auth_ns.route('/forgot-password')
class ForgotPassword(Resource):
    @auth_ns.doc('forgot_password',
                 description='Send password reset email to user')
    @auth_ns.expect(forgot_password_request_model)
    @auth_ns.marshal_with(auth_response_model, code=200)
    def post(self):
        """Send password reset email"""
        return {'message': 'If the email exists, a reset link has been sent'}

@auth_ns.route('/logout')
class Logout(Resource):
    @auth_ns.doc('logout_user',
                 description='Logout user (client-side token removal)')
    @auth_ns.marshal_with(auth_response_model, code=200)
    def post(self):
        """Logout user"""
        return {'message': 'Logged out successfully'}

@auth_ns.route('/validate')
class ValidateToken(Resource):
    @auth_ns.doc('validate_token',
                 description='Validate JWT token and return user information')
    @auth_ns.marshal_with(token_validation_response_model, code=200)
    def get(self):
        """Validate JWT token"""
        return {'valid': True, 'message': 'Token is valid'}

# Chat endpoints
@chat_ns.route('/')
class CrimeChat(Resource):
    @chat_ns.doc('chat_with_data',
                 description='AI-powered chat interface for crime data analysis')
    @chat_ns.expect(chat_request_model)
    @chat_ns.marshal_with(chat_response_model)
    def post(self):
        """Chat with crime data using AI analysis"""
        data = api.payload

        if not data or 'query' not in data:
            api.abort(400, 'Query is required')

        user_query = data['query']
        filters = data.get('filters', {})

        try:
            response = chat_service.generate_response(user_query, filters)

            return {
                'query': user_query,
                'response': response,
                'timestamp': datetime.utcnow().isoformat(),
                'filters_applied': filters
            }
        except Exception as e:
            api.abort(500, f'Error processing chat request: {str(e)}')

# System endpoints
@system_ns.route('/health')
class HealthCheck(Resource):
    @system_ns.doc('health_check',
                   description='Check API health and system status')
    def get(self):
        """Get system health status"""
        return {
            'status': 'healthy',
            'message': 'Crime Analysis API is running',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }

@system_ns.route('/upload')
class UploadData(Resource):
    @system_ns.doc('upload_crime_data',
                   description='Upload crime data file for processing (CSV, XLSX, XLS)',
                   consumes=['multipart/form-data'])
    @system_ns.expect(upload_parser)
    @system_ns.marshal_with(upload_response_model)
    def post(self):
        """Upload and process crime data"""
        # This would be implemented in the actual route
        return {
            'message': 'Data uploaded successfully',
            'records_processed': 0,
            'errors': []
        }

@system_ns.route('/cache/stats')
class CacheStats(Resource):
    @system_ns.doc('get_cache_stats',
                   description='Get cache performance statistics')
    @system_ns.marshal_with(cache_stats_model)
    def get(self):
        """Get cache statistics"""
        return CacheManager.get_cache_stats()

@system_ns.route('/cache/clear')
class CacheClear(Resource):
    @system_ns.doc('clear_cache',
                   description='Clear all cached data')
    @system_ns.marshal_with(cache_clear_response_model)
    def post(self):
        """Clear all cache entries"""
        success = CacheManager.clear_all_cache()
        if success:
            return {'message': 'Cache cleared successfully', 'status': 'success'}
        else:
            api.abort(500, 'Error clearing cache')

@system_ns.route('/last-upload')
class LastUpload(Resource):
    @system_ns.doc('get_last_upload',
                   description='Get information about the last successful data upload')
    @system_ns.marshal_with(upload_log_model)
    def get(self):
        """Get last upload information"""
        return {}

@system_ns.route('/metrics')
class Metrics(Resource):
    @system_ns.doc('get_metrics',
                   description='Get chat service and RAG performance metrics')
    @system_ns.marshal_with(metrics_model)
    def get(self):
        """Get system metrics"""
        return {}

# Export endpoints
@crime_ns.route('/export')
class CrimeExport(Resource):
    @crime_ns.doc('export_crimes',
                  description='Export crime data in various formats')
    @crime_ns.expect(crime_filter_parser)
    @crime_ns.expect(export_parser)
    def get(self):
        """Export crime data"""
        from routes.routes import apply_enhanced_filters
        from flask import Response
        import pandas as pd
        import io

        args = crime_filter_parser.parse_args()
        export_args = export_parser.parse_args()

        query = Crime.query
        query = apply_enhanced_filters(query)
        crimes = query.all()

        # Convert to DataFrame
        data = [{
            'id': c.id,
            'crime_type': c.crime_type,
            'date_time': c.date_time.isoformat() if c.date_time else None,
            'latitude': c.latitude,
            'longitude': c.longitude,
            'address': c.address,
            'severity': c.severity,
            'description': c.description
        } for c in crimes]

        df = pd.DataFrame(data)
        format_type = export_args['format']

        if format_type == 'csv':
            output = io.StringIO()
            df.to_csv(output, index=False)
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=crime_data.csv'}
            )
        elif format_type == 'excel':
            output = io.BytesIO()
            df.to_excel(output, index=False)
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={'Content-Disposition': 'attachment; filename=crime_data.xlsx'}
            )
        else:  # JSON
            return {'data': data, 'count': len(data), 'format': 'json'}

# Location-based endpoints
@locations_ns.route('/cities')
class Cities(Resource):
    @locations_ns.doc('get_cities',
                      description='Get list of all cities in the database')
    def get(self):
        """Get list of cities"""
        return []

@crime_ns.route('/cities')
class CityStatistics(Resource):
    @crime_ns.doc('get_city_statistics',
                  description='Get crime statistics by city and year')
    @crime_ns.expect(crime_filter_parser)
    @crime_ns.marshal_list_with(city_stats_model)
    def get(self):
        """Get city statistics"""
        return []

# Individual crime CRUD endpoints
@crime_ns.route('/<int:crime_id>')
class CrimeItem(Resource):
    @crime_ns.doc('get_crime',
                  description='Get a specific crime record by ID',
                  params={'crime_id': 'Crime record ID'})
    @crime_ns.marshal_with(crime_model)
    def get(self, crime_id):
        """Get specific crime"""
        return {}

    @crime_ns.doc('update_crime',
                  description='Update an existing crime record',
                  params={'crime_id': 'Crime record ID'})
    @crime_ns.expect(crime_model)
    @crime_ns.marshal_with(crud_response_model)
    def put(self, crime_id):
        """Update crime record"""
        return {'id': crime_id, 'message': 'Crime updated successfully'}

    @crime_ns.doc('delete_crime',
                  description='Delete a crime record',
                  params={'crime_id': 'Crime record ID'})
    @crime_ns.marshal_with(crud_response_model)
    def delete(self, crime_id):
        """Delete crime record"""
        return {'id': crime_id, 'message': 'Crime deleted successfully'}

@crime_ns.route('/')
class CrimeCreate(Resource):
    @crime_ns.doc('create_crime',
                  description='Create a new crime record')
    @crime_ns.expect(crime_model)
    @crime_ns.marshal_with(crud_response_model)
    def post(self):
        """Create new crime record"""
        return {'id': 1, 'message': 'Crime created successfully'}

# Add additional documentation
api.add_namespace(auth_ns)
api.add_namespace(crime_ns)
api.add_namespace(analysis_ns)
api.add_namespace(trends_ns)
api.add_namespace(locations_ns)
api.add_namespace(chat_ns)
api.add_namespace(system_ns)

# API metadata
api.title = 'Crime Analysis API'
api.description = '''
Comprehensive REST API for crime data analysis, visualization, and AI-powered insights.

## Features
- **Crime Data Management**: Upload, query, filter, and manage crime records with full CRUD operations
- **Spatial Analysis**: Heatmaps, density maps, spatial clustering (DBSCAN/K-means), and geographic insights
- **Temporal Analysis**: Time-based patterns, hourly/daily/monthly trends, semester comparisons, and weekday/weekend analysis
- **Trend Analysis**: Year-over-year analysis, growth rates, moving averages, weekly trends, and forecasting
- **AI-Powered Chat**: Natural language queries about crime data with RAG-enhanced responses
- **Location Intelligence**: City-based statistics, location filtering, and geocoding
- **Export Capabilities**: Multiple formats (JSON, CSV, Excel) for data export
- **Advanced Filtering**: Crime type, date ranges, cities, time ranges, days of week, months, and category filtering
- **Caching**: Redis-backed performance optimization with cache management and statistics
- **System Monitoring**: Health checks, cache statistics, upload logs, and performance metrics

## Authentication
JWT-based authentication with role-based access control (admin/viewer roles).

### Authentication Endpoints
- **POST /auth/register**: Register a new user account
- **POST /auth/login**: Authenticate user and receive JWT token
- **POST /auth/forgot-password**: Request password reset email
- **POST /auth/logout**: Logout user (client-side token removal)
- **GET /auth/validate**: Validate JWT token

### Authentication Flow
1. Register a new account or login with existing credentials
2. Include the JWT token in the Authorization header for protected endpoints: `Authorization: Bearer <token>`
3. Token expires after 24 hours (or 30 days if "remember me" is selected during login)
4. Use `/auth/validate` to check token validity before making requests

## Filtering Parameters
All analysis endpoints support comprehensive filtering:
- `crime_type`: Filter by specific crime types
- `start_date`/`end_date`: Date range filtering (ISO format or YYYY-MM-DD)
- `city`: Filter by city name
- `category_parent`: Filter by crime category parent
- `time_range`: Time of day filtering (00-06, 06-12, 12-18, 18-24)
- `day_of_week`: Day filtering (weekdays, weekends, monday-sunday)
- `month`: Month filtering (01-12)
- `limit`: Result limit (default: 1000)

## Data Formats
All endpoints return JSON by default. Export endpoints support CSV and Excel formats.

## API Namespaces
- **auth**: Authentication and user management (login, register, password reset)
- **crimes**: Crime data operations, CRUD management, and export
- **analysis**: Data analysis, summaries, temporal patterns, and spatial analysis
- **trends**: Trend analysis, forecasting, and growth rate calculations
- **locations**: Location-based data and city statistics
- **chat**: AI-powered chat interface with RAG
- **system**: System status, uploads, cache management, and metrics
'''

# Contact information
api.contact = 'Crime Analysis Development Team'
api.contact_email = 'support@crimeanalysis.local'
api.contact_url = 'https://github.com/crime-analysis'

# License information
api.license = 'MIT'
api.license_url = 'https://opensource.org/licenses/MIT'

# Terms of service
api.terms_url = 'https://crimeanalysis.local/terms'

# External documentation
api.external_docs = {
    'description': 'Complete API Documentation',
    'url': 'https://crimeanalysis.local/api-docs'
}