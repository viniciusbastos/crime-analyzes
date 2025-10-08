import pandas as pd
from app import create_app
from utils.geocoding import process_address_data
from models import db, Crime

def load_sample_data():
    app = create_app()
    with app.app_context():
        # Clear existing data
        Crime.query.delete()
        db.session.commit()
        print("Cleared existing data")

        # Load and process sample data
        df = pd.read_csv('data/sample_crime_data.csv')
        print(f"Loaded {len(df)} rows from sample data")

        count = 0
        for _, row in df.iterrows():
            try:
                # Convert row to dict for processing
                row_dict = row.to_dict()

                # For sample data, extract city directly from address column
                # Skip geocoding to avoid SSL issues
                city = row_dict.get('address', '').strip()
                if not city:
                    continue

                # Create crime data directly without geocoding
                crime_data = {
                    'crime_type': str(row_dict.get('crime_type', 'Unknown')),
                    'date_time': pd.to_datetime(row_dict['date_time'], format='%d-%m-%Y'),  # Keep as datetime object
                    'latitude': row_dict.get('latitude'),
                    'longitude': row_dict.get('longitude'),
                    'address': row_dict.get('address', ''),
                    'city': city,  # Use address as city for sample data
                    'severity': str(row_dict.get('severity', 'Medium')),
                    'description': row_dict.get('description', '')
                }

                crime = Crime(**crime_data)
                db.session.add(crime)
                count += 1
                if count % 10 == 0:
                    print(f"Processed {count} records...")
            except Exception as e:
                print(f"Error processing row {count}: {e}")
                continue

        db.session.commit()
        print(f"Successfully loaded {count} crime records")

if __name__ == '__main__':
    load_sample_data()