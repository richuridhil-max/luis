const { db } = require('../db');

function listOrders(query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;

  const status = query.status;
  const search = query.search ? query.search.trim() : '';
  const paymentStatus = query.payment_status;

  const whereClauses = [];
  const params = [];

  if (status && status !== 'ALL') {
    if (status.includes(',')) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      whereClauses.push(`o.order_status IN (${statuses.map(() => '?').join(',')})`);
      params.push(...statuses);
    } else {
      whereClauses.push('o.order_status = ?');
      params.push(status);
    }
  }

  if (paymentStatus && paymentStatus !== 'ALL') {
    whereClauses.push('o.payment_status = ?');
    params.push(paymentStatus);
  }

  if (search) {
    whereClauses.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ? OR o.tracking_number LIKE ? OR o.supplier_order_id LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${whereSql}`).get(...params);
  const total = totalRow.total;

  const orders = db.prepare(`
    SELECT
      o.id,
      o.order_number,
      o.customer_id,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.subtotal,
      o.discount_amount,
      o.shipping_fee,
      o.tax_amount,
      o.total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.shipping_status,
      o.supplier_name,
      o.supplier_order_id,
      o.supplier_status,
      o.cod_verified,
      o.rto_risk,
      o.courier_partner,
      o.tracking_number,
      o.created_at,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count,
      (SELECT GROUP_CONCAT(title, ', ') FROM order_items WHERE order_id = o.id) AS items_summary
    FROM orders o
    ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  // Status counts for simplified tab badges
  const allOrdersCount = db.prepare('SELECT COUNT(*) as total FROM orders').get().total;
  const countsByStatus = db.prepare(`
    SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status
  `).all();

  const rawCounts = {};
  for (const row of countsByStatus) {
    rawCounts[row.order_status] = row.count;
  }

  const statusBadgeCounts = {
    ...rawCounts,
    ALL: allOrdersCount,
    NEW: rawCounts['NEW'] || 0,
    CONFIRMED: (rawCounts['CONFIRMED'] || 0) + (rawCounts['PROCESSING'] || 0) + (rawCounts['PACKED'] || 0),
    SHIPPED: (rawCounts['SHIPPED'] || 0) + (rawCounts['OUT_FOR_DELIVERY'] || 0),
    DELIVERED: rawCounts['DELIVERED'] || 0,
    CANCELLED: (rawCounts['CANCELLED'] || 0) + (rawCounts['RETURN_REQUESTED'] || 0) + (rawCounts['RETURNED'] || 0) + (rawCounts['REFUNDED'] || 0)
  };

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    statusBadgeCounts
  };
}

