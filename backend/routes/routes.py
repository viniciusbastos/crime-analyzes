from flask import Blueprint, request, jsonify, current_app
from models.models import db, Crime, UploadLog, User
from flask_jwt_extended import jwt_required
from routes.auth import role_required
import pandas as pd
from sqlalchemy import extract, func
from datetime import datetime, timedelta
from utils import (
    perform_temporal_analysis,
    perform_spatial_clustering,
    create_heatmap_data,
    create_geojson_heatmap_data,
    generate_heatmap_html,
    get_location_statistics,
    calculate_crime_density,
    perform_year_over_year_analysis,
    calculate_growth_rates,
    perform_trend_analysis,
    perform_weekly_trend_analysis,
    simple_time_series_forecast
)
from controllers.upload_controller import UploadController
from services.cache_service import CacheManager, cache
from services.cache_service import cached_api_call, get_cache_timeout, invalidate_related_cache, CacheManager
from services.chat_service import chat_service, RAG_AVAILABLE

api_bp = Blueprint('api', __name__)

def apply_user_unidade_filter(query):
    """Apply unidade-based filtering for authenticated users"""
    from flask_jwt_extended import get_jwt_identity

    try:
        jwt_identity = get_jwt_identity()
        if jwt_identity and 'user_id' in jwt_identity:
            user_id = jwt_identity['user_id']
            user = User.query.get(user_id)
            if user and user.unidade:
                # Filter crimes to only show those from user's unidade
                query = query.filter(Crime.unidade == user.unidade)
    except:
        # If JWT is not available or invalid, don't apply filtering
        pass

    return query

def apply_enhanced_filters(query):
    """Apply all enhanced temporal and city filters to a query"""
    # Basic filters
    crime_type = request.args.get('crime_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    # City filter
    city = request.args.get('city')

    # Category parent filter
    category_parent = request.args.get('category_parent')

    # Police organizational filters
    unidade = request.args.get('unidade')
    aisp = request.args.get('aisp')
    risp = request.args.get('risp')

    # Enhanced temporal filters
    time_range = request.args.get('time_range')
    day_of_week = request.args.get('day_of_week')
    month = request.args.get('month')

    # Apply basic filters
    if crime_type:
        query = query.filter(Crime.crime_type == crime_type)
    if start_date:
        try:
            # Validate that start_date is a valid date string
            from datetime import datetime
            datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Crime.date_time >= start_date)
        except ValueError:
            pass  # Ignore invalid date strings
    if end_date:
        try:
            # Validate that end_date is a valid date string
            from datetime import datetime
            datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Crime.date_time <= end_date)
        except ValueError:
            pass  # Ignore invalid date strings

    # Apply city filter
    if city:
        query = query.filter(Crime.city == city)

    # Apply category parent filter
    if category_parent:
        query = query.filter(Crime.category_parent == category_parent)

    # Apply police organizational filters
    if unidade:
        query = query.filter(Crime.unidade == unidade)
    if aisp:
        try:
            aisp_int = int(aisp)
            query = query.filter(Crime.aisp == aisp_int)
        except ValueError:
            pass  # Ignore invalid aisp values
    if risp:
        query = query.filter(Crime.risp == risp)

    # Apply time range filter
    if time_range:
        if time_range == '00-06':
            query = query.filter(extract('hour', Crime.date_time).between(0, 5))
        elif time_range == '06-12':
            query = query.filter(extract('hour', Crime.date_time).between(6, 11))
        elif time_range == '12-18':
            query = query.filter(extract('hour', Crime.date_time).between(12, 17))
        elif time_range == '18-24':
            query = query.filter(extract('hour', Crime.date_time).between(18, 23))

    # Apply day of week filter
    if day_of_week:
        if day_of_week == 'weekdays':
            query = query.filter(extract('dow', Crime.date_time).between(1, 5))
        elif day_of_week == 'weekends':
            query = query.filter(extract('dow', Crime.date_time).in_([0, 6]))
        elif day_of_week == 'monday':
            query = query.filter(extract('dow', Crime.date_time) == 1)
        elif day_of_week == 'tuesday':
            query = query.filter(extract('dow', Crime.date_time) == 2)
        elif day_of_week == 'wednesday':
            query = query.filter(extract('dow', Crime.date_time) == 3)
        elif day_of_week == 'thursday':
            query = query.filter(extract('dow', Crime.date_time) == 4)
        elif day_of_week == 'friday':
            query = query.filter(extract('dow', Crime.date_time) == 5)
        elif day_of_week == 'saturday':
            query = query.filter(extract('dow', Crime.date_time) == 6)
        elif day_of_week == 'sunday':
            query = query.filter(extract('dow', Crime.date_time) == 0)

    # Apply month filter
    if month:
        try:
            month_int = int(month)
            if 1 <= month_int <= 12:
                query = query.filter(extract('month', Crime.date_time) == month_int)
        except ValueError:
            pass  # Ignore invalid month values

    return query

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Crime Analysis API is running'})

