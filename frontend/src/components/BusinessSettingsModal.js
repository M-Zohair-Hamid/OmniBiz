import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../context/ToastContext';
import { useModalAnimation, getBackdropAnimationClass, getModalAnimationClass } from '../hooks/useModalAnimation';

const BusinessSettingsModal = ({ isOpen, onClose }) => {
  const { showToast } = useContext(ToastContext);
  const modalAnim = useModalAnimation(isOpen);

  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    email: '',
    phone: '',
    whatsapp: '',
    logo_placement: 'both',
    logo_as_watermark: true
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);
  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;
    setRemovingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings/remove-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setCurrentLogoUrl(null);
        setLogoFile(null);
        setLogoPreview(null);
        setImageDimensions(null);
        showToast('Logo removed successfully', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to remove logo', 'error');
      }
    } catch (error) {
      showToast('Failed to remove logo', 'error');
      console.error('Error removing logo:', error);
    } finally {
      setRemovingLogo(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          business_name: data.business_name || '',
          address: data.address || '',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          logo_placement: data.logo_placement || 'both',
          logo_as_watermark: data.logo_as_watermark !== undefined ? data.logo_as_watermark : true
        });
        setCurrentLogoUrl(data.logo_url ? `http://localhost:5000${data.logo_url}` : null);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }

      setLogoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);

        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });

          if (img.width > 1000 || img.height > 1000) {
            showToast('Large image detected. It will be automatically resized to fit (max 800x600)', 'info');
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      showToast('Please select a logo file first', 'error');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('logo', logoFile);

      const response = await fetch('http://localhost:5000/api/settings/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentLogoUrl(`http://localhost:5000${data.logo_url}`);
        setLogoFile(null);
        setLogoPreview(null);
        setImageDimensions(null);
        showToast('Logo uploaded and optimized successfully', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to upload logo', 'error');
      }
    } catch (error) {
      showToast('Failed to upload logo', 'error');
      console.error('Error uploading logo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClearBusinessInfo = () => {
    setFormData(prev => ({
      ...prev,
      business_name: '',
      address: '',
      email: '',
      phone: '',
      whatsapp: ''
    }));
    showToast('Business information cleared', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Settings saved successfully', 'success');
        document.title = formData.business_name || 'Business Management System';
        window.location.reload();
        onClose();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to save settings', 'error');
      }
    } catch (error) {
      showToast('Failed to save settings', 'error');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCloseModal = () => {
    modalAnim.handleClose(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50  z-[100] flex items-center justify-center p-4 ${getBackdropAnimationClass(modalAnim.isClosing)}`}
      onClick={handleCloseModal}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-y-auto ${getModalAnimationClass(modalAnim.isClosing, 'scale')}`}
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <div className="bg-slate-950 text-white px-8 py-5 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Business Settings</h2>
            <button
              onClick={handleCloseModal}
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none hover:bg-white hover:bg-opacity-10 rounded-full w-10 h-10 flex items-center justify-center transition-all"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-xl border-2 border-dashed border-slate-300 shadow-sm">
                <h3 className="text-xl font-semibold text-[#0f172a] mb-4">Business Logo</h3>

                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-6 rounded">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-teal-800 mb-1">Recommended Logo Guidelines:</p>
                      <ul className="text-xs text-teal-700 space-y-1">
                        <li>• <strong>Transparent PNG</strong> recommended for best results on documents</li>
                        <li>• Images with backgrounds will be auto-converted to PNG</li>
                        <li>• Maximum size: 5MB | Auto-resize: Large images scaled to 800x600px</li>
                        <li>• Supports: PNG, JPG, JPEG formats</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-64 h-64 border-2 border-gray-300 rounded-xl flex items-center justify-center bg-white overflow-hidden shadow-md relative">
                      {logoPreview ? (
                        <div className="relative w-full h-full p-4">
                          <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain mx-auto" />
                          {imageDimensions && (
                            <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
                              {imageDimensions.width} × {imageDimensions.height}px
                            </div>
                          )}
                        </div>
                      ) : currentLogoUrl ? (
                        <img src={currentLogoUrl} alt="Current Logo" className="max-w-full max-h-full object-contain p-4" />
                      ) : (
                        <div className="text-gray-400 text-center p-4">
                          <svg className="w-20 h-20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-semibold">No logo uploaded</p>
                          <p className="text-xs mt-1">Upload your business logo</p>
                        </div>
                      )}
                    </div>
                    {/* Remove Logo Button */}
                    {currentLogoUrl && !logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={removingLogo}
                        className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {removingLogo ? 'Removing...' : 'Remove Logo'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Choose Logo File</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0f172a] file:text-white hover:file:bg-[#0d0a2e] cursor-pointer transition-all"
                      />
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Logo Placement on Documents</label>
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="logo_placement"
                            value="both"
                            checked={formData.logo_placement === 'both'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">Both (Header + Watermark)</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="logo_placement"
                            value="side"
                            checked={formData.logo_placement === 'side'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">Header Only</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="logo_placement"
                            value="watermark"
                            checked={formData.logo_placement === 'watermark'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">Watermark Only</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Enable Watermark</span>
                          <p className="text-xs text-gray-500 mt-1">Show logo as watermark background</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="logo_as_watermark"
                            checked={formData.logo_as_watermark}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </div>
                      </label>
                    </div>

                    {logoFile && (
                      <button
                        type="button"
                        onClick={handleUploadLogo}
                        disabled={uploading}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                      >
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Processing & Uploading...
                          </span>
                        ) : (
                          'Upload & Optimize Logo'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-xl font-semibold text-[#0f172a]">Business Information</h3>
                  <button
                    type="button"
                    onClick={handleClearBusinessInfo}
                    className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                  >
                    Clear All
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent text-base"
                    placeholder="Your Business Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent text-base resize-none"
                    placeholder="Complete business address"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent text-base"
                      placeholder="business@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent text-base"
                      placeholder="+1-800-0000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-transparent text-base"
                      placeholder="+1-800-0000000"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-all hover:border-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold transition-colors duration-150"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettingsModal;