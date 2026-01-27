import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, getBuyers, getItems } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportTableToPDF, exportChartToImage } from '../utils/exportUtils';
import { formatDate, getCurrentDateForInput } from '../utils/dateUtils';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [buyers, setBuyers] = useState([]);
  const [items, setItems] = useState([]);
  
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
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
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
      // Prepare data for API - convert string IDs to integers
      const submitData = {
        ...formData,
        buyer_id: formData.buyer_id ? parseInt(formData.buyer_id) : null,
        items: formData.items.map(item => ({
          item_id: item.item_id ? parseInt(item.item_id) : null,
          quantity: item.quantity
        }))
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

  const addItemRow = () => {
    setFormData({...formData, items: [...formData.items, { item_id: '', quantity: 1 }]});
  };

  const confirmAddItem = (index) => {
    const currentItem = formData.items[index];
    
    if (!currentItem.item_id || !currentItem.quantity) {
      showToast('Please select item and quantity first', 'warning');
      return;
    }
    
    // Check if this item already exists in other rows (compare as numbers)
    const currentItemId = parseInt(currentItem.item_id, 10);
    const existingIndex = formData.items.findIndex((item, i) => 
      i !== index && parseInt(item.item_id) === currentItemId
    );
    
    if (existingIndex !== -1) {
      // Item already exists - merge quantities and remove current row
      const newItems = formData.items
        .map((item, i) => {
          if (i === existingIndex) {
            const baseQty = Number.isFinite(parseFloat(item.quantity)) ? parseFloat(item.quantity) : 0;
            const addQty = Number.isFinite(parseFloat(currentItem.quantity)) ? parseFloat(currentItem.quantity) : 0;
            return { 
              ...item, 
              quantity: baseQty + addQty
            };
          }
          return item;
        })
        .filter((_, i) => i !== index); // Remove current row
      
      setFormData({...formData, items: newItems});
      const itemName = items.find(it => String(it.id) === String(currentItem.item_id))?.name || 'item';
      showToast(`Merged quantities for "${itemName}"`, 'success');
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
      // Auto-merge: check if this item already exists in another row
      if (value) {
        const selectedItemId = parseInt(value, 10);
        const existingIndex = newItems.findIndex((item, i) => i !== index && parseInt(item.item_id, 10) === selectedItemId);

        if (existingIndex !== -1) {
          // Item already exists - merge quantities and remove current row
          const currentQty = Number.isFinite(parseFloat(newItems[index].quantity)) ? parseFloat(newItems[index].quantity) : 0;
          const existingQty = Number.isFinite(parseFloat(newItems[existingIndex].quantity)) ? parseFloat(newItems[existingIndex].quantity) : 0;
          newItems[existingIndex].quantity = currentQty + existingQty;
          newItems.splice(index, 1); // Remove current row

          const itemName = items.find(it => String(it.id) === String(selectedItemId))?.name || 'item';
          showToast(`Auto-merged quantities for "${itemName}"`, 'success');
        }
      }
    } else {
      newItems[index][field] = value;
    }
    setFormData({...formData, items: newItems});
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100" style={{ backgroundImage: 'url(/imgs/1.jpg)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <Sidebar companyName={user?.full_name || 'User'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Orders Management</h1>
            <button onClick={handleAddOrder} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95 border border-blue-400 border-opacity-30">+ New Order</button>
          </div>

          {/* Orders Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 overflow-hidden">
            {loading ? <div className="p-8 text-center">Loading...</div> : orders.length === 0 ? <div className="p-8 text-center text-gray-600">No orders found</div> : (
              <>
                <div className="flex justify-end gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
                  <button onClick={() => exportTableToPDF('ordersTable', 'orders.pdf')} className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">📄 PDF</button>
                  <button onClick={() => exportChartToImage('ordersTable', 'orders.png')} className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">🖼️ PNG</button>
                </div>
                <div className="overflow-x-auto">
                  <table id="ordersTable" className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-blue-700">Order #</th>
                        <th className="px-4 py-2 text-left font-bold text-blue-700">Buyer</th>
                        <th className="px-4 py-2 text-left font-bold text-blue-700">Date</th>
                        <th className="px-4 py-2 text-left font-bold text-blue-700">Total</th>
                        <th className="px-4 py-2 text-left font-bold text-blue-700">Status</th>
                        <th className="px-4 py-2 text-left font-bold text-blue-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-b border-blue-100 hover:bg-blue-50 hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                          <td className="px-4 py-2 font-bold text-blue-700">{order.order_number}</td>
                          <td className="px-4 py-2 text-black font-semibold">{order.buyer_name}</td>
                          <td className="px-4 py-2 text-black font-semibold">{formatDate(order.order_date)}</td>
                          <td className="px-4 py-2 font-semibold text-black">₨ {order.total_amount.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-4 py-2"><span className="bg-yellow-300 bg-opacity-30 text-yellow-800 border border-yellow-300 border-opacity-50 px-2 py-1 rounded text-xs font-bold">{order.status}</span></td>
                          <td className="px-4 py-2">
                            <button onClick={() => handleEditOrder(order)} className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-105 active:scale-95 mr-2">Edit</button>
                            <button onClick={() => handleDeleteOrder(order.id)} className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-105 active:scale-95">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => fetchOrders(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-semibold transition-all duration-200">Previous</button>
                    <button onClick={() => fetchOrders(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-semibold transition-all duration-200">Next</button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-blue-700">{editingId ? 'Edit Order' : 'New Order'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Buyer *</label>
                      <select value={String(formData.buyer_id)} onChange={(e) => setFormData({...formData, buyer_id: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400">
                        <option value="">Select buyer</option>
                        {buyers.map(b => <option key={b.id} value={String(b.id)}>{b.company_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Company Name</label>
                      <input type="text" value={formData.buyer_id ? (buyers.find(b => b.id === parseInt(formData.buyer_id))?.company_name || '') : ''} readOnly className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400 bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Order Date</label>
                      <input type="date" value={formData.order_date} onChange={(e) => setFormData({...formData, order_date: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-blue-700 font-bold mb-2">Tax Rate (%)</label>
                      <input type="number" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value)})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-blue-200 rounded-lg focus:border-blue-400" />
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
                  <button type="button" onClick={addItemRow} className="mb-4 text-black hover:text-gray-800 font-semibold text-sm">+ Add Item</button>

                  <div className="flex gap-4">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-all"
                    >
                      {submitting ? 'Saving...' : (editingId ? 'Update Order' : 'Create Order')}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded font-semibold">Cancel</button>
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

export default OrdersPage;