@api_bp.route('/upload', methods=['POST'])
@role_required('admin')
def upload_crime_data():
    print(f"Upload endpoint accessed")
    result = UploadController.upload_crime_data()
    return result

@api_bp.route('/last-upload', methods=['GET'])
@jwt_required(optional=True)
def get_last_upload():
    """Get information about the last successful data upload"""
    try:
        last_upload = UploadLog.query.filter_by(status='success').order_by(UploadLog.upload_time.desc()).first()

        if last_upload:
            return jsonify({
                'filename': last_upload.filename,
                'upload_time': last_upload.upload_time.isoformat(),
                'records_processed': last_upload.records_processed,
                'records_loaded': last_upload.records_loaded,
                'duplicates_skipped': last_upload.duplicates_skipped,
                'message': last_upload.message
            })
        else:
            return jsonify({
                'message': 'No successful uploads found',
                'upload_time': None
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def process_crime_data(df):
    count = 0
    for _, row in df.iterrows():
        try:
            # Process and validate data using geocoding utilities
            crime_data = process_address_data(row)
            if crime_data:
                crime = Crime(**crime_data)
                db.session.add(crime)
                count += 1
        except Exception as e:
            print(f"Error processing row: {e}")
            continue

    db.session.commit()
    return count

@api_bp.route('/crimes', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('crimes'))
def get_crimes():
    # Add pagination support
    page = request.args.get('page', type=int, default=1)
    per_page = request.args.get('per_page', type=int, default=100)
    limit = request.args.get('limit', type=int)  # Override per_page if specified

    if limit:
        per_page = limit

    query = Crime.query
    query = apply_user_unidade_filter(query)  # Apply user-based unidade filtering first
    query = apply_enhanced_filters(query)

    # Get total count for pagination
    total = query.count()

    # Apply pagination
    crimes = query.offset((page - 1) * per_page).limit(per_page).all()

    result = [{
        'id': c.id,
        'crime_type': c.crime_type,
        'date_time': c.date_time.isoformat(),
        'latitude': c.latitude,
        'longitude': c.longitude,
        'address': c.address,
        'city': c.city,
        'severity': c.severity
    } for c in crimes]

    return jsonify({
        'crimes': result,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }
    })

    result = [{
        'id': c.id,
        'crime_type': c.crime_type,
        'date_time': c.date_time.isoformat(),
        'latitude': c.latitude,
        'longitude': c.longitude,
        'address': c.address,
        'city': c.city,
        'severity': c.severity
    } for c in crimes]

    return jsonify(result)

@api_bp.route('/semester-comparison', methods=['GET'])
# @jwt_required(optional=True)
# @cached_api_call(timeout=get_cache_timeout('trends'))
def get_semester_comparison():
    """Get semester-over-semester crime comparison"""
    try:
        print(f"Semester comparison request args: {dict(request.args)}")
        query = Crime.query
        query = apply_enhanced_filters(query)

        # Group by year and semester (1=Jan-Jun, 2=Jul-Dec)
        from sqlalchemy import func, case, extract

        semester_data = db.session.query(
            extract('year', Crime.date_time).label('year'),
            case(
                (extract('month', Crime.date_time) <= 6, 1),
                else_=2
            ).label('semester'),
            func.count(Crime.id).label('crime_count')
        ).group_by(
            extract('year', Crime.date_time),
            case(
                (extract('month', Crime.date_time) <= 6, 1),
                else_=2
            )
        ).order_by(
            extract('year', Crime.date_time),
            case(
                (extract('month', Crime.date_time) <= 6, 1),
                else_=2
            )
        ).all()

        # Organize data by year and semester
        yearly_data = {}
        for year, semester, count in semester_data:
            year_key = str(int(year))
            if year_key not in yearly_data:
                yearly_data[year_key] = {'S1': 0, 'S2': 0}
            semester_key = f'S{semester}'
            yearly_data[year_key][semester_key] = count

        # Create comparison data
        comparison_data = []
        years = sorted(yearly_data.keys(), reverse=True)

        for i, current_year in enumerate(years):
            if i == len(years) - 1:  # Last year, no previous year to compare
                break

            prev_year = years[i + 1]
            current_data = yearly_data[current_year]
            prev_data = yearly_data[prev_year]

            for semester in ['S1', 'S2']:
                current_count = current_data.get(semester, 0)
                prev_count = prev_data.get(semester, 0)

                # Calculate change
                change = current_count - prev_count
                change_percent = ((change / prev_count) * 100) if prev_count > 0 else 0

                comparison_data.append({
                    'period': f'{current_year} {semester}',
                    'current_year': current_year,
                    'previous_year': prev_year,
                    'semester': semester,
                    'current_count': current_count,
                    'previous_count': prev_count,
                    'change': change,
                    'change_percent': round(change_percent, 1),
                    'semester_name': 'Jan-Jun' if semester == 'S1' else 'Jul-Dec'
                })

        # Sort by period (most recent first)
        comparison_data.sort(key=lambda x: (x['current_year'], x['semester']), reverse=True)

        return jsonify(comparison_data)
    except Exception as e:
        print(f"Error in semester comparison: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/heatmap', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('heatmap'))
def get_heatmap_data():
    # Add limit and sampling parameters for performance
    limit = request.args.get('limit', type=int, default=5000)
    sample = request.args.get('sample', type=bool, default=False)

    query = Crime.query
    query = apply_user_unidade_filter(query)
    query = apply_enhanced_filters(query)

    # Apply sampling if requested (random sampling for performance)
    if sample:
        # Use SQL random ordering for sampling
        query = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).order_by(db.func.random()).limit(limit)
    else:
        query = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).limit(limit)

    crimes = query.all()
    crimes_df = pd.DataFrame([{
        'latitude': c.latitude,
        'longitude': c.longitude,
        'crime_type': c.crime_type,
        'date_time': c.date_time
    } for c in crimes])

    heat_data = create_heatmap_data(crimes_df)
    return jsonify(heat_data)

