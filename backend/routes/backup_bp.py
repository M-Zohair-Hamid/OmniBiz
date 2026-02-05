from flask import Blueprint, request, jsonify, send_file
import os
import shutil
import zipfile
from datetime import datetime
import json

bp = Blueprint('backup', __name__, url_prefix='/api/backup')

BACKUP_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backup_config.json')
INSTANCE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')

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

def create_backup(destination_path):
    """Create backup zip file with both databases"""
    try:
        # Ensure destination directory exists
        os.makedirs(destination_path, exist_ok=True)
        
        # Create timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_filename = f'backup_{timestamp}.zip'
        backup_filepath = os.path.join(destination_path, backup_filename)
        
        # Create zip file
        with zipfile.ZipFile(backup_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add umarsons.db
            umarsons_db = os.path.join(INSTANCE_DIR, 'umarsons.db')
            if os.path.exists(umarsons_db):
                zipf.write(umarsons_db, arcname='umarsons.db')
            
            # Add makkah_packages.db
            makkah_db = os.path.join(INSTANCE_DIR, 'makkah_packages.db')
            if os.path.exists(makkah_db):
                zipf.write(makkah_db, arcname='makkah_packages.db')
        
        # Update last backup time
        config = get_backup_config()
        config['last_backup_time'] = datetime.now().isoformat()
        if 'auto_backup_enabled' not in config:
            config['auto_backup_enabled'] = False
        save_backup_config(config)
        
        return True, backup_filepath, backup_filename
    except Exception as e:
        print(f"Backup error: {e}")
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
        
        success, result, filename = create_backup(destination_path)
        
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
