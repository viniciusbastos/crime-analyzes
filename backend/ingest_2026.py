"""
Script to load the converted 2026 crime data into the database.
"""
import os
import sys
import pandas as pd

# Add the parent directory of 'backend' to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from backend.app import create_app
    from backend.models.models import db, Crime
    from backend.services.crime_service import CrimeDataService
except ImportError:
    # Fallback for running from within backend/
    if current_dir not in sys.path:
        sys.path.append(current_dir)
    from app import create_app
    from models.models import db, Crime
    from services.crime_service import CrimeDataService

def ingest_2026_data(converted_file='backend/data/converted_crime_data_2026.csv'):
    app = create_app()
    with app.app_context():
        if not os.path.exists(converted_file):
            print(f"Error: Converted file not found at {converted_file}")
            return

        print(f"Loading data from {converted_file}...")
        df = pd.read_csv(converted_file)
        converted_data = df.to_dict('records')
        
        print(f"Ingesting {len(converted_data)} records...")
        processed_count, duplicates_skipped = CrimeDataService.load_data_to_database(converted_data)
        
        print(f"Successfully ingested {processed_count} new records.")
        print(f"Skipped {duplicates_skipped} duplicates.")

if __name__ == '__main__':
    # Adjust path if running from root or backend
    path = 'backend/data/converted_crime_data_2026.csv'
    if not os.path.exists(path):
        path = 'data/converted_crime_data_2026.csv'
        
    ingest_2026_data(path)