@api_bp.route('/crime-points', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('crime_points'))
def get_crime_points():
    """Get crime data in latitude/longitude/weight format for mapping"""
    # Add limit parameter for performance, default to 5000 for initial load
    limit = request.args.get('limit', type=int, default=5000)
    query = Crime.query
    query = apply_user_unidade_filter(query)
    query = apply_enhanced_filters(query)
    crimes = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).limit(limit).all()

    # Return data in the requested format: {latitude, longitude, weight}
    crime_points = []
    for crime in crimes:
        crime_points.append({
            'latitude': crime.latitude,
            'longitude': crime.longitude,
            'weight': 1  # Default weight, could be modified based on severity or other factors
        })

    return jsonify(crime_points)

@api_bp.route('/heatmap/geojson', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('heatmap'))
def get_heatmap_geojson():
    """Get crime data as GeoJSON for heatmap visualization"""
    query = Crime.query
    query = apply_enhanced_filters(query)
    crimes = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).all()

    crimes_df = pd.DataFrame([{
        'latitude': c.latitude,
        'longitude': c.longitude,
        'crime_type': c.crime_type,
        'date_time': c.date_time,
        'address': c.address,
        'city': c.city,
        'severity': c.severity
    } for c in crimes])

    geojson_data = create_geojson_heatmap_data(crimes_df)
    return jsonify(geojson_data)

@api_bp.route('/heatmap/html', methods=['GET'])
@jwt_required(optional=True)
def get_heatmap_html():
    center_lat = float(request.args.get('center_lat', 40.7128))
    center_lng = float(request.args.get('center_lng', -74.0060))
    zoom = int(request.args.get('zoom', 10))

    query = Crime.query
    query = apply_enhanced_filters(query)
    crimes = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).limit(5000).all()  # Limit for performance
    crimes_df = pd.DataFrame([{
        'latitude': c.latitude,
        'longitude': c.longitude,
        'crime_type': c.crime_type,
        'date_time': c.date_time
    } for c in crimes])

    html_content = generate_heatmap_html(crimes_df, center_lat, center_lng, zoom)
    return html_content, 200, {'Content-Type': 'text/html'}

@api_bp.route('/density', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('density'))
def get_density_data():
    """Get crime density contour data"""
    # Add limit parameter for performance, default to 10000 for density calculations
    limit = request.args.get('limit', type=int, default=10000)
    query = Crime.query
    query = apply_enhanced_filters(query)
    crimes = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).limit(limit).all()

    # Debug: Check if we have crimes and their structure
    print(f"Density data: Found {len(crimes)} crimes with coordinates")
    if len(crimes) > 0:
        print(f"Sample crime: lat={crimes[0].latitude}, lng={crimes[0].longitude}")

    crimes_df = pd.DataFrame([{
        'latitude': c.latitude,
        'longitude': c.longitude,
        'crime_type': c.crime_type,
        'date_time': c.date_time
    } for c in crimes])

    # Debug: Check DataFrame structure
    print(f"DataFrame columns: {crimes_df.columns.tolist()}")
    print(f"DataFrame shape: {crimes_df.shape}")
    if not crimes_df.empty:
        print(f"Sample DataFrame row: {crimes_df.iloc[0].to_dict()}")

    density_data = calculate_crime_density(crimes_df)
    return jsonify(density_data)

@api_bp.route('/summary', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('summary'))
def get_summary_statistics():
    # Add limit parameter for performance, default to 50000 for summary stats
    limit = request.args.get('limit', type=int, default=50000)
    query = Crime.query
    query = apply_user_unidade_filter(query)
    query = apply_enhanced_filters(query)
    crimes = query.limit(limit).all()
    if not crimes:
        return jsonify({
            'total_crimes': 0,
            'date_range': {'start': None, 'end': None},
            'crime_types': [],
            'severity_distribution': [],
            'top_locations': []
        })
    crimes_df = pd.DataFrame([{
        'latitude': c.latitude,
        'longitude': c.longitude,
        'crime_type': c.crime_type,
        'date_time': c.date_time,
        'address': c.address,
        'severity': c.severity
    } for c in crimes])
    stats = get_location_statistics(crimes_df)
    return jsonify(stats)

@api_bp.route('/temporal', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('temporal'))
def get_temporal_analysis():
    query = Crime.query
    query = apply_user_unidade_filter(query)
    query = apply_enhanced_filters(query)

    # Optimize by fetching only the date_time column
    crimes_datetimes = query.with_entities(Crime.date_time).all()

    if not crimes_datetimes:
        return jsonify({
            'hourly': [],
            'daily': [],
            'monthly': [],
            'monthly_by_year': {}
        })

    # Get basic temporal analysis
    crimes_df = pd.DataFrame(crimes_datetimes, columns=['date_time'])
    temporal_analysis = perform_temporal_analysis(crimes_df)

    # Add monthly data grouped by year
    from sqlalchemy import func, extract

    monthly_by_year = db.session.query(
        extract('year', Crime.date_time).label('year'),
        extract('month', Crime.date_time).label('month'),
        func.count(Crime.id).label('count')
    ).group_by(
        extract('year', Crime.date_time),
        extract('month', Crime.date_time)
    ).order_by(
        extract('year', Crime.date_time),
        extract('month', Crime.date_time)
    ).all()

    # Organize by year
    yearly_monthly_data = {}
    for year, month, count in monthly_by_year:
        year_key = str(int(year))
        if year_key not in yearly_monthly_data:
            yearly_monthly_data[year_key] = []
        yearly_monthly_data[year_key].append({
            'month': int(month),
            'count': count
        })

    temporal_analysis['monthly_by_year'] = yearly_monthly_data
    return jsonify(temporal_analysis)

@api_bp.route('/spatial', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('spatial'))
def get_spatial_analysis():
    # Get algorithm parameter (default to dbscan)
    algorithm = request.args.get('algorithm', 'dbscan').lower()
    n_clusters = request.args.get('n_clusters', type=int)
    # Add limit parameter for performance, default to 10000 for spatial analysis
    limit = request.args.get('limit', type=int, default=10000)

    # Validate algorithm
    if algorithm not in ['dbscan', 'kmeans']:
        algorithm = 'dbscan'

    query = Crime.query
    query = apply_enhanced_filters(query)
    crimes = query.filter(Crime.latitude.isnot(None), Crime.longitude.isnot(None)).limit(limit).all()
    if not crimes:
        return jsonify([])

    crimes_df = pd.DataFrame([{
        'latitude': c.latitude,
        'longitude': c.longitude,
        'crime_type': c.crime_type
    } for c in crimes])

    # Get spatial clusters using specified algorithm
    spatial_clusters = perform_spatial_clustering(crimes_df, algorithm=algorithm, n_clusters=n_clusters)

    # Add RAG context for spatial analysis
    if RAG_AVAILABLE:
        try:
            city = request.args.get('city', '')
            crime_type = request.args.get('crime_type', '')

            # Build contextual query for RAG
            rag_query_parts = []
            if city:
                rag_query_parts.append(f"crime patterns in {city}")
            if crime_type:
                rag_query_parts.append(f"{crime_type} crimes")
            if algorithm == 'dbscan':
                rag_query_parts.append("DBSCAN clustering for hotspots")
            elif algorithm == 'kmeans':
                rag_query_parts.append("K-means clustering for crime analysis")

            if rag_query_parts:
                rag_query = " ".join(rag_query_parts)
                relevant_docs = rag_service.retrieve_relevant_documents(rag_query, n_results=2)

                # Add RAG insights to response
                if relevant_docs:
                    rag_insights = [doc['content'] for doc in relevant_docs]
                    # Add RAG context to each cluster
                    for cluster in spatial_clusters:
                        cluster['rag_insights'] = rag_insights
        except Exception as e:
            print(f"Error getting RAG context for spatial analysis: {e}")

    return jsonify(spatial_clusters)

@api_bp.route('/trends/year-over-year', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('trends'))
def get_year_over_year_analysis():
    query = Crime.query
    query = apply_enhanced_filters(query)

    # Optimize by fetching only the date_time column
    crimes_datetimes = query.with_entities(Crime.date_time).all()

    if not crimes_datetimes:
        return jsonify({})

    # Create DataFrame from the list of datetimes
    crimes_df = pd.DataFrame(crimes_datetimes, columns=['date_time'])

    yoy_analysis = perform_year_over_year_analysis(crimes_df)
    return jsonify(yoy_analysis)

@api_bp.route('/trends/growth-rates', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('trends'))
def get_growth_rates():
    query = Crime.query
    query = apply_enhanced_filters(query)

    # Optimize by fetching only the date_time column
    crimes_datetimes = query.with_entities(Crime.date_time).all()

    if not crimes_datetimes:
        return jsonify({})

    # Create DataFrame from the list of datetimes
    crimes_df = pd.DataFrame(crimes_datetimes, columns=['date_time'])

    growth_rates = calculate_growth_rates(crimes_df)
    return jsonify(growth_rates)

