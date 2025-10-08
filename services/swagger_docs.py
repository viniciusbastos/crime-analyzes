from flask_restx import Api, Resource, fields, reqparse
from flask import Blueprint, request
from models.models import db, Crime
from services.chat_service import chat_service
from services.cache_service import CacheManager
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
crime_ns = api.namespace('crimes', description='Crime data operations')
analysis_ns = api.namespace('analysis', description='Data analysis and insights')
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
    'severity': fields.String(description='Crime severity level'),
    'description': fields.String(description='Additional crime details')
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
    'weekday_weekend': fields.Raw(description='Weekday vs weekend comparison')
})

chat_request_model = api.model('ChatRequest', {
    'query': fields.String(required=True, description='User question about crime data'),
    'filters': fields.Raw(description='Optional filters to apply to the analysis')
})

chat_response_model = api.model('ChatResponse', {
    'query': fields.String(description='Original user query'),
    'response': fields.String(description='AI-generated analysis response'),
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

# Request parsers for query parameters
crime_filter_parser = reqparse.RequestParser()
crime_filter_parser.add_argument('crime_type', type=str, help='Filter by crime type')
crime_filter_parser.add_argument('start_date', type=str, help='Start date (YYYY-MM-DD)')
crime_filter_parser.add_argument('end_date', type=str, help='End date (YYYY-MM-DD)')
crime_filter_parser.add_argument('time_range', type=str, help='Time range (00-06, 06-12, 12-18, 18-24)')
crime_filter_parser.add_argument('day_of_week', type=str, help='Day of week filter')
crime_filter_parser.add_argument('month', type=str, help='Month filter (01-12)')

export_parser = reqparse.RequestParser()
export_parser.add_argument('format', type=str, choices=['json', 'csv', 'excel'],
                          default='json', help='Export format')

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
        from routes.routes import apply_enhanced_filters
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
    def post(self):
        """Clear all cache entries"""
        success = CacheManager.clear_all_cache()
        if success:
            return {'message': 'Cache cleared successfully'}
        else:
            api.abort(500, 'Error clearing cache')

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

# Add additional documentation
api.add_namespace(crime_ns)
api.add_namespace(analysis_ns)
api.add_namespace(chat_ns)
api.add_namespace(system_ns)

# API metadata
api.title = 'Crime Analysis API'
api.description = '''
Comprehensive REST API for crime data analysis and visualization.

## Features
- **Crime Data Management**: Upload, query, and filter crime records
- **Spatial Analysis**: Heatmaps, density maps, and geographic insights
- **Temporal Analysis**: Time-based patterns and trends
- **AI-Powered Chat**: Natural language queries about crime data
- **Export Capabilities**: Multiple formats (JSON, CSV, Excel)
- **Caching**: Redis-backed performance optimization

## Authentication
Currently open for development. Add authentication headers for production use.

## Rate Limiting
Implemented via Flask-Caching for API protection.

## Data Formats
All endpoints return JSON by default. Export endpoints support multiple formats.
'''

# Contact information
api.contact = 'Crime Analysis Team'
api.contact_email = 'admin@crimeanalysis.com'
api.contact_url = 'https://crimeanalysis.com'

# License information
api.license = 'MIT'
api.license_url = 'https://opensource.org/licenses/MIT'

# Terms of service
api.terms_url = 'https://crimeanalysis.com/terms'

# External documentation
api.external_docs = {
    'description': 'Complete API Guide',
    'url': 'https://crimeanalysis.com/api-docs'
}