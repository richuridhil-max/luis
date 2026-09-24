const { db } = require('../db');

function getProfitAndLoss(query) {
  const period = query.period || '30d';

  const salesAgg = db.prepare(`
    SELECT
      COUNT(*) AS total_delivered_orders,
      COALESCE(SUM(subtotal), 0) AS gross_sales,
      COALESCE(SUM(discount_amount), 0) AS total_discounts,
      COALESCE(SUM(shipping_fee), 0) AS shipping_collected,
      COALESCE(SUM(tax_amount), 0) AS gst_collected,
      COALESCE(SUM(total_amount), 0) AS gross_revenue
    FROM orders
    WHERE order_status NOT IN ('CANCELLED')
  `).get();

  const cogsAgg = db.prepare(`
    SELECT COALESCE(SUM(oi.cost_price * oi.quantity), 0) AS total_supplier_cogs
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_status NOT IN ('CANCELLED')
  `).get();

  const expensesList = db.prepare(`
    SELECT * FROM expenses ORDER BY date DESC
  `).all();

  const expensesByCategory = db.prepare(`
    SELECT category, SUM(amount) AS total
    FROM expenses
    GROUP BY category
    ORDER BY total DESC
  `).all();

  const totalExpensesRow = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses').get();
  const totalOperatingExpenses = totalExpensesRow.total;

  const adSpendRow = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category = 'Ad Spend'").get();
  const adSpend = adSpendRow.total;

  const rtoLossRow = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category = 'RTO Loss'").get();
  const rtoLoss = rtoLossRow.total;

  const netSales = Math.round(salesAgg.gross_sales - salesAgg.total_discounts);
  const grossProfit = Math.round(netSales - cogsAgg.total_supplier_cogs);
  const grossMarginPct = netSales > 0 ? Number(((grossProfit / netSales) * 100).toFixed(1)) : 0;
  const netProfit = Math.round(grossProfit - totalOperatingExpenses);
  const netMarginPct = netSales > 0 ? Number(((netProfit / netSales) * 100).toFixed(1)) : 0;
  const roas = adSpend > 0 ? Number((salesAgg.gross_revenue / adSpend).toFixed(2)) : 0;

  const rtoOrders = db.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) as total_val FROM orders WHERE order_status = 'RETURNED'").get();

  return {
    period,
    grossSales: Math.round(salesAgg.gross_sales),
    discountsGiven: Math.round(salesAgg.total_discounts),
    netSales,
    cogs: Math.round(cogsAgg.total_supplier_cogs),
    grossProfit,
    grossMarginPct,
    adSpend: Math.round(adSpend),
    roas,
    rtoLoss: Math.round(rtoLoss),
    rtoOrdersCount: rtoOrders.count,
    rtoOrdersValue: Math.round(rtoOrders.total_val),
    shippingCollected: Math.round(salesAgg.shipping_collected),
    gstCollected: Math.round(salesAgg.gst_collected),
    totalOperatingExpenses: Math.round(totalOperatingExpenses),
    netProfit,
    netMarginPct,
    paidOrdersCount: salesAgg.total_delivered_orders,
    expensesByCategory,
    expensesList
  };
}

function addExpense(data) {
  if (!data.title || !data.amount) throw new Error('Title and amount required');
  const now = new Date().toISOString();
  const date = data.date || now.split('T')[0];

  const res = db.prepare(`
    INSERT INTO expenses (title, category, amount, date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.category || 'General',
    Number(data.amount),
    date,
    data.notes || '',
    now
  );

  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(res.lastInsertRowid));
}

function listInvoices(query) {
  const search = query.search ? query.search.trim() : '';
  const where = ["o.order_status NOT IN ('CANCELLED')"];
  const params = [];

  if (search) {
    where.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const invoices = db.prepare(`
    SELECT
      o.id,
      o.order_number,
      'INV-' || substr(o.order_number, 4) AS invoice_number,
      o.customer_name,
      o.customer_email,
      o.subtotal,
      o.discount_amount,
      o.tax_amount,
      o.shipping_fee,
      o.total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.created_at,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
    FROM orders o
    ${whereSql}
    ORDER BY o.created_at DESC
  `).all(...params);

  return invoices;
}

module.exports = {
  getProfitAndLoss,
  addExpense,
  listInvoices
};
