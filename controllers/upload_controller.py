"""
Upload controller for handling file upload operations
"""
import os
from flask import request, jsonify
from werkzeug.utils import secure_filename
from services.crime_service import CrimeDataService


class UploadController:
    """Controller for handling file upload operations"""

    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv', 'xlsx', 'xls'}

    @staticmethod
    def upload_crime_data():
        """Handle crime data file upload"""
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and UploadController.allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join('data', filename)
            file.save(filepath)

            try:
                # Process the uploaded file
                df = CrimeDataService.process_uploaded_file(filepath, filename)

                # Convert data - skip OPM filtering for sample data
                if 'sample_crime_data.csv' in filename:
                    # For sample data, don't filter by OPM
                    converted_data = CrimeDataService.convert_crime_data(df, filter_opm=None)
                    filter_message = "sample data (all records)"
                else:
                    # For real data, filter by OPM
                    converted_data = CrimeDataService.convert_crime_data(df, filter_opm='6ª CIPM - Rio Real')
                    filter_message = "6ª CIPM - Rio Real"

                if converted_data:
                    # Save converted data to CSV
                    converted_filepath = CrimeDataService.save_converted_data(converted_data, filename)

                    # Load data into database
                    processed_count = CrimeDataService.load_data_to_database(converted_data)

                    return jsonify({
                        'message': f'Successfully processed and loaded {processed_count} crime records from {filter_message}',
                        'converted_file': f'converted_{filename}',
                        'records_processed': len(converted_data),
                        'records_loaded': processed_count
                    }), 200
                else:
                    return jsonify({'error': f'No valid records found for {filter_message}'}), 400

            except Exception as e:
                return jsonify({'error': f'Error processing file: {str(e)}'}), 500
        else:
            return jsonify({'error': 'Invalid file type. Only CSV, XLSX, and XLS files are allowed'}), 400