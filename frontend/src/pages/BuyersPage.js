import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getBuyers, createBuyer, updateBuyer, deleteBuyer } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const BuyersPage = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    company_name: '',
    gst_number: 'GST-',
    ntn_number: 'NTN-',
    address: '',
    contact_person: '',
    email: '',
    phone: '',
    city: '',
    is_filer: true
  });

  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightText = (text) => {
    const value = String(text ?? '');
    const term = searchTerm.trim();
    if (!term) return value;

    const pattern = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return value.split(pattern).map((part, idx) => {
      const match = part.toLowerCase() === term.toLowerCase();
      return match ? <mark key={idx} className="bg-yellow-300 text-gray-900 px-0.5 rounded">{part}</mark> : part;
    });
  };

  const fetchBuyers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getBuyers(page, 10, search);
      setBuyers(response.data.data);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      showToast('Failed to load buyers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set page title based on company name
  useEffect(() => {
    if (user?.company_name) {
      document.title = `${user.company_name} - Buyers`;
    }
  }, [user?.company_name]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    fetchBuyers(1, e.target.value);
  };

  const ensurePrefix = (val, prefix) => {
    const v = (val || '').replace(/^\s+/, '');
    return v.startsWith(prefix) ? v : prefix + v.replace(new RegExp('^' + prefix), '');
  };

  const handleAddBuyer = () => {
    setFormData({ company_name: '', gst_number: 'GST-', ntn_number: 'NTN-', address: '', contact_person: '', email: '', phone: '', city: '', is_filer: true });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEditBuyer = (buyer) => {
    const isNonFiler = (buyer.gst_number || '').trim().toUpperCase() === 'N/A'
      && (buyer.ntn_number || '').trim().toUpperCase() === 'N/A';
    setFormData({
      ...buyer,
      gst_number: isNonFiler ? 'N/A' : ensurePrefix(buyer.gst_number || 'GST-', 'GST-'),
      ntn_number: isNonFiler ? 'N/A' : ensurePrefix(buyer.ntn_number || 'NTN-', 'NTN-'),
      is_filer: !isNonFiler
    });
    setEditingId(buyer.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isFiler = formData.is_filer;
    const gst = isFiler ? ensurePrefix(formData.gst_number, 'GST-') : 'N/A';
    const ntn = isFiler ? ensurePrefix(formData.ntn_number, 'NTN-') : 'N/A';

    const hasGstDigits = isFiler ? (gst.replace(/^GST-/, '').trim().length > 0) : true;
    const hasNtnDigits = isFiler ? (ntn.replace(/^NTN-/, '').trim().length > 0) : true;

    if (!formData.company_name || !formData.address || !hasGstDigits || !hasNtnDigits) {
      showToast(isFiler ? 'Please fill required fields: Company Name, GST, NTN, Address' : 'Please fill required fields: Company Name, Address', 'warning');
      return;
    }

    const payload = { ...formData, gst_number: gst, ntn_number: ntn };

    try {
      console.log('Submitting buyer payload:', payload);
      if (editingId) {
        await updateBuyer(editingId, payload);
        showToast('Buyer updated successfully', 'success');
      } else {
        await createBuyer(payload);
        showToast('Buyer created successfully', 'success');
      }
      setShowForm(false);
      fetchBuyers(currentPage);
    } catch (error) {
      const errMsg = error?.response?.data?.error || error?.message || 'Failed to save buyer';
      console.error('Buyer save error:', error?.response?.data);
      showToast(errMsg, 'error');
    }
  };

  const handleDeleteBuyer = async (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      try {
        await deleteBuyer(id);
        showToast('Buyer deleted successfully', 'success');
        fetchBuyers(currentPage);
      } catch (error) {
        showToast('Failed to delete buyer', 'error');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      <Sidebar companyName={user?.company_name || 'Business'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold text-white">Buyers Management</h1>
            <button
              onClick={handleAddBuyer}
              className="bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95 border border-[#00D4FF] border-opacity-30"
            >
              + Add Buyer
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label htmlFor="searchBuyers" className="block text-white font-semibold mb-2">Search</label>
            <input
              id="searchBuyers"
              name="searchBuyers"
              type="text"
              placeholder="Search buyers..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-3 backdrop-blur-sm bg-white bg-opacity-40 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-[#00D4FF] focus:bg-opacity-60 transition-all duration-200 text-gray-800 placeholder-gray-500"
            />
          </div>

          {/* Buyers Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg overflow-hidden border border-white border-opacity-30">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : buyers.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No buyers found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table id="buyersTable" className="w-full">
                    <thead className="border-b border-[#17144B]">
                      <tr>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Company Name</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Filer Status</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Contact Person</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Email</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Phone</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">City</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyers.map(buyer => (
                        (() => {
                          const gst = String(buyer.gst_number || '').trim().toUpperCase();
                          const ntn = String(buyer.ntn_number || '').trim().toUpperCase();
                          const isNonFiler = gst === 'N/A' || ntn === 'N/A' || (!gst && !ntn);
                          return (
                        <tr key={buyer.id} className="border-b border-[#3A3F8C] hover:bg-[#3A3F8C] hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                          <td className="px-6 py-3 font-semibold text-black text-center">{highlightText(buyer.company_name)}</td>
                          <td className="px-6 py-3 text-black text-center font-semibold">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${isNonFiler ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'}`}>
                              {isNonFiler ? 'Non-Filer' : 'Filer'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-black text-center">{highlightText(buyer.contact_person || '-')}</td>
                          <td className="px-6 py-3 text-black text-center">{highlightText(buyer.email || '-')}</td>
                          <td className="px-6 py-3 text-black text-center">{highlightText(buyer.phone || '-')}</td>
                          <td className="px-6 py-3 text-black text-center">{highlightText(buyer.city || '-')}</td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEditBuyer(buyer)}
                                className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#17144B] px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBuyer(buyer.id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                          );
                        })()
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                  <div className="flex justify-between items-center p-6">
                  <span className="text-black font-semibold">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchBuyers(currentPage - 1, searchTerm)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] disabled:opacity-50 disabled:cursor-not-allowed text-[#17144B] rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchBuyers(currentPage + 1, searchTerm)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] disabled:opacity-50 disabled:cursor-not-allowed text-[#17144B] rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
                <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Buyer' : 'Add Buyer'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                      <label htmlFor="filerStatus" className="block font-bold text-[#17144B] mb-2">Filer Status *</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          id="filerStatus"
                          onClick={() => setFormData({ ...formData, is_filer: true, gst_number: ensurePrefix(formData.gst_number || 'GST-', 'GST-'), ntn_number: ensurePrefix(formData.ntn_number || 'NTN-', 'NTN-') })}
                          className={`px-4 py-2 rounded-lg font-semibold border ${formData.is_filer ? 'bg-[#00D4FF] text-[#17144B] border-[#00D4FF]' : 'bg-white text-[#17144B] border-[#3A3F8C]'}`}
                        >
                          Filer
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, is_filer: false, gst_number: 'N/A', ntn_number: 'N/A' })}
                          className={`px-4 py-2 rounded-lg font-semibold border ${!formData.is_filer ? 'bg-[#00D4FF] text-[#17144B] border-[#00D4FF]' : 'bg-white text-[#17144B] border-[#3A3F8C]'}`}
                        >
                          Non-Filer
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="companyName" className="block font-bold text-[#17144B] mb-2">Company Name *</label>
                      <input id="companyName" name="company_name" type="text" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="w-full px-4 py-3 border border-[#3A3F8C] rounded-lg text-base" />
                    </div>
                    <div>
                      <label htmlFor="gstNumber" className="block font-bold text-[#17144B] mb-2">GST Number *</label>
                      <input
                        id="gstNumber"
                        name="gst_number"
                        type="text"
                        value={formData.gst_number}
                        onChange={(e) => formData.is_filer && setFormData({ ...formData, gst_number: ensurePrefix(e.target.value, 'GST-') })}
                        className="w-full px-4 py-3 border border-[#3A3F8C] rounded-lg text-base"
                        placeholder="GST-XXXX-XXXX"
                        disabled={!formData.is_filer}
                      />
                    </div>
                    <div>
                      <label htmlFor="ntnNumber" className="block font-bold text-[#17144B] mb-2">NTN Number *</label>
                      <input
                        id="ntnNumber"
                        name="ntn_number"
                        type="text"
                        value={formData.ntn_number}
                        onChange={(e) => formData.is_filer && setFormData({ ...formData, ntn_number: ensurePrefix(e.target.value, 'NTN-') })}
                        className="w-full px-4 py-3 border border-[#3A3F8C] rounded-lg text-base"
                        placeholder="NTN-XXXXXXX"
                        disabled={!formData.is_filer}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label htmlFor="address" className="block font-bold text-[#17144B] mb-2">Address *</label>
                      <textarea id="address" name="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 border border-[#3A3F8C] rounded-lg text-base" rows="2" />
                    </div>
                    <div>
                      <label htmlFor="contactPerson" className="block text-gray-700 font-semibold mb-2">Contact Person</label>
                      <input id="contactPerson" name="contact_person" type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email</label>
                      <input id="email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">Phone</label>
                      <input id="phone" name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-gray-700 font-semibold mb-2">City</label>
                      <input id="city" name="city" type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button type="submit" className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-4 py-3 rounded-lg font-semibold text-lg">Save</button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-lg font-semibold text-lg transition-all duration-200">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyersPage;