@api_bp.route('/trends/moving-averages', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('trends'))
def get_moving_averages():
    query = Crime.query
    query = apply_enhanced_filters(query)

    # Optimize by fetching only the date_time column
    crimes_datetimes = query.with_entities(Crime.date_time).all()

    if not crimes_datetimes:
        return jsonify({})

    # Create DataFrame from the list of datetimes
    crimes_df = pd.DataFrame(crimes_datetimes, columns=['date_time'])

    trend_analysis = perform_trend_analysis(crimes_df)
    return jsonify(trend_analysis)
@api_bp.route('/trends/weekly-moving-averages', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('trends'))
def get_weekly_moving_averages():
    query = Crime.query
    query = apply_enhanced_filters(query)

    # Optimize by fetching only the date_time column
    crimes_datetimes = query.with_entities(Crime.date_time).all()

    if not crimes_datetimes:
        return jsonify({})

    # Create DataFrame from the list of datetimes
    crimes_df = pd.DataFrame(crimes_datetimes, columns=['date_time'])

    weekly_trends = perform_weekly_trend_analysis(crimes_df)
    return jsonify(weekly_trends)

@api_bp.route('/trends/forecast', methods=['GET'])
# @jwt_required(optional=True)
@cached_api_call(timeout=get_cache_timeout('forecast'))
def get_forecast():
    query = Crime.query
    query = apply_enhanced_filters(query)

    # Optimize by fetching only the date_time column
    crimes_datetimes = query.with_entities(Crime.date_time).all()

    if not crimes_datetimes:
        return jsonify({})

    # Create DataFrame from the list of datetimes
    crimes_df = pd.DataFrame(crimes_datetimes, columns=['date_time'])

    forecast = simple_time_series_forecast(crimes_df)
    return jsonify(forecast)

@api_bp.route('/cities', methods=['GET'])
# @jwt_required(optional=True)
def get_city_statistics():
    """Get crime statistics by city and year"""
    query = Crime.query
    query = apply_enhanced_filters(query)

    # Group by city and year, then count crimes
    from sqlalchemy import func, extract
    city_year_stats = db.session.query(
        Crime.city,
        extract('year', Crime.date_time).label('year'),
        func.count(Crime.id).label('crime_count')
    ).filter(
        Crime.city.isnot(None),
        Crime.city != ''
    ).group_by(Crime.city, extract('year', Crime.date_time)).order_by(
        Crime.city, extract('year', Crime.date_time)
    ).all()

    # Group by city and create yearly breakdown
    city_data = {}
    for city, year, count in city_year_stats:
        if city not in city_data:
            city_data[city] = {
                'city': city,
                'yearly_data': {},
                'total_crimes': 0
            }
        city_data[city]['yearly_data'][str(int(year))] = count
        city_data[city]['total_crimes'] += count

    # Convert to list and sort by total crimes
    result = list(city_data.values())
    result.sort(key=lambda x: x['total_crimes'], reverse=True)

    # Calculate percentages and add summary stats
    total_crimes_all = sum(item['total_crimes'] for item in result)
    for item in result:
        item['percentage'] = round((item['total_crimes'] / total_crimes_all) * 100, 1) if total_crimes_all > 0 else 0

        # Convert yearly_data to list format for easier frontend consumption
        item['years'] = [
            {'year': year, 'count': count}
            for year, count in item['yearly_data'].items()
        ]
        item['years'].sort(key=lambda x: x['year'])

    return jsonify(result)

@api_bp.route('/export', methods=['GET'])
@jwt_required(optional=True)
def export_data():
    format_type = request.args.get('format', 'json')

    query = Crime.query
    query = apply_user_unidade_filter(query)
    query = apply_enhanced_filters(query)
    crimes = query.all()
    crimes_df = pd.DataFrame([{
        'id': c.id,
        'crime_type': c.crime_type,
        'date_time': c.date_time.isoformat(),
        'latitude': c.latitude,
        'longitude': c.longitude,
        'address': c.address,
        'city': c.city,
        'severity': c.severity,
        'description': c.description,
        'category_parent': c.category_parent
    } for c in crimes])

    if format_type == 'csv':
        csv_data = crimes_df.to_csv(index=False)
        return csv_data, 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=crime_data.csv'
        }
    elif format_type == 'excel':
        from io import BytesIO
        output = BytesIO()
        crimes_df.to_excel(output, index=False)
        output.seek(0)
        return output.getvalue(), 200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=crime_data.xlsx'
        }
    else:
        return jsonify(crimes_df.to_dict('records'))

