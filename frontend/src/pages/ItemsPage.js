import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getItems, createItem, updateItem, deleteItem } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportTableToPDF, exportChartToImage } from '../utils/exportUtils';

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', unit: 'PCS', unit_price: 0, quantity_in_stock: 0, add_stock: 0
  });

  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const fetchItems = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getItems(page, 10, search);
      setItems(response.data.data);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    fetchItems(1, e.target.value);
  };

  const handleAddItem = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', description: '', unit: 'PCS', unit_price: 0, quantity_in_stock: 0, add_stock: 0 });
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
      // If adding stock, update quantity_in_stock
      const submitData = { ...formData };
      if (formData.add_stock && formData.add_stock > 0) {
        submitData.quantity_in_stock = parseFloat(formData.quantity_in_stock) + parseFloat(formData.add_stock);
        submitData.add_stock = 0; // Reset add_stock after using it
      }
      
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
      fetchItems(currentPage);
    } catch (error) {
      showToast('Failed to save item', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        showToast('Item deleted successfully', 'success');
        fetchItems(currentPage);
      } catch (error) {
        showToast('Failed to delete item', 'error');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100" style={{ backgroundImage: 'url(/imgs/1.jpg)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <Sidebar companyName={user?.full_name || 'User'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Items Management</h1>
            <button
              onClick={handleAddItem}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-black px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95 border border-blue-400 border-opacity-30"
            >
              + Add Item
            </button>
          </div>

          {/* Stock Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Items</p>
                  <p className="text-2xl font-bold text-blue-700">{items.length}</p>
                </div>
                <div className="bg-blue-500 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Stock</p>
                  <p className="text-2xl font-bold text-green-700">{items.reduce((sum, item) => sum + item.quantity_in_stock, 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-500 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-700">{items.filter(item => item.quantity_in_stock > 0 && item.quantity_in_stock <= 10).length}</p>
                </div>
                <div className="bg-orange-500 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-xl shadow-glass-lg border border-white border-opacity-30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-700">{items.filter(item => item.quantity_in_stock === 0).length}</p>
                </div>
                <div className="bg-red-500 bg-opacity-20 p-3 rounded-lg">
                  <span className="text-2xl">🚫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 backdrop-blur-sm bg-white bg-opacity-40 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-blue-300 focus:bg-opacity-60 transition-all"
            />
          </div>

          {/* Items Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No items found</div>
            ) : (
              <>
                <div className="flex justify-end gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
                  <button onClick={() => exportTableToPDF('itemsTable', 'items.pdf')} className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">📄 PDF</button>
                  <button onClick={() => exportChartToImage('itemsTable', 'items.png')} className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">🖼️ PNG</button>
                </div>
                <div className="overflow-x-auto">
                  <table id="itemsTable" className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-blue-700">Code</th>
                        <th className="px-6 py-3 text-left font-bold text-blue-700">Name</th>
                        <th className="px-6 py-3 text-left font-bold text-blue-700">Unit</th>
                        <th className="px-6 py-3 text-left font-bold text-blue-700">Price (₨)</th>
                        <th className="px-6 py-3 text-left font-bold text-blue-700">Stock</th>
                        <th className="px-6 py-3 text-left font-bold text-blue-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-b border-blue-100 hover:bg-blue-50 hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                          <td className="px-6 py-3 font-semibold text-gray-800">{item.code}</td>
                          <td className="px-6 py-3 text-gray-700">{item.name}</td>
                          <td className="px-6 py-3 text-gray-700">{item.unit}</td>
                          <td className="px-6 py-3 font-semibold text-blue-700">₨{item.unit_price.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3 font-semibold text-gray-800">{item.quantity_in_stock}</td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95"
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
                <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                  <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchItems(currentPage - 1, searchTerm)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-semibold transition-all duration-200"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchItems(currentPage + 1, searchTerm)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-semibold transition-all duration-200"
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
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-blue-700">{editingId ? 'Edit Item' : 'Add Item'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Code *</label>
                      <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="Enter item code" className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" required />
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Name *</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Unit</label>
                      <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400">
                        <option>PCS</option>
                        <option>KG</option>
                        <option>MTR</option>
                        <option>BOX</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Unit Price (₨) *</label>
                      <input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Stock Quantity</label>
                      <input type="number" step="0.01" value={formData.quantity_in_stock} onChange={(e) => setFormData({...formData, quantity_in_stock: parseFloat(e.target.value)})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Add Stock</label>
                      <input type="number" step="0.01" value={formData.add_stock} onChange={(e) => setFormData({...formData, add_stock: parseFloat(e.target.value) || 0})} placeholder="Enter amount to add" className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-blue-700 font-bold mb-2">Description</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg">Save</button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all duration-200">Cancel</button>
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
