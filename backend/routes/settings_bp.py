from flask import Blueprint, request, jsonify, send_from_directory
from models import db, BusinessSettings
from werkzeug.utils import secure_filename
import os
from pathlib import Path
from PIL import Image
import io

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

# Define upload folder
UPLOAD_FOLDER = Path(__file__).parent.parent / 'uploads'
UPLOAD_FOLDER.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@settings_bp.route('/remove-logo', methods=['POST', 'OPTIONS'])
def remove_logo():
    """Remove the current business logo and clear the reference in the database"""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        company_id = 1  # Always use company ID 1
        settings = BusinessSettings.query.filter_by(company_id=company_id).first()
        if not settings or not settings.logo_filename:
            return jsonify({'error': 'No logo to remove'}), 400

        # Delete logo file from disk
        logo_path = UPLOAD_FOLDER / settings.logo_filename
        if logo_path.exists():
            try:
                logo_path.unlink()
            except Exception as e:
                return jsonify({'error': f'Failed to delete logo file: {str(e)}'}), 500

        # Clear logo reference in DB
        settings.logo_filename = None
        db.session.commit()
        return jsonify({'message': 'Logo removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/', methods=['GET', 'OPTIONS'], strict_slashes=False)
def get_settings():
    """Get business settings"""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        company_id = 1  # Always use company ID 1
        settings = BusinessSettings.query.filter_by(company_id=company_id).first()
        
        if not settings:
            # Return default settings if none exist
            return jsonify({
                'business_name': 'BUSINESS COMPANY',
                'address': 'Business District, City, Country',
                'email': 'support@company.local',
                'phone': '+1-800-0000000',
                'whatsapp': '+1-800-0000000',
                'logo_url': None,
                'needs_setup': True
            }), 200

        default_name_values = {'BUSINESS COMPANY', 'Business Company', ''}
        default_address_values = {'Business District, City, Country', ''}
        needs_setup = (
            (settings.business_name or '').strip() in default_name_values
            and (settings.address or '').strip() in default_address_values
            and not settings.logo_filename
        )
        
        return jsonify({
            'id': settings.id,
            'business_name': settings.business_name,
            'address': settings.address,
            'email': settings.email,
            'phone': settings.phone,
            'whatsapp': settings.whatsapp,
            'logo_url': f'/api/settings/logo/{settings.logo_filename}' if settings.logo_filename else None,
            'logo_placement': settings.logo_placement or 'both',
            'logo_as_watermark': settings.logo_as_watermark if settings.logo_as_watermark is not None else True,
            'needs_setup': needs_setup
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/', methods=['POST', 'OPTIONS'], strict_slashes=False)
def save_settings():
    """Save or update business settings"""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        company_id = 1  # Always use company ID 1
        data = request.json
        
        settings = BusinessSettings.query.filter_by(company_id=company_id).first()
        
        if settings:
            # Update existing settings
            settings.business_name = data.get('business_name', settings.business_name)
            settings.address = data.get('address', settings.address)
            settings.email = data.get('email', settings.email)
            settings.phone = data.get('phone', settings.phone)
            settings.whatsapp = data.get('whatsapp', settings.whatsapp)
            settings.logo_placement = data.get('logo_placement', settings.logo_placement)
            settings.logo_as_watermark = data.get('logo_as_watermark', settings.logo_as_watermark)
        else:
            # Create new settings
            settings = BusinessSettings(
                company_id=company_id,
                business_name=data.get('business_name', 'BUSINESS COMPANY'),
                address=data.get('address', ''),
                email=data.get('email', ''),
                phone=data.get('phone', ''),
                whatsapp=data.get('whatsapp', ''),
                logo_placement=data.get('logo_placement', 'both'),
                logo_as_watermark=data.get('logo_as_watermark', True)
            )
            db.session.add(settings)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Settings saved successfully',
            'settings': {
                'id': settings.id,
                'business_name': settings.business_name,
                'address': settings.address,
                'email': settings.email,
                'phone': settings.phone,
                'whatsapp': settings.whatsapp,
                'logo_url': f'/api/settings/logo/{settings.logo_filename}' if settings.logo_filename else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/upload-logo', methods=['POST', 'OPTIONS'])
def upload_logo():
    """Upload business logo with automatic resize and PNG conversion"""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        if 'logo' not in request.files:
            return jsonify({'error': 'No logo file provided'}), 400
        
        file = request.files['logo']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, and JPEG are allowed'}), 400
        
        company_id = 1  # Always use company ID 1
        
        # Process image: resize if too large, convert to PNG
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f'logo_{timestamp}.png'  # Always save as PNG
        filepath = UPLOAD_FOLDER / filename
        
        # Open image with PIL
        image = Image.open(file.stream)
        
        # Get original dimensions
        original_width, original_height = image.size
        
        # Maximum dimensions (adjust as needed)
        max_width = 800
        max_height = 600
        
        # Resize if image is too large, maintaining aspect ratio
        if original_width > max_width or original_height > max_height:
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Convert to RGBA (supports transparency) if not already
        if image.mode != 'RGBA':
            # If image has transparency info, preserve it
            if image.mode == 'P' and 'transparency' in image.info:
                image = image.convert('RGBA')
            elif image.mode == 'RGB':
                # Add alpha channel to RGB images
                image = image.convert('RGBA')
        
        # Save as PNG with optimization
        image.save(str(filepath), 'PNG', optimize=True)
        
        # Update or create settings with new logo filename
        settings = BusinessSettings.query.filter_by(company_id=company_id).first()
        
        # Delete old logo file if exists
        if settings and settings.logo_filename:
            old_logo_path = UPLOAD_FOLDER / settings.logo_filename
            if old_logo_path.exists():
                try:
                    old_logo_path.unlink()
                except:
                    pass
        
        if settings:
            settings.logo_filename = filename
        else:
            # Create new settings with default values
            settings = BusinessSettings(
                company_id=company_id,
                business_name='BUSINESS COMPANY',
                address='Business District, City, Country',
                email='support@company.local',
                phone='+1-800-0000000',
                whatsapp='+1-800-0000000',
                logo_filename=filename
            )
            db.session.add(settings)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Logo uploaded successfully',
            'logo_url': f'/api/settings/logo/{filename}'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/logo/<filename>', methods=['GET'])
def get_logo(filename):
    """Serve uploaded logo file"""
    try:
        return send_from_directory(str(UPLOAD_FOLDER), filename)
    except Exception as e:
        return jsonify({'error': 'Logo not found'}), 404
