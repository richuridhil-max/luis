const { db } = require('../db');

function listCustomers(query) {
  const search = query.search ? query.search.trim() : '';
  const tag = query.tag;

  const where = [];
  const params = [];

  if (tag && tag !== 'ALL') {
    where.push('tag = ?');
    params.push(tag);
  }

  if (search) {
    where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const customers = db.prepare(`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      city,
      state,
      postal_code,
      country,
      total_spent,
      orders_count,
      tag,
      status,
      notes,
      created_at,
      ROUND(CASE WHEN orders_count > 0 THEN total_spent / orders_count ELSE 0 END, 2) AS aov
    FROM customers
    ${whereSql}
    ORDER BY total_spent DESC
  `).all(...params);

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total_customers,
      SUM(CASE WHEN tag = 'VIP' THEN 1 ELSE 0 END) AS vip_customers,
      SUM(CASE WHEN tag = 'NEW' THEN 1 ELSE 0 END) AS new_customers,
      SUM(CASE WHEN tag = 'AT_RISK' THEN 1 ELSE 0 END) AS at_risk_customers,
      ROUND(AVG(total_spent), 0) AS avg_clv
    FROM customers
  `).get();

  return {
    customers,
    stats
  };
}

function getCustomerProfile(id) {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!customer) return null;

  const orders = db.prepare(`
    SELECT
      id,
      order_number,
      total_amount,
      payment_method,
      payment_status,
      order_status,
      shipping_status,
      created_at,
      (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) AS items_count
    FROM orders
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `).all(id);

  return {
    ...customer,
    orders
  };
}

function updateCustomerTag(id, tag, notes) {
  db.prepare(`
    UPDATE customers
    SET tag = ?, notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(tag, notes || null, id);

  return getCustomerProfile(id);
}

function exportCustomersCSV() {
  const customers = db.prepare(`
    SELECT first_name, last_name, email, phone, city, state, postal_code, tag, orders_count, total_spent, created_at
    FROM customers
    ORDER BY total_spent DESC
  `).all();

  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'City', 'State', 'Pincode', 'Segment Tag', 'Orders', 'Total Spend (INR)', 'Member Since'];
  const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

  const rows = [headers.map(escapeCSV).join(',')];
  for (const c of customers) {
    rows.push([
      c.first_name, c.last_name, c.email, c.phone, c.city, c.state, c.postal_code,
      c.tag, c.orders_count, c.total_spent, c.created_at
    ].map(escapeCSV).join(','));
  }

  return rows.join('\r\n');
}

module.exports = {
  listCustomers,
  getCustomerProfile,
  updateCustomerTag,
  exportCustomersCSV
};
