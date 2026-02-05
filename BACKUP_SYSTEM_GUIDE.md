# Database Backup System Implementation Guide

## Overview
The database backup system provides both manual and automatic backup capabilities for SQLite databases (umarsons.db and makkah_packages.db). The system uses timestamped zip files and persists configuration in JSON format.

## Components

### Backend

#### 1. Backup Blueprint (`backend/routes/backup_bp.py`)
**Purpose:** Handle database backup operations and configuration management

**Endpoints:**
- `POST /api/backup` - Create manual backup
  - Required: `destination_path` (absolute path string)
  - Returns: `filename`, `location`, `timestamp`
  - Example: `POST /api/backup` with `{"destination_path": "C:\\Backups"}`

- `GET /api/backup/config` - Retrieve backup configuration
  - Returns: `auto_backup_enabled`, `last_backup_time`, `backup_location`

- `POST /api/backup/config` - Save backup configuration
  - Required: `backup_location`, `auto_backup_enabled`
  - Updates persistent JSON configuration

**Key Functions:**
- `create_backup(destination_path)` - Creates timestamped zip file
  - Zips both `umarsons.db` and `makkah_packages.db`
  - Naming: `backup_YYYY-MM-DD_HH-MM-SS.zip`
  - Updates `last_backup_time` in config upon success
  - Returns: `(success: bool, filepath: str, filename: str)`

- `get_backup_config()` - Loads config from `backup_config.json`
- `save_backup_config(config)` - Persists config to JSON file

**Configuration File:** `backend/backup_config.json`
```json
{
  "auto_backup_enabled": false,
  "last_backup_time": "2026-02-05T14:30:45.123456",
  "backup_location": "C:\\Backups"
}
```

#### 2. Flask App Integration (`backend/app.py`)
**Changes:**
- Added `datetime` import for timestamp handling
- Registered `backup_bp` blueprint: `app.register_blueprint(backup_bp.bp)`
- Added auto-backup startup check:
  - Executes in app startup context after database initialization
  - Checks if auto-backup is enabled and if >24 hours since last backup
  - Triggers automatic backup if conditions met
  - Logs backup status and any errors

**Auto-Backup Logic:**
```
IF auto_backup_enabled AND backup_location_configured:
    IF no_previous_backup OR last_backup > 24_hours_ago:
        create_backup(backup_location)
        log_success_or_error()
```

#### 3. Routes Package (`backend/routes/__init__.py`)
**Changes:**
- Added import: `from . import backup_bp`
- Added to `__all__`: `'backup_bp'`

---

### Frontend

#### 1. Backup Modal Component (`frontend/src/components/BackupModal.js`)
**Purpose:** UI for manual/automatic backup management

**Features:**
- **Last Backup Display** - Shows when database was last backed up
  - Format: "Just now", "5 minutes ago", "2 hours ago", "3 days ago", "Never"
  
- **Backup Location Picker**
  - Text input field for absolute path
  - Browse button opens prompt for path entry
  - Examples shown: `C:\Backups` or `/home/user/backups`

- **Manual Backup Button**
  - Creates backup immediately in specified location
  - Shows loading spinner while creating
  - Displays success/error toast notifications
  - Updates last backup time on success

- **Auto-Backup Toggle**
  - Switch to enable/disable daily automatic backups
  - Persists setting to server
  - Requires backup location to be configured

- **Configuration Persistence**
  - Loads current config on modal open
  - Automatically saves location when backup created
  - Saves auto-backup preference when toggled

**State Management:**
- `backupPath` - User-selected destination
- `autoBackupEnabled` - Auto-backup toggle state
- `lastBackupTime` - Timestamp of last backup
- `isLoading` - Manual backup in progress
- `isLoadingConfig` - Config loading in progress

**API Calls:**
- `GET /api/backup/config` - Load configuration on mount
- `POST /api/backup` - Create manual backup
- `POST /api/backup/config` - Save auto-backup preference and location

#### 2. Sidebar Integration (`frontend/src/components/Sidebar.js`)
**Changes:**
- Imported `BackupModal` component
- Added state: `isBackupModalOpen`
- Added Backup button above Logout button
  - Green gradient styling matching design theme
  - Icon: 💾
  - Opens BackupModal on click
  - Responsive: Shows "💾 Backup" when sidebar open, "💾" when collapsed

