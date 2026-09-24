const { db } = require('../db');

function parseDateRange(period, customStart, customEnd) {
  const now = new Date();
  let currentStart, currentEnd;
  let prevStart, prevEnd;

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'today': {
      currentStart = startOfDay(now);
      currentEnd = endOfDay(now);
      const yest = new Date(now.getTime() - 86400000);
      prevStart = startOfDay(yest);
      prevEnd = endOfDay(yest);
      break;
    }
    case 'yesterday': {
      const yest = new Date(now.getTime() - 86400000);
      currentStart = startOfDay(yest);
      currentEnd = endOfDay(yest);
      const dayBefore = new Date(now.getTime() - 2 * 86400000);
      prevStart = startOfDay(dayBefore);
      prevEnd = endOfDay(dayBefore);
      break;
    }
    case '7d': {
      currentStart = new Date(now.getTime() - 7 * 86400000);
      currentEnd = now;
      prevStart = new Date(now.getTime() - 14 * 86400000);
      prevEnd = currentStart;
      break;
    }
    case 'this_month': {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      currentEnd = now;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    }
    case 'last_month': {
      currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
      break;
    }
    case 'this_year': {
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      currentEnd = now;
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    }
    case 'custom': {
      currentStart = customStart ? new Date(customStart) : new Date(now.getTime() - 30 * 86400000);
      currentEnd = customEnd ? new Date(customEnd) : now;
      const duration = currentEnd.getTime() - currentStart.getTime();
      prevStart = new Date(currentStart.getTime() - duration);
      prevEnd = currentStart;
      break;
    }
    case '30d':
    default: {
      currentStart = new Date(now.getTime() - 30 * 86400000);
      currentEnd = now;
      prevStart = new Date(now.getTime() - 60 * 86400000);
      prevEnd = currentStart;
      break;
    }
  }

  return {
    current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
    previous: { start: prevStart.toISOString(), end: prevEnd.toISOString() }
  };
}

function calculatePercentChange(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const diff = current - previous;
  return Number(((diff / previous) * 100).toFixed(1));
}

function getPeriodMetrics(startIso, endIso) {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(CASE WHEN payment_status = 'PAID' OR (payment_method = 'COD' AND order_status NOT IN ('CANCELLED', 'RETURNED')) THEN total_amount ELSE 0 END), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN payment_status = 'PAID' OR (payment_method = 'COD' AND order_status NOT IN ('CANCELLED', 'RETURNED')) THEN (total_amount - tax_amount - shipping_fee) ELSE 0 END), 0) AS net_sales,
      COALESCE(SUM(CASE WHEN payment_method = 'COD' AND payment_status = 'PENDING' AND order_status NOT IN ('CANCELLED', 'RETURNED') THEN total_amount ELSE 0 END), 0) AS pending_cod_payments,
      COALESCE(SUM(CASE WHEN payment_status = 'REFUNDED' OR order_status = 'REFUNDED' THEN total_amount ELSE 0 END), 0) AS refund_amount,
      COALESCE(SUM(CASE WHEN payment_method = 'COD' THEN 1 ELSE 0 END), 0) AS cod_orders_count,
      COALESCE(SUM(CASE WHEN payment_method != 'COD' THEN 1 ELSE 0 END), 0) AS prepaid_orders_count,
      COALESCE(SUM(CASE WHEN order_status = 'RETURNED' THEN 1 ELSE 0 END), 0) AS rto_count,
      COUNT(DISTINCT customer_id) AS distinct_customers
    FROM orders
    WHERE created_at >= ? AND created_at <= ?
  `).get(startIso, endIso);

  // Supplier sourcing COGS
  const itemsRow = db.prepare(`
    SELECT
      COALESCE(SUM(oi.quantity), 0) AS products_sold,
      COALESCE(SUM(oi.cost_price * oi.quantity), 0) AS total_supplier_cogs
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status NOT IN ('CANCELLED')
  `).get(startIso, endIso);

  // Ad Spend & Operating Expenses
  const expenseRow = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) AS total_expenses,
      COALESCE(SUM(CASE WHEN category = 'Ad Spend' THEN amount ELSE 0 END), 0) AS total_ad_spend,
      COALESCE(SUM(CASE WHEN category = 'RTO Loss' THEN amount ELSE 0 END), 0) AS total_rto_losses
    FROM expenses
    WHERE date >= ? AND date <= ?
  `).get(startIso.split('T')[0], endIso.split('T')[0]);

  // True Dropshipping Net Profit = Net Sales - Supplier Product COGS - Ad Spend - RTO Losses - Other Expenses
  const netProfit = Math.round(row.net_sales - itemsRow.total_supplier_cogs - expenseRow.total_expenses);

  // Blended ROAS
  const roas = expenseRow.total_ad_spend > 0
    ? Number((row.total_revenue / expenseRow.total_ad_spend).toFixed(2))
    : 0;

  // RTO % Rate
  const rtoRate = row.total_orders > 0
    ? Number(((row.rto_count / row.total_orders) * 100).toFixed(1))
    : 0;

  return {
    totalRevenue: Math.round(row.total_revenue),
    totalOrders: row.total_orders,
    productsSold: itemsRow.products_sold,
    netSales: Math.round(row.net_sales),
    supplierCogs: Math.round(itemsRow.total_supplier_cogs),
    adSpend: Math.round(expenseRow.total_ad_spend),
    roas,
    estimatedProfit: netProfit,
    pendingPayments: Math.round(row.pending_cod_payments),
    refundAmount: Math.round(row.refund_amount),
    rtoCount: row.rto_count,
    rtoRate,
    codOrdersCount: row.cod_orders_count,
    prepaidOrdersCount: row.prepaid_orders_count,
    distinctCustomers: row.distinct_customers,
    totalExpenses: Math.round(expenseRow.total_expenses)
  };
}

