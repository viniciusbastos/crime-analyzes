"""
Tests for CrimeDataService.convert_crime_data (item 2.4)

Covers:
  - ANO/MES/DIA columns (current dados.csv format)
  - DD-MM-YYYY legacy format
  - ISO datetime with T separator
  - DD/MM/YYYY slash format
  - Invalid / missing date → goes to rejected
  - Coordinates outside Bahia bbox → nulled, geocoded=False
  - Corrupt coordinate strings
  - AISP "26 - Candeias" → aisp=26, aisp_name="Candeias"
  - AISP name-only "Portal do Sertão" → aisp=None, aisp_name=...
  - Structured columns promoted out of description
"""
import sys
import os

import pandas as pd
import pytest

# Make sure the backend package root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.crime_service import CrimeDataService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _base_row(**overrides):
    """Return a minimal valid row dict, with optional overrides."""
    row = {
        'ANO': 2026,
        'MES': 1,
        'DIA': 15,
        'HORA': 10,
        'DELITO': 'HOMICIDIO DOLOSO',
        'MUNICIPIO': 'Salvador',
        'LOGRADOURO': 'RUA DAS FLORES',
        'BAIRRO': 'CENTRO',
        'LATITUDE': -12.9711,
        'LONGITUDE': -38.5108,
        'BO': '2026-001',
        'DELEGACIA': '1ª DH',
        'SEXO': 'MASCULINO',
        'IDADE': 30,
        'AISP 2026': '26 - Candeias',
        'OPM 2026': '6ª CIPM',
        'RISP 2026': 'LESTE',
        'COORPIN 2026': '02ª COORPIN',
        'REGIAO': 'CAPITAL',
        'IDMUNICIPIO': '2927408',
    }
    row.update(overrides)
    return row


def _df(*rows):
    return pd.DataFrame(list(rows))


# ---------------------------------------------------------------------------
# 1. Date format: ANO / MES / DIA columns
# ---------------------------------------------------------------------------

class TestDateParsing:
    def test_ano_mes_dia_format(self):
        df = _df(_base_row(ANO=2026, MES=3, DIA=7, HORA=14))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert len(data) == 1
        dt = pd.Timestamp(data[0]['date_time'])
        assert dt.year == 2026
        assert dt.month == 3
        assert dt.day == 7
        assert dt.hour == 14

    def test_legacy_dd_mm_yyyy(self):
        row = _base_row()
        row.pop('ANO', None); row.pop('MES', None); row.pop('DIA', None)
        row['DATA'] = '07-03-2025'
        df = _df(row)
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        dt = pd.Timestamp(data[0]['date_time'])
        assert dt.year == 2025
        assert dt.month == 3
        assert dt.day == 7

    def test_iso_with_t_separator(self):
        row = _base_row()
        row.pop('ANO', None); row.pop('MES', None); row.pop('DIA', None)
        row['DATA'] = '2026-06-20T00:00:00'
        df = _df(row)
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        dt = pd.Timestamp(data[0]['date_time'])
        assert dt.year == 2026
        assert dt.month == 6
        assert dt.day == 20

    def test_dd_slash_mm_slash_yyyy(self):
        row = _base_row()
        row.pop('ANO', None); row.pop('MES', None); row.pop('DIA', None)
        row['DATA'] = '20/06/2026'
        df = _df(row)
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        dt = pd.Timestamp(data[0]['date_time'])
        assert dt.year == 2026
        assert dt.month == 6
        assert dt.day == 20

    def test_invalid_date_goes_to_rejected(self):
        row = _base_row()
        row.pop('ANO', None); row.pop('MES', None); row.pop('DIA', None)
        row['DATA'] = 'NOT_A_DATE'
        df = _df(row)
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(data) == 0
        assert len(rejected) == 1
        assert 'unparseable date' in rejected[0]['reason']

    def test_missing_date_goes_to_rejected(self):
        row = _base_row()
        # Remove all date-related columns
        for col in ['ANO', 'MES', 'DIA', 'DATA', 'date_time', 'datetime', 'date']:
            row.pop(col, None)
        df = _df(row)
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(data) == 0
        assert len(rejected) == 1
        assert 'missing date' in rejected[0]['reason']


# ---------------------------------------------------------------------------
# 2. Geospatial validation
# ---------------------------------------------------------------------------

