from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from models.models import db, Crime, IbgeDemographicData
from sqlalchemy import func, extract, and_, or_
from services.ibge_service import ibge_service


class CrimeDataService:
    """Service for querying and formatting crime data"""

    def get_crime_data_context(self, filters: Dict[str, Any], aggregation: str = None) -> Dict[str, Any]:
        """Query and format crime data for LLM context, or specific aggregation if provided"""
        try:
            # Apply filters to base query
            query = Crime.query

            # Apply temporal filters
            if filters.get('start_date'):
                query = query.filter(Crime.date_time >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(Crime.date_time <= filters['end_date'])
            if filters.get('time_range'):
                query = self._apply_time_range_filter(query, filters['time_range'])
            if filters.get('day_of_week'):
                query = self._apply_day_filter(query, filters['day_of_week'])
            if filters.get('month'):
                query = query.filter(extract('month', Crime.date_time) == int(filters['month']))
            if filters.get('crime_type'):
                query = query.filter(Crime.crime_type == filters['crime_type'])
            if filters.get('city'):
                query = query.filter(Crime.city == filters['city'])

            if aggregation:
                # Return specific aggregated data
                if aggregation == 'count_total':
                    total = query.count()
                    return {'total_crimes': total, 'aggregation': 'count_total'}
                elif aggregation == 'count_by_month':
                    monthly = db.session.query(
                        extract('year', Crime.date_time).label('year'),
                        extract('month', Crime.date_time).label('month'),
                        func.count(Crime.id).label('count')
                    ).filter(
                        and_(*[getattr(Crime, k) == v for k, v in filters.items() if k in ['crime_type', 'city']])
                    ).group_by(extract('year', Crime.date_time), extract('month', Crime.date_time)).order_by(
                        extract('year', Crime.date_time), extract('month', Crime.date_time)
                    ).all()
                    return {
                        'monthly_counts': [{'year': int(m[0]), 'month': int(m[1]), 'count': m[2]} for m in monthly],
                        'aggregation': 'count_by_month'
                    }
                elif aggregation == 'count_by_city':
                    cities = db.session.query(
                        Crime.city,
                        func.count(Crime.id).label('count')
                    ).filter(
                        and_(*[getattr(Crime, k) == v for k, v in filters.items() if k in ['crime_type']])
                    ).group_by(Crime.city).order_by(func.count(Crime.id).desc()).limit(10).all()
                    return {
                        'cities': [{'city': c[0], 'count': c[1]} for c in cities],
                        'aggregation': 'count_by_city'
                    }
                elif aggregation == 'trends_hourly':
                    hourly = db.session.query(
                        extract('hour', Crime.date_time).label('hour'),
                        func.count(Crime.id).label('count')
                    ).filter(
                        and_(*[getattr(Crime, k) == v for k, v in filters.items() if k in ['crime_type', 'city']])
                    ).group_by(extract('hour', Crime.date_time)).order_by(extract('hour', Crime.date_time)).all()
                    return {
                        'hourly_trends': [{'hour': int(h[0]), 'count': h[1]} for h in hourly],
                        'aggregation': 'trends_hourly'
                    }
                elif aggregation == 'trends_weekly':
                    weekly = db.session.query(
                        extract('year', Crime.date_time).label('year'),
                        extract('week', Crime.date_time).label('week'),
                        func.count(Crime.id).label('count')
                    ).filter(
                        and_(*[getattr(Crime, k) == v for k, v in filters.items() if k in ['crime_type', 'city']])
                    ).group_by(extract('year', Crime.date_time), extract('week', Crime.date_time)).order_by(
                        extract('year', Crime.date_time).desc(), extract('week', Crime.date_time).desc()
                    ).limit(52).all()
                    return {
                        'weekly_trends': [{'year': int(w[0]), 'week': int(w[1]), 'count': w[2]} for w in weekly],
                        'aggregation': 'trends_weekly'
                    }
                else:
                    # Fallback to full context if unknown aggregation
                    aggregation = None

            if not aggregation:
                # Full context (original logic)
                total_crimes = query.count()

                # Get crime types distribution
                crime_types = db.session.query(
                    Crime.crime_type,
                    func.count(Crime.id).label('count')
                ).filter(
                    and_(*[getattr(Crime, k) == v for k, v in filters.items() if k in ['crime_type', 'city']])
                ).group_by(Crime.crime_type).order_by(func.count(Crime.id).desc()).limit(10).all()

                # Get temporal patterns
                hourly_pattern = db.session.query(
                    extract('hour', Crime.date_time).label('hour'),
                    func.count(Crime.id).label('count')
                ).group_by(extract('hour', Crime.date_time)).order_by(extract('hour', Crime.date_time)).all()

                monthly_pattern = db.session.query(
                    extract('month', Crime.date_time).label('month'),
                    func.count(Crime.id).label('count')
                ).group_by(extract('month', Crime.date_time)).order_by(extract('month', Crime.date_time)).all()

                # Get year-over-year data
                yearly_data = db.session.query(
                    extract('year', Crime.date_time).label('year'),
                    func.count(Crime.id).label('count')
                ).group_by(extract('year', Crime.date_time)).order_by(extract('year', Crime.date_time)).all()

                # Get daily patterns (limited to recent data to avoid overwhelming response)
                daily_pattern = db.session.query(
                    func.date(Crime.date_time).label('date'),
                    func.count(Crime.id).label('count')
                ).group_by(func.date(Crime.date_time)).order_by(func.date(Crime.date_time).desc()).limit(30).all()

                # Get weekly patterns
                weekly_pattern = db.session.query(
                    extract('year', Crime.date_time).label('year'),
                    extract('week', Crime.date_time).label('week'),
                    func.count(Crime.id).label('count')
                ).group_by(extract('year', Crime.date_time), extract('week', Crime.date_time)).order_by(extract('year', Crime.date_time).desc(), extract('week', Crime.date_time).desc()).limit(52).all()

                # Get weekday vs weekend
                weekday_weekend = db.session.query(
                    (extract('dow', Crime.date_time).in_([0, 6])).label('is_weekend'),
                    func.count(Crime.id).label('count')
                ).group_by((extract('dow', Crime.date_time).in_([0, 6]))).all()

                # Get geographic distribution
                city_distribution = db.session.query(
                    Crime.city,
                    func.count(Crime.id).label('count')
                ).filter(
                    and_(*[getattr(Crime, k) == v for k, v in filters.items() if k in ['crime_type']])
                ).group_by(Crime.city).order_by(func.count(Crime.id).desc()).limit(10).all()

                # Get recent crime locations (sample)
                recent_crimes_locations = query.with_entities(Crime.latitude, Crime.longitude).filter(
                    Crime.latitude.isnot(None),
                    Crime.longitude.isnot(None)
                ).order_by(Crime.date_time.desc()).limit(100).all()

                # Format data for LLM
                context = {
                    'total_crimes': total_crimes,
                    'date_range': {
                        'start': filters.get('start_date', 'all'),
                        'end': filters.get('end_date', 'present')
                    },
                    'filters_applied': filters,
                    'crime_types': [
                        {'type': ct[0], 'count': ct[1], 'percentage': round(ct[1] / total_crimes * 100, 1) if total_crimes > 0 else 0}
                        for ct in crime_types
                    ],
                    'geographic_distribution': {
                        'top_cities': [{'city': city[0], 'count': city[1]} for city in city_distribution],
                        'recent_locations_sample': [{'lat': loc.latitude, 'lon': loc.longitude} for loc in recent_crimes_locations]
                    },
                    'temporal_patterns': {
                        'hourly': [{'hour': int(h[0]), 'count': h[1]} for h in hourly_pattern],
                        'daily': [{'date': str(d[0]), 'count': d[1]} for d in daily_pattern],
                        'weekly': [{'year': int(w[0]), 'week': int(w[1]), 'count': w[2]} for w in weekly_pattern],
                        'monthly': [{'month': int(m[0]), 'count': m[1]} for m in monthly_pattern],
                        'yearly': [{'year': int(y[0]), 'count': y[1]} for y in yearly_data]
                    },
                    'weekday_weekend': {
                        'weekdays': next((w[1] for w in weekday_weekend if not w[0]), 0),
                        'weekends': next((w[1] for w in weekday_weekend if w[0]), 0)
                    }
                }

                return context

        except Exception as e:
            print(f"Error getting crime data context: {e}")
            return {'error': str(e)}

    def _apply_time_range_filter(self, query, time_range: str):
        """Apply time range filter to query"""
        if time_range == '00-06':
            return query.filter(extract('hour', Crime.date_time).between(0, 5))
        elif time_range == '06-12':
            return query.filter(extract('hour', Crime.date_time).between(6, 11))
        elif time_range == '12-18':
            return query.filter(extract('hour', Crime.date_time).between(12, 17))
        elif time_range == '18-24':
            return query.filter(extract('hour', Crime.date_time).between(18, 23))
        return query

    def _apply_day_filter(self, query, day_filter: str):
        """Apply day of week filter to query"""
        if day_filter == 'weekdays':
            return query.filter(extract('dow', Crime.date_time).between(1, 5))
        elif day_filter == 'weekends':
            return query.filter(extract('dow', Crime.date_time).in_([0, 6]))
        elif day_filter == 'monday':
            return query.filter(extract('dow', Crime.date_time) == 1)
        elif day_filter == 'tuesday':
            return query.filter(extract('dow', Crime.date_time) == 2)
        elif day_filter == 'wednesday':
            return query.filter(extract('dow', Crime.date_time) == 3)
        elif day_filter == 'thursday':
            return query.filter(extract('dow', Crime.date_time) == 4)
        elif day_filter == 'friday':
            return query.filter(extract('dow', Crime.date_time) == 5)
        elif day_filter == 'saturday':
            return query.filter(extract('dow', Crime.date_time) == 6)
        elif day_filter == 'sunday':
            return query.filter(extract('dow', Crime.date_time) == 0)
        return query

    def get_crime_demographic_correlation(self, city: str = None, year: int = None) -> Dict[str, Any]:
        """Analyze correlation between crime rates and demographic factors"""
        try:
            if not year:
                year = datetime.now().year - 1

            # Get crime statistics by city
            crime_query = Crime.query
            if city:
                crime_query = crime_query.filter(Crime.city == city)

            # Get crime counts by city
            crime_stats = db.session.query(
                Crime.city,
                func.count(Crime.id).label('crime_count')
            ).filter(
                Crime.city.isnot(None),
                extract('year', Crime.date_time) == year
            ).group_by(Crime.city).all()

            crime_by_city = {stat.city: stat.crime_count for stat in crime_stats}

            # Get IBGE data for cities with crime data
            correlations = []

            for city_name, crime_count in crime_by_city.items():
                # Try to find municipality code for the city
                # This is a simplified approach - in practice, you'd need a mapping
                # For now, we'll skip cities that don't have clear IBGE codes
                municipality_code = self._get_municipality_code_from_city(city_name)
                if not municipality_code:
                    continue

                # Get IBGE demographic data
                ibge_data = ibge_service.get_municipality_data(municipality_code, year)
                if not ibge_data:
                    continue

                # Calculate crime rate per 1000 inhabitants
                population = ibge_data.get('total_population', 0)
                if population > 0:
                    crime_rate = (crime_count / population) * 1000
                else:
                    crime_rate = 0

                correlation_data = {
                    'city': city_name,
                    'municipality_code': municipality_code,
                    'year': year,
                    'crime_count': crime_count,
                    'crime_rate_per_1000': round(crime_rate, 2),
                    'population': population,
                    'demographic_indicators': {
                        'urban_population_pct': round((ibge_data.get('urban_population', 0) / population * 100), 1) if population > 0 else 0,
                        'gini_coefficient': ibge_data.get('gini_coefficient'),
                        'average_income': ibge_data.get('average_income'),
                        'poverty_rate': ibge_data.get('poverty_rate'),
                        'literacy_rate': ibge_data.get('literacy_rate'),
                        'unemployment_rate': ibge_data.get('unemployment_rate'),
                        'gdp_per_capita': ibge_data.get('gdp_per_capita')
                    }
                }

                correlations.append(correlation_data)

            return {
                'correlations': correlations,
                'year': year,
                'total_cities_analyzed': len(correlations)
            }

        except Exception as e:
            print(f"Error in crime-demographic correlation analysis: {e}")
            return {'error': str(e)}

    def _get_municipality_code_from_city(self, city_name: str) -> Optional[str]:
        """Get IBGE municipality code from city name (simplified mapping)"""
        # This is a placeholder - in a real implementation, you'd have a proper mapping table
        # or use IBGE's locality API to find municipality codes by name

        # For Bahia state (example mappings)
        bahia_cities = {
            'Salvador': '2927408',
            'Feira de Santana': '2910800',
            'Vitória da Conquista': '2933307',
            'Camaçari': '2905701',
            'Itabuna': '2914802',
            'Juazeiro': '2918407',
            'Ilhéus': '2913606',
            'Lauro de Freitas': '2919207',
            'Jequié': '2918001',
            'Teixeira de Freitas': '2931350',
            'Eunápolis': '2910727',
            'Alagoinhas': '2900702',
            'Itapetinga': '2914703',
            'Porto Seguro': '2925303',
            'Simões Filho': '2930709',
            'Paulo Afonso': '2924009',
            'Valença': '2930501',
            'Barreiras': '2903201',
            'Candeias': '2906501',
            'Santo Antônio de Jesus': '2928703',
            'Conceição do Jacuípe': '2908203',
            'Serrinha': '2930501',
            'Cruz das Almas': '2909203',
            'Itaberaba': '2914703',
            'Rio Real': '2926600'
        }

        return bahia_cities.get(city_name)

    def get_socioeconomic_crime_analysis(self, indicator: str, year: int = None) -> Dict[str, Any]:
        """Analyze relationship between socioeconomic indicators and crime rates"""
        try:
            if not year:
                year = datetime.now().year - 1

            # Get all IBGE data for the year
            ibge_records = IbgeDemographicData.query.filter_by(year=year).all()

            analysis_data = []

            for record in ibge_records:
                # Get crime count for this municipality
                crime_count = db.session.query(func.count(Crime.id)).filter(
                    Crime.city == record.municipality_name,
                    extract('year', Crime.date_time) == year
                ).scalar() or 0

                # Calculate crime rate
                population = record.total_population or 0
                crime_rate = (crime_count / population * 1000) if population > 0 else 0

                # Get the socioeconomic indicator value
                indicator_value = getattr(record, indicator, None)

                if indicator_value is not None and population > 0:
                    analysis_data.append({
                        'municipality': record.municipality_name,
                        'population': population,
                        'crime_count': crime_count,
                        'crime_rate_per_1000': round(crime_rate, 2),
                        'indicator': indicator,
                        'indicator_value': indicator_value
                    })

            # Sort by indicator value for correlation analysis
            analysis_data.sort(key=lambda x: x['indicator_value'])

            return {
                'analysis': analysis_data,
                'indicator': indicator,
                'year': year,
                'total_municipalities': len(analysis_data)
            }

        except Exception as e:
            print(f"Error in socioeconomic crime analysis: {e}")
            return {'error': str(e)}