**Button Styling:**
```jsx
<button
  onClick={() => setIsBackupModalOpen(true)}
  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-green-500/60 transform hover:scale-105"
>
  {isOpen ? '💾 Backup' : '💾'}
</button>
```

---

## Usage Workflow

### Manual Backup
1. Click "💾 Backup" button in sidebar
2. Enter absolute path for backup location (or click Browse)
3. Click "Backup Now"
4. System creates timestamped zip file with both databases
5. Success toast shows: "Backup created successfully: backup_2026-02-05_14-30-45.zip"

### Enable Auto-Backup
1. Open Backup modal
2. Enter backup location
3. Toggle "Auto-Backup" switch to ON
4. Settings automatically saved
5. On next app startup (if >24 hours since last backup), automatic backup triggers
6. Backup runs silently with status logged to server console

### Check Last Backup
1. Open Backup modal
2. "Last Backup" section shows relative time
3. If recently backed up, displays "Just now" or "X minutes ago"

---

## File Structure

```
Project-CS-L/
├── backend/
│   ├── app.py (updated with auto-backup logic)
│   ├── backup_config.json (created on first config save)
│   ├── routes/
│   │   ├── __init__.py (updated with backup_bp export)
│   │   └── backup_bp.py (new)
│   └── instance/
│       ├── umarsons.db
│       └── makkah_packages.db
└── frontend/
    └── src/
        ├── components/
        │   ├── Sidebar.js (updated with Backup button)
        │   └── BackupModal.js (new)
        └── services/
            └── api.js (used by BackupModal)
```

---

## Error Handling

**Frontend:**
- Invalid path: "Please enter a backup location"
- Network error: "Failed to create backup" (with server error message)
- Config load error: "Failed to load backup configuration"
- Settings save error: "Failed to save backup settings"

**Backend:**
- Non-absolute path: Returns `{'error': 'Path must be absolute'}` with 400 status
- Directory creation failure: Caught and returned in error response
- Backup file creation failure: Detailed error message in response
- Config file save failure: Logged to server console

---

## Security Considerations

1. **Path Validation**
   - Only absolute paths accepted
   - Prevents directory traversal attacks
   - User responsible for folder permissions

2. **JWT Authentication**
   - All endpoints require valid JWT token
   - Backup operations tied to authenticated user session

3. **File Permissions**
   - Backup destination must be writable
   - System uses standard file permissions
   - User responsible for securing backup location

4. **Sensitive Data**
   - Zip files contain unencrypted databases
   - User should store backups securely
   - Consider encrypting backup location if needed

---

## Testing Checklist

- [x] Frontend builds with 0 errors and 0 warnings
- [x] Backend syntax validation passes (app.py, backup_bp.py)
- [x] Backup button appears in sidebar above logout
- [x] BackupModal opens when backup button clicked
- [x] Last backup time displays correctly
- [x] Backup location input accepts valid paths
- [x] Manual backup creates zip file with timestamp
- [x] Config persists across page refreshes
- [x] Auto-backup toggle saves state
- [x] API endpoints protected with JWT auth
- [x] Error messages display in toast notifications

---

## Configuration Examples

### Windows Path
```
C:\Users\Username\Documents\Backups
```

### macOS/Linux Path
```
/Users/username/Documents/backups
```

### Network Path (Windows)
```
\\server\backups
```

---

## Troubleshooting

**Backup modal doesn't open:**
- Check sidebar is rendering BackupModal component
- Verify isBackupModalOpen state is toggling correctly

**Auto-backup not triggering:**
- Verify `auto_backup_enabled` is `true` in backup_config.json
- Check `backup_location` is set and exists
- Restart Flask server to trigger startup check
- Check server logs for "[AUTO-BACKUP]" messages

**Cannot create backup:**
- Verify destination path is absolute and exists
- Check folder permissions allow file creation
- Ensure sufficient disk space available
- Confirm both database files exist in backend/instance/

**Config not persisting:**
- Verify backend/backup_config.json is writable
- Check server logs for save errors
- Ensure JWT token is valid

---

## Future Enhancements

1. **Restore from Backup**
   - Add restore functionality to decompress and replace databases

2. **Backup History**
   - List all previous backups in modal
   - Allow selective deletion of old backups

3. **Encryption**
   - Encrypt backup zip files with password
   - Add password field to backup modal

4. **Cloud Storage**
   - Support uploading backups to cloud services
   - Google Drive, Dropbox, S3 integration

5. **Email Notifications**
   - Send email confirmation when backup completes
   - Alert on auto-backup failures