function getOrderDetails(id) {
  const order = db.prepare(`
    SELECT o.*, c.total_spent as customer_total_spent, c.orders_count as customer_orders_count, c.tag as customer_tag
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ? OR o.order_number = ?
  `).get(id, id);

  if (!order) return null;

  const items = db.prepare(`
    SELECT oi.*, p.stock_quantity as current_stock, p.category, p.supplier_name, p.supplier_sku
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(order.id);

  const timeline = db.prepare(`
    SELECT * FROM order_timeline
    WHERE order_id = ?
    ORDER BY created_at ASC
  `).all(order.id);

  const notes = db.prepare(`
    SELECT * FROM order_notes
    WHERE order_id = ?
    ORDER BY created_at DESC
  `).all(order.id);

  return {
    ...order,
    items,
    timeline,
    notes
  };
}

function updateOrderStatus(id, { status, note, actor = 'Dropship Admin' }) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) throw new Error('Order not found');

  const oldStatus = order.order_status;
  const now = new Date().toISOString();

  let shippingStatus = order.shipping_status;
  if (status === 'CONFIRMED') shippingStatus = 'PENDING';
  if (status === 'PROCESSING') shippingStatus = 'PROCESSING';
  if (status === 'PACKED') shippingStatus = 'PACKED';
  if (status === 'SHIPPED') shippingStatus = 'IN_TRANSIT';
  if (status === 'OUT_FOR_DELIVERY') shippingStatus = 'OUT_FOR_DELIVERY';
  if (status === 'DELIVERED') shippingStatus = 'DELIVERED';
  if (status === 'CANCELLED') shippingStatus = 'CANCELLED';
  if (status === 'RETURN_REQUESTED') shippingStatus = 'RETURN_REQUESTED';
  if (status === 'RETURNED') shippingStatus = 'RETURNED';
  if (status === 'REFUNDED') shippingStatus = 'REFUNDED';

  const actualDelivery = (status === 'DELIVERED' && !order.actual_delivery) ? now.split('T')[0] : (order.actual_delivery || null);

  db.prepare(`
    UPDATE orders
    SET order_status = ?, shipping_status = ?, actual_delivery = ?, updated_at = ?
    WHERE id = ?
  `).run(status, shippingStatus, actualDelivery, now, id);

  const titles = {
    CONFIRMED: 'Order Confirmed & Payment Verified',
    PROCESSING: 'Pushed to Sourcing Supplier',
    PACKED: 'Supplier Packed & Labelled',
    SHIPPED: 'Dispatched to Transit Carrier',
    OUT_FOR_DELIVERY: 'Out for Final Mile Delivery',
    DELIVERED: 'Delivered to Customer',
    CANCELLED: 'Order Cancelled',
    RETURN_REQUESTED: 'Return Requested',
    RETURNED: 'RTO (Return to Origin) Received',
    REFUNDED: 'Order Refunded'
  };

  const title = titles[status] || `Status updated to ${status}`;
  const desc = note || `Dropshipping status changed from ${oldStatus} to ${status}`;

  db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, status, title, desc, actor, now);

  return getOrderDetails(id);
}

function updateOrderTracking(id, { courier_partner, tracking_number, notes }) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) throw new Error('Order not found');

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE orders
    SET courier_partner = ?, tracking_number = ?, shipping_status = 'IN_TRANSIT', updated_at = ?
    WHERE id = ?
  `).run(courier_partner, tracking_number, now, id);

  db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
    VALUES (?, 'SHIPPED', 'Courier AWB Assigned', ?, 'Logistics Desk', ?)
  `).run(id, `Assigned to ${courier_partner} with domestic AWB #${tracking_number}. ${notes || ''}`.trim(), now);

  return getOrderDetails(id);
}

function pushToSupplier(id, { supplier_name }) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) throw new Error('Order not found');

  const now = new Date().toISOString();
  const targetSupplier = supplier_name || order.supplier_name || 'CJ Dropshipping';
  const prefix = targetSupplier.includes('CJ') ? 'CJ-2026-' : (targetSupplier.includes('Roposo') ? 'RP-' : 'PSA-');
  const supplierOrderId = `${prefix}${Math.floor(10000 + Math.random() * 90000)}`;

  db.prepare(`
    UPDATE orders
    SET supplier_name = ?, supplier_order_id = ?, supplier_status = 'SUPPLIER_PROCESSING',
        order_status = 'PROCESSING', updated_at = ?
    WHERE id = ?
  `).run(targetSupplier, supplierOrderId, now, id);

  db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
    VALUES (?, 'PROCESSING', 'Auto-Pushed to Sourcing Supplier', ?, 'CJ/Supplier API', ?)
  `).run(id, `Order successfully pushed to ${targetSupplier}. Supplier PO #${supplierOrderId} created. Sourcing confirmed.`, now);

  return getOrderDetails(id);
}

