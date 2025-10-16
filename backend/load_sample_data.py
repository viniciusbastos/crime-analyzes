import pandas as pd
from backend.app import create_app
from backend.utils.geocoding import process_address_data
from backend.models import db, Crime
from backend.services.crime_service import CrimeDataService

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

        # Use CrimeDataService to convert data (this will apply category_parent logic)
        converted_data = CrimeDataService.convert_crime_data(df, filter_opm=None)

        count = 0
        for row in converted_data:
            try:
                crime_data = process_address_data(row)
                if crime_data:
                    crime = Crime(**crime_data)
                    db.session.add(crime)
                    count += 1
                    if count % 10 == 0:
                        print(f"Processed {count} records...")
            except Exception as e:
                print(f"Error processing converted row {count}: {e}")
                continue

        db.session.commit()
        print(f"Successfully loaded {count} crime records")

if __name__ == '__main__':
    load_sample_data()