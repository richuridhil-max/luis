const { db } = require('../db');

function listProducts(query) {
  const category = query.category;
  const status = query.status;
  const stockFilter = query.stock; // 'all', 'low', 'out'
  const search = query.search ? query.search.trim() : '';

  const where = [];
  const params = [];

  if (category && category !== 'ALL') {
    where.push('category = ?');
    params.push(category);
  }

  if (status && status !== 'ALL') {
    where.push('status = ?');
    params.push(status);
  }

  if (stockFilter === 'low') {
    where.push('stock_quantity <= low_stock_threshold AND stock_quantity > 0');
  } else if (stockFilter === 'out') {
    where.push('stock_quantity = 0');
  }

  if (search) {
    where.push('(title LIKE ? OR sku LIKE ? OR brand LIKE ? OR category LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const products = db.prepare(`
    SELECT
      *,
      ROUND(price - cost_price, 2) AS profit_per_unit,
      ROUND(((price - cost_price) / price) * 100, 1) AS margin_percentage
    FROM products
    ${whereSql}
    ORDER BY id ASC
  `).all(...params);

  const categories = db.prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC').all();

  const inventorySummary = db.prepare(`
    SELECT
      COUNT(*) AS total_skus,
      SUM(stock_quantity) AS total_units,
      SUM(stock_quantity * cost_price) AS total_inventory_valuation_cost,
      SUM(stock_quantity * price) AS total_inventory_valuation_retail,
      SUM(CASE WHEN stock_quantity <= low_stock_threshold AND stock_quantity > 0 THEN 1 ELSE 0 END) AS low_stock_count,
      SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count
    FROM products
  `).get();

  return {
    products,
    categories: categories.map(c => c.category),
    inventorySummary
  };
}

function addProduct(data) {
  const now = new Date().toISOString();
  const sku = data.sku || `LC-${Date.now().toString().slice(-6)}`;

  const res = db.prepare(`
    INSERT INTO products (
      sku, title, category, brand, description, price, cost_price,
      compare_price, stock_quantity, low_stock_threshold, image_url,
      status, tags, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sku,
    data.title,
    data.category || 'Luxury Goods',
    data.brand || 'LUISCART',
    data.description || '',
    Number(data.price) || 0,
    Number(data.cost_price) || 0,
    data.compare_price ? Number(data.compare_price) : null,
    parseInt(data.stock_quantity) || 0,
    parseInt(data.low_stock_threshold) || 5,
    data.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    data.status || 'ACTIVE',
    data.tags || '',
    now,
    now
  );

  const newId = Number(res.lastInsertRowid);

  if (data.stock_quantity > 0) {
    db.prepare(`
      INSERT INTO inventory_logs (product_id, change_amount, previous_stock, new_stock, reason, created_at)
      VALUES (?, ?, 0, ?, 'Initial Product Cataloging', ?)
    `).run(newId, data.stock_quantity, data.stock_quantity, now);
  }

  return db.prepare('SELECT * FROM products WHERE id = ?').get(newId);
}

function updateProduct(id, data) {
  const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!prod) throw new Error('Product not found');

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products
    SET title = ?, category = ?, brand = ?, description = ?,
        price = ?, cost_price = ?, compare_price = ?,
        low_stock_threshold = ?, image_url = ?, status = ?,
        tags = ?, updated_at = ?
    WHERE id = ?
  `).run(
    data.title || prod.title,
    data.category || prod.category,
    data.brand || prod.brand,
    data.description !== undefined ? data.description : prod.description,
    Number(data.price) || prod.price,
    Number(data.cost_price) || prod.cost_price,
    data.compare_price !== undefined ? Number(data.compare_price) : prod.compare_price,
    data.low_stock_threshold !== undefined ? parseInt(data.low_stock_threshold) : prod.low_stock_threshold,
    data.image_url || prod.image_url,
    data.status || prod.status,
    data.tags !== undefined ? data.tags : prod.tags,
    now,
    id
  );

  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function adjustStock(id, { adjustment, newStock, reason = 'Inventory Audit Adjustment' }) {
  const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!prod) throw new Error('Product not found');

  const prevStock = prod.stock_quantity;
  let finalStock;
  let change;

  if (newStock !== undefined) {
    finalStock = Math.max(0, parseInt(newStock));
    change = finalStock - prevStock;
  } else {
    change = parseInt(adjustment) || 0;
    finalStock = Math.max(0, prevStock + change);
  }

  const now = new Date().toISOString();

  db.prepare('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?').run(finalStock, now, id);

  db.prepare(`
    INSERT INTO inventory_logs (product_id, change_amount, previous_stock, new_stock, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, change, prevStock, finalStock, reason, now);

  return {
    productId: id,
    previousStock: prevStock,
    newStock: finalStock,
    change
  };
}

function getInventoryAuditLogs() {
  return db.prepare(`
    SELECT
      il.*,
      p.title AS product_title,
      p.sku AS product_sku,
      p.image_url AS product_image
    FROM inventory_logs il
    LEFT JOIN products p ON il.product_id = p.id
    ORDER BY il.created_at DESC
    LIMIT 30
  `).all();
}

function exportProductsCSV() {
  const prods = db.prepare(`
    SELECT sku, title, category, brand, price, cost_price, compare_price, stock_quantity, low_stock_threshold, status
    FROM products
    ORDER BY id ASC
  `).all();

  const headers = ['SKU', 'Title', 'Category', 'Brand', 'Price (INR)', 'Cost Price', 'Compare MRP', 'Stock Quantity', 'Low Stock Threshold', 'Status'];
  const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

  const rows = [headers.map(escapeCSV).join(',')];
  for (const p of prods) {
    rows.push([
      p.sku, p.title, p.category, p.brand, p.price, p.cost_price, p.compare_price,
      p.stock_quantity, p.low_stock_threshold, p.status
    ].map(escapeCSV).join(','));
  }

  return rows.join('\r\n');
}

module.exports = {
  listProducts,
  addProduct,
  updateProduct,
  adjustStock,
  getInventoryAuditLogs,
  exportProductsCSV
};
