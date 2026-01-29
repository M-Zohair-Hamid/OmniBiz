import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, getBuyers, getItems } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportTableToPDF, exportChartToImage } from '../utils/exportUtils';
import { formatDate, getCurrentDateForInput } from '../utils/dateUtils';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [buyers, setBuyers] = useState([]);
  const [items, setItems] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [formData, setFormData] = useState({
    buyer_id: '', order_date: getCurrentDateForInput(), status: 'pending', tax_rate: 0, notes: '', items: [{ item_id: '', quantity: 1 }]
  });

  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getOrders(page, 10);
      setOrders(response.data.data);
      applyFilters(response.data.data, searchTerm);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchBuyersAndItems = async () => {
    try {
      const buyersRes = await getBuyers(1, 100);
      const itemsRes = await getItems(1, 100);
      setBuyers(buyersRes.data.data);
      setItems(itemsRes.data.data);
    } catch (error) {
      showToast('Failed to load buyers or items', 'error');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBuyersAndItems();
  }, []);

  // Apply client-side search for buyer, order number, date, month, or year
  const applyFilters = (list = orders, term = searchTerm) => {
    const search = (term || '').trim().toLowerCase();
    if (!search) {
      setFilteredOrders(list);
      return;
    }

    const result = list.filter(o => {
      const buyer = (o.buyer_name || '').toLowerCase();
      const number = String(o.order_number || '').toLowerCase();
      const formattedDate = (formatDate(o.order_date) || '').toLowerCase();

      const d = new Date(o.order_date);
      const validDate = !isNaN(d.getTime());
      const year = validDate ? String(d.getFullYear()) : '';
      const month = validDate ? String(d.getMonth() + 1).padStart(2, '0') : '';
      const day = validDate ? String(d.getDate()).padStart(2, '0') : '';
      const isoDate = validDate ? `${year}-${month}-${day}` : '';
      const slashDate = validDate ? `${month}/${day}/${year}` : '';

      const matchesBuyer = buyer.includes(search);
      const matchesNumber = number.includes(search);
      const matchesMonth = month === search;
      const matchesYear = year === search;
      const matchesDate = formattedDate.includes(search) || isoDate.includes(search) || slashDate.includes(search);

      return matchesBuyer || matchesNumber || matchesMonth || matchesYear || matchesDate;
    });

    setFilteredOrders(result);
  };

  // Re-apply search when input or data changes
  useEffect(() => {
    applyFilters(orders, searchTerm);
  }, [searchTerm, orders]);

  const handleAddOrder = () => {
    setEditingId(null);
    setFormData({ buyer_id: '', order_date: getCurrentDateForInput(), status: 'pending', tax_rate: 0, notes: '', items: [{ item_id: '', quantity: 1 }] });
    setShowForm(true);
  };

  const handleEditOrder = async (order) => {
    try {
      // Fetch full order details including items
      const response = await getOrder(order.id);
      const fullOrder = response.data;
      
      // Format date for input field (YYYY-MM-DD)
      let formattedDate = getCurrentDateForInput();
      if (fullOrder.order_date) {
        // Handle ISO format or other formats
        const dateMatch = fullOrder.order_date.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          formattedDate = dateMatch[0];
        } else {
          // Try parsing the date
          const d = new Date(fullOrder.order_date);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          }
        }
      }
      
      setEditingId(order.id);
      setFormData({
        buyer_id: String(fullOrder.buyer_id),
        order_date: formattedDate,
        status: fullOrder.status,
        tax_rate: fullOrder.tax_rate || 0,
        notes: fullOrder.notes || '',
        items: fullOrder.items.map(item => ({
          item_id: String(item.item_id),
          quantity: parseFloat(item.quantity)
        }))
      });
      setShowForm(true);
    } catch (error) {
      showToast('Failed to load order details', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return; // Prevent double submission

    if (!formData.buyer_id || formData.items.some(i => !i.item_id || !i.quantity)) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    console.log('Submitting form data:', formData); // Debug log

    setSubmitting(true);
    try {
      // Auto-merge duplicate items before submission
      const itemMap = new Map();
      for (const item of formData.items) {
        const itemId = parseInt(item.item_id, 10);
        const qty = Number.isFinite(parseFloat(item.quantity)) ? parseFloat(item.quantity) : 0;
        
        if (itemMap.has(itemId)) {
          itemMap.set(itemId, itemMap.get(itemId) + qty);
        } else {
          itemMap.set(itemId, qty);
        }
      }
      
      const mergedItems = Array.from(itemMap, ([itemId, qty]) => ({
        item_id: itemId,
        quantity: qty
      }));
      
      // Prepare data for API - convert string IDs to integers
      const submitData = {
        ...formData,
        buyer_id: formData.buyer_id ? parseInt(formData.buyer_id) : null,
        items: mergedItems
      };

      console.log('Prepared submit data:', submitData); // Debug log

      if (editingId) {
        console.log('Updating order:', editingId, 'with data:', submitData); // Debug log
        await updateOrder(editingId, submitData);
        showToast('Order updated successfully', 'success');
      } else {
        await createOrder(submitData);
        showToast('Order created successfully', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      // Reset form
      setFormData({ 
        buyer_id: '', 
        order_date: getCurrentDateForInput(), 
        status: 'pending', 
        tax_rate: 0, 
        notes: '', 
        items: [{ item_id: '', quantity: 1 }] 
      });
      // Refresh orders list
      await fetchOrders(currentPage);
    } catch (error) {
      const errMsg = error?.response?.data?.error || error?.message || (editingId ? 'Failed to update order' : 'Failed to create order');
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteOrder(id);
        showToast('Order deleted', 'success');
        fetchOrders(currentPage);
      } catch (error) {
        showToast('Failed to delete order', 'error');
      }
    }
  };

  const handleOpenOptions = (order) => {
    setSelectedOrder(order);
    setShowOptionsModal(true);
  };

  const handleGenerateInvoice = () => {
    setShowOptionsModal(false);
    showToast('Generate Sales Tax Invoice - Coming soon', 'info');
    // TODO: Implement invoice generation
  };

  const handleGenerateBill = () => {
    setShowOptionsModal(false);
    showToast('Generate Bill - Coming soon', 'info');
    // TODO: Implement bill generation
  };

  const handleRecordPayment = () => {
    setShowOptionsModal(false);
    showToast('Record Payment - Coming soon', 'info');
    // TODO: Implement payment recording
  };

  const addItemRow = () => {
    setFormData({...formData, items: [...formData.items, { item_id: '', quantity: 1 }]});
  };

  const confirmAddItem = (index) => {
    const currentItem = formData.items[index];
    
    if (!currentItem.item_id || !currentItem.quantity) {
      showToast('Please select item and quantity first', 'warning');
      return;
    }
    
    // Get item details and check stock
    const itemDetail = items.find(i => String(i.id) === String(currentItem.item_id));
    if (!itemDetail) {
      showToast('Item not found', 'error');
      return;
    }
    
    const requestedQty = Number.isFinite(parseFloat(currentItem.quantity)) ? parseFloat(currentItem.quantity) : 0;
    const availableStock = Number.isFinite(parseFloat(itemDetail.quantity_in_stock)) ? parseFloat(itemDetail.quantity_in_stock) : 0;
    
    // Check stock availability
    if (requestedQty > availableStock) {
      showToast(`Insufficient stock for ${itemDetail.name}. Available: ${availableStock}`, 'warning');
      return;
    }
    
    // Check if this item already exists in other rows
    const currentItemId = parseInt(currentItem.item_id, 10);
    const existingIndex = formData.items.findIndex((item, i) => 
      i !== index && parseInt(item.item_id, 10) === currentItemId
    );
    
    if (existingIndex !== -1) {
      // Item already exists - merge quantities into the current row, drop the other row
      const newItems = [...formData.items];
      const baseQty = Number.isFinite(parseFloat(newItems[index].quantity)) ? parseFloat(newItems[index].quantity) : 0;
      const existingQty = Number.isFinite(parseFloat(newItems[existingIndex].quantity)) ? parseFloat(newItems[existingIndex].quantity) : 0;
      const mergedQty = baseQty + existingQty;
      
      // Check merged total doesn't exceed stock
      if (mergedQty > availableStock) {
        showToast(`Total quantity ${mergedQty} exceeds available stock ${availableStock}`, 'warning');
        return;
      }
      
      newItems[index].quantity = mergedQty;
      newItems.splice(existingIndex, 1); // Remove the other row, keep current row visible
      
      setFormData({...formData, items: newItems});
      showToast(`Merged quantities for "${itemDetail.name}"`, 'success');
    } else {
      showToast('Item added', 'success');
    }
  };

  const removeItemRow = (index) => {
    setFormData({...formData, items: formData.items.filter((_, i) => i !== index)});
  };

  const handleItemRowKeyDown = (index, event) => {
    if (event.key === 'Enter' || event.key === 'NumpadEnter') {
      event.preventDefault();
      confirmAddItem(index);
    }
  };

  const updateItemRow = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'quantity') {
      newItems[index][field] = value === '' ? '' : parseFloat(value) || 0;
    } else if (field === 'item_id') {
      newItems[index][field] = String(value); // Keep as string for select
    } else {
      newItems[index][field] = value;
    }
    setFormData({...formData, items: newItems});
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-red-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-red-800 to-red-900 opacity-80"></div>
      <Sidebar companyName={user?.full_name || 'User'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold text-white">Orders Management</h1>
            <button onClick={handleAddOrder} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 active:scale-95 border border-orange-400 border-opacity-30">+ New Order</button>
          </div>

          {/* Search */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1">
                <label className="block text-orange-700 font-bold mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buyer, order #, date (dd-mm-yyyy), month (01), or year (2026)"
                  className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-orange-200 rounded-lg focus:border-orange-400"
                />
              </div>
              <div className="flex gap-2 md:justify-end">
                <button onClick={() => applyFilters(orders, searchTerm)} className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-semibold shadow-md">Apply</button>
                <button onClick={() => { setSearchTerm(''); applyFilters(orders, ''); }} className="flex-1 md:flex-none px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold">Clear</button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30">
            {loading ? <div className="p-8 text-center text-white">Loading...</div> : filteredOrders.length === 0 ? <div className="p-8 text-center text-gray-200">No orders found</div> : (
              <>
                <div className="flex justify-end gap-2 p-4 border-b border-red-600">
                  <button onClick={() => exportTableToPDF('ordersTable', 'orders.pdf')} className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">📄 PDF</button>
                  <button onClick={() => exportChartToImage('ordersTable', 'orders.png')} className="px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">🖼️ PNG</button>
                </div>
                <div className="overflow-x-auto">
                  <table id="ordersTable" className="w-full text-sm">
                    <thead className="border-b border-red-600">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-red-700">Order #</th>
                        <th className="px-4 py-2 text-left font-bold text-red-700">Buyer</th>
                        <th className="px-4 py-2 text-left font-bold text-red-700">Date</th>
                        <th className="px-4 py-2 text-left font-bold text-red-700">Total</th>
                        <th className="px-4 py-2 text-left font-bold text-red-700">Status</th>
                        <th className="px-4 py-2 text-left font-bold text-red-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="border-b border-red-600 hover:bg-orange-50 hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                          <td className="px-4 py-2 font-bold text-black">{highlightText(order.order_number)}</td>
                          <td className="px-4 py-2 text-black font-semibold">{highlightText(order.buyer_name)}</td>
                          <td className="px-4 py-2 text-black font-semibold">{highlightText(formatDate(order.order_date))}</td>
                          <td className="px-4 py-2 font-semibold text-black">₨ {order.total_amount.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-4 py-2"><span className="bg-yellow-300 bg-opacity-30 text-yellow-800 border border-yellow-300 border-opacity-50 px-2 py-1 rounded text-xs font-bold">{highlightText(order.status)}</span></td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2 items-center">
                              <button onClick={() => handleEditOrder(order)} className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-105 active:scale-95">Edit</button>
                              <button onClick={() => handleDeleteOrder(order.id)} className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-105 active:scale-95">Delete</button>
                              <button onClick={() => handleOpenOptions(order)} className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-105 active:scale-95">Options</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!searchTerm.trim()) && (
                  <div className="flex justify-between items-center p-4">
                    <span className="text-black">Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button onClick={() => fetchOrders(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-semibold transition-all duration-200">Previous</button>
                      <button onClick={() => fetchOrders(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-semibold transition-all duration-200">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-black">{editingId ? 'Edit Order' : 'New Order'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-orange-700 font-bold mb-2">Buyer *</label>
                      <select value={String(formData.buyer_id)} onChange={(e) => setFormData({...formData, buyer_id: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-orange-200 rounded-lg focus:border-orange-400">
                        <option value="">Select buyer</option>
                        {buyers.map(b => <option key={b.id} value={String(b.id)}>{b.company_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-orange-700 font-bold mb-2">Company Name</label>
                      <input type="text" value={formData.buyer_id ? (buyers.find(b => b.id === parseInt(formData.buyer_id))?.company_name || '') : ''} readOnly className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-orange-200 rounded-lg focus:border-orange-400 bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-orange-700 font-bold mb-2">Order Date</label>
                      <input type="date" value={formData.order_date} onChange={(e) => setFormData({...formData, order_date: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-orange-200 rounded-lg focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="block text-orange-700 font-bold mb-2">Tax Rate (%)</label>
                      <input type="number" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value)})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-orange-200 rounded-lg focus:border-orange-400" />
                    </div>
                  </div>

                  <h3 className="font-semibold mb-2">Items</h3>
                  <div className="border rounded p-3 mb-4 max-h-32 overflow-y-auto">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <select value={String(item.item_id)} onChange={(e) => updateItemRow(idx, 'item_id', e.target.value)} onKeyDown={(e) => handleItemRowKeyDown(idx, e)} className="flex-1 px-2 py-1 border rounded text-sm">
                          <option value="">Select item</option>
                          {items.map(i => <option key={i.id} value={String(i.id)}>{i.name} (₨{i.unit_price})</option>)}
                        </select>
                        <input type="number" step="0.01" value={item.quantity} onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)} onKeyDown={(e) => handleItemRowKeyDown(idx, e)} placeholder="Qty" className="w-24 px-2 py-1 border rounded text-sm" />
                        <button type="button" onClick={() => confirmAddItem(idx)} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">+</button>
                        <button type="button" onClick={() => removeItemRow(idx)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addItemRow} className="mb-4 text-white hover:text-gray-200 font-semibold text-sm">+ Add Item</button>

                  <div className="flex gap-4">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-all"
                    >
                      {submitting ? 'Saving...' : (editingId ? 'Update Order' : 'Create Order')}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded font-semibold">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Options Modal */}
          {showOptionsModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-orange-700 text-center">Order Options</h2>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleGenerateInvoice}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 active:scale-95"
                  >
                    📄 Sales Tax Invoice
                  </button>
                  <button 
                    onClick={handleGenerateBill}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 active:scale-95"
                  >
                    📃 Generate Bill
                  </button>
                  <button 
                    onClick={handleRecordPayment}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-green-500/50 transform hover:scale-105 active:scale-95"
                  >
                    💰 Record Payment
                  </button>
                  <button 
                    onClick={() => setShowOptionsModal(false)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95 mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