function verifyCod(id, { verified, codVerified, rto_risk, rtoRisk } = {}) {
  const now = new Date().toISOString();
  const isVerified = verified !== undefined ? !!verified : (codVerified !== undefined ? !!codVerified : true);
  const val = isVerified ? 1 : 0;
  const status = isVerified ? 'CONFIRMED' : 'CANCELLED';
  const newRtoRisk = rto_risk || rtoRisk || (isVerified ? 'LOW' : 'HIGH');

  db.prepare(`
    UPDATE orders
    SET cod_verified = ?, rto_risk = ?, order_status = CASE WHEN ? = 1 THEN 'CONFIRMED' ELSE 'CANCELLED' END, updated_at = ?
    WHERE id = ?
  `).run(val, newRtoRisk, val, now, id);

  db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
    VALUES (?, ?, ?, ?, 'WhatsApp Bot', ?)
  `).run(
    id,
    status,
    isVerified ? 'COD Confirmed via WhatsApp' : 'COD Cancelled (Customer Rejected)',
    isVerified ? 'Customer verified address and cash on delivery availability.' : 'Customer declined order or failed verification.',
    now
  );

  return getOrderDetails(id);
}

function createRefund(id, { amount, reason, restock = true }) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) throw new Error('Order not found');

  const now = new Date().toISOString();
  const refundAmount = amount ? Number(amount) : order.total_amount;

  db.prepare(`
    UPDATE orders
    SET payment_status = 'REFUNDED', order_status = 'REFUNDED', shipping_status = 'REFUNDED', updated_at = ?
    WHERE id = ?
  `).run(now, id);

  db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
    VALUES (?, 'REFUNDED', 'Refund Processed', ?, 'Admin', ?)
  `).run(id, `Refund of ₹${refundAmount.toLocaleString('en-IN')} approved. Reason: ${reason || 'Customer satisfaction'}.`, now);

  return getOrderDetails(id);
}

function addOrderNote(id, { note, author = 'Dropship Admin' }) {
  if (!note || !note.trim()) throw new Error('Note cannot be empty');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO order_notes (order_id, author, note, is_internal, created_at)
    VALUES (?, ?, ?, 1, ?)
  `).run(id, author, note.trim(), now);

  return db.prepare('SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at DESC').all(id);
}

function createManualOrder(inputData) {
  let data = inputData;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { data = {}; }
  }
  data = data || {};
  const now = new Date().toISOString();
  const orderNum = `#LC${Math.floor(10000 + Math.random() * 90000)}`;

  let customerId = data.customer_id;
  if (!customerId && data.customer_email) {
    let existing = db.prepare('SELECT id FROM customers WHERE email = ?').get(data.customer_email);
    if (!existing) {
      const names = (data.customer_name || 'Guest Dropship Buyer').split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'Customer';
      const newCust = db.prepare(`
        INSERT INTO customers (first_name, last_name, email, phone, city, state, postal_code, country, tag, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'India', 'NEW', ?)
      `).run(firstName, lastName, data.customer_email, data.customer_phone || '+91 9000000000', data.city || 'Mumbai', data.state || 'Maharashtra', data.postal_code || '400001', now);
      customerId = Number(newCust.lastInsertRowid);
    } else {
      customerId = existing.id;
    }
  }

  let subtotal = 0;
  const resolvedItems = [];
  const rawItems = Array.isArray(data.items) ? data.items : (typeof data.items === 'string' ? JSON.parse(data.items || '[]') : []);

  for (const item of rawItems) {
    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (!prod) continue;
    const qty = parseInt(item.quantity) || 1;
    const itemTotal = prod.price * qty;
    subtotal += itemTotal;
    resolvedItems.push({
      product_id: prod.id,
      sku: prod.sku,
      title: prod.title,
      image_url: prod.image_url,
      price: prod.price,
      cost_price: prod.cost_price,
      quantity: qty,
      total: itemTotal
    });
  }

  if (resolvedItems.length === 0) {
    throw new Error('Order must include at least one valid product');
  }

  let discountAmount = 0;
  if (data.discount_code) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(data.discount_code);
    if (coupon) {
      if (coupon.discount_type === 'PERCENTAGE') {
        discountAmount = Math.round(subtotal * (coupon.discount_value / 100));
      } else if (coupon.discount_type === 'FIXED') {
        discountAmount = coupon.discount_value;
      }
      db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?').run(coupon.id);
    }
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableBase * 0.18);
  const shippingFee = (taxableBase >= 999 || data.shipping_fee === 0) ? 0 : 99;
  const totalAmount = taxableBase + taxAmount + shippingFee;

  const paymentMethod = data.payment_method || 'COD';
  const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'PAID';
  const orderStatus = paymentMethod === 'COD' ? 'CONFIRMED' : 'PROCESSING';
  const supplier = data.supplier_name || 'CJ Dropshipping';
  const supplierOrderId = `CJ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const courierPartner = data.courier_partner || 'Delhivery Surface';
  const trackingNumber = data.tracking_number || `DEL${Math.floor(10000000 + Math.random() * 90000000)}`;

  const orderRes = db.prepare(`
    INSERT INTO orders (
      order_number, customer_id, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, subtotal, discount_amount, discount_code,
      shipping_fee, tax_amount, total_amount, payment_method, payment_status,
      order_status, shipping_status, supplier_name, supplier_order_id, supplier_status,
      cod_verified, rto_risk, courier_partner, tracking_number,
      estimated_delivery, actual_delivery, admin_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AWAITING_SUPPLIER', 1, 'LOW', ?, ?, ?, NULL, ?, ?, ?)
  `).run(
    orderNum, customerId, data.customer_name, data.customer_email, data.customer_phone,
    data.shipping_address, data.billing_address || data.shipping_address,
    subtotal, discountAmount, data.discount_code || null,
    shippingFee, taxAmount, totalAmount, paymentMethod,
    paymentStatus, orderStatus, 'PENDING', supplier, supplierOrderId,
    courierPartner, trackingNumber,
    new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    data.notes || 'Placed via Storefront Simulator / Dropship Order', now, now
  );

  const orderId = Number(orderRes.lastInsertRowid);

  for (const item of resolvedItems) {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, sku, title, image_url, price, cost_price, quantity, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, item.product_id, item.sku, item.title, item.image_url, item.price, item.cost_price, item.quantity, item.total);
  }

  // Initial timeline
  db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
    VALUES (?, 'NEW', 'Checkout Completed', ?, 'Online Storefront', ?)
  `).run(orderId, `New dropship order received for ₹${totalAmount.toLocaleString('en-IN')}`, now);

  if (paymentMethod === 'COD') {
    db.prepare(`
      INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
      VALUES (?, 'CONFIRMED', 'COD Verified', 'Customer confirmed order intent via WhatsApp bot.', 'WhatsApp Bot', ?)
    `).run(orderId, now);
  } else {
    db.prepare(`
      INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
      VALUES (?, 'CONFIRMED', 'Prepaid Captured', 'Payment settled via gateway.', 'Payment Gateway', ?)
    `).run(orderId, now);
  }

  if (customerId) {
    db.prepare(`
      UPDATE customers
      SET orders_count = orders_count + 1,
          total_spent = total_spent + ?
      WHERE id = ?
    `).run(totalAmount, customerId);
  }

  return getOrderDetails(orderId);
}

