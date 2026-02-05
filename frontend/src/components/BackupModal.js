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
  
  // Modal animation hook
  const backupModalAnim = useModalAnimation();

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

    try {
      setIsLoading(true);
      const response = await api.post('/backup', {
        destination_path: backupPath.trim()
      });

      const { filename, timestamp } = response.data;
      showToast(`Backup created successfully: ${filename}`, 'success');
      setLastBackupTime(new Date(timestamp));
      
      // Save the backup location
      await handleSaveConfig(backupPath, autoBackupEnabled);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create backup';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
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
    <div className={`fixed left-0 top-0 right-0 bottom-0 w-screen h-screen bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${getBackdropAnimationClass(backupModalAnim.isClosing)}`}>
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
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleManualBackup}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-blue-500/60 transform hover:scale-105 active:scale-95 border border-blue-400 border-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Backup Now</span>
                  </>
                )}
              </button>

              <button
                onClick={() => backupModalAnim.handleClose(onClose)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-red-500/60 transform hover:scale-105 active:scale-95 border border-red-400 border-opacity-40 text-sm"
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