function getDashboardData(query) {
  const period = query.period || '30d';
  const customStart = query.start;
  const customEnd = query.end;

  const { current, previous } = parseDateRange(period, customStart, customEnd);

  const curMetrics = getPeriodMetrics(current.start, current.end);
  const prevMetrics = getPeriodMetrics(previous.start, previous.end);

  const totalCustomersRow = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  const totalCustomers = totalCustomersRow.count;

  // Supplier inventory status
  const invStats = db.prepare(`
    SELECT
      COUNT(*) AS total_skus,
      SUM(stock_quantity) AS total_units_in_stock,
      SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) AS low_stock_count,
      COUNT(DISTINCT supplier_name) AS active_suppliers_count
    FROM products
  `).get();

  // Status breakdown of orders
  const statusCounts = db.prepare(`
    SELECT order_status, COUNT(*) as count, SUM(total_amount) as value
    FROM orders
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY order_status
  `).all(current.start, current.end);

  const allStatuses = [
    'NEW', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
    'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'
  ];
  const orderAnalytics = {};
  for (const s of allStatuses) {
    const match = statusCounts.find(r => r.order_status === s);
    orderAnalytics[s] = {
      count: match ? match.count : 0,
      value: match ? Math.round(match.value) : 0
    };
  }

  // Winning Dropshipping Products (by Volume, Revenue & Profit)
  const topProducts = db.prepare(`
    SELECT
      oi.product_id,
      oi.sku,
      oi.title,
      oi.image_url,
      p.category,
      p.supplier_name,
      SUM(oi.quantity) AS units_sold,
      SUM(oi.total) AS total_revenue,
      SUM(oi.total - (oi.cost_price * oi.quantity)) AS gross_profit,
      ROUND(((SUM(oi.total - (oi.cost_price * oi.quantity))) / SUM(oi.total)) * 100, 1) AS margin_pct
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status NOT IN ('CANCELLED')
    GROUP BY oi.product_id, oi.sku, oi.title
    ORDER BY total_revenue DESC
    LIMIT 6
  `).all(current.start, current.end);

  // Revenue by Category
  const categorySplit = db.prepare(`
    SELECT
      COALESCE(p.category, 'General Dropship') AS category,
      SUM(oi.total) AS revenue,
      SUM(oi.quantity) AS units
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.created_at >= ? AND o.created_at <= ? AND o.order_status NOT IN ('CANCELLED')
    GROUP BY p.category
    ORDER BY revenue DESC
  `).all(current.start, current.end);

  // Customer Analytics
  const aov = curMetrics.totalOrders > 0 ? Math.round(curMetrics.totalRevenue / curMetrics.totalOrders) : 0;
  
  const repeatStats = db.prepare(`
    SELECT
      COUNT(DISTINCT CASE WHEN orders_count > 1 THEN id END) AS repeat_customers,
      COUNT(DISTINCT id) AS total_customer_base,
      AVG(total_spent) AS average_ltv
    FROM customers
  `).get();

  const repeatRate = repeatStats.total_customer_base > 0
    ? Number(((repeatStats.repeat_customers / repeatStats.total_customer_base) * 100).toFixed(1))
    : 0;

  const topCustomers = db.prepare(`
    SELECT id, first_name, last_name, email, city, total_spent, orders_count, tag
    FROM customers
    ORDER BY total_spent DESC
    LIMIT 5
  `).all();

  // Revenue trend timeline for Chart.js
  const revenueTrend = db.prepare(`
    SELECT
      substr(created_at, 1, 10) AS date_str,
      COUNT(*) AS orders_count,
      SUM(total_amount) AS daily_revenue,
      SUM(total_amount - tax_amount - shipping_fee) AS net_sales
    FROM orders
    WHERE created_at >= ? AND created_at <= ? AND order_status NOT IN ('CANCELLED')
    GROUP BY date_str
    ORDER BY date_str ASC
  `).all(current.start, current.end);

  // Recent transactions list
  const recentTransactions = db.prepare(`
    SELECT
      o.id,
      o.order_number,
      o.customer_name,
      o.total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.supplier_name,
      o.supplier_status,
      o.cod_verified,
      o.created_at
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 8
  `).all();

  return {
    period,
    dateRange: { start: current.start, end: current.end },
    kpis: {
      totalRevenue: {
        value: curMetrics.totalRevenue,
        previous: prevMetrics.totalRevenue,
        percentChange: calculatePercentChange(curMetrics.totalRevenue, prevMetrics.totalRevenue)
      },
      totalOrders: {
        value: curMetrics.totalOrders,
        previous: prevMetrics.totalOrders,
        percentChange: calculatePercentChange(curMetrics.totalOrders, prevMetrics.totalOrders),
        codCount: curMetrics.codOrdersCount,
        prepaidCount: curMetrics.prepaidOrdersCount
      },
      adSpend: {
        value: curMetrics.adSpend,
        previous: prevMetrics.adSpend,
        percentChange: calculatePercentChange(curMetrics.adSpend, prevMetrics.adSpend)
      },
      roas: {
        value: curMetrics.roas,
        previous: prevMetrics.roas,
        percentChange: calculatePercentChange(curMetrics.roas, prevMetrics.roas)
      },
      supplierCogs: {
        value: curMetrics.supplierCogs,
        previous: prevMetrics.supplierCogs,
        percentChange: calculatePercentChange(curMetrics.supplierCogs, prevMetrics.supplierCogs)
      },
      estimatedProfit: {
        value: curMetrics.estimatedProfit,
        previous: prevMetrics.estimatedProfit,
        percentChange: calculatePercentChange(curMetrics.estimatedProfit, prevMetrics.estimatedProfit)
      },
      rtoRate: {
        value: curMetrics.rtoRate,
        rtoCount: curMetrics.rtoCount,
        percentChange: calculatePercentChange(curMetrics.rtoRate, prevMetrics.rtoRate)
      },
      pendingPayments: {
        value: curMetrics.pendingPayments,
        previous: prevMetrics.pendingPayments,
        percentChange: calculatePercentChange(curMetrics.pendingPayments, prevMetrics.pendingPayments)
      }
    },
    orderAnalytics,
    topProducts,
    categorySplit,
    customerAnalytics: {
      totalCustomers,
      distinctInPeriod: curMetrics.distinctCustomers,
      repeatRate,
      averageOrderValue: aov,
      averageLtv: Math.round(repeatStats.average_ltv || 0),
      topCustomers
    },
    inventoryStatus: invStats,
    revenueTrend,
    recentTransactions
  };
}

module.exports = {
  getDashboardData
};
