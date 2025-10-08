import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import folium
from folium.plugins import HeatMap
import geopandas as gpd
from shapely.geometry import Point
from datetime import datetime, timedelta
import json

def convert_to_json_serializable(obj):
    """Convert numpy/pandas types to JSON serializable Python types"""
    if isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [convert_to_json_serializable(item) for item in obj]
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Series):
        return obj.tolist()

    if pd.isna(obj):
        return None

    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)

    return obj

def perform_temporal_analysis(crimes_df):
    """Analyze crime patterns by time periods"""
    crimes_df['hour'] = crimes_df['date_time'].dt.hour
    crimes_df['day_of_week'] = crimes_df['date_time'].dt.dayofweek
    crimes_df['month'] = crimes_df['date_time'].dt.month

    # Hourly patterns
    hourly_crimes = crimes_df.groupby('hour').size().reset_index(name='count')

    # Daily patterns
    daily_crimes = crimes_df.groupby('day_of_week').size().reset_index(name='count')

    # Monthly patterns - ensure all months are represented
    monthly_crimes = crimes_df.groupby('month').size().reset_index(name='count')
    # Create a complete list of all 12 months with zeros for missing months
    all_months = pd.DataFrame({'month': range(1, 13)})
    monthly_crimes = all_months.merge(monthly_crimes, on='month', how='left').fillna(0)
    monthly_crimes['count'] = monthly_crimes['count'].astype(int)

    # Weekday vs Weekend patterns
    crimes_df['is_weekend'] = crimes_df['day_of_week'].isin([5, 6])  # Saturday=5, Sunday=6
    weekend_crimes = crimes_df.groupby('is_weekend').size().reset_index(name='count')
    weekend_crimes['period'] = weekend_crimes['is_weekend'].map({False: 'Weekday', True: 'Weekend'})

    # Hourly patterns by weekday/weekend
    hourly_weekday = crimes_df[~crimes_df['is_weekend']].groupby('hour').size().reset_index(name='count')
    hourly_weekend = crimes_df[crimes_df['is_weekend']].groupby('hour').size().reset_index(name='count')

    # Ensure all hours are represented for both weekday and weekend
    all_hours = pd.DataFrame({'hour': range(24)})
    hourly_weekday = all_hours.merge(hourly_weekday, on='hour', how='left').fillna(0)
    hourly_weekend = all_hours.merge(hourly_weekend, on='hour', how='left').fillna(0)
    hourly_weekday['count'] = hourly_weekday['count'].astype(int)
    hourly_weekend['count'] = hourly_weekend['count'].astype(int)

    return {
        'hourly': hourly_crimes.to_dict('records'),
        'daily': daily_crimes.to_dict('records'),
        'monthly': monthly_crimes.to_dict('records'),
        'weekend_comparison': weekend_crimes.to_dict('records'),
        'hourly_weekday': hourly_weekday.to_dict('records'),
        'hourly_weekend': hourly_weekend.to_dict('records')
    }

def perform_spatial_clustering(crimes_df, eps=0.01, min_samples=5):
    """Identify crime hotspots using DBSCAN clustering"""
    # Filter out records with no coordinates
    crimes_df = crimes_df.dropna(subset=['latitude', 'longitude'])
    if crimes_df.empty:
        return []
    # Prepare coordinates for clustering
    coords = crimes_df[['latitude', 'longitude']].values

    # Normalize coordinates (approximate conversion to meters)
    scaler = StandardScaler()
    coords_scaled = scaler.fit_transform(coords)

    # Perform DBSCAN clustering
    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    clusters = dbscan.fit_predict(coords_scaled)

    crimes_df['cluster'] = clusters

    # Calculate cluster statistics
    cluster_stats = []
    for cluster_id in np.unique(clusters):
        if cluster_id != -1:  # Exclude noise points
            cluster_data = crimes_df[crimes_df['cluster'] == cluster_id]
            center_lat = cluster_data['latitude'].mean()
            center_lng = cluster_data['longitude'].mean()
            count = len(cluster_data)

            cluster_stats.append({
                'cluster_id': int(cluster_id),
                'center_lat': center_lat,
                'center_lng': center_lng,
                'crime_count': count,
                'crime_types': cluster_data['crime_type'].value_counts().to_dict()
            })

    return cluster_stats

def create_heatmap_data(crimes_df, radius=15, blur=10):
    """Generate heatmap data for Folium"""
    # Filter out records with no coordinates
    crimes_df = crimes_df.dropna(subset=['latitude', 'longitude'])
    heat_data = []

    for _, crime in crimes_df.iterrows():
        heat_data.append([
            crime['latitude'],
            crime['longitude'],
            80 # intensity
        ])

    return heat_data