function exportOrdersCSV() {
  const orders = db.prepare(`
    SELECT
      o.order_number,
      o.created_at,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.total_amount,
      o.subtotal,
      o.discount_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.supplier_name,
      o.supplier_order_id,
      o.courier_partner,
      o.tracking_number,
      o.shipping_address
    FROM orders o
    ORDER BY o.created_at DESC
  `).all();

  const headers = [
    'Order Number', 'Date', 'Customer Name', 'Email', 'Phone',
    'Total (INR)', 'Subtotal', 'Discount', 'Payment Method', 'Payment Status',
    'Order Status', 'Supplier', 'Supplier PO #', 'Courier', 'Tracking AWB', 'Shipping Address'
  ];

  const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
  const rows = [headers.map(escapeCSV).join(',')];

  for (const o of orders) {
    rows.push([
      o.order_number, o.created_at, o.customer_name, o.customer_email, o.customer_phone,
      o.total_amount, o.subtotal, o.discount_amount, o.payment_method, o.payment_status,
      o.order_status, o.supplier_name, o.supplier_order_id, o.courier_partner,
      o.tracking_number, o.shipping_address
    ].map(escapeCSV).join(','));
  }

  return rows.join('\r\n');
}

module.exports = {
  listOrders,
  getOrderDetails,
  updateOrderStatus,
  updateOrderTracking,
  pushToSupplier,
  verifyCod,
  createRefund,
  addOrderNote,
  createManualOrder,
  exportOrdersCSV
};