@api_bp.route('/cache/stats', methods=['GET'])
@jwt_required(optional=True)
def get_cache_stats():
    """Get Redis cache statistics"""
    try:
        stats = CacheManager.get_cache_stats()
        return jsonify(stats)
    except Exception as e:
        current_app.logger.error(f"Error getting cache stats: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve cache statistics',
            'connected_clients': 0,
            'used_memory_human': '0B',
            'keyspace_hits': 0,
            'keyspace_misses': 0,
            'total_commands_processed': 0
        }), 500

@api_bp.route('/cache/clear', methods=['POST'])
@role_required('admin')
def clear_cache():
    """Clear all Redis cache entries"""
    try:
        # Clear all cache entries
        cache.clear()

        # Also clear any tagged cache entries
        CacheManager.invalidate_by_tag('api')

        current_app.logger.info("Cache cleared successfully")
        return jsonify({
            'message': 'Cache cleared successfully',
            'status': 'success'
        })
    except Exception as e:
        current_app.logger.error(f"Error clearing cache: {str(e)}")
        return jsonify({
            'error': 'Failed to clear cache',
            'message': str(e)
        }), 500

@api_bp.route('/metrics', methods=['GET'])
@jwt_required(optional=True)
def get_chat_metrics():
    """Get chat service and RAG metrics"""
    try:
        metrics = chat_service.get_metrics()
        return jsonify(metrics)
    except Exception as e:
        current_app.logger.error(f"Error getting metrics: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve metrics',
            'message': str(e)
        }), 500

# Location-based endpoints
@api_bp.route('/locations/cities', methods=['GET'])
@jwt_required(optional=True)
def get_cities():
    """Get list of all cities in the database"""
    try:
        cities = db.session.query(Crime.city).filter(Crime.city.isnot(None)).distinct().all()
        city_list = [city[0] for city in cities if city[0]]
        return jsonify(sorted(city_list))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Police organizational filter endpoints
@api_bp.route('/police/unidades', methods=['GET'])
@jwt_required(optional=True)
def get_unidades():
    """Get list of all police unidades (OPM) in the database"""
    try:
        # Apply user-based filtering first
        query = Crime.query
        query = apply_user_unidade_filter(query)

        unidades = query.with_entities(Crime.unidade).filter(Crime.unidade.isnot(None)).distinct().all()
        unidade_list = [unidade[0] for unidade in unidades if unidade[0]]
        return jsonify(sorted(unidade_list))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/police/aisps', methods=['GET'])
@jwt_required(optional=True)
def get_aisps():
    """Get list of all AISP codes in the database"""
    try:
        # Apply user-based filtering first
        query = Crime.query
        query = apply_user_unidade_filter(query)

        aisps = query.with_entities(Crime.aisp).filter(Crime.aisp.isnot(None)).distinct().all()
        aisp_list = [aisp[0] for aisp in aisps if aisp[0] is not None]
        return jsonify(sorted(aisp_list))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/police/risps', methods=['GET'])
@jwt_required(optional=True)
def get_risps():
    """Get list of all RISP categories in the database"""
    try:
        # Apply user-based filtering first
        query = Crime.query
        query = apply_user_unidade_filter(query)

        risps = query.with_entities(Crime.risp).filter(Crime.risp.isnot(None)).distinct().all()
        risp_list = [risp[0] for risp in risps if risp[0]]
        return jsonify(sorted(risp_list))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Chat endpoints
