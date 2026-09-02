"""
Crime data processing services
"""
import os
import re
import pandas as pd
from datetime import datetime
from models.models import db, Crime
from utils import process_address_data

# Bounding box of Bahia state (with a small margin). Coordinates outside this
# box are data-entry errors, not real points.
BAHIA_BBOX = {'lat_min': -18.5, 'lat_max': -8.3, 'lon_min': -46.8, 'lon_max': -37.2}

# Values that mean "no real address / not georeferenced yet"
_NON_ADDRESS_TOKENS = {'NAO INFORMADO', 'PENDENTE GEORREFERENCIAMENTO', 'NÃO INFORMADO', ''}


class CrimeDataService:
    """Service for processing and managing crime data"""

    @staticmethod
    def _coords_in_bahia(lat, lon):
        """True when (lat, lon) are both present and inside the Bahia bounding box."""
        if lat is None or lon is None:
            return False
        return (
            BAHIA_BBOX['lat_min'] <= lat <= BAHIA_BBOX['lat_max']
            and BAHIA_BBOX['lon_min'] <= lon <= BAHIA_BBOX['lon_max']
        )

    @staticmethod
    def _parse_int(value):
        """Coerce a possibly messy value to int, or None."""
        if value is None or (not isinstance(value, str) and pd.isna(value)):
            return None
        s = str(value).strip()
        if not s:
            return None
        try:
            return int(float(s))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _clean_str(value):
        """Return a trimmed string, or None for blanks / NaN / placeholder tokens."""
        if value is None or (not isinstance(value, str) and pd.isna(value)):
            return None
        s = str(value).strip()
        if not s or s.upper() in _NON_ADDRESS_TOKENS:
            return None
        return s

    @staticmethod
    def process_uploaded_file(filepath, filename):
        """Process uploaded CSV file with encoding detection and data conversion"""
        # Try different encodings for CSV files (Brazilian data often uses Latin-1)
        encodings_to_try = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
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
    def _to_float(value):
        """Coerce a possibly messy coordinate string to float, or None."""
        if value is None or (not isinstance(value, str) and pd.isna(value)):
            return None
        s = str(value).strip()
        if not s:
            return None
        try:
            return float(s)
        except ValueError:
            try:
                return float(s.rstrip('.'))
            except ValueError:
                return None

    @staticmethod
    def convert_crime_data(df, **_ignored):
        """Convert raw crime data to standardized format.

        Returns ``(converted_data, rejected)`` where ``rejected`` is a list of
        ``{'row': <int>, 'reason': <str>}`` for every input row that could not be
        converted, so callers can surface *why* records were dropped instead of
        silently reporting success.
        """
        converted_data = []
        rejected = []

        for idx, row in df.iterrows():
            try:
                row_no = int(idx) if isinstance(idx, (int, float)) else idx
                # Extract hour (HORA is a bare 0-23 integer in the current dataset)
                time_raw = row.get('HORA')
                if time_raw is None or (not isinstance(time_raw, str) and pd.isna(time_raw)):
                    time_raw = row.get('time') or 0
                try:
                    hour = int(float(str(time_raw).strip() or 0))
                except (ValueError, TypeError):
                    hour = 0
                if not 0 <= hour <= 23:
                    hour = 0
                time_str = f"{hour:02d}"

                # Parse date. Prefer the discrete ANO/MES/DIA columns when present -
                # in the current dataset the DATA column is unreliable (day/month swapped).
                date_time = None
                ano, mes, dia = row.get('ANO'), row.get('MES'), row.get('DIA')
                if pd.notna(ano) and pd.notna(mes) and pd.notna(dia):
                    try:
                        date_time = pd.to_datetime(
                            f"{int(float(ano)):04d}-{int(float(mes)):02d}-{int(float(dia)):02d} {time_str}:00:00"
                        )
                    except (ValueError, TypeError):
                        date_time = None

                if date_time is None:
                    date_str = row.get('DATA') or row.get('date_time') or row.get('datetime') or row.get('date')
                    if not date_str or (not isinstance(date_str, str) and pd.isna(date_str)):
                        rejected.append({'row': row_no, 'reason': 'missing date'})
                        continue
                    date_str = str(date_str).strip()
                    try:
                        # ISO datetime string (e.g. "2026-10-02T00:00:00") - carries its own time
                        if 'T' in date_str or (len(date_str) > 10 and ':' in date_str):
                            date_time = pd.to_datetime(date_str)
                        # DD/MM/YYYY format (Brazilian date format)
                        elif '/' in date_str and len(date_str.split('/')) == 3:
                            day, month, year = date_str.split('/')
                            date_time = pd.to_datetime(f"{year}-{month.zfill(2)}-{day.zfill(2)} {time_str}:00:00")
                        elif '-' in date_str and len(date_str.split('-')) == 3:
                            parts = date_str.split('-')
                            if len(parts[0]) == 2:  # DD-MM-YYYY format
                                day, month, year = parts
                                date_time = pd.to_datetime(f"{year}-{month.zfill(2)}-{day.zfill(2)} {time_str}:00:00")
                            else:  # YYYY-MM-DD or other format
                                date_time = pd.to_datetime(f"{date_str} {time_str}:00:00")
                        else:
                            date_time = pd.to_datetime(f"{date_str} {time_str}", dayfirst=True)
                    except Exception:
                        rejected.append({'row': row_no, 'reason': f'unparseable date {date_str!r}'})
                        continue

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

                # Victim / occurrence details - kept as structured fields *and*
                # mirrored into `description` for backward compatibility.
                bo = CrimeDataService._clean_str(row.get('BO'))
                delegacia = CrimeDataService._clean_str(row.get('DELEGACIA') or row.get('police_station'))
                sexo = CrimeDataService._clean_str(row.get('SEXO') or row.get('gender'))
                idade = CrimeDataService._parse_int(row.get('IDADE') or row.get('age'))
                coorpin = CrimeDataService._clean_str(
                    row.get('COORPIN 2026') or row.get('COORPIN') or row.get('coorpin')
                )
                regiao = CrimeDataService._clean_str(row.get('REGIAO') or row.get('regiao'))
                id_municipio = CrimeDataService._clean_str(
                    row.get('IDMUNICIPIO') or row.get('ID_MUNICIPIO') or row.get('id_municipio')
                )

                desc_parts = []
                if bo:
                    desc_parts.append(f"BO: {bo}")
                if delegacia:
                    desc_parts.append(f"Delegacia: {delegacia}")
                if sexo:
                    desc_parts.append(f"Sexo: {sexo}")
                if idade is not None:
                    desc_parts.append(f"Idade: {idade}")
                description = '; '.join(desc_parts) if desc_parts else ''

                # Extract police organizational data
                # Try to find the latest year-specific fields (e.g., OPM 2026, OPM 2025, etc.)
                unidade = None
                for year in range(2026, 2023, -1):
                    col = f'OPM {year}'
                    if col in row and pd.notna(row[col]) and str(row[col]).strip():
                        unidade = str(row[col]).strip()
                        break
                if not unidade:
                    unidade = str(row.get('OPM') or '').strip()
                unidade = unidade if unidade else None

                # AISP may be numbered ("26 - Candeias") in the capital / RMS or a
                # bare region name ("Portal do Sertão") in the interior. Keep both:
                # `aisp` (int) when a number is present, `aisp_name` (str) always.
                aisp = None
                aisp_name = None
                aisp_raw = None
                for year in range(2026, 2023, -1):
                    col = f'AISP {year}'
                    if col in row and pd.notna(row[col]) and str(row[col]).strip():
                        aisp_raw = str(row[col]).strip()
                        break
                if aisp_raw is None and pd.notna(row.get('AISP')):
                    aisp_raw = str(row.get('AISP')).strip()

                if aisp_raw:
                    head, _, tail = aisp_raw.partition(' - ')
                    try:
                        aisp = int(float(head.strip()))
                        aisp_name = tail.strip() or None
                    except (ValueError, TypeError):
                        aisp = None
                        aisp_name = aisp_raw

                risp = None
                for year in range(2026, 2023, -1):
                    col = f'RISP {year}'
                    if col in row and pd.notna(row[col]) and str(row[col]).strip():
                        risp = str(row[col]).strip()
                        break
                if not risp:
                    risp = str(row.get('RISP') or '').strip()
                risp = risp if risp else None

                # If police data not found in columns, try to extract from delegacia/description
                if not unidade or not aisp or not risp:
                    delegacia = str(row.get('DELEGACIA') or '').strip()
                    if delegacia:
                        # Parse delegacia field like "2023 - 02ª COORPIN (AISP - Rio Real)"
                        unidade, aisp, risp = CrimeDataService.parse_police_info_from_delegacia(delegacia, unidade, aisp, risp)

                # Coordinates + geocoded flag.
                latitude = CrimeDataService._to_float(row.get('LATITUDE') or row.get('latitude') or row.get('lat'))
                longitude = CrimeDataService._to_float(row.get('LONGITUDE') or row.get('longitude') or row.get('lng'))
                logradouro_raw = str(row.get('LOGRADOURO') or '').strip().upper()
                if CrimeDataService._coords_in_bahia(latitude, longitude):
                    geocoded = logradouro_raw not in _NON_ADDRESS_TOKENS
                else:
                    # Outside the state bounding box -> data-entry error, not a real point.
                    latitude, longitude = None, None
                    geocoded = False

                # Create the record
                record = {
                    'crime_type': crime_type,
                    'date_time': date_time.isoformat(),
                    'latitude': latitude,
                    'longitude': longitude,
                    'geocoded': geocoded,
                    'address': address,
                    'city': city,
                    'severity': severity,
                    'description': description,
                    'category_parent': category_parent,
                    'bo': bo,
                    'delegacia': delegacia,
                    'sexo': sexo,
                    'idade': idade,
                    'coorpin': coorpin,
                    'regiao': regiao,
                    'id_municipio': id_municipio,
                    'unidade': unidade,
                    'aisp': aisp,
                    'aisp_name': aisp_name,
                    'risp': risp
                }

                converted_data.append(record)

            except Exception as e:
                print(f"Error processing row: {e}")
                rejected.append({'row': locals().get('row_no', -1), 'reason': f'{type(e).__name__}: {e}'})
                continue

        return converted_data, rejected

    @staticmethod
    def _data_dir():
        """Absolute path to the data directory, independent of the process CWD."""
        try:
            from flask import current_app
            configured = current_app.config.get('DATA_DIR')
            if configured:
                return configured
        except Exception:
            pass
        from config.config import DATA_DIR
        return DATA_DIR

    @staticmethod
    def save_converted_data(converted_data, filename):
        """Save converted data to CSV file"""
        if not converted_data:
            return None

        result_df = pd.DataFrame(converted_data)
        # Remove duplicates if any
        result_df = result_df.drop_duplicates()
        data_dir = CrimeDataService._data_dir()
        os.makedirs(data_dir, exist_ok=True)
        converted_filepath = os.path.join(data_dir, f'converted_{filename}')
        result_df.to_csv(converted_filepath, index=False, encoding='utf-8')
        return converted_filepath

    @staticmethod
    def _dedup_key(crime_data):
        """Return the identity tuple used to detect an already-loaded record.

        Prefer the Boletim de Ocorrência number (the natural key); fall back to
        (crime_type, date_time, address) when the BO is absent. The date is
        normalised to the day so a re-uploaded file with a different time-of-day
        placeholder still matches.
        """
        bo = (crime_data.get('bo') or '').strip()
        dt = crime_data.get('date_time')
        day = dt.date().isoformat() if hasattr(dt, 'date') else str(dt)[:10]
        if bo:
            return ('bo', bo, crime_data.get('crime_type'), day)
        return ('key', crime_data.get('crime_type'), day, crime_data.get('address'))

    @staticmethod
    def load_data_to_database(converted_data):
        """Load converted data into the database, skipping duplicates.

        Returns ``(processed_count, duplicates_skipped, errors)`` where ``errors``
        is a list of ``{'row': <int>, 'reason': <str>}``.
        """
        processed_count = 0
        duplicates_skipped = 0
        errors = []

        # Pre-load the identity keys of everything already in the table so the
        # per-row work is a set lookup instead of a SELECT (was N+1).
        existing_keys = set()
        for bo, ctype, dt, addr in db.session.query(
            Crime.bo, Crime.crime_type, Crime.date_time, Crime.address
        ).all():
            day = dt.date().isoformat() if hasattr(dt, 'date') else str(dt)[:10]
            if bo and bo.strip():
                existing_keys.add(('bo', bo.strip(), ctype, day))
            else:
                existing_keys.add(('key', ctype, day, addr))

        seen_in_batch = set()
        pending = []
        for i, row in enumerate(converted_data):
            try:
                crime_data = process_address_data(row)
                if not crime_data:
                    errors.append({'row': i, 'reason': 'failed validation (bad date or coordinates)'})
                    continue
                # process_address_data only forwards a subset of keys; re-attach
                # the structured columns it does not know about.
                for extra in ('geocoded', 'bo', 'delegacia', 'sexo', 'idade',
                              'coorpin', 'regiao', 'id_municipio', 'aisp_name'):
                    if extra in row:
                        crime_data[extra] = row[extra]

                key = CrimeDataService._dedup_key(crime_data)
                if key in existing_keys or key in seen_in_batch:
                    duplicates_skipped += 1
                    continue
                seen_in_batch.add(key)
                pending.append(crime_data)
            except Exception as e:
                print(f"Error processing converted row: {e}")
                errors.append({'row': i, 'reason': f'{type(e).__name__}: {e}'})
                continue

        if pending:
            db.session.bulk_insert_mappings(Crime, pending)
            db.session.commit()
            processed_count = len(pending)

        print(f"Processed {processed_count} new records, skipped {duplicates_skipped} duplicates, {len(errors)} errors")
        return processed_count, duplicates_skipped, errors

    @staticmethod
    def parse_police_info_from_delegacia(delegacia, current_unidade, current_aisp, current_risp):
        """Parse police organizational information from delegacia field"""
        unidade = current_unidade
        aisp = current_aisp
        risp = current_risp

        if not delegacia:
            return unidade, aisp, risp

        # Clean up the delegacia string
        delegacia = delegacia.strip()

        # Extract unidade (police unit) - look for patterns like "02ª COORPIN"
        import re

        # Pattern for unidade like "02ª COORPIN", "6ª CIPM", etc.
        unidade_match = re.search(r'(\d+ª\s+[A-Z]+)', delegacia)
        if unidade_match and not unidade:
            unidade = unidade_match.group(1).strip()

        # Extract AISP information - look for "(AISP - City)" pattern
        aisp_match = re.search(r'\(AISP\s*-\s*([^)]+)\)', delegacia, re.IGNORECASE)
        if aisp_match and not aisp:
            aisp_city = aisp_match.group(1).strip()

            # Map city names to AISP numbers (Bahia state mapping)
            aisp_mapping = {
                'Rio Real': 48,
                'Itapicuru': 48,
                'Crisopolis': 48,
                'Acajutiba': 48,
                'Apora': 48,
                'Olindina': 48,
                # Add more mappings as needed
            }

            if aisp_city in aisp_mapping:
                aisp = aisp_mapping[aisp_city]

        # For RISP, we can determine based on region
        # Bahia is divided into RISPs (Regiões Integradas de Segurança Pública)
        if not risp:
            # Simple mapping based on cities - this would need to be expanded
            risp_mapping = {
                'Rio Real': 'LESTE',
                'Itapicuru': 'LESTE',
                'Crisopolis': 'LESTE',
                'Acajutiba': 'LESTE',
                'Apora': 'LESTE',
                'Olindina': 'LESTE',
            }

            # Try to extract city from delegacia or use known mapping
            city_match = re.search(r'\(AISP\s*-\s*([^)]+)\)', delegacia, re.IGNORECASE)
            if city_match:
                city = city_match.group(1).strip()
                if city in risp_mapping:
                    risp = risp_mapping[city]

        return unidade, aisp, risp