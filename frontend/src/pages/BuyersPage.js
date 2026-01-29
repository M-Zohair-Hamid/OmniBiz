import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getBuyers, createBuyer, updateBuyer, deleteBuyer } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportTableToPDF, exportChartToImage } from '../utils/exportUtils';

const BuyersPage = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    company_name: '', gst_number: 'GST-', ntn_number: 'NTN-', address: '', contact_person: '', email: '', phone: '', city: ''
  });

  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

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
    setFormData({ company_name: '', gst_number: 'GST-', ntn_number: 'NTN-', address: '', contact_person: '', email: '', phone: '', city: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEditBuyer = (buyer) => {
    setFormData({
      ...buyer,
      gst_number: ensurePrefix(buyer.gst_number || 'GST-', 'GST-'),
      ntn_number: ensurePrefix(buyer.ntn_number || 'NTN-', 'NTN-')
    });
    setEditingId(buyer.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const gst = ensurePrefix(formData.gst_number, 'GST-');
    const ntn = ensurePrefix(formData.ntn_number, 'NTN-');

    const hasGstDigits = (gst.replace(/^GST-/, '').trim().length > 0);
    const hasNtnDigits = (ntn.replace(/^NTN-/, '').trim().length > 0);

    if (!formData.company_name || !hasGstDigits || !hasNtnDigits || !formData.address) {
      showToast('Please fill required fields: Company Name, GST, NTN, Address', 'warning');
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
    <div className="flex min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-red-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-red-800 to-red-900 opacity-80"></div>
      <Sidebar companyName={user?.full_name || 'User'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold text-white">Buyers Management</h1>
            <button
              onClick={handleAddBuyer}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 active:scale-95 border border-orange-400 border-opacity-30"
            >
              + Add Buyer
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search buyers..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-3 backdrop-blur-sm bg-white bg-opacity-40 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-orange-300 focus:bg-opacity-60 transition-all duration-200 text-gray-800 placeholder-gray-500"
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
                <div className="flex justify-end gap-2 p-4 border-b border-red-600">
                  <button onClick={() => exportTableToPDF('buyersTable', 'buyers.pdf')} className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">📄 PDF</button>
                  <button onClick={() => exportChartToImage('buyersTable', 'buyers.png')} className="px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">🖼️ PNG</button>
                </div>
                <div className="overflow-x-auto">
                  <table id="buyersTable" className="w-full">
                    <thead className="border-b border-red-600">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-red-700">Company Name</th>
                        <th className="px-6 py-3 text-left font-bold text-red-700">Email</th>
                        <th className="px-6 py-3 text-left font-bold text-red-700">Phone</th>
                        <th className="px-6 py-3 text-left font-bold text-red-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyers.map(buyer => (
                        <tr key={buyer.id} className="border-b border-red-600 hover:bg-orange-50 hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                          <td className="px-6 py-3 font-semibold text-black">{buyer.company_name}</td>
                          <td className="px-6 py-3 text-black">{buyer.email}</td>
                          <td className="px-6 py-3 text-black">{buyer.phone}</td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => handleEditBuyer(buyer)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded mr-2 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBuyer(buyer.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
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
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchBuyers(currentPage + 1, searchTerm)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Buyer' : 'Add Buyer'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block font-bold text-red-600 mb-2">Company Name *</label>
                      <input type="text" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="w-full px-4 py-3 border border-red-300 rounded-lg text-base" />
                    </div>
                    <div>
                      <label className="block font-bold text-red-600 mb-2">GST Number *</label>
                      <input type="text" value={formData.gst_number} onChange={(e) => setFormData({...formData, gst_number: ensurePrefix(e.target.value, 'GST-')})} className="w-full px-4 py-3 border border-red-300 rounded-lg text-base" placeholder="GST-XXXX-XXXX" />
                    </div>
                    <div>
                      <label className="block font-bold text-red-600 mb-2">NTN Number *</label>
                      <input type="text" value={formData.ntn_number} onChange={(e) => setFormData({...formData, ntn_number: ensurePrefix(e.target.value, 'NTN-')})} className="w-full px-4 py-3 border border-red-300 rounded-lg text-base" placeholder="NTN-XXXXXXX" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block font-bold text-red-600 mb-2">Address *</label>
                      <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 border border-red-300 rounded-lg text-base" rows="2" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Contact Person</label>
                      <input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Email</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">City</label>
                      <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-base" />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button type="submit" className="flex-1 bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white px-4 py-3 rounded-lg font-semibold text-lg">Save</button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 rounded-lg font-semibold text-lg">Cancel</button>
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
