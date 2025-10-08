"""
Crime data processing services
"""
import os
import pandas as pd
from datetime import datetime
from models.models import db, Crime
from utils import process_address_data


class CrimeDataService:
    """Service for processing and managing crime data"""

    @staticmethod
    def process_uploaded_file(filepath, filename):
        """Process uploaded CSV file with encoding detection and data conversion"""
        # Try different encodings for CSV files (Brazilian data often uses Latin-1)
        encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        df = None
        for encoding in encodings_to_try:
            try:
                df = pd.read_csv(filepath, encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        if df is None:
            raise UnicodeDecodeError("Could not decode file with any of the attempted encodings")

        return df

    @staticmethod
    def convert_crime_data(df, filter_opm=None):
        """Convert raw crime data to standardized format"""
        converted_data = []

        for _, row in df.iterrows():
            try:
                # Apply OPM filter if specified
                if filter_opm:
                    opm_2025 = str(row.get('OPM 2024', ''))
                    if opm_2025 != filter_opm:
                        continue  # Skip records not matching the filter

                # Extract date and time
                date_str = row.get('DATA') or row.get('date_time') or row.get('datetime') or row.get('date')
                time_str = str(row.get('HORA') or row.get('time') or '00').zfill(2)

                # Parse date
                if date_str:
                    try:
                        # Handle DD-MM-YYYY format
                        if '-' in str(date_str) and len(str(date_str).split('-')) == 3:
                            parts = str(date_str).split('-')
                            if len(parts[0]) == 2:  # DD-MM-YYYY format
                                day, month, year = parts
                                date_time = pd.to_datetime(f"{year}-{month.zfill(2)}-{day.zfill(2)} {time_str}:00:00")
                            else:  # Assume YYYY-MM-DD or other format
                                date_time = pd.to_datetime(f"{date_str} {time_str}:00:00")
                        else:
                            date_time = pd.to_datetime(f"{date_str} {time_str}:00:00")
                    except:
                        continue  # Skip invalid dates
                else:
                    continue  # Missing date

                # Build address
                address_parts = []
                logradouro = row.get('LOGRADOURO') or row.get('address') or row.get('location')
                bairro = row.get('BAIRRO') or row.get('neighborhood')

                if pd.notna(logradouro) and str(logradouro).upper() not in ['NAO INFORMADO', 'PENDENTE GEORREFERENCIAMENTO']:
                    address_parts.append(str(logradouro))
                if pd.notna(bairro) and str(bairro).upper() != 'NAO INFORMADO':
                    address_parts.append(str(bairro))
                

                address = ', '.join(address_parts) if address_parts else None
                city = row.get('MUNICIPIO') or row.get('city')
                # Determine severity based on crime type
                crime_type = str(row.get('DELITO') or row.get('crime_type') or row.get('type') or 'Unknown')
                if 'HOMICIDIO' in crime_type.upper():
                    severity = 'High'
                elif 'ROUBO' in crime_type.upper() or 'FURTO' in crime_type.upper():
                    severity = 'Medium'
                else:
                    severity = 'Low'

                # Determine category parent based on crime type
                crime_upper = crime_type.upper()
                if crime_upper in ["HOMICIDIO DOLOSO", "FEMINICIDIO", "ROUBO COM RESULTADO MORTE - (LATROCINIO)", "LESAO CORPORAL SEGUIDA DE MORTE"]:
                    category_parent = "CVLI"
                elif "FURTO" in crime_upper or "ROUBO" in crime_upper:
                    category_parent = "CVP"
                else:
                    category_parent = None

                # Build description
                desc_parts = []
                bo = row.get('BO')
                delegacia = row.get('DELEGACIA') or row.get('police_station')
                sexo = row.get('SEXO') or row.get('gender')
                idade = row.get('IDADE') or row.get('age')

                if pd.notna(bo):
                    desc_parts.append(f"BO: {bo}")
                if pd.notna(delegacia):
                    desc_parts.append(f"Delegacia: {delegacia}")
                if pd.notna(sexo):
                    desc_parts.append(f"Sexo: {sexo}")
                if pd.notna(idade) and str(idade).strip():
                    desc_parts.append(f"Idade: {idade}")

                description = '; '.join(desc_parts) if desc_parts else ''

                # Create the record
                record = {
                    'crime_type': crime_type,
                    'date_time': date_time.isoformat(),
                    'latitude': row.get('LATITUDE') if pd.notna(row.get('LATITUDE')) else None,
                    'longitude': row.get('LONGITUDE') if pd.notna(row.get('LONGITUDE')) else None,
                    'address': address,
                    'city': city,
                    'severity': severity,
                    'description': description,
                    'category_parent': category_parent
                }

                converted_data.append(record)

            except Exception as e:
                print(f"Error processing row: {e}")
                continue

        return converted_data

    @staticmethod
    def save_converted_data(converted_data, filename):
        """Save converted data to CSV file"""
        if not converted_data:
            return None

        result_df = pd.DataFrame(converted_data)
        # Remove duplicates if any
        result_df = result_df.drop_duplicates()
        converted_filepath = os.path.join('data', f'converted_{filename}')
        result_df.to_csv(converted_filepath, index=False, encoding='utf-8')
        return converted_filepath

    @staticmethod
    def load_data_to_database(converted_data):
        """Load converted data into the database, skipping duplicates"""
        processed_count = 0
        duplicates_skipped = 0

        for row in converted_data:
            try:
                crime_data = process_address_data(row)
                if crime_data:
                    # Check for existing crime with same key data
                    existing_crime = Crime.query.filter_by(
                        crime_type=crime_data.get('crime_type'),
                        date_time=crime_data.get('date_time'),
                        address=crime_data.get('address')
                    ).first()

                    if existing_crime:
                        duplicates_skipped += 1
                        continue  # Skip duplicate

                    crime = Crime(**crime_data)
                    db.session.add(crime)
                    processed_count += 1
            except Exception as e:
                print(f"Error processing converted row: {e}")
                continue

        db.session.commit()
        print(f"Processed {processed_count} new records, skipped {duplicates_skipped} duplicates")
        return processed_count, duplicates_skipped