@api_bp.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def chat_with_crime_data():
    """Chat with crime data using local LLM"""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400

        user_query = data['query']
        filters = data.get('filters', {})

        # Get user ID from JWT if authenticated
        from flask_jwt_extended import get_jwt_identity
        user_id = None
        try:
            jwt_identity = get_jwt_identity()
            if jwt_identity:
                user_id = jwt_identity.get('user_id')
        except:
            pass  # User not authenticated, user_id remains None

        print(f"Processing chat query: {user_query}")
        print(f"Applied filters: {filters}")
        print(f"User ID: {user_id}")

        # Generate response using MLX-LM with RAG
        result = chat_service.generate_response(user_query, filters, user_id)

        print(f"API Response - Thinking: {repr(result.get('thinking'))}")
        print(f"API Response - Response: {repr(result.get('response')[:200])}...")

        return jsonify({
            'query': user_query,
            'response': result.get('response', ''),
            'thinking': result.get('thinking'),
            'timestamp': datetime.utcnow().isoformat(),
            'filters_applied': filters
        })

    except Exception as e:
        error_msg = f"Error processing chat request: {str(e)}"
        print(error_msg)
        return jsonify({
            'error': error_msg,
            'query': data.get('query') if 'data' in locals() else 'unknown'
        }), 500

# Crime CRUD endpoints
@api_bp.route('/crimes/<int:crime_id>', methods=['GET'])
@jwt_required(optional=True)
def get_crime(crime_id):
    """Get a specific crime by ID"""
    crime = Crime.query.get_or_404(crime_id)
    return jsonify({
        'id': crime.id,
        'crime_type': crime.crime_type,
        'date_time': crime.date_time.isoformat(),
        'latitude': crime.latitude,
        'longitude': crime.longitude,
        'address': crime.address,
        'city': crime.city,
        'severity': crime.severity,
        'description': crime.description
    })

@api_bp.route('/crimes', methods=['POST'])
@role_required('admin')
def create_crime():
    """Create a new crime record"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['crime_type', 'date_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Create new crime
        crime = Crime(
            crime_type=data['crime_type'],
            date_time=datetime.fromisoformat(data['date_time'].replace('Z', '+00:00')),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            address=data.get('address'),
            city=data.get('city'),
            severity=data.get('severity'),
            description=data.get('description')
        )

        db.session.add(crime)
        db.session.commit()

        # Invalidate cache
        invalidate_related_cache(['crimes', 'summary', 'temporal', 'spatial', 'heatmap', 'crime_points', 'density'])

        return jsonify({
            'id': crime.id,
            'message': 'Crime created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/crimes/<int:crime_id>', methods=['PUT'])
@role_required('admin')
def update_crime(crime_id):
    """Update an existing crime record"""
    try:
        crime = Crime.query.get_or_404(crime_id)
        data = request.get_json()

        # Update fields
        if 'crime_type' in data:
            crime.crime_type = data['crime_type']
        if 'date_time' in data:
            crime.date_time = datetime.fromisoformat(data['date_time'].replace('Z', '+00:00'))
        if 'latitude' in data:
            crime.latitude = data['latitude']
        if 'longitude' in data:
            crime.longitude = data['longitude']
        if 'address' in data:
            crime.address = data['address']
        if 'city' in data:
            crime.city = data['city']
        if 'severity' in data:
            crime.severity = data['severity']
        if 'description' in data:
            crime.description = data['description']

        db.session.commit()

        # Invalidate cache
        invalidate_related_cache(['crimes', 'summary', 'temporal', 'spatial', 'heatmap', 'crime_points', 'density'])

        return jsonify({
            'id': crime.id,
            'message': 'Crime updated successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/crimes/<int:crime_id>', methods=['DELETE'])
@role_required('admin')
def delete_crime(crime_id):
    """Delete a crime record"""
    try:
        crime = Crime.query.get_or_404(crime_id)
        db.session.delete(crime)
        db.session.commit()

        # Invalidate cache
        invalidate_related_cache(['crimes', 'summary', 'temporal', 'spatial', 'heatmap', 'crime_points', 'density'])

        return jsonify({'message': 'Crime deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500