def generate_heatmap_html(crimes_df, center_lat=40.7128, center_lng=-74.0060, zoom_start=10):
    """Generate interactive heatmap HTML using Folium"""
    # Create base map
    m = folium.Map(location=[center_lat, center_lng], zoom_start=zoom_start)

    # Add heatmap layer
    heat_data = create_heatmap_data(crimes_df)
    HeatMap(heat_data, radius=15, blur=10, gradient={
        0.2: 'blue',
        0.4: 'lime',
        0.6: 'orange',
        1: 'red'
    }).add_to(m)

    # Add crime markers (sample for performance)
    if len(crimes_df) <= 1000:  # Limit markers for performance
        for _, crime in crimes_df.iterrows():
            folium.CircleMarker(
                location=[crime['latitude'], crime['longitude']],
                radius=3,
                color='red',
                fill=True,
                fill_color='red',
                popup=f"{crime['crime_type']} - {crime['date_time'].strftime('%Y-%m-%d %H:%M')}"
            ).add_to(m)

    return m.get_root().render()

def calculate_crime_density(crimes_df, grid_size=0.02):
    """Calculate crime density in a grid for contour visualization"""
    # Filter out records with no coordinates
    crimes_df = crimes_df.dropna(subset=['latitude', 'longitude'])
    if crimes_df.empty:
        return []

    # Create grid bounds with some padding
    min_lat, max_lat = crimes_df['latitude'].min(), crimes_df['latitude'].max()
    min_lng, max_lng = crimes_df['longitude'].min(), crimes_df['longitude'].max()

    # Add padding to bounds
    lat_padding = (max_lat - min_lat) * 0.1
    lng_padding = (max_lng - min_lng) * 0.1

    min_lat -= lat_padding
    max_lat += lat_padding
    min_lng -= lng_padding
    max_lng += lng_padding

    # Create grid cells
    lat_bins = np.arange(min_lat, max_lat + grid_size, grid_size)
    lng_bins = np.arange(min_lng, max_lng + grid_size, grid_size)

    # Calculate density for each grid cell
    density_grid = []
    max_density = 0

    for i in range(len(lat_bins) - 1):
        row = []
        for j in range(len(lng_bins) - 1):
            lat_min, lat_max = lat_bins[i], lat_bins[i+1]
            lng_min, lng_max = lng_bins[j], lng_bins[j+1]

            # Count crimes in this cell
            cell_crimes = crimes_df[
                (crimes_df['latitude'] >= lat_min) & (crimes_df['latitude'] < lat_max) &
                (crimes_df['longitude'] >= lng_min) & (crimes_df['longitude'] < lng_max)
            ]

            density = len(cell_crimes)
            row.append(density)
            max_density = max(max_density, density)

        density_grid.append(row)

    # Create contour data
    contour_data = []
    if max_density > 0:
        # Define contour levels (percentiles of density)
        levels = [0.2, 0.4, 0.6, 0.8, 1.0]  # 20%, 40%, 60%, 80%, 100% of max density

        for level_idx, level_multiplier in enumerate(levels):
            level_value = max_density * level_multiplier
            level_contours = []

            # Find cells above this density level
            for i in range(len(density_grid)):
                for j in range(len(density_grid[0])):
                    if density_grid[i][j] >= level_value:
                        lat_min = lat_bins[i]
                        lat_max = lat_bins[i+1]
                        lng_min = lng_bins[j]
                        lng_max = lng_bins[j+1]

                        level_contours.append({
                            'lat_min': lat_min,
                            'lat_max': lat_max,
                            'lng_min': lng_min,
                            'lng_max': lng_max,
                            'center_lat': (lat_min + lat_max) / 2,
                            'center_lng': (lng_min + lng_max) / 2,
                            'density': density_grid[i][j],
                            'level': level_idx + 1,
                            'opacity': min(0.8, density_grid[i][j] / max_density * 0.8)
                        })

            if level_contours:
                contour_data.append({
                    'level': level_idx + 1,
                    'level_value': level_value,
                    'percentage': int(level_multiplier * 100),
                    'contours': level_contours
                })

    return {
        'grid_size': grid_size,
        'bounds': {
            'min_lat': min_lat,
            'max_lat': max_lat,
            'min_lng': min_lng,
            'max_lng': max_lng
        },
        'max_density': max_density,
        'contour_levels': contour_data
    }

