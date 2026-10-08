/**
 * Standalone Offline Database Engine for PaperCone
 * Fully replicates the Flask SQLite backend logic client-side on Android / Web.
 */

const DB_KEY = 'papercone_offline_db_v1';

// Initial sample data if no database exists
const initialData = {
  settings: {
    id: 1,
    business_name: 'Business Company',
    address: 'Business District, City, Country',
    email: 'support@company.local',
    phone: '+1-800-0000000',
    whatsapp: '+1-800-0000000',
    logo_filename: null,
    logo_data: null,
    logo_placement: 'both',
    logo_as_watermark: true,
    needs_setup: false
  },
  buyers: [
    {
      id: 1,
      company_name: 'Sample Client A',
      contact_person: 'John Smith',
      email: 'contact@clienta.local',
      phone: '+1-800-1111111',
      city: 'Industrial Area',
      address: 'Plot 12, Sector B, Industrial Area',
      gst_number: 'GST-A-001',
      ntn_number: 'NTN-A-001',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      company_name: 'Sample Client B',
      contact_person: 'Sarah Johnson',
      email: 'contact@clientb.local',
      phone: '+1-800-2222222',
      city: 'Commercial District',
      address: 'Suite 404, Trade Towers, Commercial District',
      gst_number: 'GST-B-002',
      ntn_number: 'NTN-B-002',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  items: [
    {
      id: 1,
      code: 'CONE-STD-01',
      name: 'Standard Paper Cone',
      description: 'Standard industrial paper cone for textile spinning',
      unit: 'PCS',
      unit_price: 25.0,
      quantity_in_stock: 5000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      code: 'CONE-HVY-02',
      name: 'Heavy Duty Cone',
      description: 'Reinforced paper cone for high-speed winding',
      unit: 'PCS',
      unit_price: 35.0,
      quantity_in_stock: 2500,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      code: 'TUBE-PL-01',
      name: 'Plain Paper Tube',
      description: 'Cylindrical spirally wound tube for packaging',
      unit: 'PCS',
      unit_price: 18.0,
      quantity_in_stock: 4000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  orders: [],
  payments: [],
  backup_config: {
    backup_location: 'Internal Storage / PaperCone / Backups',
    auto_backup_enabled: true,
    last_backup_time: new Date().toISOString()
  }
};

class OfflineDb {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load DB from localStorage:', e);
    }
    this.save(initialData);
    return JSON.parse(JSON.stringify(initialData));
  }

  save(dataToSave) {
    if (dataToSave) this.data = dataToSave;
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save DB to localStorage:', e);
    }
  }

  roundOff(val) {
    return Math.round(Number(val) || 0);
  }

  // --- SETTINGS ---
  getSettings() {
    const s = this.data.settings;
    const defaultNames = ['BUSINESS COMPANY', 'Business Company', ''];
    const defaultAddresses = ['Business District, City, Country', ''];
    const isDefault = defaultNames.includes((s.business_name || '').trim()) &&
                      defaultAddresses.includes((s.address || '').trim()) &&
                      !s.logo_filename && !s.logo_data;

    return {
      ...s,
      logo_url: s.logo_data || (s.logo_filename ? `/api/settings/logo/${s.logo_filename}` : null),
      needs_setup: isDefault || !!s.needs_setup
    };
  }

  saveSettings(update) {
    this.data.settings = {
      ...this.data.settings,
      ...update,
      needs_setup: false,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.getSettings();
  }

  uploadLogo(base64Data, filename = 'logo.png') {
    this.data.settings.logo_filename = filename;
    this.data.settings.logo_data = base64Data;
    this.data.settings.needs_setup = false;
    this.save();
    return {
      message: 'Logo uploaded successfully',
      logo_url: base64Data,
      filename
    };
  }

  removeLogo() {
    this.data.settings.logo_filename = null;
    this.data.settings.logo_data = null;
    this.save();
    return { message: 'Logo removed successfully' };
  }

  // --- BUYERS ---
  getBuyers(params = {}) {
    const { page = 1, per_page = 10, search = '' } = params;
    let list = this.data.buyers.filter(b => b.is_active !== false);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        (b.company_name && b.company_name.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.gst_number && b.gst_number.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = list.length;
    const offset = (Number(page) - 1) * Number(per_page);
    const paginated = list.slice(offset, offset + Number(per_page));

    return {
      data: paginated,
      buyers: paginated,
      total,
      pages: Math.ceil(total / Number(per_page)) || 1,
      current_page: Number(page)
    };
  }

  getBuyer(id) {
    return this.data.buyers.find(b => b.id === Number(id)) || null;
  }

  createBuyer(buyerData) {
    const newId = this.data.buyers.length ? Math.max(...this.data.buyers.map(b => b.id)) + 1 : 1;
    const newBuyer = {
      ...buyerData,
      id: newId,
      company_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.buyers.push(newBuyer);
    this.save();
    return newBuyer;
  }

  updateBuyer(id, buyerData) {
    const idx = this.data.buyers.findIndex(b => b.id === Number(id));
    if (idx === -1) throw new Error('Buyer not found');
    this.data.buyers[idx] = {
      ...this.data.buyers[idx],
      ...buyerData,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.buyers[idx];
  }

  deleteBuyer(id) {
    const idx = this.data.buyers.findIndex(b => b.id === Number(id));
    if (idx === -1) throw new Error('Buyer not found');
    this.data.buyers[idx].is_active = false;
    this.save();
    return { message: 'Buyer deleted successfully' };
  }

  // --- ITEMS ---
  getItems(params = {}) {
    const { page = 1, per_page = 10, search = '' } = params;
    let list = this.data.items.filter(i => i.is_active !== false);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.code && i.code.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = list.length;
    const offset = (Number(page) - 1) * Number(per_page);
    const paginated = list.slice(offset, offset + Number(per_page));

    return {
      data: paginated,
      items: paginated,
      total,
      pages: Math.ceil(total / Number(per_page)) || 1,
      current_page: Number(page)
    };
  }

  getItem(id) {
    return this.data.items.find(i => i.id === Number(id)) || null;
  }

  createItem(itemData) {
    const newId = this.data.items.length ? Math.max(...this.data.items.map(i => i.id)) + 1 : 1;
    const newItem = {
      ...itemData,
      id: newId,
      company_id: 1,
      unit_price: Number(itemData.unit_price) || 0,
      quantity_in_stock: Number(itemData.quantity_in_stock) || 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.items.push(newItem);
    this.save();
    return newItem;
  }

  updateItem(id, itemData) {
    const idx = this.data.items.findIndex(i => i.id === Number(id));
    if (idx === -1) throw new Error('Item not found');
    this.data.items[idx] = {
      ...this.data.items[idx],
      ...itemData,
      unit_price: Number(itemData.unit_price !== undefined ? itemData.unit_price : this.data.items[idx].unit_price),
      quantity_in_stock: Number(itemData.quantity_in_stock !== undefined ? itemData.quantity_in_stock : this.data.items[idx].quantity_in_stock),
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.items[idx];
  }

  deleteItem(id) {
    const idx = this.data.items.findIndex(i => i.id === Number(id));
    if (idx === -1) throw new Error('Item not found');
    this.data.items[idx].is_active = false;
    this.save();
    return { message: 'Item deleted successfully' };
  }

  // --- ORDERS ---
  generateOrderNumber(buyerId, orderDateStr) {
    const buyer = this.getBuyer(buyerId);
    const buyerName = buyer ? buyer.company_name.replace(/[^a-zA-Z0-9]/g, '') : 'Buyer';
    const dateStr = (orderDateStr || new Date().toISOString()).split('T')[0];

    const buyerOrders = this.data.orders.filter(o => o.buyer_id === Number(buyerId));
    let maxNum = 999;
    buyerOrders.forEach(o => {
      try {
        if (o.order_number && o.order_number.includes('_ID')) {
          const num = parseInt(o.order_number.split('_ID').pop(), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      } catch (e) {}
    });

    return `${buyerName}_${dateStr}_ID${maxNum + 1}`;
  }

  calculateOrderStatus(orderId, totalAmount) {
    const orderPayments = this.data.payments.filter(p => p.order_id === Number(orderId));
    const totalPaid = this.roundOff(orderPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
    const orderTotal = this.roundOff(totalAmount);
    const remaining = this.roundOff(orderTotal - totalPaid);

    if (totalPaid <= 0) return 'pending';
    if (remaining <= 0) return 'paid';
    return 'partial';
  }

  getOrders(params = {}) {
    const { page = 1, per_page = 10, status = '' } = params;
    let list = [...this.data.orders];

    if (status) {
      list = list.filter(o => o.status === status);
    }

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const enriched = list.map(o => {
      const buyer = this.getBuyer(o.buyer_id);
      const orderPayments = this.data.payments.filter(p => p.order_id === o.id);
      const totalPaid = this.roundOff(orderPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
      const remainingBalance = Math.max(0, this.roundOff(o.total_amount - totalPaid));

      return {
        ...o,
        buyer_name: buyer ? buyer.company_name : 'Unknown Buyer',
        buyer_details: buyer,
        total_paid: totalPaid,
        balance: remainingBalance,
        payments: orderPayments
      };
    });

    const total = enriched.length;
    const offset = (Number(page) - 1) * Number(per_page);
    const paginated = enriched.slice(offset, offset + Number(per_page));

    return {
      data: paginated,
      orders: paginated,
      total,
      pages: Math.ceil(total / Number(per_page)) || 1,
      current_page: Number(page)
    };
  }

  getOrder(id) {
    const order = this.data.orders.find(o => o.id === Number(id));
    if (!order) return null;

    const buyer = this.getBuyer(order.buyer_id);
    const orderPayments = this.data.payments.filter(p => p.order_id === order.id);
    const totalPaid = this.roundOff(orderPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));

    return {
      ...order,
      buyer_name: buyer ? buyer.company_name : 'Unknown Buyer',
      buyer_details: buyer,
      buyer: buyer,
      total_paid: totalPaid,
      balance: Math.max(0, this.roundOff(order.total_amount - totalPaid)),
      payments: orderPayments
    };
  }

  createOrder(orderData) {
    const items = orderData.items || [];
    if (items.length > 12) {
      throw new Error('Orders are limited to a maximum of 12 items');
    }
    if (items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Check & adjust stock
    for (const item of items) {
      const stockItem = this.getItem(item.item_id);
      if (!stockItem) throw new Error(`Item ${item.item_id} not found`);
      if (stockItem.quantity_in_stock < Number(item.quantity)) {
        throw new Error(`Insufficient stock for "${stockItem.name}". Available: ${stockItem.quantity_in_stock}, requested: ${item.quantity}`);
      }
    }

    // Deduct stock
    for (const item of items) {
      const stockItem = this.getItem(item.item_id);
      stockItem.quantity_in_stock -= Number(item.quantity);
    }

    const newId = this.data.orders.length ? Math.max(...this.data.orders.map(o => o.id)) + 1 : 1;
    const orderDate = orderData.order_date || new Date().toISOString();
    const orderNumber = orderData.order_number || this.generateOrderNumber(orderData.buyer_id, orderDate);

    // Compute line totals & subtotal
    const processedItems = items.map((it, idx) => {
      const stockItem = this.getItem(it.item_id);
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unit_price) || 0;
      return {
        id: newId * 100 + idx + 1,
        order_id: newId,
        item_id: it.item_id,
        item_name: stockItem ? stockItem.name : it.item_name || 'Item',
        item_code: stockItem ? stockItem.code : it.item_code || '',
        quantity: qty,
        unit_price: price,
        line_total: this.roundOff(qty * price)
      };
    });

    const subtotal = this.roundOff(processedItems.reduce((acc, it) => acc + it.line_total, 0));
    const taxRate = Number(orderData.tax_rate) || 0;
    const taxAmount = this.roundOff((subtotal * taxRate) / 100);
    const incomeTaxRate = Number(orderData.income_tax_rate) || 0;
    const incomeTaxAmount = this.roundOff((subtotal * incomeTaxRate) / 100);
    const totalAmount = this.roundOff(subtotal + taxAmount);

    const newOrder = {
      id: newId,
      order_number: orderNumber,
      buyer_id: Number(orderData.buyer_id),
      company_id: 1,
      order_date: orderDate,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      income_tax_rate: incomeTaxRate,
      income_tax_amount: incomeTaxAmount,
      total_amount: totalAmount,
      status: 'pending',
      notes: orderData.notes || '',
      items: processedItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.orders.push(newOrder);
    this.save();
    return this.getOrder(newId);
  }

  updateOrder(id, orderData) {
    const idx = this.data.orders.findIndex(o => o.id === Number(id));
    if (idx === -1) throw new Error('Order not found');
    const existing = this.data.orders[idx];

    if (existing.status === 'paid') {
      throw new Error('Cannot edit a fully paid order');
    }

    // Restore old stock
    for (const oldIt of existing.items || []) {
      const stockItem = this.getItem(oldIt.item_id);
      if (stockItem) stockItem.quantity_in_stock += Number(oldIt.quantity);
    }

    const items = orderData.items || existing.items;
    if (items.length > 12) {
      throw new Error('Orders are limited to a maximum of 12 items');
    }

    // Check new stock
    for (const item of items) {
      const stockItem = this.getItem(item.item_id);
      if (!stockItem) throw new Error(`Item ${item.item_id} not found`);
      if (stockItem.quantity_in_stock < Number(item.quantity)) {
        throw new Error(`Insufficient stock for "${stockItem.name}". Available: ${stockItem.quantity_in_stock}`);
      }
    }

    // Deduct new stock
    for (const item of items) {
      const stockItem = this.getItem(item.item_id);
      stockItem.quantity_in_stock -= Number(item.quantity);
    }

    const processedItems = items.map((it, i) => {
      const stockItem = this.getItem(it.item_id);
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unit_price) || 0;
      return {
        id: Number(id) * 100 + i + 1,
        order_id: Number(id),
        item_id: it.item_id,
        item_name: stockItem ? stockItem.name : it.item_name || 'Item',
        item_code: stockItem ? stockItem.code : it.item_code || '',
        quantity: qty,
        unit_price: price,
        line_total: this.roundOff(qty * price)
      };
    });

    const subtotal = this.roundOff(processedItems.reduce((acc, it) => acc + it.line_total, 0));
    const taxRate = Number(orderData.tax_rate !== undefined ? orderData.tax_rate : existing.tax_rate) || 0;
    const taxAmount = this.roundOff((subtotal * taxRate) / 100);
    const incomeTaxRate = Number(orderData.income_tax_rate !== undefined ? orderData.income_tax_rate : existing.income_tax_rate) || 0;
    const incomeTaxAmount = this.roundOff((subtotal * incomeTaxRate) / 100);
    const totalAmount = this.roundOff(subtotal + taxAmount);

    const updatedOrder = {
      ...existing,
      ...orderData,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      income_tax_rate: incomeTaxRate,
      income_tax_amount: incomeTaxAmount,
      total_amount: totalAmount,
      items: processedItems,
      status: this.calculateOrderStatus(id, totalAmount),
      updated_at: new Date().toISOString()
    };

    this.data.orders[idx] = updatedOrder;
    this.save();
    return this.getOrder(id);
  }

  deleteOrder(id) {
    const idx = this.data.orders.findIndex(o => o.id === Number(id));
    if (idx === -1) throw new Error('Order not found');
    const existing = this.data.orders[idx];

    if (existing.status === 'paid' || existing.status === 'partial') {
      throw new Error('Cannot delete an order with payments');
    }

    // Restore stock
    for (const item of existing.items || []) {
      const stockItem = this.getItem(item.item_id);
      if (stockItem) stockItem.quantity_in_stock += Number(item.quantity);
    }

    this.data.orders.splice(idx, 1);
    this.save();
    return { message: 'Order deleted successfully' };
  }

  // --- PAYMENTS ---
  getPayments(params = {}) {
    const { page = 1, per_page = 10 } = params;
    const list = [...this.data.payments];
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const enriched = list.map(p => {
      const order = this.data.orders.find(o => o.id === p.order_id);
      const buyer = order ? this.getBuyer(order.buyer_id) : null;
      return {
        ...p,
        order_number: order ? order.order_number : 'N/A',
        buyer_name: buyer ? buyer.company_name : 'N/A',
        order_total: order ? order.total_amount : 0
      };
    });

    const total = enriched.length;
    const offset = (Number(page) - 1) * Number(per_page);
    const paginated = enriched.slice(offset, offset + Number(per_page));

    return {
      data: paginated,
      payments: paginated,
      total,
      pages: Math.ceil(total / Number(per_page)) || 1,
      current_page: Number(page)
    };
  }

  getPayment(id) {
    return this.data.payments.find(p => p.id === Number(id)) || null;
  }

  getOrderPayments(orderId) {
    return this.data.payments
      .filter(p => p.order_id === Number(orderId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  createPayment(paymentData) {
    const order = this.getOrder(paymentData.order_id);
    if (!order) throw new Error('Order not found');

    const paymentAmount = this.roundOff(paymentData.amount);
    if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero');

    const remainingBefore = order.balance;
    if (paymentAmount > remainingBefore) {
      throw new Error(`Payment cannot exceed remaining balance of ${remainingBefore}`);
    }

    const newBalance = Math.max(0, this.roundOff(remainingBefore - paymentAmount));
    const newId = this.data.payments.length ? Math.max(...this.data.payments.map(p => p.id)) + 1 : 1;

    const incomeTaxRate = Number(paymentData.income_tax_rate) || 0;
    const incomeTaxAmount = this.roundOff((paymentAmount * incomeTaxRate) / 100);

    const newPayment = {
      id: newId,
      order_id: Number(paymentData.order_id),
      company_id: 1,
      payment_date: paymentData.payment_date || new Date().toISOString(),
      amount: paymentAmount,
      balance: newBalance,
      payment_method: paymentData.payment_method || 'cash',
      payment_type: newBalance <= 0 ? 'full' : 'partial',
      income_tax_rate: incomeTaxRate,
      income_tax_amount: incomeTaxAmount,
      notes: paymentData.notes || '',
      created_at: new Date().toISOString()
    };

    this.data.payments.push(newPayment);

    // Update order status
    const orderIdx = this.data.orders.findIndex(o => o.id === order.id);
    if (orderIdx !== -1) {
      this.data.orders[orderIdx].status = newBalance <= 0 ? 'paid' : 'partial';
      this.data.orders[orderIdx].updated_at = new Date().toISOString();
    }

    this.save();
    return newPayment;
  }

  deletePayment(id) {
    const idx = this.data.payments.findIndex(p => p.id === Number(id));
    if (idx === -1) throw new Error('Payment not found');
    const payment = this.data.payments[idx];
    const orderId = payment.order_id;

    this.data.payments.splice(idx, 1);

    // Recompute order status
    const order = this.data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = this.calculateOrderStatus(orderId, order.total_amount);
      order.updated_at = new Date().toISOString();
    }

    this.save();
    return { message: 'Payment deleted successfully' };
  }

  // --- LEDGER ---
  getLedger(buyerId, params = {}) {
    const buyer = this.getBuyer(buyerId);
    if (!buyer) throw new Error('Buyer not found');

    const { start_date = '', end_date = '' } = params;

    let orders = this.data.orders.filter(o => o.buyer_id === Number(buyerId));
    if (start_date) {
      orders = orders.filter(o => (o.order_date || o.created_at) >= start_date);
    }
    if (end_date) {
      orders = orders.filter(o => (o.order_date || o.created_at) <= end_date + 'T23:59:59');
    }

    const orderIds = new Set(orders.map(o => o.id));
    const payments = this.data.payments.filter(p => orderIds.has(p.order_id));

    // Combine transactions
    const transactions = [];
    orders.forEach(o => {
      transactions.push({
        type: 'ORDER',
        id: o.id,
        date: o.order_date || o.created_at,
        reference: o.order_number,
        description: `Order #${o.order_number}`,
        debit: o.total_amount,
        credit: 0
      });
    });

    payments.forEach(p => {
      const parentOrder = orders.find(o => o.id === p.order_id);
      transactions.push({
        type: 'PAYMENT',
        id: p.id,
        date: p.payment_date || p.created_at,
        reference: parentOrder ? parentOrder.order_number : `Order #${p.order_id}`,
        description: `Payment via ${p.payment_method}`,
        debit: 0,
        credit: p.amount
      });
    });

    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const finalTransactions = transactions.map(t => {
      runningBalance += t.debit - t.credit;
      return {
        ...t,
        running_balance: runningBalance
      };
    });

    const totalDebit = this.roundOff(orders.reduce((sum, o) => sum + o.total_amount, 0));
    const totalCredit = this.roundOff(payments.reduce((sum, p) => sum + p.amount, 0));

    return {
      buyer,
      transactions: finalTransactions,
      summary: {
        total_orders: orders.length,
        total_debit: totalDebit,
        total_credit: totalCredit,
        closing_balance: this.roundOff(totalDebit - totalCredit)
      }
    };
  }

  // --- DASHBOARD ---
  getDashboardData() {
    const orders = this.data.orders || [];
    const payments = this.data.payments || [];

    const totalSales = this.roundOff(orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0));
    const totalPaid = this.roundOff(payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0));
    const pendingBalance = Math.max(0, this.roundOff(totalSales - totalPaid));

    const paidCount = orders.filter(o => o.status === 'paid').length;
    const partialCount = orders.filter(o => o.status === 'partial').length;
    const pendingCount = orders.filter(o => !o.status || o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped').length;

    // Recent orders in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders30Days = orders.filter(o => {
      const d = new Date(o.order_date || o.created_at);
      return !isNaN(d) && d >= thirtyDaysAgo;
    });

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at || b.order_date || 0) - new Date(a.created_at || a.order_date || 0))
      .slice(0, 10)
      .map(o => {
        const buyer = this.getBuyer(o.buyer_id);
        return {
          id: o.id,
          order_number: o.order_number,
          buyer_name: buyer ? buyer.company_name : 'Unknown Buyer',
          total_amount: Number(o.total_amount) || 0,
          status: o.status || 'pending',
          created_at: o.order_date || o.created_at
        };
      });

    // Buyer-wise sales (top 5)
    const buyerSalesMap = {};
    orders.forEach(o => {
      const buyer = this.getBuyer(o.buyer_id);
      const name = buyer ? buyer.company_name : 'Unknown Buyer';
      buyerSalesMap[name] = (buyerSalesMap[name] || 0) + (Number(o.total_amount) || 0);
    });
    const buyer_wise_sales = Object.entries(buyerSalesMap)
      .map(([name, value]) => ({ name, value: this.roundOff(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Item-wise sales (top 5)
    const itemSalesMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const stockItem = this.getItem(item.item_id);
        const name = stockItem ? stockItem.name : (item.item_name || `Item #${item.item_id}`);
        const lineTotal = Number(item.line_total) || ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0));
        itemSalesMap[name] = (itemSalesMap[name] || 0) + lineTotal;
      });
    });
    const item_wise_sales = Object.entries(itemSalesMap)
      .map(([name, value]) => ({ name, value: this.roundOff(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      summary: {
        total_sales: totalSales,
        pending_payments: pendingBalance,
        recent_orders_count: recentOrders30Days.length || recentOrders.length
      },
      payment_status: {
        paid: paidCount,
        partial: partialCount,
        pending: pendingCount
      },
      recent_orders: recentOrders,
      buyer_wise_sales,
      item_wise_sales,
      total_sales: totalSales,
      pending_balance: pendingBalance,
      total_orders: orders.length,
      order_status_counts: {
        paid: paidCount,
        partial: partialCount,
        pending: pendingCount
      }
    };
  }

  // --- REPORTS ---
  getBuyerReport(buyerId, startDate = '', endDate = '') {
    const buyer = this.getBuyer(buyerId);
    if (!buyer) throw new Error('Buyer not found');

    let orders = this.data.orders.filter(o => o.buyer_id === Number(buyerId));
    if (startDate) {
      orders = orders.filter(o => (o.order_date || o.created_at) >= startDate);
    }
    if (endDate) {
      orders = orders.filter(o => (o.order_date || o.created_at) <= endDate + 'T23:59:59');
    }

    const totalOrders = orders.length;
    const totalSales = this.roundOff(orders.reduce((sum, o) => sum + o.total_amount, 0));

    const orderIds = new Set(orders.map(o => o.id));
    const payments = this.data.payments.filter(p => orderIds.has(p.order_id));
    const totalPaid = this.roundOff(payments.reduce((sum, p) => sum + p.amount, 0));
    const outstanding = Math.max(0, totalSales - totalPaid);

    // Items aggregation
    const itemMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        if (!itemMap[it.item_name]) {
          itemMap[it.item_name] = { item_name: it.item_name, total_quantity: 0, total_value: 0 };
        }
        itemMap[it.item_name].total_quantity += Number(it.quantity) || 0;
        itemMap[it.item_name].total_value += Number(it.line_total) || 0;
      });
    });
    const items = Object.values(itemMap).sort((a, b) => b.total_value - a.total_value);

    // Monthly aggregation
    const monthlyMap = {};
    orders.forEach(o => {
      const d = o.order_date || o.created_at;
      const m = d ? d.substring(0, 7) : 'Unknown';
      monthlyMap[m] = (monthlyMap[m] || 0) + o.total_amount;
    });
    const monthlySales = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, sales]) => ({ month, total_sales: sales }));

    // Relationship score
    const paymentRatio = totalSales > 0 ? (totalPaid / totalSales) : 1;
    let score = Math.round(paymentRatio * 100);
    let label = 'Reliable Buyer';
    if (score >= 80) label = 'Strategic Partner';
    else if (score >= 60) label = 'Reliable Buyer';
    else if (score >= 40) label = 'Average / Watchlist';
    else if (score >= 20) label = 'Risky Buyer';
    else label = 'High Risk';

    return {
      buyer: {
        id: buyer.id,
        company_name: buyer.company_name,
        contact_person: buyer.contact_person,
        phone: buyer.phone,
        email: buyer.email,
        city: buyer.city
      },
      summary: {
        total_orders: totalOrders,
        total_sales: totalSales,
        total_paid: totalPaid,
        outstanding: outstanding,
        avg_payment_delay_days: 0,
        on_time_ratio: paymentRatio >= 0.8 ? 1 : 0.7
      },
      items,
      monthly_sales: monthlySales,
      relationship: {
        score,
        relationship_score: score,
        relationship_label: label,
        label
      },
      filters: {
        start_date: startDate || null,
        end_date: endDate || null
      }
    };
  }

  getReportSummary() {
    const orders = this.data.orders || [];
    const totalSales = this.roundOff(orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0));
    const totalPaid = this.roundOff(this.data.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0));
    const pendingAmount = Math.max(0, this.roundOff(totalSales - totalPaid));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders30Days = orders.filter(o => {
      const d = new Date(o.order_date || o.created_at);
      return !isNaN(d) && d >= thirtyDaysAgo;
    });

    return {
      total_sales: totalSales,
      pending_payments: pendingAmount,
      recent_orders: recentOrders30Days.length,
      total_collected: totalPaid,
      pending_amount: pendingAmount,
      total_buyers: this.data.buyers.filter(b => b.is_active).length,
      total_items: this.data.items.filter(i => i.is_active).length,
      total_orders: orders.length
    };
  }

  getPaymentStatusReport() {
    const orders = this.data.orders || [];
    const groups = { paid: { count: 0, total: 0 }, partial: { count: 0, total: 0 }, pending: { count: 0, total: 0 } };
    orders.forEach(o => {
      const st = o.status || 'pending';
      if (groups[st]) {
        groups[st].count++;
        groups[st].total += Number(o.total_amount) || 0;
      }
    });
    return {
      ...groups,
      paid: groups.paid.count,
      partial: groups.partial.count,
      pending: groups.pending.count
    };
  }

  getBuyerWiseReport() {
    return this.data.buyers.filter(b => b.is_active).map(b => {
      const buyerOrders = this.data.orders.filter(o => o.buyer_id === b.id);
      const totalAmount = this.roundOff(buyerOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0));
      const orderIds = new Set(buyerOrders.map(o => o.id));
      const totalPaid = this.roundOff(this.data.payments.filter(p => orderIds.has(p.order_id)).reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
      return {
        id: b.id,
        buyer_name: b.company_name,
        order_count: buyerOrders.length,
        total_orders: totalAmount,
        total_amount: totalAmount,
        total_paid: totalPaid,
        balance: Math.max(0, this.roundOff(totalAmount - totalPaid))
      };
    });
  }

  getItemWiseReport() {
    const itemSales = {};
    this.data.orders.forEach(o => {
      (o.items || []).forEach(it => {
        if (!itemSales[it.item_id]) {
          itemSales[it.item_id] = { qty: 0, total: 0 };
        }
        itemSales[it.item_id].qty += Number(it.quantity) || 0;
        itemSales[it.item_id].total += Number(it.line_total) || 0;
      });
    });

    return this.data.items.filter(i => i.is_active).map(i => {
      const sale = itemSales[i.id] || { qty: 0, total: 0 };
      return {
        id: i.id,
        item_name: i.name,
        name: i.name,
        item_code: i.code,
        code: i.code,
        current_stock: i.quantity_in_stock,
        total_quantity: sale.qty,
        units_sold: sale.qty,
        total_value: this.roundOff(sale.total),
        total_revenue: this.roundOff(sale.total)
      };
    });
  }

  // --- BACKUP & RESTORE ---
  getBackupConfig() {
    return this.data.backup_config || initialData.backup_config;
  }

  exportDataJson() {
    return JSON.stringify(this.data, null, 2);
  }

  importDataJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.settings || !parsed.buyers || !parsed.items) {
        throw new Error('Invalid backup file structure');
      }
      this.data = parsed;
      this.save();
      return { success: true, message: 'Database successfully restored' };
    } catch (e) {
      throw new Error(`Failed to restore data: ${e.message}`);
    }
  }
}

export const offlineDb = new OfflineDb();
export default offlineDb;
