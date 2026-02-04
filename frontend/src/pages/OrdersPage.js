import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, getBuyers, getItems, createPayment, getOrderPayments } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { exportTableToPDF, exportChartToImage } from '../utils/exportUtils';
import { formatDate, getCurrentDateForInput } from '../utils/dateUtils';

const OrdersPage = () => {
  const navigate = useNavigate();
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
  const [showBillTaxModal, setShowBillTaxModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdditionalPaymentModal, setShowAdditionalPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    payment_type: 'full',
    payment_date: getCurrentDateForInput(),
    income_tax_rate: '',
    notes: ''
  });
  
  const [formData, setFormData] = useState({
    buyer_id: '', order_date: getCurrentDateForInput(), status: 'pending', tax_rate: 0, notes: '', items: [{ item_id: '', quantity: 1, item_query: '' }]
  });

  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const filteredItems = items.filter(i => {
    const term = itemSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      String(i.name || '').toLowerCase().includes(term) ||
      String(i.code || '').toLowerCase().includes(term)
    );
  });

  const getFilteredItemsForRow = (query) => {
    if (!query.trim()) return items;
    const term = query.trim().toLowerCase();
    return items.filter(i =>
      String(i.code || '').toLowerCase().includes(term) ||
      String(i.name || '').toLowerCase().includes(term)
    );
  };

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

  const roundToNearestTen = (value) => {
    const number = Math.round(Number(value) || 0);
    const lastDigit = number % 10;
    return lastDigit <= 5 ? number - lastDigit : number + (10 - lastDigit);
  };

  const formatRoundedAmount = (value) => roundToNearestTen(value).toLocaleString('en-PK');

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
      const buyersRes = await getBuyers(1, 500);
      const itemsRes = await getItems(1, 500);
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
    setFormData({ buyer_id: '', order_date: getCurrentDateForInput(), status: 'pending', tax_rate: 0, notes: '', items: [{ item_id: '', quantity: 1, item_query: '' }] });
    setItemSearchTerm('');
    fetchBuyersAndItems();
    setShowForm(true);
  };

  const handleEditOrder = async (order) => {
    try {
      // First fetch buyers and items to ensure we have fresh data
      const buyersRes = await getBuyers(1, 500);
      const itemsRes = await getItems(1, 500);
      const buyersList = buyersRes.data.data;
      const itemsList = itemsRes.data.data;
      
      setBuyers(buyersList);
      setItems(itemsList);

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
        items: fullOrder.items.map(item => {
          let itemQuery = '';
          let foundItemData = null;
          
          // Try to get item data from the response first
          if (item.item && item.item.code) {
            itemQuery = getItemLabel(item.item);
            foundItemData = item.item;
          } else {
            // Otherwise look it up from freshly fetched items array
            const foundItem = itemsList.find(i => i.id === item.item_id);
            if (foundItem) {
              itemQuery = getItemLabel(foundItem);
              foundItemData = foundItem;
            }
          }
          
          // If still no code, construct it manually
          if (!itemQuery && item.item_id) {
            itemQuery = `${foundItemData?.code || 'N/A'} | ${foundItemData?.name || 'Item'} (₨${foundItemData?.unit_price || 0})`;
          }
          
          return {
            item_id: String(item.item_id),
            quantity: parseFloat(item.quantity),
            item_query: itemQuery
          };
        })
      });
      setItemSearchTerm('');
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
        const response = await updateOrder(editingId, submitData);
        
        // Check if status was automatically updated to 'paid'
        if (response.data.order && response.data.order.status === 'paid') {
          showToast('✅ Order updated! Amount now equals paid amount - Order marked as PAID', 'success');
        } else {
          showToast('Order updated successfully', 'success');
        }
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
    if (window.confirm('Are you sure? Deleting this order will also delete all related payments.')) {
      try {
        await deleteOrder(id);
        showToast('Order deleted', 'success');
        fetchOrders(currentPage);
      } catch (error) {
        showToast('Failed to delete order', 'error');
      }
    }
  };

  const handleViewOrder = async (order) => {
    try {
      const response = await getOrder(order.id);
      setViewingOrder(response.data);
      setShowViewModal(true);
    } catch (error) {
      showToast('Failed to load order details', 'error');
    }
  };

  const handleOpenOptions = (order) => {
    setSelectedOrder(order);
    setShowOptionsModal(true);
  };

  const isPaymentLocked = (order) =>
    order && ['partial', 'paid'].includes(String(order.status).toLowerCase());

  const getPaymentButtonLabel = (order) => {
    const status = String(order?.status || '').toLowerCase();
    if (status === 'partial') return '🔒 Record Remaining';
    if (status === 'paid') return '🔒 Payment Recorded';
    return '💰 Record Payment';
  };

  const getOrderDateObj = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      const parts = value.split('-');
      if (parts.length === 3 && parts[0].length === 2) {
        const [dd, mm, yyyy] = parts;
        return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      }
    }
    return new Date(value);
  };

  const isOrderOverdue = (order) => {
    const status = String(order?.status || '').toLowerCase();
    if (status === 'paid') return false;
    const date = getOrderDateObj(order?.order_date);
    if (!date || isNaN(date.getTime())) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 30;
  };

  const getStatusBadgeClasses = (order) => {
    const status = String(order?.status || '').toLowerCase();
    if (isOrderOverdue(order)) {
      return 'bg-red-700 text-white border border-red-800';
    }
    if (status === 'paid') {
      return 'bg-green-500 bg-opacity-30 text-green-900 border border-green-400';
    }
    if (status === 'partial') {
      return 'bg-yellow-300 bg-opacity-30 text-yellow-800 border border-yellow-300 border-opacity-50';
    }
    return 'bg-red-200 bg-opacity-50 text-red-900 border border-red-300';
  };

  const getStatusTextClass = (order) => {
    const status = String(order?.status || '').toLowerCase();
    if (isOrderOverdue(order)) return 'text-red-800';
    if (status === 'paid') return 'text-green-700';
    if (status === 'partial') return 'text-yellow-600';
    return 'text-red-500';
  };

  const handleGenerateInvoice = async () => {
    if (!selectedOrder) return;
    
    setShowOptionsModal(false);
    showToast('Opening Sales Tax Invoice...', 'info');
    
    // Navigate to invoice page with order ID
    navigate(`/invoice/${selectedOrder.id}`);
  };

  const handleGenerateBill = () => {
    setShowOptionsModal(false);
    setShowBillTaxModal(true);
  };

  const handleBillWithTax = () => {
    if (!selectedOrder) return;
    setShowBillTaxModal(false);
    showToast('Opening Bill (Including Tax)...', 'info');
    navigate(`/bill/${selectedOrder.id}?tax=include`);
  };

  const handleBillWithoutTax = () => {
    if (!selectedOrder) return;
    setShowBillTaxModal(false);
    showToast('Opening Bill (Excluding Tax)...', 'info');
    navigate(`/bill/${selectedOrder.id}?tax=exclude`);
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder) return;
    
    // For partial orders, show record additional payment modal
    if (String(selectedOrder.status || '').toLowerCase() === 'partial') {
      setShowOptionsModal(false);
      try {
        const response = await getOrderPayments(selectedOrder.id);
        const remaining = response.data.remaining;
        
        setPaymentForm({
          amount: remaining.toFixed(2),
          payment_method: 'cash',
          payment_type: remaining >= selectedOrder.total_amount ? 'full' : 'partial',
          payment_date: getCurrentDateForInput(),
          notes: ''
        });
        setShowAdditionalPaymentModal(true);
      } catch (error) {
        showToast('Failed to load payment details', 'error');
      }
      return;
    }

    if (isPaymentLocked(selectedOrder)) {
      showToast('Payment already recorded for this order', 'info');
      return;
    }
    setShowOptionsModal(false);
    
    // Fetch existing payments to calculate remaining amount
    try {
      const response = await getOrderPayments(selectedOrder.id);
      const remaining = response.data.remaining;
      
      setPaymentForm({
        amount: remaining.toFixed(2),
        payment_method: 'cash',
        payment_type: remaining >= selectedOrder.total_amount ? 'full' : 'partial',
        payment_date: getCurrentDateForInput(),
        notes: ''
      });
      setShowPaymentModal(true);
    } catch (error) {
      // If no payments yet, use full amount
      setPaymentForm({
        amount: selectedOrder.total_amount.toFixed(2),
        payment_method: 'cash',
        payment_type: 'full',
        payment_date: getCurrentDateForInput(),
        notes: ''
      });
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedOrder || !paymentForm.amount) {
      showToast('Please enter payment amount', 'warning');
      return;
    }

    if (isPaymentLocked(selectedOrder)) {
      showToast('Payment already recorded for this order', 'info');
      return;
    }

    let amount = parseFloat(paymentForm.amount);
    // Round amount to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    
    if (amount <= 0) {
      showToast('Payment amount must be greater than 0', 'error');
      return;
    }

    // Parse income tax rate (percentage)
    let income_tax_rate = parseFloat(paymentForm.income_tax_rate || 0);
    income_tax_rate = Math.round(income_tax_rate * 100) / 100;

    try {
      const response = await createPayment({
        order_id: selectedOrder.id,
        amount: amount,
        payment_method: paymentForm.payment_method,
        payment_type: paymentForm.payment_type,
        payment_date: paymentForm.payment_date,
        income_tax_rate: income_tax_rate,
        notes: paymentForm.notes
      });
      
      // Check if payment was auto-upgraded to full
      if (response.data.auto_upgraded) {
        showToast('✅ Payment recorded! Auto-upgraded from Partial to FULL (amount equals remaining balance)', 'success');
      } else {
        showToast('Payment recorded successfully', 'success');
      }
      
      setShowPaymentModal(false);
      setShowAdditionalPaymentModal(false);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to record payment', 'error');
    }
  };

  const addItemRow = () => {
    setFormData({...formData, items: [...formData.items, { item_id: '', quantity: 1, item_query: '' }]});
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
    } else if (field === 'item_query') {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = value;
    }
    setFormData({...formData, items: newItems});
  };

  const getItemLabel = (item) => {
    if (!item) return '';
    const labelCode = item.code || '';
    return `${labelCode} | ${item.name} (₨${item.unit_price})`;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17144B] via-[#3A3F8C] to-[#17144B] opacity-80"></div>
      <Sidebar companyName={user?.company_name || 'Business'} />
      
      <div className="flex-1 ml-64 relative z-10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold text-white">Orders Management</h1>
            <button onClick={handleAddOrder} className="bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95 border border-[#00D4FF] border-opacity-30">+ New Order</button>
          </div>

          {/* Search */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1">
                <label className="block text-[#17144B] font-bold mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buyer, order #, date (dd-mm-yyyy), month (01), or year (2026)"
                  className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]"
                />
              </div>
              <div className="flex gap-2 md:justify-end">
                <button onClick={() => applyFilters(orders, searchTerm)} className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] rounded-lg font-semibold shadow-md">Apply</button>
                <button onClick={() => { setSearchTerm(''); applyFilters(orders, ''); }} className="flex-1 md:flex-none px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold">Clear</button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="backdrop-blur-xl bg-white bg-opacity-40 rounded-2xl shadow-glass-lg border border-white border-opacity-30">
            {loading ? <div className="p-8 text-center text-white">Loading...</div> : filteredOrders.length === 0 ? <div className="p-8 text-center text-gray-200">No orders found</div> : (
              <>
                <div className="overflow-x-auto">
                  <table id="ordersTable" className="w-full text-sm">
                    <thead className="border-b border-[#17144B]">
                      <tr>
                        <th className="px-4 py-2 text-center font-bold text-[#17144B]">Order #</th>
                        <th className="px-4 py-2 text-center font-bold text-[#17144B]">Buyer</th>
                        <th className="px-4 py-2 text-center font-bold text-[#17144B]">Date</th>
                        <th className="px-4 py-2 text-center font-bold text-[#17144B]">Total</th>
                        <th className="px-4 py-2 text-center font-bold text-[#17144B]">Status</th>
                        <th className="px-4 py-2 text-center font-bold text-[#17144B]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="border-b border-[#3A3F8C] hover:bg-[#3A3F8C] hover:bg-opacity-50 transition-all duration-200 hover:scale-100 hover:shadow-md cursor-pointer">
                          <td className="px-4 py-2 font-bold text-black text-center">{highlightText(order.order_number)}</td>
                          <td className="px-4 py-2 text-black font-semibold text-center">{highlightText(order.buyer_name)}</td>
                          <td className="px-4 py-2 text-black font-semibold text-center">{highlightText(formatDate(order.order_date))}</td>
                          <td className="px-4 py-2 font-semibold text-black text-center">₨ {formatRoundedAmount(order.total_amount)}</td>
                          <td className="px-4 py-2 text-center"><span className={`${getStatusBadgeClasses(order)} px-2 py-1 rounded text-xs font-bold`}>{highlightText(order.status)}</span></td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex gap-2 items-center justify-center flex-wrap">
                              <button onClick={() => handleViewOrder(order)} className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-105 active:scale-95">👁️ View</button>
                              <button 
                                onClick={() => handleEditOrder(order)} 
                                disabled={String(order.status).toLowerCase() === 'paid'}
                                className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                                  String(order.status).toLowerCase() === 'paid'
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] transform hover:scale-105 active:scale-95'
                                }`}
                              >
                                Edit
                              </button>
                              <button onClick={() => handleDeleteOrder(order.id)} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-105 active:scale-95">Delete</button>
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
                      <button onClick={() => fetchOrders(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-[#17144B] rounded-lg font-semibold transition-all duration-200">Previous</button>
                      <button onClick={() => fetchOrders(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 text-[#17144B] rounded-lg font-semibold transition-all duration-200">Next</button>
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
                      <label className="block text-[#17144B] font-bold mb-2">Buyer *</label>
                      <select value={String(formData.buyer_id)} onChange={(e) => setFormData({...formData, buyer_id: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]">
                        <option value="">Select buyer</option>
                        {buyers.map(b => <option key={b.id} value={String(b.id)}>{b.company_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#17144B] font-bold mb-2">Company Name</label>
                      <input type="text" value={formData.buyer_id ? (buyers.find(b => b.id === parseInt(formData.buyer_id))?.company_name || '') : ''} readOnly className="w-full px-3 py-2 backdrop-blur-sm bg-gray-100 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]" />
                    </div>
                    <div>
                      <label className="block text-[#17144B] font-bold mb-2">Order Date</label>
                      <input type="date" value={formData.order_date} onChange={(e) => setFormData({...formData, order_date: e.target.value})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]" />
                    </div>
                    <div>
                      <label className="block text-[#17144B] font-bold mb-2">Tax Rate (%)</label>
                      <input type="number" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value)})} className="w-full px-3 py-2 backdrop-blur-sm bg-white bg-opacity-40 border border-[#3A3F8C] rounded-lg focus:border-[#00D4FF]" />
                    </div>
                  </div>

                  <h3 className="font-semibold mb-2">Items</h3>
                  <div className="border rounded p-3 mb-4 space-y-3">
                    {formData.items.map((item, idx) => {
                      const selectedItem = items.find(i => String(i.id) === String(item.item_id));
                      const displayValue = item.item_query || (selectedItem ? getItemLabel(selectedItem) : '');
                      const suggestedItems = getFilteredItemsForRow(displayValue);
                      const showDropdown = openDropdownIdx === idx;

                      return (
                        <div key={idx} className="relative">
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={displayValue}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateItemRow(idx, 'item_query', value);
                                  setOpenDropdownIdx(idx);
                                  if (!value.trim()) {
                                    updateItemRow(idx, 'item_id', '');
                                    return;
                                  }
                                  const parsedCode = value.split('|')[0].trim();
                                  const match = items.find(i =>
                                    String(i.code || '').toLowerCase() === parsedCode.toLowerCase()
                                  );
                                  if (match) {
                                    updateItemRow(idx, 'item_id', String(match.id));
                                  }
                                }}
                                onFocus={() => setOpenDropdownIdx(idx)}
                                onBlur={() => setTimeout(() => setOpenDropdownIdx(null), 300)}
                                onKeyDown={(e) => handleItemRowKeyDown(idx, e)}
                                placeholder="Search and select item"
                                className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                              {showDropdown && suggestedItems.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50" style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
                                  {suggestedItems.map((suggestion) => (
                                    <div
                                      key={suggestion.id}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        updateItemRow(idx, 'item_query', getItemLabel(suggestion));
                                        updateItemRow(idx, 'item_id', String(suggestion.id));
                                        setOpenDropdownIdx(null);
                                      }}
                                      className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm text-gray-800 border-b last:border-b-0"
                                    >
                                      <div className="font-semibold">{suggestion.code}</div>
                                      <div className="text-xs text-gray-600">{suggestion.name}</div>
                                      <div className="text-xs text-gray-500">₨{suggestion.unit_price}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <input type="number" step="0.01" value={item.quantity} onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)} onKeyDown={(e) => handleItemRowKeyDown(idx, e)} placeholder="Qty" className="w-24 px-2 py-1 border rounded text-sm" />
                            <button type="button" onClick={() => confirmAddItem(idx)} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">+</button>
                            <button type="button" onClick={() => removeItemRow(idx)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={addItemRow} className="mb-4 text-white hover:text-gray-200 font-semibold text-sm">+ Add Item</button>

                  <div className="flex gap-4">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] disabled:bg-gray-400 disabled:cursor-not-allowed text-[#17144B] px-4 py-2 rounded font-semibold transition-all"
                    >
                      {submitting ? 'Saving...' : (editingId ? 'Update Order' : 'Create Order')}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded font-semibold transition-all duration-200">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Options Modal */}
          {showOptionsModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-[#17144B] text-center">Order Options</h2>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleGenerateInvoice}
                    className="w-full bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95"
                  >
                    📄 Sales Tax Invoice
                  </button>
                  <button 
                    onClick={handleGenerateBill}
                    className="w-full bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95"
                  >
                    📃 Generate Bill
                  </button>
                  <button 
                    onClick={handleRecordPayment}
                    disabled={isPaymentLocked(selectedOrder) && String(selectedOrder.status || '').toLowerCase() === 'paid'}
                    className={`w-full px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg ${
                      String(selectedOrder.status || '').toLowerCase() === 'partial'
                        ? 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white hover:shadow-red-500/50 transform hover:scale-105 active:scale-95'
                        : isPaymentLocked(selectedOrder)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-green-500/50 transform hover:scale-105 active:scale-95'
                    }`}
                  >
                    {getPaymentButtonLabel(selectedOrder)}
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

          {/* Bill Tax Options Modal */}
          {showBillTaxModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-[#17144B] text-center">Select Bill Type</h2>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleBillWithTax}
                    className="w-full bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95"
                  >
                    📊 Bill (Including Tax)
                  </button>
                  <button 
                    onClick={handleBillWithoutTax}
                    className="w-full bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] hover:from-[#00B8E0] hover:to-[#00A0C8] text-[#17144B] px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-[#00D4FF]/50 transform hover:scale-105 active:scale-95"
                  >
                    📋 Bill (Excluding Tax)
                  </button>
                  <button 
                    onClick={() => setShowBillTaxModal(false)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95 mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Record Payment Modal */}
          {showPaymentModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-[#17144B] text-center">💳 Record Payment</h2>
                <div className="mb-4 p-4 bg-white bg-opacity-50 rounded-lg">
                  <p className="text-sm text-gray-700"><strong>Order:</strong> {selectedOrder.order_number}</p>
                  <p className="text-sm text-gray-700"><strong>Buyer:</strong> {selectedOrder.buyer_name}</p>
                  <p className="text-sm text-gray-700"><strong>Total:</strong> ₨ {formatRoundedAmount(selectedOrder.total_amount)}</p>
                </div>
                <div className="space-y-4">
                  {/* Payment Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Card</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="cheque">📄 Cheque</option>
                    </select>
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                    <select
                      value={paymentForm.payment_type}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="full">✅ Full Payment</option>
                      <option value="partial">⚠️ Partial Payment</option>
                    </select>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Income Tax Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Income Tax Rate (%) - Optional</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.income_tax_rate}
                      onChange={(e) => setPaymentForm({...paymentForm, income_tax_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 1.5 for 1.5%"
                    />
                    <p className="text-xs text-gray-500 mt-1">Income tax will be calculated as: Payment Amount × Rate / 100</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      placeholder="Additional notes..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={handlePaymentSubmit}
                      disabled={isPaymentLocked(selectedOrder)}
                      className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg ${isPaymentLocked(selectedOrder)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-green-500/50 transform hover:scale-105 active:scale-95'
                      }`}
                    >
                      {getPaymentButtonLabel(selectedOrder)}
                    </button>
                    <button 
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Order Details Modal */}
          {showViewModal && viewingOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <h2 className="text-2xl font-bold mb-6 text-[#17144B]">📋 Order Details</h2>
                
                <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
                  {/* LEFT SIDE - Order Details (Scrollable) */}
                  <div className="flex-1 flex flex-col overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#00D4FF rgba(0,212,255,0.2)'}}>
                    {/* Order Header Info */}
                    <div className="grid grid-cols-2 gap-4 p-6 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30 flex-shrink-0">
                      <div>
                        <p className="text-sm text-gray-600 font-bold uppercase tracking-wide">Order ID</p>
                        <p className="text-3xl font-bold text-[#17144B] mt-2">#{viewingOrder.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-bold uppercase tracking-wide">Order Number</p>
                        <p className="text-xl font-bold text-[#17144B] mt-2 break-words">{viewingOrder.order_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-bold uppercase tracking-wide">Date</p>
                        <p className="text-2xl font-bold text-[#17144B] mt-2">{formatDate(viewingOrder.order_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-bold uppercase tracking-wide">Status</p>
                        <p className={`text-2xl font-bold mt-2 ${getStatusTextClass(viewingOrder)}`}>{viewingOrder.status}</p>
                      </div>
                    </div>

                    {/* Buyer Info */}
                    <div className="p-6 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30 mt-4 flex-shrink-0">
                      <h3 className="font-bold text-[#17144B] mb-4 text-lg">👤 Buyer Information</h3>
                      <p className="text-base text-gray-800 mb-3"><span className="font-bold">Company:</span> {viewingOrder.buyer_name}</p>
                      <p className="text-base text-gray-800"><span className="font-bold">ID:</span> {viewingOrder.buyer_id}</p>
                    </div>

                    {/* Totals Section */}
                    <div className="p-6 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30 mt-4 flex-shrink-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base text-gray-700 font-semibold">Subtotal:</span>
                          <span className="font-bold text-gray-800 text-lg">₨ {formatRoundedAmount((viewingOrder.total_amount / (1 + viewingOrder.tax_rate / 100)) || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-base text-gray-700 font-semibold">Tax ({viewingOrder.tax_rate}%):</span>
                          <span className="font-bold text-gray-800 text-lg">₨ {formatRoundedAmount(viewingOrder.total_amount - (viewingOrder.total_amount / (1 + viewingOrder.tax_rate / 100)))}</span>
                        </div>
                        <div className="flex justify-between items-center border-t-2 border-gray-300 pt-3 mt-3">
                          <span className="font-bold text-[#17144B] text-lg">Total:</span>
                          <span className="font-bold text-emerald-600 text-2xl">₨ {formatRoundedAmount(viewingOrder.total_amount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {viewingOrder.notes && (
                      <div className="p-6 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30 mt-4 flex-shrink-0">
                        <h3 className="font-bold text-[#17144B] mb-3 text-lg">📝 Notes</h3>
                        <p className="text-base text-gray-800">{viewingOrder.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT SIDE - Items List (Scrollable) */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 backdrop-blur-sm bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30 flex-1 flex flex-col overflow-hidden">
                      <h3 className="font-bold text-[#17144B] mb-3 flex-shrink-0">📦 Items</h3>
                      <div className="space-y-2 overflow-y-scroll flex-1" style={{scrollbarWidth: 'thin', scrollbarColor: '#00D4FF rgba(0,212,255,0.2)'}}>
                        {viewingOrder.items && viewingOrder.items.map((item, idx) => {
                          const itemSubtotal = (item.item?.unit_price || 0) * (item.quantity || 0);
                          const itemTax = itemSubtotal * ((viewingOrder.tax_rate || 0) / 100);
                          return (
                            <div key={idx} className="flex flex-col p-3 bg-white bg-opacity-40 rounded border border-white border-opacity-20 hover:bg-opacity-60 transition-all flex-shrink-0">
                              <p className="text-sm font-semibold text-gray-800">{item.item?.name || 'Item'}</p>
                              <p className="text-xs text-gray-600 mb-2">Code: {item.item?.code || 'N/A'}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-700">Qty: <strong>{item.quantity}</strong></span>
                                <span className="text-sm font-bold text-emerald-600">₨ {formatRoundedAmount(itemSubtotal)}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">Unit: ₨ {formatRoundedAmount(item.item?.unit_price)}</p>
                              {(viewingOrder.tax_rate > 0) && (
                                <p className="text-xs text-blue-600 mt-1">Tax ({viewingOrder.tax_rate}%): ₨ {itemTax.toFixed(2)}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 flex-shrink-0">
                  <button 
                    onClick={() => setShowViewModal(false)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Record Additional Payment Modal */}
          {showAdditionalPaymentModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="backdrop-blur-xl bg-white bg-opacity-40 border border-white border-opacity-30 rounded-2xl shadow-glass-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-[#17144B] text-center">💳 Record Additional Payment</h2>
                <div className="mb-4 p-4 bg-white bg-opacity-50 rounded-lg space-y-2">
                  <p className="text-sm text-gray-700"><strong>Order:</strong> {selectedOrder.order_number}</p>
                  <p className="text-sm text-gray-700"><strong>Total Amount:</strong> ₨ {formatRoundedAmount(selectedOrder.total_amount)}</p>
                  <p className="text-sm text-gray-700"><strong>Status:</strong> <span className={getStatusTextClass(selectedOrder)}>{selectedOrder.status?.toUpperCase()}</span></p>
                </div>
                <div className="space-y-4">
                  {/* Payment Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Amount</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  {/* Payment Portion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                    <select
                      value={paymentForm.payment_type}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="partial">⚠️ Partial Payment</option>
                      <option value="full">✅ Full/Complete Payment</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Card</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="cheque">📄 Cheque</option>
                    </select>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      placeholder="Additional notes..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={handlePaymentSubmit}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95"
                    >
                      💳 Record Payment
                    </button>
                    <button 
                      onClick={() => setShowAdditionalPaymentModal(false)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
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
