// LUISCART Clean & Simple Storefront Simulator & Quick POS Component

const PosSimulatorComponent = {
  cart: [],
  products: [],
  customers: [],
  selectedCustomerId: null,
  appliedCoupon: null,

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const [prodData, custData] = await Promise.all([
        API.getProducts({}),
        API.getCustomers({})
      ]);
      this.products = prodData.products;
      this.customers = custData.customers;
      if (this.customers.length > 0 && !this.selectedCustomerId) {
        this.selectedCustomerId = this.customers[0].id;
      }
      this.renderView(container);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load simulator: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container) {
    const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let discount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.type === 'PERCENTAGE') {
        discount = Math.round(subtotal * (this.appliedCoupon.val / 100));
      } else if (this.appliedCoupon.type === 'FIXED') {
        discount = this.appliedCoupon.val;
      }
    }
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * 0.18);
    const shipping = taxable > 999 || subtotal === 0 ? 0 : 99;
    const total = taxable + tax + shipping;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              Create Dropship Order
            </h1>
            <p class="text-xs text-zinc-500">Create manual phone, WhatsApp, or instant customer orders with 1-click supplier routing.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left Catalog (2 Cols) -->
          <div class="lg:col-span-2 space-y-4">
            <div class="app-card p-4 flex items-center justify-between">
              <span class="font-bold text-black text-sm">Select Items for Basket</span>
              <span class="text-xs text-zinc-500">${this.products.length} Products in Catalog</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              ${this.products.map(p => `
                <div class="app-card p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 hover:border-black transition">
                  <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <img src="${p.image_url}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-zinc-200 shrink-0" />
                    <div class="min-w-0">
                      <p class="font-bold text-black text-xs truncate">${p.title}</p>
                      <div class="flex items-center gap-1.5 text-[10px] mt-0.5">
                        <span class="text-black font-mono font-bold">${p.sku}</span>
                        <span class="text-zinc-400">•</span>
                        <span class="text-zinc-600 font-bold">Stock: ${p.stock_quantity}</span>
                      </div>
                      <p class="font-black text-black font-mono text-xs sm:text-sm mt-0.5">${Utils.formatCurrency(p.price)}</p>
                    </div>
                  </div>

                  <button onclick="PosSimulatorComponent.addToCart(${p.id})" class="btn-primary text-xs py-1.5 px-3 shadow-sm shrink-0">
                    + Add
                  </button>
                </div>
              `).join('')}
            </div>

            <!-- Sticky Mobile Floating Basket Bar -->
            ${this.cart.length > 0 ? `
              <div class="lg:hidden sticky bottom-20 z-20 mx-auto w-full">
                <div class="bg-black text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-zinc-800">
                  <div>
                    <span class="font-bold text-xs block">${this.cart.reduce((a, b) => a + b.quantity, 0)} Items Added</span>
                    <span class="font-mono text-xs font-semibold text-zinc-300">Total: ${Utils.formatCurrency(total)}</span>
                  </div>
                  <button onclick="document.getElementById('pos-basket-card').scrollIntoView({ behavior: 'smooth' })" class="bg-white text-black px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm shrink-0 hover:bg-zinc-100">
                    Checkout ↓
                  </button>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right Checkout Basket (1 Col) -->
          <div class="space-y-4">
            <div id="pos-basket-card" class="app-card p-4 sm:p-5 space-y-4 scroll-mt-20">
              <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
                <h3 class="font-bold text-base text-black flex items-center gap-2">
                  <i data-lucide="shopping-bag" class="w-4 h-4 text-black"></i>
                  Order Basket (${this.cart.length})
                </h3>
                ${this.cart.length > 0 ? `
                  <button onclick="PosSimulatorComponent.clearCart()" class="text-xs text-black font-bold hover:underline">Clear</button>
                ` : ''}
              </div>

              <!-- Cart Items -->
              <div class="divide-y divide-zinc-200 max-h-56 overflow-y-auto">
                ${this.cart.length === 0 ? `
                  <div class="py-8 text-center text-xs text-zinc-400">
                    Basket is empty.<br>Click "+ Add" on items to create order.
                  </div>
                ` : this.cart.map(item => `
                  <div class="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p class="font-semibold text-black line-clamp-1 max-w-[140px]">${item.title}</p>
                      <span class="font-mono text-zinc-500">${Utils.formatCurrency(item.price)} each</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <button onclick="PosSimulatorComponent.changeQty(${item.product_id}, -1)" class="w-6 h-6 rounded bg-zinc-100 text-black font-bold hover:bg-zinc-200">-</button>
                      <span class="font-mono font-bold text-black text-xs w-4 text-center">${item.quantity}</span>
                      <button onclick="PosSimulatorComponent.changeQty(${item.product_id}, 1)" class="w-6 h-6 rounded bg-zinc-100 text-black font-bold hover:bg-zinc-200">+</button>
                    </div>

                    <span class="font-mono font-black text-black w-16 text-right">${Utils.formatCurrency(item.price * item.quantity)}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Customer Select -->
              <div class="pt-2 border-t border-zinc-200">
                <label class="block text-xs font-bold text-black mb-1">Select Customer</label>
                <select id="pos-customer-select" class="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs text-black">
                  ${this.customers.map(c => `
                    <option value="${c.id}" ${c.id === this.selectedCustomerId ? 'selected' : ''}>
                      ${c.first_name} ${c.last_name} (${c.city})
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Promo Code -->
              <div>
                <label class="block text-xs font-bold text-black mb-1">Promo Code</label>
                <div class="flex gap-2">
                  <input type="text" id="pos-coupon-input" value="${this.appliedCoupon ? this.appliedCoupon.code : ''}" placeholder="FREESHIP / DISCOUNT10" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-black font-mono uppercase" />
                  <button onclick="PosSimulatorComponent.applyCoupon()" class="btn-secondary text-xs px-3 py-1.5 shadow-sm shrink-0">Apply</button>
                </div>
                ${this.appliedCoupon ? `<span class="text-[10px] text-black mt-1 block font-bold">✓ Promo '${this.appliedCoupon.code}' active</span>` : ''}
              </div>

              <!-- Payment Method & Courier -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label class="block font-bold text-black mb-1">Payment</label>
                  <select id="pos-payment-method" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black">
                    <option value="UPI">UPI (GPay/PhonePe)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-black mb-1">Courier</label>
                  <select id="pos-courier-partner" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black">
                    <option value="Delhivery Surface">Delhivery Surface</option>
                    <option value="Bluedart Express">Bluedart Express</option>
                    <option value="Shadowfax Air">Shadowfax Air</option>
                    <option value="XpressBees">XpressBees</option>
                  </select>
                </div>
              </div>

              <!-- Summary Totals -->
              <div class="pt-3 border-t border-zinc-200 space-y-1.5 text-xs">
                <div class="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span class="font-mono font-bold text-black">${Utils.formatCurrency(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                  <div class="flex justify-between text-black font-bold">
                    <span>Discount:</span>
                    <span class="font-mono font-bold text-black">- ${Utils.formatCurrency(discount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between text-zinc-600">
                  <span>GST (18%):</span>
                  <span class="font-mono font-bold text-black">${Utils.formatCurrency(tax)}</span>
                </div>
                <div class="flex justify-between text-zinc-600">
                  <span>Shipping:</span>
                  <span class="font-mono font-bold text-black">${shipping === 0 ? '<span class="font-black text-black">FREE</span>' : Utils.formatCurrency(shipping)}</span>
                </div>
                <div class="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-black">
                  <span>Order Total:</span>
                  <span class="font-mono text-black font-black text-base">${Utils.formatCurrency(total)}</span>
                </div>
              </div>

              <!-- Place Order Button -->
              <button
                ${this.cart.length === 0 ? 'disabled class="w-full py-3 bg-zinc-100 text-zinc-400 rounded-xl text-xs font-bold cursor-not-allowed"' : 'onclick="PosSimulatorComponent.checkout()" class="w-full btn-primary text-xs py-3 justify-center shadow-md"'}
              >
                Place Order & Dispatch Immediately →
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  addToCart(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;

    const existing = this.cart.find(i => i.product_id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        product_id: prod.id,
        title: prod.title,
        price: prod.price,
        quantity: 1
      });
    }

    this.renderView(document.getElementById('main-content'));
  },

  changeQty(productId, delta) {
    const item = this.cart.find(i => i.product_id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(i => i.product_id !== productId);
    }
    this.renderView(document.getElementById('main-content'));
  },

  clearCart() {
    this.cart = [];
    this.appliedCoupon = null;
    this.renderView(document.getElementById('main-content'));
  },

  applyCoupon() {
    const code = document.getElementById('pos-coupon-input').value.trim().toUpperCase();
    if (code === 'FREESHIP') {
      this.appliedCoupon = { code: 'FREESHIP', type: 'FIXED', val: 99 };
      Utils.showToast('Free Shipping coupon applied');
    } else if (code === 'DISCOUNT10' || code === 'WELCOME10') {
      this.appliedCoupon = { code: 'DISCOUNT10', type: 'PERCENTAGE', val: 10 };
      Utils.showToast('10% Discount applied');
    } else if (code === 'LUIS100' || code === 'ROYAL500') {
      this.appliedCoupon = { code: 'LUIS100', type: 'FIXED', val: 100 };
      Utils.showToast('₹100 discount coupon applied');
    } else {
      Utils.showToast('Invalid coupon code', 'error');
      this.appliedCoupon = null;
    }
    this.renderView(document.getElementById('main-content'));
  },

  async checkout() {
    if (this.cart.length === 0) return;

    const custSelect = document.getElementById('pos-customer-select');
    const custId = parseInt(custSelect.value);
    const cust = this.customers.find(c => c.id === custId);
    const payMethod = document.getElementById('pos-payment-method').value;
    const courier = document.getElementById('pos-courier-partner').value;

    const orderPayload = {
      customer_id: cust ? cust.id : null,
      customer_name: cust ? `${cust.first_name} ${cust.last_name}` : 'Walk-in Dropship Customer',
      customer_email: cust ? cust.email : 'client@luiscart.com',
      customer_phone: cust ? cust.phone : '+91 98200 00000',
      shipping_address: cust ? `${cust.first_name} ${cust.last_name}, Flat 402, ${cust.city}, ${cust.state} - ${cust.postal_code}` : 'Mumbai Hub, Maharashtra',
      items: this.cart,
      discount_code: this.appliedCoupon ? this.appliedCoupon.code : null,
      payment_method: payMethod,
      courier_partner: courier,
      notes: 'Placed via Admin Store Simulator / POS'
    };

    try {
      const newOrder = await API.createOrder(orderPayload);
      Utils.showToast(`Order ${newOrder.order_number} created successfully! Opening details...`);
      this.cart = [];
      this.appliedCoupon = null;
      App.openOrderDetails(newOrder.id);
    } catch (e) {
      Utils.showToast('Failed to place simulated order: ' + e.message, 'error');
    }
  }
};
