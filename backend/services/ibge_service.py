"""
IBGE SIDRA API service for demographic and socioeconomic data integration
"""
import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from models.models import db, IbgeDemographicData, IbgeDataCache
from services.cache_service import CacheManager
import logging

logger = logging.getLogger(__name__)

class IbgeService:
    """Service for interacting with IBGE SIDRA API"""

    BASE_URL = "https://api.sidra.ibge.gov.br"

    # Key SIDRA table codes for demographic and socioeconomic data
    TABLES = {
        'population': '1378',  # Population estimates
        'census_population': '1378',  # Census population data
        'income': '5938',  # Average household income
        'gini': '5938',  # Gini coefficient
        'education': '6318',  # Education indicators
        'health': '6318',  # Health indicators
        'poverty': '5938',  # Poverty indicators
        'housing': '6318',  # Housing conditions
        'gdp': '5938',  # GDP per capita
        'unemployment': '6318',  # Unemployment rates
    }

    # Variable codes for different indicators
    VARIABLES = {
        'total_population': '93',
        'urban_population': '94',
        'rural_population': '95',
        'male_population': '96',
        'female_population': '97',
        'age_0_14': '98',
        'age_15_64': '99',
        'age_65_plus': '100',
        'average_income': '5938',
        'gini_coefficient': '5939',
        'literacy_rate': '5940',
        'school_enrollment': '5941',
        'life_expectancy': '5942',
        'infant_mortality': '5943',
        'gdp_per_capita': '5944',
        'unemployment_rate': '5945',
        'households_water': '5946',
        'households_sewage': '5947',
        'poverty_rate': '5948',
    }

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Crime Analysis System/1.0',
            'Accept': 'application/json'
        })

    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict]:
        """Make a request to SIDRA API with error handling and rate limiting"""
        url = f"{self.BASE_URL}{endpoint}"

        # Check cache first
        cache_key = f"ibge_{endpoint}_{json.dumps(params, sort_keys=True) if params else ''}"
        cached_data = self._get_cached_data(cache_key)
        if cached_data:
            return cached_data

        try:
            # Rate limiting: 1 request per second
            time.sleep(1)

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Cache the response for 24 hours
            self._cache_data(cache_key, data, timedelta(hours=24))

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"IBGE API request failed: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse IBGE API response: {e}")
            return None

    def _get_cached_data(self, cache_key: str) -> Optional[Dict]:
        """Get data from cache if available and not expired"""
        try:
            cache_entry = IbgeDataCache.query.filter_by(cache_key=cache_key).first()
            if cache_entry and cache_entry.expires_at > datetime.utcnow():
                return json.loads(cache_entry.data)
            elif cache_entry:
                # Remove expired cache entry
                db.session.delete(cache_entry)
                db.session.commit()
        except Exception as e:
            logger.error(f"Error retrieving cached data: {e}")

        return None

    def _cache_data(self, cache_key: str, data: Dict, expires_in: timedelta):
        """Cache data with expiration"""
        try:
            expires_at = datetime.utcnow() + expires_in

            # Remove existing cache entry if it exists
            existing = IbgeDataCache.query.filter_by(cache_key=cache_key).first()
            if existing:
                db.session.delete(existing)

            # Add new cache entry
            cache_entry = IbgeDataCache(
                cache_key=cache_key,
                data=json.dumps(data),
                expires_at=expires_at
            )
            db.session.add(cache_entry)
            db.session.commit()

        except Exception as e:
            logger.error(f"Error caching data: {e}")

    def get_population_data(self, municipality_code: str, year: int = None) -> Optional[Dict]:
        """Get population data for a specific municipality"""
        if not year:
            year = datetime.now().year - 1  # Use last available year

        endpoint = f"/values/t/{self.TABLES['population']}/n6/{municipality_code}/v/{self.VARIABLES['total_population']}/p/{year}"

        data = self._make_request(endpoint)
        if not data:
            return None

        # Parse SIDRA response format
        result = {}
        for item in data:
            if 'V' in item and item['V']:  # Value field
                result['total_population'] = int(float(item['V']))
            if 'D1N' in item:  # Municipality name
                result['municipality_name'] = item['D1N']
            if 'D2N' in item:  # State name
                result['state_name'] = item['D2N']
            if 'D2C' in item:  # State code
                result['state_code'] = item['D2C']

        return result if result else None

    def get_demographic_data(self, municipality_code: str, year: int = None) -> Optional[Dict]:
        """Get comprehensive demographic data for a municipality"""
        if not year:
            year = datetime.now().year - 1

        # Get multiple variables in one request
        variables = [
            self.VARIABLES['total_population'],
            self.VARIABLES['urban_population'],
            self.VARIABLES['rural_population'],
            self.VARIABLES['male_population'],
            self.VARIABLES['female_population'],
            self.VARIABLES['age_0_14'],
            self.VARIABLES['age_15_64'],
            self.VARIABLES['age_65_plus']
        ]

        variables_str = ','.join(variables)
        endpoint = f"/values/t/{self.TABLES['population']}/n6/{municipality_code}/v/{variables_str}/p/{year}"

        data = self._make_request(endpoint)
        if not data:
            return None

        result = {
            'municipality_code': municipality_code,
            'year': year
        }

        # Parse the response
        for item in data:
            var_code = item.get('V', '')
            value = item.get('V', '')

            if not value:
                continue

            try:
                numeric_value = int(float(value))
            except (ValueError, TypeError):
                continue

            # Map variable codes to result fields
            if var_code == self.VARIABLES['total_population']:
                result['total_population'] = numeric_value
            elif var_code == self.VARIABLES['urban_population']:
                result['urban_population'] = numeric_value
            elif var_code == self.VARIABLES['rural_population']:
                result['rural_population'] = numeric_value
            elif var_code == self.VARIABLES['male_population']:
                result['male_population'] = numeric_value
            elif var_code == self.VARIABLES['female_population']:
                result['female_population'] = numeric_value
            elif var_code == self.VARIABLES['age_0_14']:
                result['population_0_14'] = numeric_value
            elif var_code == self.VARIABLES['age_15_64']:
                result['population_15_64'] = numeric_value
            elif var_code == self.VARIABLES['age_65_plus']:
                result['population_65_plus'] = numeric_value

            # Get location info from first valid item
            if 'D1N' in item and 'municipality_name' not in result:
                result['municipality_name'] = item['D1N']
            if 'D2N' in item and 'state_name' not in result:
                result['state_name'] = item['D2N']
            if 'D2C' in item and 'state_code' not in result:
                result['state_code'] = item['D2C']

        return result if len(result) > 2 else None  # Return if we have more than just code and year

    def get_socioeconomic_data(self, municipality_code: str, year: int = None) -> Optional[Dict]:
        """Get socioeconomic indicators for a municipality"""
        if not year:
            year = datetime.now().year - 1

        # Get socioeconomic variables
        variables = [
            self.VARIABLES['average_income'],
            self.VARIABLES['gini_coefficient'],
            self.VARIABLES['literacy_rate'],
            self.VARIABLES['school_enrollment'],
            self.VARIABLES['life_expectancy'],
            self.VARIABLES['infant_mortality'],
            self.VARIABLES['gdp_per_capita'],
            self.VARIABLES['unemployment_rate'],
            self.VARIABLES['households_water'],
            self.VARIABLES['households_sewage'],
            self.VARIABLES['poverty_rate']
        ]

        variables_str = ','.join(variables)
        endpoint = f"/values/t/{self.TABLES['income']}/n6/{municipality_code}/v/{variables_str}/p/{year}"

        data = self._make_request(endpoint)
        if not data:
            return None

        result = {
            'municipality_code': municipality_code,
            'year': year
        }

        # Parse the response
        for item in data:
            var_code = item.get('V', '')
            value = item.get('V', '')

            if not value:
                continue

            try:
                # Try integer first, then float
                if '.' in str(value):
                    numeric_value = float(value)
                else:
                    numeric_value = int(float(value))
            except (ValueError, TypeError):
                continue

            # Map variable codes to result fields
            if var_code == self.VARIABLES['average_income']:
                result['average_income'] = numeric_value
            elif var_code == self.VARIABLES['gini_coefficient']:
                result['gini_coefficient'] = numeric_value
            elif var_code == self.VARIABLES['literacy_rate']:
                result['literacy_rate'] = numeric_value
            elif var_code == self.VARIABLES['school_enrollment']:
                result['school_enrollment_rate'] = numeric_value
            elif var_code == self.VARIABLES['life_expectancy']:
                result['life_expectancy'] = numeric_value
            elif var_code == self.VARIABLES['infant_mortality']:
                result['infant_mortality_rate'] = numeric_value
            elif var_code == self.VARIABLES['gdp_per_capita']:
                result['gdp_per_capita'] = numeric_value
            elif var_code == self.VARIABLES['unemployment_rate']:
                result['unemployment_rate'] = numeric_value
            elif var_code == self.VARIABLES['households_water']:
                result['households_with_water'] = numeric_value
            elif var_code == self.VARIABLES['households_sewage']:
                result['households_with_sewage'] = numeric_value
            elif var_code == self.VARIABLES['poverty_rate']:
                result['poverty_rate'] = numeric_value

        return result if len(result) > 2 else None

    def save_demographic_data(self, data: Dict) -> bool:
        """Save demographic data to database"""
        try:
            # Check if data already exists
            existing = IbgeDemographicData.query.filter_by(
                municipality_code=data['municipality_code'],
                year=data['year']
            ).first()

            if existing:
                # Update existing record
                for key, value in data.items():
                    if hasattr(existing, key) and value is not None:
                        setattr(existing, key, value)
                existing.last_updated = datetime.utcnow()
            else:
                # Create new record
                record = IbgeDemographicData(
                    municipality_code=data['municipality_code'],
                    municipality_name=data.get('municipality_name', ''),
                    state_code=data.get('state_code', ''),
                    state_name=data.get('state_name', ''),
                    year=data['year'],
                    data_source=f"SIDRA-{self.TABLES['population']}",
                    **{k: v for k, v in data.items() if k not in ['municipality_code', 'municipality_name', 'state_code', 'state_name', 'year']}
                )
                db.session.add(record)

            db.session.commit()
            return True

        except Exception as e:
            logger.error(f"Error saving demographic data: {e}")
            db.session.rollback()
            return False

    def get_municipality_data(self, municipality_code: str, year: int = None) -> Optional[Dict]:
        """Get comprehensive data for a municipality from database or API"""
        if not year:
            year = datetime.now().year - 1

        # Try to get from database first
        db_record = IbgeDemographicData.query.filter_by(
            municipality_code=municipality_code,
            year=year
        ).first()

        if db_record:
            return {
                'municipality_code': db_record.municipality_code,
                'municipality_name': db_record.municipality_name,
                'state_code': db_record.state_code,
                'state_name': db_record.state_name,
                'year': db_record.year,
                'total_population': db_record.total_population,
                'urban_population': db_record.urban_population,
                'rural_population': db_record.rural_population,
                'population_0_14': db_record.population_0_14,
                'population_15_64': db_record.population_15_64,
                'population_65_plus': db_record.population_65_plus,
                'male_population': db_record.male_population,
                'female_population': db_record.female_population,
                'gini_coefficient': db_record.gini_coefficient,
                'average_income': db_record.average_income,
                'poverty_rate': db_record.poverty_rate,
                'literacy_rate': db_record.literacy_rate,
                'school_enrollment_rate': db_record.school_enrollment_rate,
                'life_expectancy': db_record.life_expectancy,
                'infant_mortality_rate': db_record.infant_mortality_rate,
                'gdp_per_capita': db_record.gdp_per_capita,
                'unemployment_rate': db_record.unemployment_rate,
                'households_with_water': db_record.households_with_water,
                'households_with_sewage': db_record.households_with_sewage,
                'data_source': db_record.data_source,
                'last_updated': db_record.last_updated.isoformat() if db_record.last_updated else None
            }

        # If not in database, fetch from API
        demo_data = self.get_demographic_data(municipality_code, year)
        socio_data = self.get_socioeconomic_data(municipality_code, year)

        if demo_data and socio_data:
            combined_data = {**demo_data, **socio_data}
            # Save to database for future use
            self.save_demographic_data(combined_data)
            return combined_data
        elif demo_data:
            self.save_demographic_data(demo_data)
            return demo_data

        return None

    def get_municipalities_by_state(self, state_code: str) -> List[Dict]:
        """Get list of municipalities for a state"""
        # This would typically come from IBGE's localities API
        # For now, return empty list - would need to implement municipality lookup
        return []

    def clear_expired_cache(self):
        """Clear expired cache entries"""
        try:
            expired_entries = IbgeDataCache.query.filter(
                IbgeDataCache.expires_at < datetime.utcnow()
            ).all()

            for entry in expired_entries:
                db.session.delete(entry)

            db.session.commit()
            logger.info(f"Cleared {len(expired_entries)} expired IBGE cache entries")

        except Exception as e:
            logger.error(f"Error clearing expired cache: {e}")
            db.session.rollback()


# Global service instance
ibge_service = IbgeService()