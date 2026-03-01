import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getItems, createItem, updateItem, deleteItem } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', unit: 'PCS', unit_price: 0
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

  const fetchItems = async (search = '') => {
    setLoading(true);
    try {
      const response = await getItems(1, 1000, search);
      setItems(response.data.data);
    } catch (error) {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set page title based on company name
  useEffect(() => {
    if (user?.company_name) {
      document.title = `${user.company_name} - Items`;
    }
  }, [user?.company_name]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    fetchItems(e.target.value);
  };

  const handleAddItem = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', description: '', unit: 'PCS', unit_price: 0 });
    setShowForm(true);
  };

  const handleEditItem = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.unit_price) {
      showToast('Please fill required fields: Code, Name, Unit Price', 'warning');
      return;
    }

    try {
      const submitData = { ...formData };
      
      if (editingId) {
        await updateItem(editingId, submitData);
        showToast('Item updated successfully', 'success');
      } else {
        const resp = await createItem(submitData);
        if (resp?.data?.code) {
          setFormData({ ...submitData, code: resp.data.code });
        }
        showToast('Item created successfully', 'success');
      }
      setShowForm(false);
      fetchItems(searchTerm);
    } catch (error) {
      showToast('Failed to save item', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        showToast('Item deleted successfully', 'success');
        fetchItems(searchTerm);
      } catch (error) {
        showToast('Failed to delete item', 'error');
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
            <h1 className="text-5xl font-bold text-white">Items Management</h1>
            <button
              onClick={handleAddItem}
              className="bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95 border border-[#00D4FF] border-opacity-30"
            >
              + Add Item
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 backdrop-blur-sm bg-white bg-opacity-40 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-[#00D4FF] focus:bg-opacity-60 transition-all"
            />
          </div>

          {/* Items Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 overflow-hidden h-[calc(100vh-240px)]">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No items found</div>
            ) : (
              <>
                <div className="overflow-x-auto h-full overflow-y-auto">
                  <table id="itemsTable" className="w-full">
                    <thead className="border-b border-[#17144B]">
                      <tr>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Code</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Name</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Unit</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Price (₨)</th>
                        <th className="px-6 py-3 text-center font-bold text-[#17144B]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-b border-[#3A3F8C] hover:bg-[#3A3F8C] hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                          <td className="px-6 py-3 font-semibold text-black text-center">{highlightText(item.code)}</td>
                          <td className="px-6 py-3 text-black text-center">{highlightText(item.name)}</td>
                          <td className="px-6 py-3 text-black text-center">{highlightText(item.unit)}</td>
                          <td className="px-6 py-3 font-semibold text-black text-center">{highlightText(`₨${item.unit_price.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)}</td>
                          <td className="px-6 py-3 text-center">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </>
            )}
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
                <h2 className="text-2xl font-bold mb-6 text-white">{editingId ? 'Edit Item' : 'Add Item'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[#17144B] font-bold mb-2">Code *</label>
                      <input 
                        type="text" 
                        value={formData.code} 
                        onChange={(e) => {
                          let value = e.target.value.trim();
                          // If user entered something and it doesn't start with HS-, add it
                          if (value && !value.startsWith('HS-')) {
                            value = 'HS-' + value.replace(/^HS-/, '');
                          }
                          setFormData({...formData, code: value});
                        }} 
                        placeholder="Enter item code" 
                        className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[#17144B] font-bold mb-2">Name *</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]" />
                    </div>
                    <div>
                      <label className="block text-[#17144B] font-bold mb-2">Unit</label>
                      <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]">
                        <option>PCS</option>
                        <option>KG</option>
                        <option>MTR</option>
                        <option>BOX</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#17144B] font-bold mb-2">Unit Price (₨) *</label>
                      <input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[#17144B] font-bold mb-2">Description</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]" />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button type="submit" className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-4 py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg">Save</button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-lg font-bold transition-all duration-200">Cancel</button>
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

export default ItemsPage;
