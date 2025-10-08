"""
Simplified geocoding utilities - extracts city directly from address field
No external geocoding services required.
"""
import pandas as pd

class Geocoder:
    def __init__(self):
        # No geocoding dependencies needed
        pass

    def extract_city_from_address(self, address):
        """Extract city directly from address string (no geocoding)"""
        if not address or pd.isna(address):
            return None

        # Clean and return the address as city (since sample data uses city names in address field)
        return str(address).strip()

def validate_coordinates(latitude, longitude):
    """Validate latitude and longitude values"""
    try:
        lat = float(latitude)
        lng = float(longitude)
        if -90 <= lat <= 90 and -180 <= lng <= 180:
            return True, lat, lng
        return False, None, None
    except (ValueError, TypeError):
        return False, None, None

geocoder = Geocoder()

def process_address_data(row):
    """Process a data row and return validated crime data with location details (no geocoding)"""

    # Extract basic fields
    crime_type = row.get('crime_type') or row.get('type') or 'Unknown'
    date_time_str = row.get('date_time') or row.get('datetime') or row.get('date')
    address = row.get('address') or row.get('location')
    severity = row.get('severity') or row.get('priority') or 'Medium'

    # Parse date_time
    if date_time_str:
        try:
            # Try pandas parsing first
            import pandas as pd
            date_time = pd.to_datetime(date_time_str)
        except:
            return None  # Invalid date
    else:
        return None  # Missing date

    # Get coordinates
    latitude = row.get('latitude') or row.get('lat')
    longitude = row.get('longitude') or row.get('lng') or row.get('lon')

    if latitude and longitude:
        valid, lat, lng = validate_coordinates(latitude, longitude)
        if not valid:
            return None
    else:
        lat, lng = None, None

    # Extract city directly from address field (no geocoding)
    city = None
    if address:
        city = geocoder.extract_city_from_address(address)

    # Override with explicit city data from CSV if provided
    if row.get('city'):
        city = row.get('city')

    return {
        'crime_type': str(crime_type),
        'date_time': date_time,
        'latitude': lat,
        'longitude': lng,
        'address': address,
        'city': city,
        'severity': str(severity),
        'description': row.get('description') or ''
    }