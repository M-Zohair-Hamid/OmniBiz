from flask import Blueprint, request, jsonify, send_file, g
import os
import shutil
from datetime import datetime
import json
import zipfile
import tempfile

bp = Blueprint('backup', __name__, url_prefix='/api/backup')

BACKUP_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backup_config.json')
INSTANCE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')

COMPANY_FILES = {
    'umarsons': {
        'folder': 'umarsons',
        'db': 'umarsons.db'
    },
    'makkah_packages': {
        'folder': 'makkahpackages',
        'db': 'makkah_packages.db'
    }
}

def get_company_scope(scope, company_code):
    if scope == 'current':
        if not company_code or company_code not in COMPANY_FILES:
            return []
        return [company_code]
    return list(COMPANY_FILES.keys())

def get_backup_config():
    """Load backup configuration including last backup time"""
    if os.path.exists(BACKUP_CONFIG_FILE):
        try:
            with open(BACKUP_CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_backup_config(config):
    """Save backup configuration"""
    try:
        os.makedirs(os.path.dirname(BACKUP_CONFIG_FILE), exist_ok=True)
        with open(BACKUP_CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving backup config: {e}")
        return False

def create_backup(destination_path, overwrite=False, scope='both', company_code=None):
    """Create backup by copying databases into per-company folders"""
    try:
        # Ensure destination directory exists
        os.makedirs(destination_path, exist_ok=True)

        companies = get_company_scope(scope, company_code)
        if not companies:
            return False, 'Invalid company scope for backup.', None

        targets = []
        sources = []
        for code in companies:
            folder = COMPANY_FILES[code]['folder']
            db_name = COMPANY_FILES[code]['db']
            company_dir = os.path.join(destination_path, folder)
            os.makedirs(company_dir, exist_ok=True)

            db_path = os.path.join(INSTANCE_DIR, db_name)
            target_path = os.path.join(company_dir, db_name)
            sources.append(db_path)
            targets.append(target_path)

        # Overwrite checks
        if not overwrite:
            if any(os.path.exists(t) for t in targets):
                return False, 'Backup already exists. Set overwrite to replace.', None

        # Copy files (overwrite if exists)
        for src, dst in zip(sources, targets):
            if os.path.exists(src):
                shutil.copy2(src, dst)
        
        # Update last backup time
        config = get_backup_config()
        config['last_backup_time'] = datetime.now().isoformat()
        if 'auto_backup_enabled' not in config:
            config['auto_backup_enabled'] = False
        save_backup_config(config)

        return True, destination_path, 'backup_completed'
    except Exception as e:
        print(f"Backup error: {e}")
        return False, str(e), None

def create_periodic_backup_zip(destination_path, scope='both', company_code=None):
    """Create periodic backup as a zip file with per-company folders inside."""
    try:
        os.makedirs(destination_path, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        zip_name = f"backup_{timestamp}.zip"
        zip_path = os.path.join(destination_path, zip_name)

        companies = get_company_scope(scope, company_code)
        if not companies:
            return False, 'Invalid company scope for backup.', None

        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
            for code in companies:
                folder = COMPANY_FILES[code]['folder']
                db_name = COMPANY_FILES[code]['db']
                db_path = os.path.join(INSTANCE_DIR, db_name)
                if os.path.exists(db_path):
                    zipf.write(db_path, arcname=os.path.join(folder, db_name))

        # Update last backup time
        config = get_backup_config()
        config['last_backup_time'] = datetime.now().isoformat()
        if 'auto_backup_enabled' not in config:
            config['auto_backup_enabled'] = False
        save_backup_config(config)

        return True, zip_path, zip_name
    except Exception as e:
        print(f"Periodic backup error: {e}")
        return False, str(e), None

@bp.route('', methods=['POST'])
def manual_backup():
    """Create manual backup"""
    try:
        data = request.get_json()
        destination_path = data.get('destination_path')
        
        if not destination_path:
            return jsonify({'error': 'Destination path required'}), 400
        
        # Validate path is absolute
        if not os.path.isabs(destination_path):
            return jsonify({'error': 'Path must be absolute (e.g., C:\\Backups or /home/user/backups)'}), 400
        
        # Check if path exists or can be created
        try:
            os.makedirs(destination_path, exist_ok=True)
        except Exception as e:
            return jsonify({'error': f'Cannot create directory: {str(e)}'}), 400
        
        overwrite = bool(data.get('overwrite', False))
        scope = data.get('scope', 'both')
        company_code = getattr(g, 'company_code', None)
        success, result, filename = create_backup(destination_path, overwrite=overwrite, scope=scope, company_code=company_code)
        
        if success:
            # Save the location to config
            config = get_backup_config()
            config['backup_location'] = destination_path
            save_backup_config(config)
            
            return jsonify({
                'success': True,
                'message': f'Backup created successfully',
                'filename': filename,
                'location': result,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': f'Backup failed: {result}'
            }), 500
    except Exception as e:
        print(f"Manual backup error: {str(e)}")
        return jsonify({'error': f'Backup failed: {str(e)}'}), 500

@bp.route('/config', methods=['GET'])
def get_config():
    """Get backup configuration"""
    config = get_backup_config()
    return jsonify({
        'auto_backup_enabled': config.get('auto_backup_enabled', False),
        'last_backup_time': config.get('last_backup_time', None),
        'backup_location': config.get('backup_location', None)
    }), 200

@bp.route('/config', methods=['POST'])
def save_config():
    """Save backup configuration"""
    try:
        data = request.get_json()
        config = get_backup_config()
        
        if 'auto_backup_enabled' in data:
            config['auto_backup_enabled'] = data['auto_backup_enabled']
        if 'backup_location' in data:
            config['backup_location'] = data['backup_location']
        
        save_backup_config(config)
        
        return jsonify({
            'success': True,
            'message': 'Configuration saved'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/periodic', methods=['POST'])
def periodic_backup():
    """Create periodic backup as a zip file"""
    try:
        data = request.get_json()
        destination_path = data.get('destination_path')

        if not destination_path:
            return jsonify({'error': 'Destination path required'}), 400

        if not os.path.isabs(destination_path):
            return jsonify({'error': 'Path must be absolute (e.g., C:\\Backups or /home/user/backups)'}), 400

        try:
            os.makedirs(destination_path, exist_ok=True)
        except Exception as e:
            return jsonify({'error': f'Cannot create directory: {str(e)}'}), 400

        scope = data.get('scope', 'both')
        company_code = getattr(g, 'company_code', None)
        success, result, filename = create_periodic_backup_zip(destination_path, scope=scope, company_code=company_code)
        if success:
            config = get_backup_config()
            config['backup_location'] = destination_path
            save_backup_config(config)

            return jsonify({
                'success': True,
                'message': 'Periodic backup created successfully',
                'filename': filename,
                'zip_path': result,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': f'Periodic backup failed: {result}'
            }), 500
    except Exception as e:
        print(f"Periodic backup error: {str(e)}")
        return jsonify({'error': f'Periodic backup failed: {str(e)}'}), 500

@bp.route('/restore', methods=['POST'])
def restore_backup():
    """Restore databases from backup folders"""
    try:
        data = request.get_json()
        source_path = data.get('source_path')
        overwrite = bool(data.get('overwrite', False))

        if not source_path:
            return jsonify({'error': 'Source path required'}), 400

        if not os.path.isabs(source_path):
            return jsonify({'error': 'Path must be absolute (e.g., C:\\Backups or /home/user/backups)'}), 400

        scope = data.get('scope', 'both')
        company_code = getattr(g, 'company_code', None)
        companies = get_company_scope(scope, company_code)
        if not companies:
            return jsonify({'error': 'Invalid company scope for restore.'}), 400

        sources = []
        targets = []
        for code in companies:
            folder = COMPANY_FILES[code]['folder']
            db_name = COMPANY_FILES[code]['db']
            source_db = os.path.join(source_path, folder, db_name)
            target_db = os.path.join(INSTANCE_DIR, db_name)
            sources.append(source_db)
            targets.append(target_db)

        if not any(os.path.exists(s) for s in sources):
            return jsonify({'error': 'No backup files found in the selected location'}), 404

        if not overwrite:
            if any(os.path.exists(t) and os.path.exists(s) for s, t in zip(sources, targets)):
                return jsonify({'error': 'Restore would overwrite existing databases. Set overwrite to continue.'}), 400

        os.makedirs(INSTANCE_DIR, exist_ok=True)

        for src, dst in zip(sources, targets):
            if os.path.exists(src):
                shutil.copy2(src, dst)

        return jsonify({
            'success': True,
            'message': 'Restore completed successfully'
        }), 200
    except Exception as e:
        print(f"Restore error: {e}")
        return jsonify({'error': f'Restore failed: {str(e)}'}), 500

@bp.route('/periodic/restore', methods=['POST'])
def restore_periodic_backup():
    """Restore databases from a periodic backup zip"""
    temp_dir = None
    try:
        data = request.get_json()
        zip_path = data.get('zip_path')
        overwrite = bool(data.get('overwrite', False))

        if not zip_path:
            return jsonify({'error': 'Zip path required'}), 400

        if not os.path.isabs(zip_path):
            return jsonify({'error': 'Path must be absolute (e.g., C:\\Backups\\backup.zip or /home/user/backup.zip)'}), 400

        if not os.path.exists(zip_path):
            return jsonify({'error': 'Zip file not found'}), 404

        if not zipfile.is_zipfile(zip_path):
            return jsonify({'error': 'Selected file is not a valid zip'}), 400

        temp_dir = tempfile.mkdtemp(prefix='backup_restore_')
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            zipf.extractall(temp_dir)

        scope = data.get('scope', 'both')
        company_code = getattr(g, 'company_code', None)
        companies = get_company_scope(scope, company_code)
        if not companies:
            return jsonify({'error': 'Invalid company scope for restore.'}), 400

        sources = []
        targets = []
        for code in companies:
            folder = COMPANY_FILES[code]['folder']
            db_name = COMPANY_FILES[code]['db']
            source_db = os.path.join(temp_dir, folder, db_name)
            target_db = os.path.join(INSTANCE_DIR, db_name)
            sources.append(source_db)
            targets.append(target_db)

        if not any(os.path.exists(s) for s in sources):
            return jsonify({'error': 'No database files found in the zip'}), 404

        if not overwrite:
            if any(os.path.exists(t) and os.path.exists(s) for s, t in zip(sources, targets)):
                return jsonify({'error': 'Restore would overwrite existing databases. Set overwrite to continue.'}), 400

        os.makedirs(INSTANCE_DIR, exist_ok=True)

        for src, dst in zip(sources, targets):
            if os.path.exists(src):
                shutil.copy2(src, dst)

        return jsonify({
            'success': True,
            'message': 'Zip restore completed successfully'
        }), 200
    except Exception as e:
        print(f"Zip restore error: {e}")
        return jsonify({'error': f'Restore failed: {str(e)}'}), 500
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception:
                pass
