"""
Upload controller for handling file upload operations
"""
import os
from flask import request, jsonify
from werkzeug.utils import secure_filename
from services.crime_service import CrimeDataService
from models.models import db, UploadLog


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

                # Convert data - process all records without OPM filtering
                converted_data = CrimeDataService.convert_crime_data(df)
                filter_message = "all records"

                if converted_data:
                    # Save converted data to CSV
                    converted_filepath = CrimeDataService.save_converted_data(converted_data, filename)

                    # Load data into database
                    processed_count, duplicates_skipped = CrimeDataService.load_data_to_database(converted_data)

                    # Clear cache immediately after successful database update
                    try:
                        from services.cache_service import invalidate_related_cache, CacheManager
                        print("Clearing cache after database update...")
                        invalidate_related_cache(['*'])  # Clear all cache
                        CacheManager.clear_all_cache()
                        print("Cache cleared successfully")
                    except Exception as e:
                        print(f"Warning: Cache clearing failed: {str(e)}")

                    message = f'Successfully processed and loaded {processed_count} crime records from {filter_message}'
                    if duplicates_skipped > 0:
                        message += f' ({duplicates_skipped} duplicates discarded)'

                    # Record the upload in the database
                    upload_log = UploadLog(
                        filename=filename,
                        records_processed=len(converted_data),
                        records_loaded=processed_count,
                        duplicates_skipped=duplicates_skipped,
                        status='success',
                        message=message
                    )
                    db.session.add(upload_log)
                    db.session.commit()

                    return jsonify({
                        'message': message,
                        'converted_file': f'converted_{filename}',
                        'records_processed': len(converted_data),
                        'records_loaded': processed_count,
                        'duplicates_skipped': duplicates_skipped
                    }), 200
                else:
                    return jsonify({'error': f'No valid records found for {filter_message}'}), 400

            except Exception as e:
                # Record failed upload
                upload_log = UploadLog(
                    filename=filename,
                    records_processed=0,
                    records_loaded=0,
                    duplicates_skipped=0,
                    status='error',
                    message=f'Error processing file: {str(e)}'
                )
                db.session.add(upload_log)
                db.session.commit()
                return jsonify({'error': f'Error processing file: {str(e)}'}), 500
        else:
            # Record invalid file type attempt
            upload_log = UploadLog(
                filename=filename if 'filename' in locals() else 'unknown',
                records_processed=0,
                records_loaded=0,
                duplicates_skipped=0,
                status='error',
                message='Invalid file type. Only CSV, XLSX, and XLS files are allowed'
            )
            db.session.add(upload_log)
            db.session.commit()
            return jsonify({'error': 'Invalid file type. Only CSV, XLSX, and XLS files are allowed'}), 400