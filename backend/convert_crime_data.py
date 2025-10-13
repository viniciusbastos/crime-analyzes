import pandas as pd
from datetime import datetime

def convert_crime_data(input_file, output_file):
    """Convert Brazilian crime data CSV to format compatible with the database"""

    # Read the CSV file
    df = pd.read_csv(input_file, encoding='latin-1', sep=',')

    # Create a new dataframe for the converted data
    converted_data = []

    for _, row in df.iterrows():
        try:


            # Extract date and time
            date_str = row['DATA']  # DD-MM-YYYY
            time_str = str(row['HORA']).zfill(2)  # Ensure 2 digits

            # Parse date (DD-MM-YYYY to YYYY-MM-DD)
            date_parts = date_str.split('-')
            if len(date_parts) == 3:
                day, month, year = date_parts
                iso_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                date_time_str = f"{iso_date} {time_str}:00:00"
            else:
                continue  # Skip invalid dates

            # Build address
            address_parts = []
            if pd.notna(row.get('LOGRADOURO')) and row['LOGRADOURO'] != 'NAO INFORMADO' and row['LOGRADOURO'] != 'PENDENTE GEORREFERENCIAMENTO':
                address_parts.append(str(row['LOGRADOURO']))
            if pd.notna(row.get('BAIRRO')) and row['BAIRRO'] != 'NAO INFORMADO':
                address_parts.append(str(row['BAIRRO']))
            

            address = ', '.join(address_parts) if address_parts else None
            city = row['MUNICIPIO'] if pd.notna(row.get('MUNICIPIO')) else None
            # Determine severity based on crime type
            crime_type = str(row['DELITO'])
            if 'HOMICIDIO' in crime_type.upper():
                severity = 'High'
            elif 'ROUBO' in crime_type.upper() or 'FURTO' in crime_type.upper():
                severity = 'Medium'
            else:
                severity = 'Low'

            # Build description
            desc_parts = []
            if pd.notna(row.get('BO')):
                desc_parts.append(f"BO: {row['BO']}")
            if pd.notna(row.get('DELEGACIA')):
                desc_parts.append(f"Delegacia: {row['DELEGACIA']}")
            if pd.notna(row.get('SEXO')):
                desc_parts.append(f"Sexo: {row['SEXO']}")
            if pd.notna(row.get('IDADE')) and str(row['IDADE']).strip():
                desc_parts.append(f"Idade: {row['IDADE']}")

            description = '; '.join(desc_parts) if desc_parts else ''

            # Extract police organizational data
            # Try 2025 fields first, then 2024, then current
            unidade = None
            if pd.notna(row.get('OPM 2025')) and row['OPM 2025']:
                unidade = str(row['OPM 2025'])
            elif pd.notna(row.get('OPM 2024')) and row['OPM 2024']:
                unidade = str(row['OPM 2024'])

            aisp = None
            if pd.notna(row.get('AISP 2025')) and str(row['AISP 2025']).strip():
                try:
                    # Extract number from string like '26 - Candeias'
                    aisp_str = str(row['AISP 2025']).split(' - ')[0].strip()
                    aisp = int(float(aisp_str))
                except (ValueError, TypeError, IndexError):
                    pass
            elif pd.notna(row.get('AISP 2024')) and str(row['AISP 2024']).strip():
                try:
                    # Extract number from string like '26 - Candeias'
                    aisp_str = str(row['AISP 2024']).split(' - ')[0].strip()
                    aisp = int(float(aisp_str))
                except (ValueError, TypeError, IndexError):
                    pass
            elif pd.notna(row.get('AISP')) and str(row['AISP']).strip():
                try:
                    aisp = int(float(row['AISP']))
                except (ValueError, TypeError):
                    pass

            risp = None
            if pd.notna(row.get('RISP 2025')) and row['RISP 2025']:
                risp = str(row['RISP 2025'])
            elif pd.notna(row.get('RISP 2024')) and row['RISP 2024']:
                risp = str(row['RISP 2024'])
            elif pd.notna(row.get('RISP')) and row['RISP']:
                risp = str(row['RISP'])

            # Determine category_parent based on crime type
            category_parent = None
            crime_type_upper = crime_type.upper()
            if 'HOMICIDIO' in crime_type_upper or 'CVLI' in crime_type_upper:
                category_parent = 'CVLI'
            elif 'CVP' in crime_type_upper:
                category_parent = 'CVP'

            # Create the record
            record = {
                'crime_type': crime_type,
                'date_time': date_time_str,
                'latitude': row['LATITUDE'] if pd.notna(row['LATITUDE']) else None,
                'longitude': row['LONGITUDE'] if pd.notna(row['LONGITUDE']) else None,
                'address': address,
                'city': city,
                'severity': severity,
                'description': description,
                'category_parent': category_parent,
                'unidade': unidade,
                'aisp': aisp,
                'risp': risp
            }

            converted_data.append(record)

        except Exception as e:
            print(f"Error processing row: {e}")
            continue

    # Create dataframe from converted data
    result_df = pd.DataFrame(converted_data)

    # Remove duplicates if any
    result_df = result_df.drop_duplicates()

    # Save to CSV
    result_df.to_csv(output_file, index=False, encoding='utf-8')

    print(f"Converted {len(result_df)} records from {input_file} to {output_file}")
    print(f"Columns: {list(result_df.columns)}")
    print(f"Sample record: {result_df.iloc[0].to_dict() if len(result_df) > 0 else 'No records'}")

if __name__ == '__main__':
    input_file = 'data/listagemdevitimas2025_estado (2).csv'
    output_file = 'data/converted_crime_data_2025.csv'

    convert_crime_data(input_file, output_file)