def perform_year_over_year_analysis(crimes_df):
    """Analyze crime trends year-over-year"""
    crimes_df['year'] = crimes_df['date_time'].dt.year
    crimes_df['month'] = crimes_df['date_time'].dt.month

    # Yearly totals
    yearly_crimes = crimes_df.groupby('year').size().reset_index(name='count')
    yearly_crimes = yearly_crimes.sort_values('year')

    # Year-over-year comparison
    yoy_comparison = []
    for i in range(1, len(yearly_crimes)):
        current_year = yearly_crimes.iloc[i]
        previous_year = yearly_crimes.iloc[i-1]

        change = current_year['count'] - previous_year['count']
        change_percent = (change / previous_year['count'] * 100) if previous_year['count'] > 0 else 0

        yoy_comparison.append({
            'year': int(current_year['year']),
            'current_count': int(current_year['count']),
            'previous_count': int(previous_year['count']),
            'change': int(change),
            'change_percent': round(change_percent, 2)
        })

    # Monthly trends by year
    monthly_by_year = crimes_df.groupby(['year', 'month']).size().reset_index(name='count')
    monthly_by_year = monthly_by_year.sort_values(['year', 'month'])

    return convert_to_json_serializable({
        'yearly_totals': yearly_crimes.to_dict('records'),
        'year_over_year': yoy_comparison,
        'monthly_by_year': monthly_by_year.to_dict('records')
    })

def calculate_growth_rates(crimes_df):
    """Calculate growth rates and trends"""
    crimes_df['year'] = crimes_df['date_time'].dt.year
    crimes_df['month'] = crimes_df['date_time'].dt.month
    crimes_df['year_month'] = crimes_df['date_time'].dt.to_period('M')

    # Monthly crime counts
    monthly_counts = crimes_df.groupby('year_month').size().reset_index(name='count')
    monthly_counts['year_month'] = monthly_counts['year_month'].astype(str)
    monthly_counts = monthly_counts.sort_values('year_month')

    # Calculate month-over-month growth rates
    monthly_counts['mom_growth'] = monthly_counts['count'].pct_change() * 100
    monthly_counts['mom_growth'] = monthly_counts['mom_growth'].fillna(0)

    # Calculate moving averages (3-month and 6-month)
    monthly_counts['ma_3month'] = monthly_counts['count'].rolling(window=3).mean()
    monthly_counts['ma_6month'] = monthly_counts['count'].rolling(window=6).mean()

    # Calculate year-over-year growth
    monthly_counts['year_ago'] = monthly_counts['count'].shift(12)
    monthly_counts['yoy_growth'] = ((monthly_counts['count'] - monthly_counts['year_ago']) / monthly_counts['year_ago'] * 100).fillna(0)

    return convert_to_json_serializable({
        'monthly_counts': monthly_counts.to_dict('records'),
        'growth_rates': {
            'average_mom_growth': monthly_counts['mom_growth'].mean(),
            'average_yoy_growth': monthly_counts['yoy_growth'].mean(),
            'volatility': monthly_counts['mom_growth'].std()
        }
    })

def perform_trend_analysis(crimes_df):
    """Perform comprehensive trend analysis with moving averages and indicators"""
    crimes_df['year_month'] = crimes_df['date_time'].dt.to_period('M')

    # Monthly crime counts
    monthly_counts = crimes_df.groupby('year_month').size().reset_index(name='count')
    monthly_counts['year_month'] = monthly_counts['year_month'].astype(str)
    monthly_counts = monthly_counts.sort_values('year_month')

    # Calculate multiple moving averages
    monthly_counts['ma_3'] = monthly_counts['count'].rolling(window=3).mean()
    monthly_counts['ma_6'] = monthly_counts['count'].rolling(window=6).mean()
    monthly_counts['ma_12'] = monthly_counts['count'].rolling(window=12).mean()

    # Calculate trend direction (slope of recent data)
    recent_data = monthly_counts.tail(6)  # Last 6 months
    if len(recent_data) >= 3:
        x = np.arange(len(recent_data))
        y = recent_data['count'].values
        slope = np.polyfit(x, y, 1)[0]
        trend_direction = 'increasing' if slope > 0 else 'decreasing'
        trend_strength = abs(slope)
    else:
        trend_direction = 'insufficient_data'
        trend_strength = 0

    return convert_to_json_serializable({
        'monthly_trends': monthly_counts.to_dict('records'),
        'moving_averages': {
            'ma_3': monthly_counts['ma_3'].dropna().tolist(),
            'ma_6': monthly_counts['ma_6'].dropna().tolist(),
            'ma_12': monthly_counts['ma_12'].dropna().tolist()
        },
        'trend_indicators': {
            'direction': trend_direction,
            'strength': trend_strength,
            'current_level': monthly_counts['count'].iloc[-1] if len(monthly_counts) > 0 else 0,
            'average_level': monthly_counts['count'].mean()
        }
    })