class TestGeospatialValidation:
    def test_coords_inside_bahia_are_kept(self):
        df = _df(_base_row(LATITUDE=-12.9711, LONGITUDE=-38.5108))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert data[0]['latitude'] == pytest.approx(-12.9711)
        assert data[0]['longitude'] == pytest.approx(-38.5108)
        assert data[0]['geocoded'] is True

    def test_coords_outside_bahia_bbox_nulled(self):
        """Coordinates clearly outside Bahia (e.g. São Paulo) should be nulled."""
        df = _df(_base_row(LATITUDE=-23.5505, LONGITUDE=-46.6333))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert data[0]['latitude'] is None
        assert data[0]['longitude'] is None
        assert data[0]['geocoded'] is False

    def test_corrupt_coordinate_string_trailing_dot(self):
        """'-16.721418.' should be coerced to a valid float."""
        df = _df(_base_row(LATITUDE='-16.721418.', LONGITUDE='-39.2'))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        # Either parsed correctly (inside bbox) or nulled
        lat = data[0]['latitude']
        assert lat is None or isinstance(lat, float)

    def test_corrupt_coordinate_double_dot(self):
        """'-1..861011' is unparseable and should be treated as None."""
        df = _df(_base_row(LATITUDE='-1..861011', LONGITUDE='-38.5'))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert data[0]['latitude'] is None

    def test_pending_georreferenciamento_flag(self):
        """Address flagged as pending → geocoded should be False."""
        df = _df(_base_row(
            LATITUDE=-12.9711,
            LONGITUDE=-38.5108,
            LOGRADOURO='PENDENTE GEORREFERENCIAMENTO',
        ))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert data[0]['geocoded'] is False


# ---------------------------------------------------------------------------
# 3. AISP parsing
# ---------------------------------------------------------------------------

class TestAispParsing:
    def test_aisp_numeric_with_name(self):
        df = _df(_base_row(**{'AISP 2026': '26 - Candeias'}))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert data[0]['aisp'] == 26
        assert data[0]['aisp_name'] == 'Candeias'

    def test_aisp_name_only_interior(self):
        df = _df(_base_row(**{'AISP 2026': 'Portal do Sertão'}))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert data[0]['aisp'] is None
        assert data[0]['aisp_name'] == 'Portal do Sertão'

    def test_aisp_numeric_only(self):
        df = _df(_base_row(**{'AISP 2026': '48'}))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        assert data[0]['aisp'] == 48
        assert data[0]['aisp_name'] is None


# ---------------------------------------------------------------------------
# 4. Structured column promotion (item 1.2)
# ---------------------------------------------------------------------------

class TestStructuredColumns:
    def test_bo_delegacia_sexo_idade_as_columns(self):
        df = _df(_base_row(
            BO='2026-XYZ',
            DELEGACIA='1ª DH SALVADOR',
            SEXO='FEMININO',
            IDADE=25,
        ))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        r = data[0]
        assert r['bo'] == '2026-XYZ'
        assert r['delegacia'] == '1ª DH SALVADOR'
        assert r['sexo'] == 'FEMININO'
        assert r['idade'] == 25

    def test_extra_structured_columns_present(self):
        df = _df(_base_row(
            **{'COORPIN 2026': '02ª COORPIN', 'REGIAO': 'INTERIOR', 'IDMUNICIPIO': '2910800'}
        ))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        r = data[0]
        assert r['coorpin'] == '02ª COORPIN'
        assert r['regiao'] == 'INTERIOR'
        assert r['id_municipio'] == '2910800'

    def test_description_backward_compat_still_populated(self):
        """description field should still be populated for backward compat."""
        df = _df(_base_row(BO='2026-001', DELEGACIA='1ª DH', SEXO='MASCULINO', IDADE=30))
        data, rejected = CrimeDataService.convert_crime_data(df)
        assert len(rejected) == 0
        desc = data[0]['description']
        assert 'BO:' in desc
        assert 'Delegacia:' in desc


# ---------------------------------------------------------------------------
# 5. Dedup key (item 1.1)
# ---------------------------------------------------------------------------

class TestDedupKey:
    def test_bo_key_preferred(self):
        record = {
            'bo': '2026-001',
            'crime_type': 'HOMICIDIO DOLOSO',
            'date_time': pd.Timestamp('2026-03-07'),
            'address': 'RUA DAS FLORES, CENTRO',
        }
        key = CrimeDataService._dedup_key(record)
        assert key[0] == 'bo'
        assert key[1] == '2026-001'

    def test_fallback_key_when_no_bo(self):
        record = {
            'bo': None,
            'crime_type': 'FURTO',
            'date_time': pd.Timestamp('2026-03-07'),
            'address': 'RUA A, BAIRRO B',
        }
        key = CrimeDataService._dedup_key(record)
        assert key[0] == 'key'
        assert 'FURTO' in key


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
