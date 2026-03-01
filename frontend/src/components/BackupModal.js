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
  const [scopeDialog, setScopeDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onSelect: null
  });
  
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

    setScopeDialog({
      isOpen: true,
      title: 'Backup Scope',
      message: 'Choose which company data to back up.',
      onSelect: async (scope) => {
        if (!scope) return;
        try {
          setIsLoading(true);
          const response = await api.post('/backup', {
            destination_path: backupPath.trim(),
            overwrite,
            scope
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
      }
    });
  };

  const handlePeriodicBackup = async () => {
    if (!backupPath.trim()) {
      showToast('Please enter a backup location', 'error');
      return;
    }

    setScopeDialog({
      isOpen: true,
      title: 'Periodic Backup Scope',
      message: 'Choose which company data to include in the ZIP backup.',
      onSelect: async (scope) => {
        if (!scope) return;
        try {
          setIsPeriodicBackingUp(true);
          const response = await api.post('/backup/periodic', {
            destination_path: backupPath.trim(),
            scope
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
      }
    });
  };

  const handleRestore = async () => {
    if (!backupPath.trim()) {
      showToast('Please enter a backup location', 'error');
      return;
    }

    const overwrite = window.confirm('Restore will overwrite current databases. Continue?');
    if (!overwrite) return;

    setScopeDialog({
      isOpen: true,
      title: 'Restore Scope',
      message: 'Choose which company data to restore from the folder backup.',
      onSelect: async (scope) => {
        if (!scope) return;
        try {
          setIsRestoring(true);
          await api.post('/backup/restore', {
            source_path: backupPath.trim(),
            overwrite: true,
            scope
          });
          showToast('Restore completed successfully. Restart the app to reload data.', 'success');
        } catch (error) {
          const errorMsg = error.response?.data?.error || 'Failed to restore backup';
          showToast(errorMsg, 'error');
        } finally {
          setIsRestoring(false);
        }
      }
    });
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

    setScopeDialog({
      isOpen: true,
      title: 'ZIP Restore Scope',
      message: 'Choose which company data to restore from the ZIP backup.',
      onSelect: async (scope) => {
        if (!scope) return;
        try {
          setIsZipRestoring(true);
          await api.post('/backup/periodic/restore', {
            zip_path: zipPath.trim(),
            overwrite: true,
            scope
          });
          showToast('Zip restore completed successfully. Restart the app to reload data.', 'success');
        } catch (error) {
          const errorMsg = error.response?.data?.error || 'Failed to restore from zip';
          showToast(errorMsg, 'error');
        } finally {
          setIsZipRestoring(false);
        }
      }
    });
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
    <div className={`fixed left-0 top-0 right-0 bottom-0 w-screen h-screen bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${getBackdropAnimationClass(backupModalAnim.isClosing)}`}>
      <div className={`backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 w-full max-w-md ${getModalAnimationClass(backupModalAnim.isClosing, 'scale')}`}>
        {/* Header */}
        <h2 className="text-xl font-bold text-black mb-6">💾 Database Backup</h2>

        {isLoadingConfig ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-[#3A3F8C] border-opacity-30 border-t-[#3A3F8C] rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Last Backup Info */}
            <div>
              <label className="block text-[#17144B] font-bold mb-2 text-sm">Last Backup</label>
              <div className="w-full px-3 py-2 backdrop-blur-sm bg-gray-100 border border-[#3A3F8C] rounded-lg text-[#17144B] font-semibold text-sm">
                {formatLastBackupTime()}
              </div>
            </div>

            {/* Backup Location */}
            <div>
              <label className="block text-[#17144B] font-bold mb-2 text-sm">Backup Location</label>
              <input
                type="text"
                value={backupPath}
                onChange={(e) => setBackupPath(e.target.value)}
                placeholder="Enter full path: C:\Backups"
                className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] text-[#17144B] placeholder-[#3A3F8C] placeholder-opacity-50 focus:outline-none focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF] focus:ring-opacity-30 transition-all rounded-lg text-sm mb-2"
              />
              <button
                onClick={handleBrowseFolder}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all border border-blue-400 border-opacity-40 font-semibold text-sm"
              >
                📁 Help me choose
              </button>
              <p className="text-xs text-[#17144B] opacity-60 mt-2">Examples: C:\Users\YourName\Backups or /home/username/backups</p>
            </div>

            {/* Auto-Backup Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-[#17144B] font-bold text-sm">Auto-Backup</label>
                <p className="text-[#17144B] text-xs opacity-70">Daily on startup</p>
              </div>
              <button
                onClick={handleAutoBackupToggle}
                disabled={isLoading}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                  autoBackupEnabled ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'
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
                className={`w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-blue-500/60 transform hover:scale-105 active:scale-95 border border-blue-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Backup Now (Simple)</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePeriodicBackup}
                disabled={isLoading || isRestoring || isPeriodicBackingUp || isZipRestoring}
                className={`w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-indigo-500/60 transform hover:scale-105 active:scale-95 border border-indigo-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isPeriodicBackingUp ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating ZIP...</span>
                  </>
                ) : (
                  <>
                    <span>🗂️</span>
                    <span>Periodic Backup (ZIP)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleRestore}
                disabled={isLoading || isRestoring || isPeriodicBackingUp || isZipRestoring}
                className={`w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-emerald-500/60 transform hover:scale-105 active:scale-95 border border-emerald-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isRestoring ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <span>♻️</span>
                    <span>Restore (Folder)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleZipRestore}
                disabled={isLoading || isRestoring || isPeriodicBackingUp || isZipRestoring}
                className={`w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-teal-500/60 transform hover:scale-105 active:scale-95 border border-teal-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isZipRestoring ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Restoring ZIP...</span>
                  </>
                ) : (
                  <>
                    <span>📦</span>
                    <span>Restore (ZIP)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => backupModalAnim.handleClose(onClose)}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-red-500/60 transform hover:scale-105 active:scale-95 border border-red-400 border-opacity-40 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {scopeDialog.isOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-[110]">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-200">
            <h3 className="text-lg font-bold text-[#17144B] mb-2">{scopeDialog.title}</h3>
            <p className="text-sm text-[#17144B] opacity-80 mb-5">{scopeDialog.message}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const onSelect = scopeDialog.onSelect;
                  setScopeDialog({ ...scopeDialog, isOpen: false, onSelect: null });
                  if (onSelect) onSelect('current');
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all font-semibold text-sm"
              >
                This Company
              </button>
              <button
                onClick={() => {
                  const onSelect = scopeDialog.onSelect;
                  setScopeDialog({ ...scopeDialog, isOpen: false, onSelect: null });
                  if (onSelect) onSelect('both');
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all font-semibold text-sm"
              >
                Both Companies
              </button>
              <button
                onClick={() => setScopeDialog({ ...scopeDialog, isOpen: false, onSelect: null })}
                className="w-full px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg transition-all font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupModal;
