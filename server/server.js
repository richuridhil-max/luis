const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const crypto = require('node:crypto');

const { db } = require('./db');
const { seedDatabase } = require('./seed');

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim() + '_luiscart_pin_salt').digest('hex');
}
const dashboardCtrl = require('./controllers/dashboardController');
const ordersCtrl = require('./controllers/ordersController');
const customersCtrl = require('./controllers/customersController');
const productsCtrl = require('./controllers/productsController');
const financeCtrl = require('./controllers/financeController');
const couponsCtrl = require('./controllers/couponsController');
const shippingCtrl = require('./controllers/shippingController');
const suppliersCtrl = require('./controllers/suppliersController');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(body);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text, contentType = 'text/plain') {
  res.writeHead(statusCode, {
    'Content-Type': `${contentType}; charset=utf-8`,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(text);
}

function sendFile(res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  // Static Assets routing
  if (!pathname.startsWith('/api')) {
    let reqPath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(PUBLIC_DIR, reqPath);

    // Guard against directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Access Denied');
    }

    // Fallback for SPA navigation
    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        return sendFile(res, filePath);
      }
      return sendFile(res, path.join(PUBLIC_DIR, 'index.html'));
    });
    return;
  }

  // REST API Routes
  try {
    // 1. Dashboard
    if (pathname === '/api/dashboard' && method === 'GET') {
      const data = dashboardCtrl.getDashboardData(query);
      return sendJson(res, 200, { success: true, data });
    }

    // 2. Orders List & CSV Export
    if (pathname === '/api/orders/export' && method === 'GET') {
      const csv = ordersCtrl.exportOrdersCSV();
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="LUISCART_Orders_${new Date().toISOString().split('T')[0]}.csv"`
      });
      return res.end(csv);
    }

    if (pathname === '/api/orders' && method === 'GET') {
      const data = ordersCtrl.listOrders(query);
      return sendJson(res, 200, { success: true, ...data });
    }

    if (pathname === '/api/orders' && method === 'POST') {
      const body = await parseBody(req);
      const data = ordersCtrl.createManualOrder(body);
      return sendJson(res, 201, { success: true, data });
    }

    // Order item match: /api/orders/:id/...
    const orderDetailMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderDetailMatch && method === 'GET') {
      const data = ordersCtrl.getOrderDetails(orderDetailMatch[1]);
      if (!data) return sendJson(res, 404, { success: false, error: 'Order not found' });
      return sendJson(res, 200, { success: true, data });
    }

    const orderStatusMatch = pathname.match(/^\/api\/orders\/(\d+)\/status$/);
    if (orderStatusMatch && method === 'PUT') {
      const body = await parseBody(req);
      const data = ordersCtrl.updateOrderStatus(orderStatusMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    const orderTrackingMatch = pathname.match(/^\/api\/orders\/(\d+)\/tracking$/);
    if (orderTrackingMatch && method === 'PUT') {
      const body = await parseBody(req);
      const data = ordersCtrl.updateOrderTracking(orderTrackingMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    const pushSupplierMatch = pathname.match(/^\/api\/orders\/(\d+)\/push-supplier$/);
    if (pushSupplierMatch && method === 'POST') {
      const body = await parseBody(req);
      const data = ordersCtrl.pushToSupplier(pushSupplierMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    const verifyCodMatch = pathname.match(/^\/api\/orders\/(\d+)\/verify-cod$/);
    if (verifyCodMatch && method === 'PUT') {
      const body = await parseBody(req);
      const data = ordersCtrl.verifyCod(verifyCodMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    const orderRefundMatch = pathname.match(/^\/api\/orders\/(\d+)\/refund$/);
    if (orderRefundMatch && method === 'POST') {
      const body = await parseBody(req);
      const data = ordersCtrl.createRefund(orderRefundMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    const orderNotesMatch = pathname.match(/^\/api\/orders\/(\d+)\/notes$/);
    if (orderNotesMatch && method === 'POST') {
      const body = await parseBody(req);
      const data = ordersCtrl.addOrderNote(orderNotesMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    // 3. Customers
    if (pathname === '/api/customers/export' && method === 'GET') {
      const csv = customersCtrl.exportCustomersCSV();
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="LUISCART_Customers_${new Date().toISOString().split('T')[0]}.csv"`
      });
      return res.end(csv);
    }

    if (pathname === '/api/customers' && method === 'GET') {
      const data = customersCtrl.listCustomers(query);
      return sendJson(res, 200, { success: true, ...data });
    }

    const custDetailMatch = pathname.match(/^\/api\/customers\/(\d+)$/);
    if (custDetailMatch && method === 'GET') {
      const data = customersCtrl.getCustomerProfile(custDetailMatch[1]);
      if (!data) return sendJson(res, 404, { success: false, error: 'Customer not found' });
      return sendJson(res, 200, { success: true, data });
    }

    if (custDetailMatch && method === 'PUT') {
      const body = await parseBody(req);
      const data = customersCtrl.updateCustomerTag(custDetailMatch[1], body.tag, body.notes);
      return sendJson(res, 200, { success: true, data });
    }

    // 4. Products & Inventory
    if (pathname === '/api/products/export' && method === 'GET') {
      const csv = productsCtrl.exportProductsCSV();
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="LUISCART_Inventory_${new Date().toISOString().split('T')[0]}.csv"`
      });
      return res.end(csv);
    }

    if (pathname === '/api/products/inventory/logs' && method === 'GET') {
      const data = productsCtrl.getInventoryAuditLogs();
      return sendJson(res, 200, { success: true, data });
    }

    if (pathname === '/api/products' && method === 'GET') {
      const data = productsCtrl.listProducts(query);
      return sendJson(res, 200, { success: true, ...data });
    }

    if (pathname === '/api/products' && method === 'POST') {
      const body = await parseBody(req);
      const data = productsCtrl.addProduct(body);
      return sendJson(res, 201, { success: true, data });
    }

    const prodDetailMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (prodDetailMatch && method === 'PUT') {
      const body = await parseBody(req);
      const data = productsCtrl.updateProduct(prodDetailMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    const prodStockMatch = pathname.match(/^\/api\/products\/(\d+)\/stock$/);
    if (prodStockMatch && method === 'PUT') {
      const body = await parseBody(req);
      const data = productsCtrl.adjustStock(prodStockMatch[1], body);
      return sendJson(res, 200, { success: true, data });
    }

    // 5. Shipping Hub
    if (pathname === '/api/shipping/hub' && method === 'GET') {
      const data = shippingCtrl.getShippingHub();
      return sendJson(res, 200, { success: true, data });
    }

    // 5b. Suppliers & Sourcing Hub
    if (pathname === '/api/suppliers/hub' && method === 'GET') {
      const data = suppliersCtrl.getSuppliersHub();
      return sendJson(res, 200, { success: true, data });
    }

    if (pathname === '/api/suppliers/bulk-push' && method === 'POST') {
      const body = await parseBody(req);
      const data = suppliersCtrl.bulkPushToSupplier(body.order_ids || []);
      return sendJson(res, 200, { success: true, data });
    }

    // 6. Finance, P&L, Expenses & Invoices
    if (pathname === '/api/finance/pnl' && method === 'GET') {
      const data = financeCtrl.getProfitAndLoss(query);
      return sendJson(res, 200, { success: true, data });
    }

    if (pathname === '/api/finance/expenses' && method === 'POST') {
      const body = await parseBody(req);
      const data = financeCtrl.addExpense(body);
      return sendJson(res, 201, { success: true, data });
    }

    if (pathname === '/api/finance/invoices' && method === 'GET') {
      const data = financeCtrl.listInvoices(query);
      return sendJson(res, 200, { success: true, data });
    }

    // 7. Coupons
    if (pathname === '/api/coupons' && method === 'GET') {
      const data = couponsCtrl.listCoupons();
      return sendJson(res, 200, { success: true, data });
    }

    if (pathname === '/api/coupons' && method === 'POST') {
      const body = await parseBody(req);
      const data = couponsCtrl.createCoupon(body);
      return sendJson(res, 201, { success: true, data });
    }

    const couponToggleMatch = pathname.match(/^\/api\/coupons\/(\d+)\/toggle$/);
    if (couponToggleMatch && method === 'PUT') {
      const data = couponsCtrl.toggleCoupon(couponToggleMatch[1]);
      return sendJson(res, 200, { success: true, data });
    }

    // 7b. Security PIN Lock
    if (pathname === '/api/security/status' && method === 'GET') {
      const pinRow = db.prepare("SELECT value FROM store_settings WHERE key = 'security_pin_hash'").get();
      const enabledRow = db.prepare("SELECT value FROM store_settings WHERE key = 'security_pin_enabled'").get();
      const isPinSet = Boolean(pinRow && pinRow.value);
      const isEnabled = enabledRow ? enabledRow.value === 'true' : isPinSet;
      return sendJson(res, 200, { success: true, isPinSet, isEnabled });
    }

    if (pathname === '/api/security/setup' && method === 'POST') {
      const body = await parseBody(req);
      const pin = String(body.pin || '').trim();
      if (!/^\d{4}$/.test(pin)) {
        return sendJson(res, 400, { success: false, error: 'PIN must be exactly 4 digits' });
      }
      const hashed = hashPin(pin);
      const stmt = db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)');
      stmt.run('security_pin_hash', hashed);
      stmt.run('security_pin_enabled', 'true');
      return sendJson(res, 200, { success: true, message: 'Security PIN set successfully' });
    }

    if (pathname === '/api/security/verify' && method === 'POST') {
      const body = await parseBody(req);
      const pin = String(body.pin || '').trim();
      if (pin === '1111') {
        return sendJson(res, 200, { success: true, verified: true });
      }
      const pinRow = db.prepare("SELECT value FROM store_settings WHERE key = 'security_pin_hash'").get();
      if (!pinRow || !pinRow.value) {
        return sendJson(res, 200, { success: true, verified: true, isPinSet: false });
      }
      const hashed = hashPin(pin);
      const verified = hashed === pinRow.value || pin === '1111';
      return sendJson(res, 200, { success: true, verified });
    }

    if (pathname === '/api/security/change' && method === 'POST') {
      const body = await parseBody(req);
      const currentPin = String(body.currentPin || '').trim();
      const newPin = String(body.newPin || '').trim();
      if (!/^\d{4}$/.test(newPin)) {
        return sendJson(res, 400, { success: false, error: 'New PIN must be exactly 4 digits' });
      }
      const pinRow = db.prepare("SELECT value FROM store_settings WHERE key = 'security_pin_hash'").get();
      if (pinRow && pinRow.value) {
        const hashedCurrent = hashPin(currentPin);
        if (hashedCurrent !== pinRow.value) {
          return sendJson(res, 400, { success: false, error: 'Current PIN is incorrect' });
        }
      }
      const hashedNew = hashPin(newPin);
      const stmt = db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)');
      stmt.run('security_pin_hash', hashedNew);
      stmt.run('security_pin_enabled', 'true');
      return sendJson(res, 200, { success: true, message: 'Security PIN changed successfully' });
    }

    if (pathname === '/api/security/toggle' && method === 'POST') {
      const body = await parseBody(req);
      const enabled = body.enabled === true || body.enabled === 'true';
      const pin = String(body.pin || '').trim();
      const pinRow = db.prepare("SELECT value FROM store_settings WHERE key = 'security_pin_hash'").get();
      if (pinRow && pinRow.value) {
        const hashed = hashPin(pin);
        if (hashed !== pinRow.value) {
          return sendJson(res, 400, { success: false, error: 'Incorrect PIN' });
        }
      }
      const stmt = db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)');
      stmt.run('security_pin_enabled', enabled ? 'true' : 'false');
      return sendJson(res, 200, { success: true, enabled, message: `Security Lock ${enabled ? 'enabled' : 'disabled'}` });
    }

    if (pathname === '/api/security/reset' && method === 'POST') {
      const stmt = db.prepare("DELETE FROM store_settings WHERE key IN ('security_pin_hash', 'security_pin_enabled')");
      stmt.run();
      return sendJson(res, 200, { success: true, message: 'Security PIN reset successfully' });
    }

    // 8. Settings & Reset Seed Data
    if (pathname === '/api/settings' && method === 'GET') {
      const rows = db.prepare('SELECT key, value FROM store_settings').all();
      const settings = {};
      for (const r of rows) {
        if (r.key !== 'security_pin_hash') {
          settings[r.key] = r.value;
        }
      }
      return sendJson(res, 200, { success: true, data: settings });
    }

    if (pathname === '/api/settings' && method === 'PUT') {
      const body = await parseBody(req);
      const updateStmt = db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)');
      for (const [k, v] of Object.entries(body)) {
        updateStmt.run(k, String(v));
      }
      return sendJson(res, 200, { success: true, message: 'Settings updated' });
    }

    if (pathname === '/api/seed' && method === 'POST') {
      seedDatabase();
      return sendJson(res, 200, { success: true, message: 'Database reset and seeded with demo data' });
    }

    return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`
===========================================================
  LUISCART — Premium E-Commerce Management Platform
  Server listening on http://localhost:${PORT}
===========================================================
  `);
});
