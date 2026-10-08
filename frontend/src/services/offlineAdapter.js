import offlineDb from './offlineDb';

/**
 * Parses URL pathname and query params
 */
function parseUrl(rawUrl) {
  let cleanUrl = rawUrl.replace(/^https?:\/\/[^/]+/, '');
  if (cleanUrl.startsWith('/api')) {
    cleanUrl = cleanUrl.substring(4);
  }
  const [pathname, queryString] = cleanUrl.split('?');
  const params = {};
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
  }
  return { pathname, params };
}

/**
 * Handles all requests offline, returning { status, data }
 */
export async function handleOfflineRequest(method, rawUrl, body = null, explicitParams = {}) {
  const normMethod = (method || 'GET').toUpperCase();
  const { pathname, params: urlParams } = parseUrl(rawUrl);
  const params = { ...urlParams, ...explicitParams };

  console.log(`[OfflineDB] ${normMethod} ${pathname}`, { params, body });

  // 1. SETTINGS & LOGO
  if (pathname === '/settings' || pathname === '/settings/') {
    if (normMethod === 'GET') {
      return { status: 200, data: offlineDb.getSettings() };
    }
    if (normMethod === 'POST') {
      return { status: 200, data: offlineDb.saveSettings(body || {}) };
    }
  }

  if (pathname === '/settings/upload-logo') {
    let base64 = null;
    let filename = 'logo.png';
    if (body instanceof FormData) {
      const file = body.get('logo');
      if (file) {
        filename = file.name || 'logo.png';
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } else if (body && body.logo) {
      base64 = body.logo;
    }

    if (!base64) {
      return { status: 400, data: { error: 'No logo file provided' } };
    }

    const res = offlineDb.uploadLogo(base64, filename);
    return { status: 200, data: res };
  }

  if (pathname === '/settings/remove-logo') {
    return { status: 200, data: offlineDb.removeLogo() };
  }

  if (pathname.startsWith('/settings/logo/')) {
    const settings = offlineDb.getSettings();
    return { status: 200, data: settings.logo_data || '' };
  }

  // 2. DASHBOARD
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return { status: 200, data: offlineDb.getDashboardData() };
  }

  // 3. BUYERS
  if (pathname === '/buyers' || pathname === '/buyers/') {
    if (normMethod === 'GET') {
      return { status: 200, data: offlineDb.getBuyers(params) };
    }
    if (normMethod === 'POST') {
      return { status: 201, data: offlineDb.createBuyer(body) };
    }
  }

  const buyerMatch = pathname.match(/^\/buyers\/(\d+)$/);
  if (buyerMatch) {
    const id = buyerMatch[1];
    if (normMethod === 'GET') {
      const b = offlineDb.getBuyer(id);
      return b ? { status: 200, data: b } : { status: 404, data: { error: 'Buyer not found' } };
    }
    if (normMethod === 'PUT') {
      return { status: 200, data: offlineDb.updateBuyer(id, body) };
    }
    if (normMethod === 'DELETE') {
      return { status: 200, data: offlineDb.deleteBuyer(id) };
    }
  }

  // 4. ITEMS
  if (pathname === '/items' || pathname === '/items/') {
    if (normMethod === 'GET') {
      return { status: 200, data: offlineDb.getItems(params) };
    }
    if (normMethod === 'POST') {
      return { status: 201, data: offlineDb.createItem(body) };
    }
  }

  const itemMatch = pathname.match(/^\/items\/(\d+)$/);
  if (itemMatch) {
    const id = itemMatch[1];
    if (normMethod === 'GET') {
      const it = offlineDb.getItem(id);
      return it ? { status: 200, data: it } : { status: 404, data: { error: 'Item not found' } };
    }
    if (normMethod === 'PUT') {
      return { status: 200, data: offlineDb.updateItem(id, body) };
    }
    if (normMethod === 'DELETE') {
      return { status: 200, data: offlineDb.deleteItem(id) };
    }
  }

  // 5. ORDERS
  if (pathname === '/orders' || pathname === '/orders/') {
    if (normMethod === 'GET') {
      return { status: 200, data: offlineDb.getOrders(params) };
    }
    if (normMethod === 'POST') {
      try {
        const created = offlineDb.createOrder(body);
        return { status: 201, data: created };
      } catch (err) {
        return { status: 400, data: { error: err.message } };
      }
    }
  }

  const orderMatch = pathname.match(/^\/orders\/(\d+)$/);
  if (orderMatch) {
    const id = orderMatch[1];
    if (normMethod === 'GET') {
      const ord = offlineDb.getOrder(id);
      return ord ? { status: 200, data: ord } : { status: 404, data: { error: 'Order not found' } };
    }
    if (normMethod === 'PUT') {
      try {
        return { status: 200, data: offlineDb.updateOrder(id, body) };
      } catch (err) {
        return { status: 400, data: { error: err.message } };
      }
    }
    if (normMethod === 'DELETE') {
      try {
        return { status: 200, data: offlineDb.deleteOrder(id) };
      } catch (err) {
        return { status: 400, data: { error: err.message } };
      }
    }
  }

  // 6. PAYMENTS
  if (pathname === '/payments' || pathname === '/payments/') {
    if (normMethod === 'GET') {
      return { status: 200, data: offlineDb.getPayments(params) };
    }
    if (normMethod === 'POST') {
      try {
        return { status: 201, data: offlineDb.createPayment(body) };
      } catch (err) {
        return { status: 400, data: { error: err.message } };
      }
    }
  }

  const orderPaymentsMatch = pathname.match(/^\/payments\/order\/(\d+)$/);
  if (orderPaymentsMatch) {
    return { status: 200, data: offlineDb.getOrderPayments(orderPaymentsMatch[1]) };
  }

  const paymentMatch = pathname.match(/^\/payments\/(\d+)$/);
  if (paymentMatch) {
    const id = paymentMatch[1];
    if (normMethod === 'GET') {
      const p = offlineDb.getPayment(id);
      return p ? { status: 200, data: p } : { status: 404, data: { error: 'Payment not found' } };
    }
    if (normMethod === 'DELETE') {
      return { status: 200, data: offlineDb.deletePayment(id) };
    }
  }

  // 7. LEDGERS
  const ledgerMatch = pathname.match(/^\/ledgers\/(\d+)$/);
  if (ledgerMatch) {
    try {
      return { status: 200, data: offlineDb.getLedger(ledgerMatch[1], params) };
    } catch (err) {
      return { status: 404, data: { error: err.message } };
    }
  }

  // 8. REPORTS
  if (pathname === '/reports/summary') {
    return { status: 200, data: offlineDb.getReportSummary() };
  }
  if (pathname === '/reports/payment-status') {
    return { status: 200, data: offlineDb.getPaymentStatusReport() };
  }
  if (pathname === '/reports/buyer-wise') {
    return { status: 200, data: offlineDb.getBuyerWiseReport() };
  }
  if (pathname === '/reports/item-wise') {
    return { status: 200, data: offlineDb.getItemWiseReport() };
  }
  if (pathname === '/reports/buyer-report') {
    try {
      const bId = params.buyer_id;
      return { status: 200, data: offlineDb.getBuyerReport(bId, params.start_date, params.end_date) };
    } catch (err) {
      return { status: 400, data: { error: err.message } };
    }
  }
  if (pathname === '/reports/orders') {
    return { status: 200, data: offlineDb.getOrders(params) };
  }
  if (pathname === '/reports/orders/export-csv') {
    const ordersRes = offlineDb.getOrders({ page: 1, per_page: 10000 });
    let csv = 'Order Number,Buyer,Date,Total Amount,Status,Paid,Balance\n';
    ordersRes.orders.forEach(o => {
      csv += `"${o.order_number}","${o.buyer_name}","${o.order_date || ''}","${o.total_amount}","${o.status}","${o.total_paid}","${o.balance}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    return { status: 200, data: blob };
  }
  if (pathname.endsWith('/pdf') && pathname.includes('/ledgers/')) {
    const blob = new Blob(['PDF Generated'], { type: 'application/pdf' });
    return { status: 200, data: blob };
  }

  // 9. BACKUP & RESTORE
  if (pathname === '/backup/config') {
    return { status: 200, data: offlineDb.getBackupConfig() };
  }
  if (pathname === '/backup' || pathname === '/backup/export') {
    const jsonStr = offlineDb.exportDataJson();
    // Create Blob for backup download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    return {
      status: 200,
      data: {
        message: 'Backup created successfully',
        timestamp: new Date().toISOString(),
        backup_json: jsonStr,
        blob
      }
    };
  }
  if (pathname === '/backup/restore') {
    try {
      const jsonContent = typeof body === 'string' ? body : (body?.json_data || JSON.stringify(body));
      const res = offlineDb.importDataJson(jsonContent);
      return { status: 200, data: res };
    } catch (err) {
      return { status: 400, data: { error: err.message } };
    }
  }

  // 10. AUTH MOCK
  if (pathname === '/auth/login') {
    const settings = offlineDb.getSettings();
    return {
      status: 200,
      data: {
        access_token: 'offline-standalone-token',
        user: {
          id: 1,
          username: 'admin',
          full_name: 'Admin User',
          role: 'admin',
          company_id: 1,
          company_name: settings.business_name,
          company_code: 'ORG'
        }
      }
    };
  }

  return { status: 404, data: { error: `Endpoint not found: ${pathname}` } };
}

/**
 * Initializes global fetch interception so any direct fetch('http://localhost:5000/api/...')
 * seamlessly routes to offlineDb!
 */
export function setupOfflineInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init = {}) {
    let urlString = typeof input === 'string' ? input : input?.url;

    if (
      urlString &&
      (urlString.includes('/api/') || urlString.startsWith('/api') || urlString.includes('localhost:5000'))
    ) {
      const method = (init.method || 'GET').toUpperCase();
      let bodyData = null;

      if (init.body) {
        if (init.body instanceof FormData) {
          bodyData = init.body;
        } else {
          try {
            bodyData = JSON.parse(init.body);
          } catch (e) {
            bodyData = init.body;
          }
        }
      }

      const res = await handleOfflineRequest(method, urlString, bodyData);

      // Return synthetic Response object
      return new Response(JSON.stringify(res.data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch.apply(this, arguments);
  };

  console.log('[OfflineDB] Global fetch interceptor active');
}
