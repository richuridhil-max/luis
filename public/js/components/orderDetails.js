// LUISCART Clean & Simple Order Details & Timeline Component

const OrderDetailsComponent = {
  currentOrder: null,

  async render(container, orderId) {
    if (!orderId) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-500">
          <p>No order selected.</p>
          <button onclick="App.navigate('orders')" class="btn-primary mt-3 text-xs">Back to Orders</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const order = await API.getOrder(orderId);
      this.currentOrder = order;
      this.renderView(container, order);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p class="font-bold">Failed to load order #${orderId}.</p>
          <p class="text-sm mt-1 text-zinc-600">${err.message}</p>
          <button onclick="App.navigate('orders')" class="mt-4 btn-primary text-xs">Back to Orders</button>
        </div>
      `;
    }
  },

  renderView(container, order) {
    container.innerHTML = `
      <div class="space-y-6">

        <!-- Top Navigation Bar & Action Buttons -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button onclick="App.navigate('orders')" class="btn-secondary text-xs shadow-sm">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              Back to Orders
            </button>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-black tracking-tight text-black font-mono">${order.order_number}</h1>
                ${Utils.renderStatusBadge(order.order_status)}
                ${Utils.renderPaymentBadge(order.payment_status)}
              </div>
              <p class="text-xs text-zinc-500 mt-0.5">Placed on ${Utils.formatDate(order.created_at)}</p>
            </div>
          </div>

          <!-- Document & Print Action Shortcuts -->
          <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onclick="InvoiceModal.show(${order.id})" class="btn-secondary text-xs shadow-sm flex-1 sm:flex-initial justify-center">
              <i data-lucide="file-text" class="w-4 h-4 text-black"></i>
              Invoice
            </button>

            <button onclick="ShippingLabelModal.show(${order.id})" class="btn-secondary text-xs shadow-sm flex-1 sm:flex-initial justify-center">
              <i data-lucide="tag" class="w-4 h-4 text-black"></i>
              Label
            </button>

            <button onclick="OrderDetailsComponent.openStatusModal()" class="btn-primary text-xs shadow-sm w-full sm:w-auto justify-center">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              Update Status
            </button>
          </div>
        </div>

        <!-- 2-Column Split Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- ==================== LEFT COLUMN (2 Cols) ==================== -->
          <div class="lg:col-span-2 space-y-6">

            <!-- 1. Products in Order -->
            <div class="app-card p-4 sm:p-5">
              <div class="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
                <h3 class="font-bold text-base text-black flex items-center gap-2">
                  <i data-lucide="shopping-bag" class="w-4 h-4 text-black"></i>
                  Ordered Products (${order.items.length})
                </h3>
                <span class="text-xs text-zinc-500 font-mono">INR (₹)</span>
              </div>

              <div class="divide-y divide-zinc-200">
                ${order.items.map(item => `
                  <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div class="flex items-start sm:items-center gap-3 sm:gap-4">
                      <img src="${item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-zinc-300 shrink-0" />
                      <div class="min-w-0">
                        <h4 class="font-bold text-black text-sm leading-snug">${item.title}</h4>
                        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[11px] sm:text-xs">
                          <span class="font-mono text-black font-bold">${item.sku}</span>
                          <span class="text-zinc-400">•</span>
                          <span class="text-zinc-600">${item.category || 'Viral'}</span>
                          <span class="text-zinc-400 hidden sm:inline">•</span>
                          <span class="text-zinc-600 block sm:inline">Supplier: <b class="text-black">${item.supplier_name || 'CJ'}</b></span>
                        </div>
                      </div>
                    </div>

                    <div class="flex sm:block justify-between items-center sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200">
                      <span class="text-xs text-zinc-500 sm:hidden">Item Subtotal:</span>
                      <div>
                        <p class="font-black text-black font-mono text-base">${Utils.formatCurrency(item.total)}</p>
                        <p class="text-xs text-zinc-500 sm:mt-0.5">${item.quantity} × ${Utils.formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Pricing Breakdown -->
              <div class="mt-6 pt-4 border-t border-zinc-200 space-y-2 text-sm">
                <div class="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span class="font-mono font-bold text-black">${Utils.formatCurrency(order.subtotal)}</span>
                </div>
                ${order.discount_amount > 0 ? `
                  <div class="flex justify-between text-black font-semibold">
                    <span>Coupon Discount (${order.discount_code || 'Promo'})</span>
                    <span class="font-mono font-bold text-black">- ${Utils.formatCurrency(order.discount_amount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between text-zinc-600">
                  <span>Estimated GST (18%)</span>
                  <span class="font-mono font-bold text-black">${Utils.formatCurrency(order.tax_amount)}</span>
                </div>
                <div class="flex justify-between text-zinc-600">
                  <span>Shipping Fee</span>
                  <span class="font-mono font-bold text-black">${order.shipping_fee > 0 ? Utils.formatCurrency(order.shipping_fee) : '<span class="font-black text-black">FREE</span>'}</span>
                </div>
                <div class="flex justify-between pt-3 border-t border-zinc-200 font-bold text-black text-base">
                  <span>Grand Total</span>
                  <span class="font-mono text-black font-black text-lg">${Utils.formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            <!-- 2. Customer Information Card -->
            <div class="app-card p-4 sm:p-5">
              <div class="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
                <h3 class="font-bold text-base text-black flex items-center gap-2">
                  <i data-lucide="user" class="w-4 h-4 text-black"></i>
                  Customer Information
                </h3>
                <div>
                  ${Utils.renderTagBadge(order.customer_tag)}
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm font-bold text-black">${order.customer_name}</p>
                  <p class="text-xs text-zinc-600 mt-0.5 font-mono">${order.customer_email}</p>
                  <p class="text-xs text-zinc-600 font-mono">${order.customer_phone}</p>
                  
                  <!-- Contact Shortcuts -->
                  <div class="flex flex-wrap items-center gap-2 mt-3">
                    <a href="tel:${order.customer_phone}" class="btn-secondary text-xs py-1 px-2.5 flex-1 sm:flex-initial justify-center">
                      📞 Call
                    </a>
                    <a href="https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}" target="_blank" class="px-2.5 py-1 bg-white hover:bg-zinc-100 text-black border border-black rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition flex-1 sm:flex-initial shadow-sm">
                      💬 WhatsApp
                    </a>
                    <a href="mailto:${order.customer_email}?subject=LUISCART Order ${order.order_number}" class="btn-secondary text-xs py-1 px-2.5 flex-1 sm:flex-initial justify-center">
                      ✉️ Email
                    </a>
                  </div>
                </div>

                <div class="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 text-xs space-y-1.5">
                  <span class="text-zinc-500 uppercase tracking-wider font-bold">Buyer Metrics</span>
                  <div class="flex justify-between text-zinc-700">
                    <span>Total Orders Placed:</span>
                    <span class="font-bold text-black">${order.customer_orders_count || 1}</span>
                  </div>
                  <div class="flex justify-between text-zinc-700">
                    <span>Lifetime Spend:</span>
                    <span class="font-bold text-black font-mono">${Utils.formatCurrency(order.customer_total_spent || order.total_amount)}</span>
                  </div>
                  <div class="flex justify-between text-zinc-700">
                    <span>Customer ID:</span>
                    <span class="font-mono text-zinc-600">CUST-${order.customer_id}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Chronological Order Timeline Audit Trail -->
            <div class="app-card p-5">
              <div class="flex items-center justify-between pb-3 border-b border-zinc-200 mb-6">
                <div>
                  <h3 class="font-bold text-base text-black flex items-center gap-2">
                    <i data-lucide="clock" class="w-4 h-4 text-black"></i>
                    Chronological Audit Trail
                  </h3>
                  <p class="text-xs text-zinc-500">Complete immutable record of events, suppliers & couriers</p>
                </div>
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-black text-white">
                  ${order.timeline.length} events logged
                </span>
              </div>

              <!-- Vertical Timeline -->
              <div class="relative pl-6 space-y-6">
                ${order.timeline.map((event, idx) => `
                  <div class="timeline-item relative">
                    <div class="timeline-stem"></div>
                    <div class="absolute -left-6 top-1 w-5 h-5 rounded-full bg-black border-2 border-black flex items-center justify-center text-[10px] text-white font-bold">
                      ${idx + 1}
                    </div>
                    <div>
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-bold text-sm text-black">${event.title}</span>
                        <span class="text-[11px] text-zinc-400 whitespace-nowrap">${Utils.formatDate(event.created_at)}</span>
                      </div>
                      <p class="text-xs text-zinc-700 mt-0.5">${event.description}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-black font-bold">
                          Actor: ${event.actor || 'System'}
                        </span>
                        ${Utils.renderStatusBadge(event.status)}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- ==================== RIGHT COLUMN (1 Col) ==================== -->
          <div class="space-y-6">

            <!-- 1. Sourcing & Supplier Fulfillment Card -->
            <div class="app-card p-5 border border-zinc-200 bg-white">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="truck" class="w-4 h-4 text-black"></i>
                  Dropship Supplier Sourcing
                </h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${order.supplier_status === 'FULFILLED' ? 'bg-black text-white' : 'bg-white border border-black text-black'}">
                  ${order.supplier_status || 'AWAITING_SUPPLIER'}
                </span>
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-zinc-600">Assigned Supplier:</span>
                  <span class="font-bold text-black">${order.supplier_name || 'CJ Dropshipping'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-600">Supplier PO Order #:</span>
                  <span class="font-mono text-black font-bold">${order.supplier_order_id || 'PO-PENDING'}</span>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-zinc-200">
                <button onclick="OrderDetailsComponent.pushOrderToSupplier('${order.supplier_name || 'CJ Dropshipping'}')" class="w-full btn-primary text-xs justify-center shadow-sm">
                  <i data-lucide="send" class="w-4 h-4"></i>
                  Push to ${order.supplier_name || 'Supplier'} API
                </button>
              </div>
            </div>

            <!-- 2. COD Verification & RTO Risk Card -->
            <div class="app-card p-5">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-4 h-4 text-black"></i>
                  COD & RTO Protection
                </h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${order.rto_risk === 'HIGH' ? 'bg-black text-white' : (order.rto_risk === 'MEDIUM' ? 'bg-zinc-100 border border-black text-black' : 'bg-white border border-zinc-300 text-black')}">
                  Risk: ${order.rto_risk || 'LOW'}
                </span>
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-zinc-600">Payment Type:</span>
                  <span class="font-mono font-bold text-black">${order.payment_method}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-zinc-600">WhatsApp Confirmation:</span>
                  ${order.payment_method === 'COD' ? (order.cod_verified ? '<span class="text-black font-bold">✓ Confirmed</span>' : '<span class="text-zinc-600 font-bold">⚠️ Pending</span>') : '<span class="text-black font-semibold">Prepaid</span>'}
                </div>
              </div>

              ${order.payment_method === 'COD' ? `
                <div class="mt-4 pt-3 border-t border-zinc-200 grid grid-cols-2 gap-2">
                  <button onclick="OrderDetailsComponent.confirmCod(true)" class="py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition">
                    ✓ Confirm COD
                  </button>
                  <button onclick="OrderDetailsComponent.confirmCod(false)" class="py-1.5 bg-white hover:bg-zinc-100 text-black border border-black rounded-lg text-xs font-bold transition">
                    ✕ Reject COD
                  </button>
                </div>
              ` : ''}
            </div>

            <!-- 3. Shipping & Tracking Box -->
            <div class="app-card p-5">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="navigation" class="w-4 h-4 text-black"></i>
                  Logistics & Tracking
                </h3>
                <button onclick="OrderDetailsComponent.openTrackingModal()" class="text-xs text-black hover:underline font-bold">Edit AWB</button>
              </div>

              <div class="space-y-2.5 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-600">Shipping Status:</span>
                  ${Utils.renderStatusBadge(order.shipping_status || 'PENDING')}
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-600">Courier Partner:</span>
                  <span class="font-bold text-black">${order.courier_partner || 'Not Assigned'}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-600">Tracking AWB:</span>
                  <span class="font-mono font-black text-black">${order.tracking_number || 'Pending Dispatch'}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-600">Estimated Delivery:</span>
                  <span class="font-bold text-black">${order.estimated_delivery ? Utils.formatDateOnly(order.estimated_delivery) : 'Calculating...'}</span>
                </div>
              </div>
            </div>

            <!-- 4. Delivery Address -->
            <div class="app-card p-5">
              <h3 class="font-bold text-xs text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <i data-lucide="map-pin" class="w-4 h-4 text-black"></i>
                Delivery Address
              </h3>
              <div class="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs space-y-1 text-zinc-700">
                <p class="font-bold text-black">${order.customer_name}</p>
                <p>${order.shipping_address}</p>
                <p class="text-zinc-500 mt-2 font-mono">Contact: ${order.customer_phone}</p>
              </div>
            </div>

            <!-- 5. Internal Notes Thread -->
            <div class="app-card p-5">
              <h3 class="font-bold text-xs text-black uppercase tracking-wider mb-3">Internal Admin Notes</h3>

              <div class="space-y-2.5 mb-3 max-h-48 overflow-y-auto">
                ${order.notes.length === 0 ? `
                  <p class="text-xs text-zinc-400 italic">No notes added yet.</p>
                ` : order.notes.map(n => `
                  <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                    <div class="flex items-center justify-between text-zinc-500 mb-1">
                      <span class="font-bold text-black">${n.author}</span>
                      <span class="text-[10px]">${Utils.formatDate(n.created_at)}</span>
                    </div>
                    <p class="text-zinc-800">${n.note}</p>
                  </div>
                `).join('')}
              </div>

              <div class="flex gap-2">
                <input
                  type="text"
                  id="new-order-note"
                  placeholder="Add memo..."
                  class="flex-1 bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                  onkeydown="if(event.key === 'Enter') OrderDetailsComponent.addNote()"
                />
                <button onclick="OrderDetailsComponent.addNote()" class="btn-primary text-xs py-1.5 px-3">Add</button>
              </div>
            </div>

          </div>

        </div>

      </div>
    `;

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  async pushOrderToSupplier(supplierName) {
    if (!this.currentOrder) return;
    try {
      await API.pushToSupplier(this.currentOrder.id, supplierName);
      Utils.showToast(`Order successfully pushed to ${supplierName} API! PO created.`);
      await this.render(document.getElementById('main-content'), this.currentOrder.id);
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  },

  async confirmCod(isConfirmed) {
    if (!this.currentOrder) return;
    try {
      await API.verifyCod(this.currentOrder.id, isConfirmed);
      Utils.showToast(isConfirmed ? 'COD Order confirmed & verified via WhatsApp!' : 'COD Order rejected & cancelled.');
      await this.render(document.getElementById('main-content'), this.currentOrder.id);
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  },

  async addNote() {
    const input = document.getElementById('new-order-note');
    if (!input || !input.value.trim() || !this.currentOrder) return;
    try {
      await API.addOrderNote(this.currentOrder.id, input.value.trim());
      input.value = '';
      Utils.showToast('Note saved to audit trail.');
      await this.render(document.getElementById('main-content'), this.currentOrder.id);
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  },

  openStatusModal() {
    const order = this.currentOrder;
    if (!order) return;
    OrdersComponent.quickStatusModal(order.id, order.order_status, order.order_number);
  },

  openTrackingModal() {
    const order = this.currentOrder;
    if (!order) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="app-card w-full max-w-md p-6 bg-white border-2 border-black shadow-2xl">
        <h3 class="text-base font-black text-black">Update Courier & Tracking: ${order.order_number}</h3>

        <div class="mt-4 space-y-3">
          <label class="block text-xs font-bold text-black">Courier Partner</label>
          <select id="tracking-courier" class="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-black focus:ring-1 focus:ring-black">
            <option value="Delhivery Surface" ${order.courier_partner === 'Delhivery Surface' ? 'selected' : ''}>Delhivery Surface</option>
            <option value="Bluedart Express" ${order.courier_partner === 'Bluedart Express' ? 'selected' : ''}>Bluedart Express</option>
            <option value="Shadowfax Air" ${order.courier_partner === 'Shadowfax Air' ? 'selected' : ''}>Shadowfax Air</option>
            <option value="XpressBees" ${order.courier_partner === 'XpressBees' ? 'selected' : ''}>XpressBees</option>
            <option value="Ecom Express" ${order.courier_partner === 'Ecom Express' ? 'selected' : ''}>Ecom Express</option>
          </select>

          <label class="block text-xs font-bold text-black">Tracking / AWB Number</label>
          <input type="text" id="tracking-number" value="${order.tracking_number || ''}" placeholder="DEL99881122IN" class="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-black font-mono focus:ring-1 focus:ring-black" />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
          <button id="tracking-submit" class="btn-primary text-xs shadow-sm">Save Logistics Info</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#tracking-submit').onclick = async () => {
      const courier = modal.querySelector('#tracking-courier').value;
      const awb = modal.querySelector('#tracking-number').value.trim();
      try {
        await API.updateOrderTracking(order.id, {
          courier_partner: courier,
          tracking_number: awb,
          shipping_status: 'SHIPPED'
        });
        Utils.showToast(`AWB ${awb} assigned to ${order.order_number}`);
        modal.remove();
        await OrderDetailsComponent.render(document.getElementById('main-content'), order.id);
      } catch (e) {
        Utils.showToast(e.message, 'error');
      }
    };
  },

  openRefundModal() {
    const order = this.currentOrder;
    if (!order) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="app-card w-full max-w-md p-6 bg-white border-2 border-black shadow-2xl">
        <h3 class="text-base font-black text-black">Process Refund: ${order.order_number}</h3>
        <p class="text-xs text-zinc-600 mt-1">Maximum refundable: <b class="font-mono text-black">${Utils.formatCurrency(order.total_amount)}</b></p>

        <div class="mt-4 space-y-3">
          <label class="block text-xs font-bold text-black">Refund Amount (₹)</label>
          <input type="number" id="refund-amount" value="${order.total_amount}" max="${order.total_amount}" class="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-black font-mono focus:ring-1 focus:ring-black" />

          <label class="block text-xs font-bold text-black">Reason for Refund</label>
          <input type="text" id="refund-reason" placeholder="Customer return / RTO / damaged delivery..." class="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-black focus:ring-1 focus:ring-black" />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
          <button id="refund-submit" class="btn-primary text-xs shadow-sm">Confirm Refund</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#refund-submit').onclick = async () => {
      const amount = parseFloat(modal.querySelector('#refund-amount').value);
      const reason = modal.querySelector('#refund-reason').value.trim();
      try {
        await API.createRefund(order.id, amount, reason);
        Utils.showToast(`Refund of ₹${amount} issued successfully`);
        modal.remove();
        await OrderDetailsComponent.render(document.getElementById('main-content'), order.id);
      } catch (e) {
        Utils.showToast(e.message, 'error');
      }
    };
  }
};
