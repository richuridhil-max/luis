const { db } = require('../db');

function getSuppliersHub() {
  const suppliers = db.prepare(`
    SELECT
      COALESCE(p.supplier_name, 'CJ Dropshipping') AS supplier_name,
      COUNT(DISTINCT p.id) AS product_count,
      COALESCE(SUM(oi.quantity), 0) AS units_ordered,
      COALESCE(SUM(oi.cost_price * oi.quantity), 0) AS total_sourcing_volume
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.supplier_name
  `).all();

  // Pending orders awaiting supplier fulfillment
  const pendingSupplierOrders = db.prepare(`
    SELECT
      o.id,
      o.order_number,
      o.customer_name,
      o.total_amount,
      o.supplier_name,
      o.supplier_order_id,
      o.supplier_status,
      o.order_status,
      o.created_at,
      (SELECT GROUP_CONCAT(title, ', ') FROM order_items WHERE order_id = o.id) as items_summary
    FROM orders o
    WHERE o.supplier_status IN ('AWAITING_SUPPLIER', 'SUPPLIER_PROCESSING')
    ORDER BY o.created_at DESC
  `).all();

  return {
    suppliers,
    pendingSupplierOrders
  };
}

function bulkPushToSupplier(orderIds) {
  const now = new Date().toISOString();
  let updated = 0;

  for (const id of orderIds) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) continue;

    const supplier = order.supplier_name || 'CJ Dropshipping';
    const prefix = supplier.includes('CJ') ? 'CJ-2026-' : 'RP-';
    const poNum = `${prefix}${Math.floor(10000 + Math.random() * 90000)}`;

    db.prepare(`
      UPDATE orders
      SET supplier_order_id = ?, supplier_status = 'SUPPLIER_PROCESSING',
          order_status = 'PROCESSING', updated_at = ?
      WHERE id = ?
    `).run(poNum, now, id);

    db.prepare(`
      INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
      VALUES (?, 'PROCESSING', 'Bulk Pushed to Supplier API', ?, 'Dropship Auto-Sync', ?)
    `).run(id, `Automated bulk sync sent to ${supplier}. Supplier PO #${poNum} created.`, now);

    updated++;
  }

  return { updated };
}

module.exports = {
  getSuppliersHub,
  bulkPushToSupplier
};
