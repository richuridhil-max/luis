const { db } = require('../db');

function listCoupons() {
  return db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
}

function createCoupon(data) {
  if (!data.code || !data.discount_value) throw new Error('Code and discount value required');
  const now = new Date().toISOString();

  const res = db.prepare(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_value, usage_limit, times_used, expires_at, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?)
  `).run(
    data.code.toUpperCase().trim(),
    data.discount_type || 'PERCENTAGE',
    Number(data.discount_value),
    Number(data.min_order_value) || 0,
    parseInt(data.usage_limit) || 100,
    data.expires_at || null,
    now
  );

  return db.prepare('SELECT * FROM coupons WHERE id = ?').get(Number(res.lastInsertRowid));
}

function toggleCoupon(id) {
  const c = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
  if (!c) throw new Error('Coupon not found');

  const newStatus = c.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE coupons SET is_active = ? WHERE id = ?').run(newStatus, id);
  return { id, is_active: newStatus };
}

module.exports = {
  listCoupons,
  createCoupon,
  toggleCoupon
};
