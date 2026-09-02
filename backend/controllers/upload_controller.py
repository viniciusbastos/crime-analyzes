"""
Upload controller for handling file upload operations
"""
import os
from flask import request, jsonify, current_app
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

            # Use the absolute DATA_DIR from app config so the path is always
            # correct regardless of the process working directory (item 2.3).
            data_dir = current_app.config.get('DATA_DIR', 'data')
            os.makedirs(data_dir, exist_ok=True)
            filepath = os.path.join(data_dir, filename)
            file.save(filepath)

            try:
                # Process the uploaded file
                df = CrimeDataService.process_uploaded_file(filepath, filename)

                # Convert data – returns (converted_data, rejected) so we can
                # surface rows that were dropped and *why* (item 1.5).
                converted_data, rejected = CrimeDataService.convert_crime_data(df)
                filter_message = "all records"

                if converted_data:
                    # Save converted data to CSV
                    CrimeDataService.save_converted_data(converted_data, filename)

                    # Load data into database – returns (processed, dupes, errors)
                    processed_count, duplicates_skipped, db_errors = CrimeDataService.load_data_to_database(converted_data)

                    # Merge conversion rejections and DB-level errors into one list
                    all_rejected = rejected + db_errors
                    records_rejected = len(all_rejected)

                    # Clear cache immediately after successful database update
                    try:
                        from services.cache_service import invalidate_related_cache, CacheManager
                        invalidate_related_cache(['*'])  # Clear all cache
                        CacheManager.clear_all_cache()
                    except Exception as cache_err:
                        current_app.logger.warning(f"Cache clearing failed: {cache_err}")

                    message = (
                        f'Successfully processed and loaded {processed_count} crime records '
                        f'from {filter_message}'
                    )
                    if duplicates_skipped > 0:
                        message += f' ({duplicates_skipped} duplicates discarded)'
                    if records_rejected > 0:
                        message += f' ({records_rejected} rows rejected)'

                    # Record the upload in the database
                    upload_log = UploadLog(
                        filename=filename,
                        records_processed=len(converted_data) + records_rejected,
                        records_loaded=processed_count,
                        duplicates_skipped=duplicates_skipped,
                        records_rejected=records_rejected,
                        status='success',
                        message=message,
                    )
                    db.session.add(upload_log)
                    db.session.commit()

                    return jsonify({
                        'message': message,
                        'converted_file': f'converted_{filename}',
                        'records_processed': len(converted_data) + records_rejected,
                        'records_loaded': processed_count,
                        'duplicates_skipped': duplicates_skipped,
                        'records_rejected': records_rejected,
                        'rejection_details': all_rejected[:50],  # cap at 50 to keep response lean
                    }), 200
                else:
                    # Conversion produced nothing – surface why
                    return jsonify({
                        'error': f'No valid records found for {filter_message}',
                        'records_rejected': len(rejected),
                        'rejection_details': rejected[:50],
                    }), 400

            except Exception as e:
                current_app.logger.exception(f"Error processing upload: {e}")
                # Record failed upload
                upload_log = UploadLog(
                    filename=filename,
                    records_processed=0,
                    records_loaded=0,
                    duplicates_skipped=0,
                    records_rejected=0,
                    status='error',
                    message=f'Error processing file: {str(e)}',
                )
                db.session.add(upload_log)
                db.session.commit()
                return jsonify({'error': f'Error processing file: {str(e)}'}), 500
        else:
            filename_val = file.filename if file else 'unknown'
            upload_log = UploadLog(
                filename=secure_filename(filename_val) if filename_val else 'unknown',
                records_processed=0,
                records_loaded=0,
                duplicates_skipped=0,
                records_rejected=0,
                status='error',
                message='Invalid file type. Only CSV, XLSX, and XLS files are allowed',
            )
            db.session.add(upload_log)
            db.session.commit()
            return jsonify({'error': 'Invalid file type. Only CSV, XLSX, and XLS files are allowed'}), 400