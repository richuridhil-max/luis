const { db } = require('../db');

function getShippingHub() {
  // Carrier breakdown
  const carrierStats = db.prepare(`
    SELECT
      COALESCE(courier_partner, 'Unassigned') AS courier,
      COUNT(*) AS total_shipments,
      SUM(CASE WHEN shipping_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
      SUM(CASE WHEN shipping_status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'MANIFESTED') THEN 1 ELSE 0 END) AS active_in_transit
    FROM orders
    WHERE order_status NOT IN ('CANCELLED', 'NEW')
    GROUP BY courier_partner
  `).all();

  // Shipments in flight
  const activeShipments = db.prepare(`
    SELECT
      id,
      order_number,
      customer_name,
      shipping_address,
      courier_partner,
      tracking_number,
      order_status,
      shipping_status,
      estimated_delivery,
      actual_delivery,
      created_at
    FROM orders
    WHERE shipping_status IN ('PENDING', 'PACKED', 'MANIFESTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY')
    ORDER BY created_at DESC
  `).all();

  // Status breakdown
  const statusCounts = db.prepare(`
    SELECT shipping_status, COUNT(*) as count
    FROM orders
    GROUP BY shipping_status
  `).all();

  return {
    carrierStats,
    activeShipments,
    statusCounts
  };
}

module.exports = {
  getShippingHub
};
