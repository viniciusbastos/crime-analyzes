import pandas as pd
from app import create_app
from utils.geocoding import process_address_data
from models import db, Crime
from services.crime_service import CrimeDataService

def load_converted_data():
    app = create_app()
    with app.app_context():
        # Check if data already exists
        if Crime.query.first():
            print("Data already exists in database, skipping load")
            return

        # Load and process converted data that includes police organizational fields
        df = pd.read_csv('data/converted_crime_data_2025.csv')
        df = df.head(50)  # Limit to 50 rows for sample data
        print(f"Loaded {len(df)} rows from converted data (limited to 50 for sample)")

        count = 0
        for _, row in df.iterrows():
            try:
                # Convert row to dict and process
                row_dict = row.to_dict()

                # Process address data (geocoding)
                crime_data = process_address_data(row_dict)
                if crime_data:
                    crime = Crime(**crime_data)
                    db.session.add(crime)
                    count += 1
                    if count % 100 == 0:
                        print(f"Processed {count} records...")
                        db.session.commit()  # Commit in batches
            except Exception as e:
                print(f"Error processing row {count}: {e}")
                continue

        db.session.commit()
        print(f"Successfully loaded {count} crime records with police organizational data")

if __name__ == '__main__':
    load_converted_data()