def perform_weekly_trend_analysis(crimes_df):
    """Perform weekly trend analysis with daily moving averages"""
    # Group by date (daily)
    crimes_df['date'] = crimes_df['date_time'].dt.date

    # Daily crime counts
    daily_counts = crimes_df.groupby('date').size().reset_index(name='count')
    daily_counts = daily_counts.sort_values('date')

    # Calculate moving averages
    daily_counts['ma_7'] = daily_counts['count'].rolling(window=7).mean()
    daily_counts['ma_15'] = daily_counts['count'].rolling(window=15).mean()
    daily_counts['ma_30'] = daily_counts['count'].rolling(window=30).mean()

    # Convert date to string for JSON serialization
    daily_counts['date'] = daily_counts['date'].astype(str)

    return convert_to_json_serializable({
        'daily_trends': daily_counts.to_dict('records'),
        'moving_averages': {
            'ma_7': daily_counts['ma_7'].dropna().tolist(),
            'ma_15': daily_counts['ma_15'].dropna().tolist(),
            'ma_30': daily_counts['ma_30'].dropna().tolist()
        },
        'summary': {
            'total_days': len(daily_counts),
            'avg_daily_crimes': daily_counts['count'].mean(),
            'max_daily_crimes': daily_counts['count'].max(),
            'min_daily_crimes': daily_counts['count'].min()
        }
    })

def simple_time_series_forecast(crimes_df, forecast_months=3):
    """Simple time-series forecasting using moving average and linear trend"""
    crimes_df['year_month'] = crimes_df['date_time'].dt.to_period('M')

    # Get historical monthly data
    monthly_counts = crimes_df.groupby('year_month').size().reset_index(name='count')
    monthly_counts['year_month'] = monthly_counts['year_month'].astype(str)
    monthly_counts = monthly_counts.sort_values('year_month')

    if len(monthly_counts) < 6:
        return {'forecast': [], 'method': 'insufficient_data'}

    # Method 1: Simple moving average forecast
    recent_avg = monthly_counts['count'].tail(3).mean()

    # Method 2: Linear trend extrapolation
    x = np.arange(len(monthly_counts))
    y = monthly_counts['count'].values
    slope, intercept = np.polyfit(x, y, 1)

    # Generate forecast
    forecast = []
    last_date = pd.to_datetime(monthly_counts['year_month'].iloc[-1] + '-01')

    for i in range(1, forecast_months + 1):
        forecast_date = last_date + pd.DateOffset(months=i)
        year_month_str = forecast_date.strftime('%Y-%m')

        # Linear trend forecast
        trend_forecast = slope * (len(monthly_counts) + i - 1) + intercept

        # Moving average forecast (weighted with recent trend)
        ma_forecast = recent_avg * (1 + slope * 0.1)  # Slight trend adjustment

        # Combined forecast (weighted average)
        combined_forecast = (trend_forecast * 0.6 + ma_forecast * 0.4)

        forecast.append({
            'period': year_month_str,
            'linear_trend': max(0, round(trend_forecast, 1)),
            'moving_average': max(0, round(ma_forecast, 1)),
            'combined_forecast': max(0, round(combined_forecast, 1)),
            'confidence_interval': {
                'lower': max(0, round(combined_forecast * 0.8, 1)),
                'upper': round(combined_forecast * 1.2, 1)
            }
        })

    return convert_to_json_serializable({
        'forecast': forecast,
        'method': 'combined_linear_ma',
        'historical_data_points': len(monthly_counts),
        'trend_slope': slope,
        'average_level': monthly_counts['count'].mean()
    })

def get_location_statistics(crimes_df):
    """Generate location-based crime statistics"""
    # Top crime locations
    top_locations = crimes_df.groupby('address').size().reset_index(name='count')
    top_locations = top_locations.sort_values('count', ascending=False).head(20)

    # Crime type distribution
    crime_types = crimes_df['crime_type'].value_counts().reset_index()
    crime_types.columns = ['crime_type', 'count']

    # Severity distribution
    severity_stats = crimes_df['severity'].value_counts().reset_index()
    severity_stats.columns = ['severity', 'count']

    return {
        'top_locations': top_locations.to_dict('records'),
        'crime_types': crime_types.to_dict('records'),
        'severity_distribution': severity_stats.to_dict('records'),
        'total_crimes': len(crimes_df),
        'date_range': {
            'start': crimes_df['date_time'].min().isoformat(),
            'end': crimes_df['date_time'].max().isoformat()
        }
    }