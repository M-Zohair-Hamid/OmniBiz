import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ToastContext } from '../context/ToastContext';
import api from '../services/api';
import { useModalAnimation, getBackdropAnimationClass, getModalAnimationClass } from '../hooks/useModalAnimation';

const BackupModal = ({ isOpen, onClose }) => {
  const { showToast } = useContext(ToastContext);
  const [backupPath, setBackupPath] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPeriodicBackingUp, setIsPeriodicBackingUp] = useState(false);
  const [isZipRestoring, setIsZipRestoring] = useState(false);
  
  // Modal animation hook
  const backupModalAnim = useModalAnimation(isOpen);

  // Fetch backup configuration on modal open
  const fetchBackupConfig = useCallback(async () => {
    try {
      setIsLoadingConfig(true);
      const response = await api.get('/backup/config');
      const { backup_location, auto_backup_enabled, last_backup_time } = response.data;
      setBackupPath(backup_location || '');
      setAutoBackupEnabled(auto_backup_enabled || false);
      if (last_backup_time) {
        setLastBackupTime(new Date(last_backup_time));
      }
    } catch (error) {
      showToast('Failed to load backup configuration', 'error');
    } finally {
      setIsLoadingConfig(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchBackupConfig();
    }
  }, [isOpen, fetchBackupConfig]);

  const handleBrowseFolder = () => {
    // Since browsers can't access full file paths for security, show instructions
    const userPath = window.prompt(
      'Enter the backup folder path:\n\nExamples:\nWindows: C:\\Users\\YourName\\Backups\nMac: /Users/YourName/Backups\nLinux: /home/username/backups',
      backupPath || ''
    );
    
    if (userPath !== null && userPath.trim()) {
      setBackupPath(userPath.trim());
      showToast(`Backup location set to: ${userPath.trim()}`, 'info');
    }
  };


  const handleManualBackup = async () => {
    if (!backupPath.trim()) {
      showToast('Please enter a backup location', 'error');
      return;
    }

    const overwrite = window.confirm('Overwrite existing backups in this location?');
    
    try {
      setIsLoading(true);
      const response = await api.post('/backup', {
        destination_path: backupPath.trim(),
        overwrite,
        scope: 'current'
      });

      const { timestamp } = response.data;
      showToast('Backup created successfully', 'success');
      setLastBackupTime(new Date(timestamp));

      await handleSaveConfig(backupPath, autoBackupEnabled);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create backup';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodicBackup = async () => {
    if (!backupPath.trim()) {
      showToast('Please enter a backup location', 'error');
      return;
    }

    try {
      setIsPeriodicBackingUp(true);
      const response = await api.post('/backup/periodic', {
        destination_path: backupPath.trim(),
        scope: 'current'
      });

      const { timestamp, zip_path } = response.data;
      showToast(`Periodic backup created: ${zip_path}`, 'success');
      setLastBackupTime(new Date(timestamp));

      await handleSaveConfig(backupPath, autoBackupEnabled);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create periodic backup';
      showToast(errorMsg, 'error');
    } finally {
      setIsPeriodicBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!backupPath.trim()) {
      showToast('Please enter a backup location', 'error');
      return;
    }

    const overwrite = window.confirm('Restore will overwrite current databases. Continue?');
    if (!overwrite) return;

    try {
      setIsRestoring(true);
      await api.post('/backup/restore', {
        source_path: backupPath.trim(),
        overwrite: true,
        scope: 'current'
      });
      showToast('Restore completed successfully. Restart the app to reload data.', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to restore backup';
      showToast(errorMsg, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleZipRestore = async () => {
    const zipPath = window.prompt(
      'Enter the full path to the backup ZIP file:\n\nExamples:\nWindows: C:\\Backups\\backup_20250101_120000.zip\nMac: /Users/YourName/Backups/backup_20250101_120000.zip\nLinux: /home/username/backups/backup_20250101_120000.zip',
      ''
    );

    if (!zipPath || !zipPath.trim()) {
      return;
    }

    const overwrite = window.confirm('Restore will overwrite current databases. Continue?');
    if (!overwrite) return;

    try {
      setIsZipRestoring(true);
      await api.post('/backup/periodic/restore', {
        zip_path: zipPath.trim(),
        overwrite: true,
        scope: 'current'
      });
      showToast('Zip restore completed successfully. Restart the app to reload data.', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to restore from zip';
      showToast(errorMsg, 'error');
    } finally {
      setIsZipRestoring(false);
    }
  };

  const handleSaveConfig = async (location, autoEnabled) => {
    try {
      await api.post('/backup/config', {
        backup_location: location.trim(),
        auto_backup_enabled: autoEnabled
      });
      showToast('Backup settings saved', 'success');
    } catch (error) {
      showToast('Failed to save backup settings', 'error');
    }
  };

  const handleAutoBackupToggle = async () => {
    try {
      const newState = !autoBackupEnabled;
      await handleSaveConfig(backupPath, newState);
      setAutoBackupEnabled(newState);
    } catch (error) {
      showToast('Failed to update auto-backup setting', 'error');
    }
  };

  const formatLastBackupTime = () => {
    if (!lastBackupTime) return 'Never';
    const now = new Date();
    const diffMs = now - lastBackupTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute(s) ago`;
    if (diffHours < 24) return `${diffHours} hour(s) ago`;
    return `${diffDays} day(s) ago`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed left-0 top-0 right-0 bottom-0 w-screen h-screen bg-black bg-opacity-40  flex items-center justify-center z-[100] p-4 ${getBackdropAnimationClass(backupModalAnim.isClosing)}`}>
      <div className={` bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 w-full max-w-md ${getModalAnimationClass(backupModalAnim.isClosing, 'scale')}`}>
        {/* Header */}
        <h2 className="text-xl font-bold text-black mb-6">Database Backup</h2>

        {isLoadingConfig ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-[#1e293b] border-opacity-30 border-t-[#1e293b] rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Last Backup Info */}
            <div>
              <label className="block text-[#0f172a] font-bold mb-2 text-sm">Last Backup</label>
              <div className="w-full px-3 py-2  bg-gray-100 border border-[#1e293b] rounded-lg text-[#0f172a] font-semibold text-sm">
                {formatLastBackupTime()}
              </div>
            </div>

            {/* Backup Location */}
            <div>
              <label className="block text-[#0f172a] font-bold mb-2 text-sm">Backup Location</label>
              <input
                type="text"
                value={backupPath}
                onChange={(e) => setBackupPath(e.target.value)}
                placeholder="Enter full path: C:\Backups"
                className="w-full px-3 py-2  bg-white border border-[#1e293b] text-[#0f172a] placeholder-[#1e293b] placeholder-opacity-50 focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488] focus:ring-opacity-30 transition-all rounded-lg text-sm mb-2"
              />
              <button
                onClick={handleBrowseFolder}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all border border-teal-500/20 font-semibold text-sm"
              >
                Help me choose
              </button>
              <p className="text-xs text-[#0f172a] opacity-60 mt-2">Examples: C:\Users\YourName\Backups or /home/username/backups</p>
            </div>

            {/* Auto-Backup Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-[#0f172a] font-bold text-sm">Auto-Backup</label>
                <p className="text-[#0f172a] text-xs opacity-70">Daily on startup</p>
              </div>
              <button
                onClick={handleAutoBackupToggle}
                disabled={isLoading}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                  autoBackupEnabled ? 'bg-teal-600' : 'bg-slate-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all shadow-md ${
                    autoBackupEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleManualBackup}
                disabled={isLoading || isRestoring || isPeriodicBackingUp || isZipRestoring}
                className={`w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all duration-200 font-bold shadow-sm hover:shadow-md transform  active:scale-95 border border-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Backup Now (Simple)</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePeriodicBackup}
                disabled={isLoading || isRestoring || isPeriodicBackingUp || isZipRestoring}
                className={`w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-indigo-500/60 transform  active:scale-95 border border-indigo-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isPeriodicBackingUp ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating ZIP...</span>
                  </>
                ) : (
                  <>
                    <span>Periodic Backup (ZIP)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleRestore}
                disabled={isLoading || isRestoring || isPeriodicBackingUp || isZipRestoring}
                className={`w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-emerald-500/60 transform  active:scale-95 border border-emerald-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isRestoring ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <span>Restore (Folder)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleZipRestore}
                disabled={isLoading || isRestoring || isPeriodicBackingUp || isZipRestoring}
                className={`w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-teal-500/60 transform  active:scale-95 border border-teal-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isZipRestoring ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Restoring ZIP...</span>
                  </>
                ) : (
                  <>
                    <span>Restore (ZIP)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => backupModalAnim.handleClose(onClose)}
                className="w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all duration-200 font-bold shadow-sm hover:shadow-md transform  active:scale-95 border border-red-400 border-opacity-40 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default BackupModal;