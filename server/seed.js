const crypto = require('node:crypto');
const { db } = require('./db');

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim() + '_luiscart_pin_salt').digest('hex');
}

function seedDatabase() {
  console.log('--- Seeding LUISCART Dropshipping Database ---');

  // Clear existing data
  db.exec(`
    DELETE FROM activity_logs;
    DELETE FROM inventory_logs;
    DELETE FROM order_notes;
    DELETE FROM order_timeline;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM customers;
    DELETE FROM products;
    DELETE FROM coupons;
    DELETE FROM expenses;
    DELETE FROM store_settings;
  `);

  // 1. Store Settings for Dropshipping
  const settings = [
    ['store_name', 'LUISCART'],
    ['tagline', 'Direct Sourcing & High-Velocity Dropshipping'],
    ['business_model', 'Dropshipping / E-Commerce 3PL'],
    ['currency', 'INR'],
    ['currency_symbol', '₹'],
    ['gstin', '27AABCL1234F1Z8'],
    ['pan', 'AABCL1234F'],
    ['email', 'support@luiscart.com'],
    ['support_phone', '+91 98200 12345'],
    ['address_line1', 'LUISCART Fulfillment Hub, Sector 18, Udyog Vihar'],
    ['city', 'Gurugram'],
    ['state', 'Haryana'],
    ['postal_code', '122008'],
    ['country', 'India'],
    ['default_supplier', 'CJ Dropshipping'],
    ['auto_fulfill_prepaid', 'true'],
    ['cod_verification_whatsapp', 'true'],
    ['target_roas', '3.5'],
    ['tax_rate_standard', '18'],
    ['shipping_flat_rate', '99'],
    ['free_shipping_threshold', '999'],
    ['security_pin_hash', hashPin('1111')],
    ['security_pin_enabled', 'true']
  ];

  const insertSetting = db.prepare('INSERT INTO store_settings (key, value) VALUES (?, ?)');
  for (const [k, v] of settings) {
    insertSetting.run(k, v);
  }

  // 2. High-Velocity Dropshipping Products (Trending Winning Products)
  const products = [
    {
      sku: 'DS-EAR-01',
      title: 'Smart Visual Ear Cleaner with 1080P HD WiFi Otoscope Camera',
      category: 'Tech & Gadgets',
      brand: 'LUISCART Tech',
      description: 'WiFi connected smart endoscope with 6 LED lights, silicone safe scoop tips, compatible with iOS and Android.',
      price: 1499,
      cost_price: 380, // Supplier cost
      compare_price: 2499,
      stock_quantity: 450,
      low_stock_threshold: 20,
      supplier_name: 'CJ Dropshipping',
      supplier_sku: 'CJ-VIS-EAR-09',
      supplier_cost: 380,
      est_ad_spend: 280,
      image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'winning,tiktok,gadget,health'
    },
    {
      sku: 'DS-NECK-01',
      title: 'Smart EMS Pulse Heated Neck Massager Pro with Wireless Remote',
      category: 'Health & Wellness',
      brand: 'LUISCART Wellness',
      description: '42°C constant temperature heating, 6 massage modes, 15 intensity levels, ergonomic U-shaped design.',
      price: 1899,
      cost_price: 490,
      compare_price: 3299,
      stock_quantity: 320,
      low_stock_threshold: 25,
      supplier_name: 'CJ Dropshipping',
      supplier_sku: 'CJ-EMS-NCK-11',
      supplier_cost: 490,
      est_ad_spend: 340,
      image_url: 'https://images.unsplash.com/photo-1512290900672-1f55b9e59871?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'bestseller,wellness,massager'
    },
    {
      sku: 'DS-CHOP-01',
      title: '4-in-1 Handheld Wireless Electric Vegetable Cutter & Cleaning Brush',
      category: 'Kitchen & Dining',
      brand: 'LUISCART Home',
      description: 'Multi-functional chopper, slicer, peeler and electric cleaning brush in one rechargeable ergonomic tool.',
      price: 999,
      cost_price: 280,
      compare_price: 1899,
      stock_quantity: 850,
      low_stock_threshold: 40,
      supplier_name: 'Roposo Clout',
      supplier_sku: 'RP-CHOP-4IN1',
      supplier_cost: 280,
      est_ad_spend: 210,
      image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'viral,kitchen,instant-hit'
    },
    {
      sku: 'DS-HUM-01',
      title: 'Anti-Gravity Levitating Water Droplet Air Humidifier with Clock',
      category: 'Trending Viral',
      brand: 'LUISCART Living',
      description: 'Optical illusion levitation technology, 800ml tank, whisper quiet, warm LED atmosphere light and digital time display.',
      price: 2499,
      cost_price: 680,
      compare_price: 3999,
      stock_quantity: 180,
      low_stock_threshold: 15,
      supplier_name: 'CJ Dropshipping',
      supplier_sku: 'CJ-ANTIGRAV-01',
      supplier_cost: 680,
      est_ad_spend: 480,
      image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'antigravity,decor,viral'
    },
    {
      sku: 'DS-LAMP-01',
      title: 'Sunset Projection RGB Atmosphere Night Light 16 Colors with Remote',
      category: 'Home Decor',
      brand: 'LUISCART Living',
      description: '180 degree rotatable aluminum head, 16 RGB color modes, 4 flash modes, romantic background mood light.',
      price: 899,
      cost_price: 210,
      compare_price: 1499,
      stock_quantity: 620,
      low_stock_threshold: 30,
      supplier_name: 'AliExpress Direct',
      supplier_sku: 'AE-SUNSET-RGB',
      supplier_cost: 210,
      est_ad_spend: 180,
      image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'aesthetic,sunset,lighting'
    },
    {
      sku: 'DS-POW-01',
      title: 'Ultra-Thin Magnetic Wireless 10,000mAh Fast Charging Power Bank',
      category: 'Mobile Accessories',
      brand: 'LUISCART Tech',
      description: 'Strong snap-on magnetic attraction, 22.5W PD super fast charge, dual output, aircraft-safe certification.',
      price: 1799,
      cost_price: 520,
      compare_price: 2999,
      stock_quantity: 260,
      low_stock_threshold: 20,
      supplier_name: 'Private Sourcing Agent',
      supplier_sku: 'PSA-MAG-10K',
      supplier_cost: 520,
      est_ad_spend: 310,
      image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'magsafe,powerbank,gadgets'
    },
    {
      sku: 'DS-HAIR-01',
      title: 'Crystal Physical Hair Eraser Painless Exfoliator Nano-Glass',
      category: 'Beauty & Personal Care',
      brand: 'LUISCART Beauty',
      description: 'Painless hair removal using micro-nanotechnology, exfoliates dead skin, reusable up to 3 years, waterproof.',
      price: 699,
      cost_price: 110,
      compare_price: 1299,
      stock_quantity: 1200,
      low_stock_threshold: 50,
      supplier_name: 'Roposo Clout',
      supplier_sku: 'RP-CRYST-HAIR',
      supplier_cost: 110,
      est_ad_spend: 140,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'beauty,viral,cheap-cogs'
    },
    {
      sku: 'DS-SEAL-01',
      title: '2-in-1 Magnetic Mini Bag Sealer & Cutter Rechargeable',
      category: 'Kitchen & Dining',
      brand: 'LUISCART Home',
      description: 'Portable thermal food bag sealer with built-in hidden blade, magnetic back attaches to refrigerator.',
      price: 599,
      cost_price: 95,
      compare_price: 999,
      stock_quantity: 950,
      low_stock_threshold: 40,
      supplier_name: 'AliExpress Direct',
      supplier_sku: 'AE-MINISEAL-USB',
      supplier_cost: 95,
      est_ad_spend: 120,
      image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'kitchen,gadget,upsell'
    },
    {
      sku: 'DS-AUTO-01',
      title: 'High-Pressure Cordless Car Washer Spray Gun with Dual Battery',
      category: 'Automotive & Tools',
      brand: 'LUISCART Auto',
      description: '48V high capacity battery, 30-bar pressure, multi-angle spray nozzle, foam pot and 5m inlet hose.',
      price: 2999,
      cost_price: 890,
      compare_price: 4999,
      stock_quantity: 110,
      low_stock_threshold: 15,
      supplier_name: 'CJ Dropshipping',
      supplier_sku: 'CJ-CARWASH-48V',
      supplier_cost: 890,
      est_ad_spend: 520,
      image_url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'automotive,car-care,high-ticket'
    },
    {
      sku: 'DS-DENT-01',
      title: 'Ultrasonic Electric Dental Calculus Plaque & Tartar Remover',
      category: 'Health & Wellness',
      brand: 'LUISCART Wellness',
      description: 'High-frequency vibration dental sonic scaler with LED work light and 5 adjustable vibration frequencies.',
      price: 1299,
      cost_price: 340,
      compare_price: 2199,
      stock_quantity: 380,
      low_stock_threshold: 20,
      supplier_name: 'CJ Dropshipping',
      supplier_sku: 'CJ-DENT-SCALER',
      supplier_cost: 340,
      est_ad_spend: 260,
      image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'dental,personal-care,tiktok'
    },
    {
      sku: 'DS-LUM-01',
      title: 'Orthopedic Ergonomic Memory Foam Lumbar Support & Seat Cushion',
      category: 'Home & Office',
      brand: 'LUISCART Comfort',
      description: 'High-density space memory foam, breathable 3D mesh cover, relieves lower back strain for desk & car.',
      price: 1499,
      cost_price: 430,
      compare_price: 2499,
      stock_quantity: 240,
      low_stock_threshold: 20,
      supplier_name: 'Private Sourcing Agent',
      supplier_sku: 'PSA-LUMBAR-MF',
      supplier_cost: 430,
      est_ad_spend: 290,
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'ergonomics,cushion,office'
    },
    {
      sku: 'DS-DIFF-01',
      title: 'Flame Aroma Essential Oil Ultrasonic Diffuser & Humidifier',
      category: 'Trending Viral',
      brand: 'LUISCART Living',
      description: 'Realistic flame effect with smart LED lighting, 200ml capacity, auto power-off protection when waterless.',
      price: 1699,
      cost_price: 460,
      compare_price: 2799,
      stock_quantity: 310,
      low_stock_threshold: 20,
      supplier_name: 'CJ Dropshipping',
      supplier_sku: 'CJ-FLAME-DIFF',
      supplier_cost: 460,
      est_ad_spend: 320,
      image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      tags: 'flame,diffuser,viral'
    }
  ];

  const nowIso = new Date().toISOString();
  const insertProduct = db.prepare(`
    INSERT INTO products (sku, title, category, brand, description, price, cost_price, compare_price, stock_quantity, low_stock_threshold, supplier_name, supplier_sku, supplier_cost, est_ad_spend, image_url, status, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of products) {
    insertProduct.run(
      p.sku, p.title, p.category, p.brand, p.description,
      p.price, p.cost_price, p.compare_price, p.stock_quantity,
      p.low_stock_threshold, p.supplier_name, p.supplier_sku,
      p.supplier_cost, p.est_ad_spend, p.image_url, p.status, p.tags,
      nowIso, nowIso
    );
  }

  // 3. Customers
  const customers = [
    { first_name: 'Aarav', last_name: 'Sharma', email: 'aarav.sharma@gmail.com', phone: '+91 98201 11223', city: 'Mumbai', state: 'Maharashtra', postal_code: '400050', tag: 'VIP', notes: 'Frequent buyer of tech gadgets. Prompt WhatsApp reply.' },
    { first_name: 'Priya', last_name: 'Nair', email: 'priya.nair@outlook.com', phone: '+91 98110 44556', city: 'Bengaluru', state: 'Karnataka', postal_code: '560001', tag: 'VIP', notes: 'Prefers prepaid UPI over COD.' },
    { first_name: 'Rohan', last_name: 'Verma', email: 'rohan.v@techstartup.in', phone: '+91 98450 66778', city: 'Hyderabad', state: 'Telangana', postal_code: '500081', tag: 'REGULAR', notes: 'Ordered flame diffuser via Meta Ad.' },
    { first_name: 'Simran', last_name: 'Kaur', email: 'simran.kaur@yahoo.com', phone: '+91 97660 88990', city: 'Chandigarh', state: 'Punjab', postal_code: '160017', tag: 'REGULAR', notes: 'Bought crystal hair eraser.' },
    { first_name: 'Karan', last_name: 'Mehta', email: 'karan.mehta@studio.com', phone: '+91 94401 33445', city: 'Ahmedabad', state: 'Gujarat', postal_code: '380009', tag: 'NEW', notes: 'COD order confirmed via OTP.' },
    { first_name: 'Meera', last_name: 'Iyer', email: 'meera.iyer@gmail.com', phone: '+91 98300 22114', city: 'Chennai', state: 'Tamil Nadu', postal_code: '600018', tag: 'REGULAR', notes: 'High repeat purchase rate.' },
    { first_name: 'Aditya', last_name: 'Malhotra', email: 'aditya.m@delhicorp.in', phone: '+91 99250 99887', city: 'New Delhi', state: 'Delhi', postal_code: '110024', tag: 'VIP', notes: 'Purchased car washer spray gun.' },
    { first_name: 'Tanvi', last_name: 'Joshi', email: 'tanvi.j@designhub.co', phone: '+91 98400 55443', city: 'Pune', state: 'Maharashtra', postal_code: '411004', tag: 'NEW', notes: 'Recent customer via Instagram reels.' },
    { first_name: 'Nikhil', last_name: 'Gupta', email: 'nikhil.gupta@fintech.io', phone: '+91 98101 77665', city: 'Noida', state: 'Uttar Pradesh', postal_code: '201301', tag: 'AT_RISK', notes: 'COD order required 2 NDR followups.' },
    { first_name: 'Anika', last_name: 'Desai', email: 'anika.desai@gmail.com', phone: '+91 98720 11992', city: 'Jaipur', state: 'Rajasthan', postal_code: '302001', tag: 'REGULAR', notes: 'Home decor viral shopper.' }
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (first_name, last_name, email, phone, city, state, postal_code, country, total_spent, orders_count, tag, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of customers) {
    insertCustomer.run(
      c.first_name, c.last_name, c.email, c.phone, c.city, c.state,
      c.postal_code, 'India', 0, 0, c.tag, 'ACTIVE', c.notes,
      new Date(Date.now() - 30 * 86400000).toISOString()
    );
  }

  // 4. Coupons
  const coupons = [
    { code: 'VIRAL10', type: 'PERCENTAGE', val: 10, min_order: 999, limit: 1000, used: 240, expires: '2026-12-31' },
    { code: 'EXTRA100', type: 'FIXED', val: 100, min_order: 1499, limit: 500, used: 85, expires: '2026-12-31' },
    { code: 'FREESHIP', type: 'FREE_SHIPPING', val: 99, min_order: 799, limit: 2000, used: 410, expires: '2026-12-31' },
    { code: 'BUY2GET15', type: 'PERCENTAGE', val: 15, min_order: 2000, limit: 300, used: 42, expires: '2026-11-30' }
  ];

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_value, usage_limit, times_used, expires_at, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const cp of coupons) {
    insertCoupon.run(cp.code, cp.type, cp.val, cp.min_order, cp.limit, cp.used, cp.expires, nowIso);
  }

  // 5. Dropshipping Operational Expenses (Ad Spend, RTO losses, SaaS)
  const expenses = [
    { title: 'Meta Ads (Instagram & Facebook Reels Campaign)', category: 'Ad Spend', amount: 58000, date: getDateDaysAgo(2), notes: 'Scale campaign on Ear Cleaner & Anti-Gravity Humidifier.' },
    { title: 'Google Performance Max Shopping Ads', category: 'Ad Spend', amount: 22000, date: getDateDaysAgo(5), notes: 'Search intent targeting on High-pressure car washer.' },
    { title: 'TikTok & Creator UGC Video Samples', category: 'Marketing', amount: 15000, date: getDateDaysAgo(9), notes: '10 viral UGC creator video assets produced.' },
    { title: 'Shopify Plus & High-Speed CDN Infrastructure', category: 'Platform Fee', amount: 3500, date: getDateDaysAgo(14), notes: 'Store hosting & checkout optimization.' },
    { title: 'WATI / Interakt WhatsApp Business Automated COD Bot', category: 'Software', amount: 2800, date: getDateDaysAgo(18), notes: 'Automated 1-click WhatsApp COD confirmation workflow.' },
    { title: 'Reverse Logistics & RTO Shipping Carrier Charges', category: 'RTO Loss', amount: 6400, date: getDateDaysAgo(22), notes: 'Courier fees on 8 rejected COD deliveries.' }
  ];

  const insertExpense = db.prepare(`
    INSERT INTO expenses (title, category, amount, date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const exp of expenses) {
    insertExpense.run(exp.title, exp.category, exp.amount, exp.date, exp.notes, nowIso);
  }

  // 6. Dropshipping Orders with Supplier Auto-Fulfillment & COD verification
  const allProducts = db.prepare('SELECT * FROM products').all();
  const allCustomers = db.prepare('SELECT * FROM customers').all();

  const dropshipOrders = [
    {
      num: '#LC10294',
      custIdx: 0,
      hoursAgo: 2,
      status: 'DELIVERED',
      shipping_status: 'DELIVERED',
      payment_method: 'UPI',
      payment_status: 'PAID',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-98124',
      supplier_status: 'FULFILLED',
      courier: 'Delhivery Surface',
      tracking: 'DEL99482103',
      discount_code: 'VIRAL10',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [{ sku: 'DS-HUM-01', qty: 1 }],
      notes: 'Customer placed via Instagram Ad. Sourced via CJ Dropshipping.'
    },
    {
      num: '#LC10293',
      custIdx: 1,
      hoursAgo: 4,
      status: 'OUT_FOR_DELIVERY',
      shipping_status: 'OUT_FOR_DELIVERY',
      payment_method: 'CREDIT_CARD',
      payment_status: 'PAID',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-98002',
      supplier_status: 'SUPPLIER_SHIPPED',
      courier: 'Bluedart Express',
      tracking: 'BD88291044IN',
      discount_code: '',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [
        { sku: 'DS-EAR-01', qty: 1 },
        { sku: 'DS-NECK-01', qty: 1 }
      ],
      notes: 'Bundle order. Pushed to CJ Dropshipping API.'
    },
    {
      num: '#LC10292',
      custIdx: 2,
      hoursAgo: 6,
      status: 'SHIPPED',
      shipping_status: 'IN_TRANSIT',
      payment_method: 'COD',
      payment_status: 'PENDING',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-97911',
      supplier_status: 'SUPPLIER_SHIPPED',
      courier: 'Delhivery Surface',
      tracking: 'DEL88371920',
      discount_code: 'EXTRA100',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [{ sku: 'DS-DIFF-01', qty: 1 }],
      notes: 'COD verified via WhatsApp bot at 09:15 AM.'
    },
    {
      num: '#LC10291',
      custIdx: 3,
      hoursAgo: 8,
      status: 'PROCESSING',
      shipping_status: 'PACKED',
      payment_method: 'UPI',
      payment_status: 'PAID',
      supplier: 'Roposo Clout',
      supplier_order_id: 'RP-8819283',
      supplier_status: 'SUPPLIER_PROCESSING',
      courier: 'Ekart Logistics',
      tracking: 'EKRT9920194',
      discount_code: '',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [{ sku: 'DS-CHOP-01', qty: 2 }],
      notes: 'Supplier processing at Bhiwandi 3PL Hub.'
    },
    {
      num: '#LC10290',
      custIdx: 4,
      hoursAgo: 12,
      status: 'CONFIRMED',
      shipping_status: 'PENDING',
      payment_method: 'COD',
      payment_status: 'PENDING',
      supplier: 'Private Sourcing Agent',
      supplier_order_id: 'PSA-10928',
      supplier_status: 'AWAITING_SUPPLIER',
      courier: 'Bluedart Express',
      tracking: '',
      discount_code: 'FREESHIP',
      cod_verified: 1,
      rto_risk: 'MEDIUM',
      items: [{ sku: 'DS-POW-01', qty: 1 }],
      notes: 'COD OTP verified. Ready for automatic supplier push.'
    },
    {
      num: '#LC10289',
      custIdx: 5,
      hoursAgo: 24,
      status: 'DELIVERED',
      shipping_status: 'DELIVERED',
      payment_method: 'UPI',
      payment_status: 'PAID',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-97451',
      supplier_status: 'FULFILLED',
      courier: 'Delhivery Surface',
      tracking: 'DEL77382910',
      discount_code: 'VIRAL10',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [
        { sku: 'DS-EAR-01', qty: 1 },
        { sku: 'DS-HAIR-01', qty: 1 }
      ],
      notes: 'Delivered in 3 days. Positive review received.'
    },
    {
      num: '#LC10288',
      custIdx: 6,
      hoursAgo: 36,
      status: 'SHIPPED',
      shipping_status: 'IN_TRANSIT',
      payment_method: 'CREDIT_CARD',
      payment_status: 'PAID',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-97210',
      supplier_status: 'SUPPLIER_SHIPPED',
      courier: 'DTDC Priority',
      tracking: 'DT77482910',
      discount_code: '',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [{ sku: 'DS-AUTO-01', qty: 1 }],
      notes: 'High ticket item. Supplier AWB synced.'
    },
    {
      num: '#LC10287',
      custIdx: 7,
      hoursAgo: 48,
      status: 'DELIVERED',
      shipping_status: 'DELIVERED',
      payment_method: 'UPI',
      payment_status: 'PAID',
      supplier: 'AliExpress Direct',
      supplier_order_id: 'AE-99201948',
      supplier_status: 'FULFILLED',
      courier: 'Delhivery Surface',
      tracking: 'DEL66554411',
      discount_code: '',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [{ sku: 'DS-LAMP-01', qty: 2 }],
      notes: 'Aesthetic lamp duo.'
    },
    {
      num: '#LC10286',
      custIdx: 8,
      hoursAgo: 60,
      status: 'CANCELLED',
      shipping_status: 'CANCELLED',
      payment_method: 'COD',
      payment_status: 'FAILED',
      supplier: 'Roposo Clout',
      supplier_order_id: '',
      supplier_status: 'CANCELLED',
      courier: '',
      tracking: '',
      discount_code: '',
      cod_verified: 0,
      rto_risk: 'HIGH',
      items: [{ sku: 'DS-SEAL-01', qty: 1 }],
      notes: 'Customer failed WhatsApp OTP verification within 4 hours. Cancelled to prevent RTO loss.'
    },
    {
      num: '#LC10285',
      custIdx: 9,
      hoursAgo: 72,
      status: 'DELIVERED',
      shipping_status: 'DELIVERED',
      payment_method: 'UPI',
      payment_status: 'PAID',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-96891',
      supplier_status: 'FULFILLED',
      courier: 'Bluedart Express',
      tracking: 'BD55443322IN',
      discount_code: 'BUY2GET15',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [
        { sku: 'DS-NECK-01', qty: 1 },
        { sku: 'DS-LUM-01', qty: 1 }
      ],
      notes: 'Ergonomic comfort bundle.'
    },
    {
      num: '#LC10284',
      custIdx: 0,
      hoursAgo: 96,
      status: 'NEW',
      shipping_status: 'PENDING',
      payment_method: 'COD',
      payment_status: 'PENDING',
      supplier: 'CJ Dropshipping',
      supplier_order_id: '',
      supplier_status: 'AWAITING_SUPPLIER',
      courier: 'Delhivery Surface',
      tracking: '',
      discount_code: '',
      cod_verified: 0,
      rto_risk: 'MEDIUM',
      items: [{ sku: 'DS-DENT-01', qty: 1 }],
      notes: 'New COD order. Automated WhatsApp confirmation message sent.'
    },
    {
      num: '#LC10283',
      custIdx: 1,
      hoursAgo: 120,
      status: 'REFUNDED',
      shipping_status: 'RETURNED',
      payment_method: 'UPI',
      payment_status: 'REFUNDED',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-96401',
      supplier_status: 'RETURNED',
      courier: 'Delhivery Surface',
      tracking: 'DEL44332211',
      discount_code: '',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [{ sku: 'DS-HUM-01', qty: 1 }],
      notes: 'Customer mistook size. Refunded to source UPI account.'
    },
    {
      num: '#LC10282',
      custIdx: 2,
      hoursAgo: 144,
      status: 'DELIVERED',
      shipping_status: 'DELIVERED',
      payment_method: 'CREDIT_CARD',
      payment_status: 'PAID',
      supplier: 'Private Sourcing Agent',
      supplier_order_id: 'PSA-9948',
      supplier_status: 'FULFILLED',
      courier: 'Bluedart Express',
      tracking: 'BD33221100IN',
      discount_code: 'VIRAL10',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [{ sku: 'DS-POW-01', qty: 1 }],
      notes: 'On-time delivery.'
    },
    {
      num: '#LC10281',
      custIdx: 8,
      hoursAgo: 168,
      status: 'RETURNED',
      shipping_status: 'RETURNED',
      payment_method: 'COD',
      payment_status: 'FAILED',
      supplier: 'Roposo Clout',
      supplier_order_id: 'RP-772810',
      supplier_status: 'RTO_DELIVERED',
      courier: 'Ekart Logistics',
      tracking: 'EKRT8819201',
      discount_code: '',
      cod_verified: 1,
      rto_risk: 'HIGH',
      items: [{ sku: 'DS-CHOP-01', qty: 1 }],
      notes: 'RTO: Customer unreachable after 3 delivery attempts. RTO penalty ₹75 incurred.'
    },
    {
      num: '#LC10280',
      custIdx: 3,
      hoursAgo: 192,
      status: 'DELIVERED',
      shipping_status: 'DELIVERED',
      payment_method: 'UPI',
      payment_status: 'PAID',
      supplier: 'CJ Dropshipping',
      supplier_order_id: 'CJ-2026-95882',
      supplier_status: 'FULFILLED',
      courier: 'Delhivery Surface',
      tracking: 'DEL22119900',
      discount_code: 'EXTRA100',
      cod_verified: 1,
      rto_risk: 'LOW',
      items: [
        { sku: 'DS-EAR-01', qty: 1 },
        { sku: 'DS-DIFF-01', qty: 1 }
      ],
      notes: 'Smooth delivery.'
    }
  ];

  // Generate 50 additional realistic historical dropship orders spanning past 29 days
  const prodSkus = products.map(p => p.sku);
  const couriers = ['Delhivery Surface', 'Bluedart Express', 'DTDC Priority', 'Ekart Logistics'];
  const suppliers = ['CJ Dropshipping', 'AliExpress Direct', 'Roposo Clout', 'Private Sourcing Agent'];

  for (let i = 1; i <= 50; i++) {
    const day = (i % 28) + 1;
    const hoursAgo = day * 24 + (i % 12);
    const sku1 = prodSkus[i % prodSkus.length];
    const isCod = i % 3 === 0;
    const isRto = i === 17 || i === 33;
    const isCancel = i === 25;
    let status = 'DELIVERED';
    let shipStatus = 'DELIVERED';
    if (isRto) { status = 'RETURNED'; shipStatus = 'RETURNED'; }
    else if (isCancel) { status = 'CANCELLED'; shipStatus = 'CANCELLED'; }
    else if (day <= 1) { status = 'PROCESSING'; shipStatus = 'PACKED'; }
    else if (day <= 2) { status = 'SHIPPED'; shipStatus = 'IN_TRANSIT'; }

    const sup = suppliers[i % suppliers.length];
    const cour = couriers[i % couriers.length];
    const custIdx = i % allCustomers.length;

    dropshipOrders.push({
      num: `#LC${10250 - i}`,
      custIdx,
      hoursAgo,
      status,
      shipping_status: shipStatus,
      payment_method: isCod ? 'COD' : 'UPI',
      payment_status: (isCancel || isRto) ? (isCod ? 'FAILED' : 'REFUNDED') : 'PAID',
      supplier: sup,
      supplier_order_id: `${sup.slice(0, 2).toUpperCase()}-2026-${80000 + i}`,
      supplier_status: status === 'DELIVERED' ? 'FULFILLED' : (status === 'PROCESSING' ? 'SUPPLIER_PROCESSING' : 'SUPPLIER_SHIPPED'),
      courier: cour,
      tracking: `${cour.slice(0, 3).toUpperCase()}${70000000 + i * 37}`,
      discount_code: i % 4 === 0 ? 'VIRAL10' : '',
      cod_verified: isCod ? (isCancel ? 0 : 1) : 1,
      rto_risk: isRto ? 'HIGH' : 'LOW',
      items: [{ sku: sku1, qty: 1 }],
      notes: isRto ? 'RTO: Consignee unavailable' : 'Automated dropship order'
    });
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, customer_id, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, subtotal, discount_amount, discount_code,
      shipping_fee, tax_amount, total_amount, payment_method, payment_status,
      order_status, shipping_status, supplier_name, supplier_order_id, supplier_status,
      cod_verified, rto_risk, courier_partner, tracking_number,
      estimated_delivery, actual_delivery, admin_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, sku, title, image_url, price, cost_price, quantity, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO order_notes (order_id, author, note, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const prodBySku = {};
  for (const p of allProducts) {
    prodBySku[p.sku] = p;
  }

  for (const t of dropshipOrders) {
    const cust = allCustomers[t.custIdx];
    const orderDate = new Date(Date.now() - t.hoursAgo * 3600000);
    const orderDateIso = orderDate.toISOString();

    let subtotal = 0;
    const resolvedItems = [];
    for (const item of t.items) {
      const p = prodBySku[item.sku];
      if (p) {
        const lineTotal = p.price * item.qty;
        subtotal += lineTotal;
        resolvedItems.push({
          productId: p.id,
          sku: p.sku,
          title: p.title,
          imageUrl: p.image_url,
          price: p.price,
          costPrice: p.cost_price,
          quantity: item.qty,
          total: lineTotal
        });
      }
    }

    let discountAmount = 0;
    if (t.discount_code === 'VIRAL10') {
      discountAmount = Math.round(subtotal * 0.10);
    } else if (t.discount_code === 'EXTRA100') {
      discountAmount = 100;
    } else if (t.discount_code === 'BUY2GET15') {
      discountAmount = Math.round(subtotal * 0.15);
    }

    const shippingFee = (subtotal - discountAmount >= 999 || t.discount_code === 'FREESHIP') ? 0 : 99;
    const taxableBase = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxableBase * 0.18);
    const totalAmount = taxableBase + taxAmount + shippingFee;

    const shippingAddress = `${cust.first_name} ${cust.last_name}, Flat 304, ${cust.city}, ${cust.state} - ${cust.postal_code}, India`;
    const billingAddress = shippingAddress;

    const estDate = new Date(orderDate.getTime() + 4 * 86400000).toISOString().split('T')[0];
    const actualDelivery = (t.status === 'DELIVERED') ? new Date(orderDate.getTime() + 3 * 86400000).toISOString().split('T')[0] : null;

    const orderRes = insertOrder.run(
      t.num, cust.id, `${cust.first_name} ${cust.last_name}`, cust.email, cust.phone,
      shippingAddress, billingAddress, subtotal, discountAmount, t.discount_code || null,
      shippingFee, taxAmount, totalAmount, t.payment_method, t.payment_status,
      t.status, t.shipping_status, t.supplier || 'CJ Dropshipping', t.supplier_order_id || null,
      t.supplier_status || 'AWAITING_SUPPLIER', t.cod_verified, t.rto_risk || 'LOW',
      t.courier || null, t.tracking || null,
      estDate, actualDelivery, t.notes || null, orderDateIso, orderDateIso
    );

    const orderId = Number(orderRes.lastInsertRowid);

    for (const item of resolvedItems) {
      insertOrderItem.run(
        orderId, item.productId, item.sku, item.title, item.imageUrl,
        item.price, item.costPrice, item.quantity, item.total
      );
    }

    // Dropshipping audit timeline events
    insertTimeline.run(orderId, 'NEW', 'Checkout Completed', `Customer completed online checkout for ₹${totalAmount.toLocaleString('en-IN')} via ${t.payment_method}`, 'Online Storefront', orderDateIso);

    if (t.payment_status === 'PAID') {
      const payTime = new Date(orderDate.getTime() + 2 * 60000).toISOString();
      insertTimeline.run(orderId, 'CONFIRMED', 'Prepaid Payment Captured', `₹${totalAmount.toLocaleString('en-IN')} captured via ${t.payment_method}. No COD risk.`, 'Payment Gateway', payTime);
    } else if (t.payment_method === 'COD') {
      const codTime = new Date(orderDate.getTime() + 10 * 60000).toISOString();
      if (t.cod_verified === 1) {
        insertTimeline.run(orderId, 'CONFIRMED', 'COD WhatsApp Verification OK', 'Customer confirmed order address and intent via automated WhatsApp OTP message.', 'WhatsApp Bot', codTime);
      } else {
        insertTimeline.run(orderId, 'NEW', 'Awaiting COD Verification', 'Automated OTP message sent to phone. Awaiting response.', 'WhatsApp Bot', codTime);
      }
    }

    if (['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'REFUNDED'].includes(t.status)) {
      const supTime = new Date(orderDate.getTime() + 30 * 60000).toISOString();
      insertTimeline.run(orderId, 'PROCESSING', 'Pushed to Sourcing Supplier', `Order routed to ${t.supplier} (Supplier PO: ${t.supplier_order_id || 'PO-PENDING'}). Inventory reserved.`, 'Dropship Engine', supTime);
    }

    if (['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'REFUNDED'].includes(t.status)) {
      const packTime = new Date(orderDate.getTime() + 90 * 60000).toISOString();
      insertTimeline.run(orderId, 'PACKED', 'Supplier Packed & Quality Scanned', 'Supplier 3PL warehouse packed item and attached domestic shipping label.', `${t.supplier} 3PL`, packTime);
    }

    if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'REFUNDED'].includes(t.status)) {
      const shipTime = new Date(orderDate.getTime() + 180 * 60000).toISOString();
      insertTimeline.run(orderId, 'SHIPPED', 'Carrier Dispatched (In-Transit)', `Handed over to ${t.courier} with domestic tracking AWB #${t.tracking}`, 'Logistics', shipTime);
    }

    if (['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'REFUNDED'].includes(t.status)) {
      const outTime = new Date(orderDate.getTime() + 24 * 3600000).toISOString();
      insertTimeline.run(orderId, 'OUT_FOR_DELIVERY', 'Out for Final Mile Delivery', `Shipment out for delivery with local courier delivery associate`, 'Delivery Agent', outTime);
    }

    if (['DELIVERED', 'REFUNDED'].includes(t.status)) {
      const delivTime = new Date(orderDate.getTime() + 30 * 3600000).toISOString();
      insertTimeline.run(orderId, 'DELIVERED', 'Delivered & Remitted', 'Delivered to customer. COD remitted to bank ledger.', 'Logistics', delivTime);
    }

    if (t.status === 'RETURNED') {
      const rtoTime = new Date(orderDate.getTime() + 48 * 3600000).toISOString();
      insertTimeline.run(orderId, 'RETURNED', 'RTO (Return to Origin) Delivered', 'Customer rejected or was unreachable after 3 attempts. Returned to warehouse hub.', 'Carrier NDR Desk', rtoTime);
    }

    if (t.status === 'CANCELLED') {
      const cancelTime = new Date(orderDate.getTime() + 30 * 60000).toISOString();
      insertTimeline.run(orderId, 'CANCELLED', 'Order Cancelled (Unverified COD)', 'Cancelled due to non-response on verification.', 'Risk System', cancelTime);
    }

    if (t.status === 'REFUNDED') {
      const refTime = new Date(orderDate.getTime() + 60 * 3600000).toISOString();
      insertTimeline.run(orderId, 'REFUNDED', 'Refund Processed', `Refund of ₹${totalAmount.toLocaleString('en-IN')} remitted to customer.`, 'Admin', refTime);
    }

    if (t.notes) {
      insertNote.run(orderId, 'Dropship Admin', t.notes, 1, orderDateIso);
    }
  }

  // Update customer spend aggregates
  const customerUpdates = db.prepare(`
    SELECT customer_id, COUNT(*) as ord_count, SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END) as total_sum
    FROM orders
    GROUP BY customer_id
  `).all();

  const updateCustStmt = db.prepare('UPDATE customers SET orders_count = ?, total_spent = ? WHERE id = ?');
  for (const row of customerUpdates) {
    updateCustStmt.run(row.ord_count, row.total_sum || 0, row.customer_id);
  }

  console.log('--- LUISCART Dropshipping Database Seeded Successfully! ---');
}

function getDateDaysAgo(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().split('T')[0];
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase
};
