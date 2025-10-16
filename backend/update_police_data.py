#!/usr/bin/env python3
"""
Script to update existing crime records with police organizational data
extracted from the delegacia field in the description.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.models.models import db, Crime
from backend.services.crime_service import CrimeDataService

def update_existing_crime_records():
    """Update existing crime records that don't have police organizational data"""

    print("Starting update of existing crime records...")

    # Get all crimes that are missing police organizational data
    crimes_to_update = Crime.query.filter(
        db.or_(
            Crime.unidade.is_(None),
            Crime.aisp.is_(None),
            Crime.risp.is_(None)
        )
    ).all()

    print(f"Found {len(crimes_to_update)} records to potentially update")

    updated_count = 0

    for crime in crimes_to_update:
        # Extract delegacia from description
        description = crime.description or ""
        delegacia = None

        # Look for "Delegacia:" in the description
        if "Delegacia:" in description:
            # Extract the delegacia part
            delegacia_part = description.split("Delegacia:")[1].split(";")[0].strip()
            delegacia = delegacia_part

        if delegacia:
            # Parse police info from delegacia
            unidade, aisp, risp = CrimeDataService.parse_police_info_from_delegacia(
                delegacia, crime.unidade, crime.aisp, crime.risp
            )

            # Update the record if we found new information
            updated = False
            if unidade and not crime.unidade:
                crime.unidade = unidade
                updated = True
            if aisp is not None and crime.aisp is None:
                crime.aisp = aisp
                updated = True
            if risp and not crime.risp:
                crime.risp = risp
                updated = True

            if updated:
                updated_count += 1
                if updated_count % 100 == 0:
                    print(f"Updated {updated_count} records...")

    # Commit all changes
    db.session.commit()
    print(f"Successfully updated {updated_count} crime records with police organizational data")

if __name__ == "__main__":
    from backend.app import create_app

    app = create_app()
    with app.app_context():
        update_existing_crime_records()