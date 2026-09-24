// LUISCART Clean & Simple Dropshipping Suppliers & Sourcing Hub Component

const SuppliersComponent = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const data = await API.getSuppliersHub();
      this.renderView(container, data);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load suppliers hub: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, data) {
    const suppliers = data.suppliers || [];
    const pendingOrders = data.pendingSupplierOrders || [];

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              Suppliers & Sourcing Hub
            </h1>
            <p class="text-xs text-zinc-500">Automated 1-click supplier fulfillment, CJ Dropshipping & AliExpress API sync, and sourcing volume tracking.</p>
          </div>
          <div class="flex items-center gap-3">
            ${pendingOrders.length > 0 ? `
              <button onclick="SuppliersComponent.bulkPushAll()" class="btn-primary text-xs shadow-sm">
                <i data-lucide="send" class="w-4 h-4"></i>
                Bulk Push All (${pendingOrders.length}) to Suppliers
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Supplier Partner Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          ${suppliers.map(s => `
            <div class="app-card p-3.5 sm:p-5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-black uppercase tracking-wider truncate">${s.supplier_name}</span>
                <span class="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold shrink-0">Active</span>
              </div>
              <p class="text-xl sm:text-2xl font-black text-black mt-2 font-sans">${s.product_count} SKUs</p>
              <div class="mt-2.5 pt-2.5 border-t border-zinc-200 text-xs text-zinc-500 space-y-1">
                <div class="flex justify-between">
                  <span>Units:</span>
                  <span class="font-bold text-black font-mono">${s.units_ordered}</span>
                </div>
                <div class="flex justify-between">
                  <span>Volume:</span>
                  <span class="font-black text-black font-mono">${Utils.formatCurrency(s.total_sourcing_volume)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Pending Supplier Fulfillment Queue -->
        <div class="app-card p-4 sm:p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-base text-black flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                Orders Awaiting Fulfillment (${pendingOrders.length})
              </h3>
              <p class="text-xs text-zinc-500">Orders verified and ready to be transmitted to CJ Dropshipping / 3PL supplier APIs</p>
            </div>
          </div>

          <!-- MOBILE CARDS VIEW (< md) -->
          <div class="md:hidden divide-y divide-zinc-200 space-y-3">
            ${pendingOrders.length === 0 ? `
              <div class="py-12 text-center text-zinc-400 text-xs">
                All orders have been synchronized and fulfilled with suppliers!
              </div>
            ` : pendingOrders.map(o => `
              <div class="pt-3 first:pt-0 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="font-mono font-bold text-black underline text-xs cursor-pointer" onclick="App.openOrderDetails(${o.id})">${o.order_number}</span>
                    <p class="font-bold text-black text-xs mt-0.5">${o.customer_name}</p>
                  </div>
                  <span class="font-mono font-black text-black text-sm">${Utils.formatCurrency(o.total_amount)}</span>
                </div>

                <div class="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-[10px] text-zinc-500 uppercase block font-medium">Assigned Supplier</span>
                    <span class="font-bold text-black">${o.supplier_name || 'CJ Dropshipping'}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-black text-black">
                    ${o.supplier_status || 'AWAITING_SUPPLIER'}
                  </span>
                </div>

                <div class="flex items-center gap-2 pt-0.5">
                  <button onclick="App.openOrderDetails(${o.id})" class="btn-secondary text-xs py-1.5 flex-1 justify-center shadow-sm">
                    View Order
                  </button>
                  <button onclick="SuppliersComponent.pushSingle(${o.id}, '${o.supplier_name || 'CJ Dropshipping'}')" class="btn-primary text-xs py-1.5 flex-1 justify-center shadow-sm">
                    Push to API
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- DESKTOP TABLE VIEW (>= md) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 uppercase tracking-wider font-bold">
                <tr>
                  <th class="py-3 px-4">Order #</th>
                  <th class="py-3 px-4">Customer</th>
                  <th class="py-3 px-4">Assigned Supplier</th>
                  <th class="py-3 px-4">Supplier Status</th>
                  <th class="py-3 px-4 text-right">Order Value</th>
                  <th class="py-3 px-4 text-center">Fulfill Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 text-xs">
                ${pendingOrders.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-12 text-center text-zinc-400">
                      All orders have been synchronized and fulfilled with suppliers!
                    </td>
                  </tr>
                ` : pendingOrders.map(o => `
                  <tr class="hover:bg-zinc-50 transition">
                    <td class="py-3 px-4 font-mono font-bold text-black underline cursor-pointer" onclick="App.openOrderDetails(${o.id})">
                      ${o.order_number}
                    </td>
                    <td class="py-3 px-4">
                      <p class="font-bold text-black">${o.customer_name}</p>
                      <p class="text-[11px] text-zinc-500 font-mono">${o.customer_phone}</p>
                    </td>
                    <td class="py-3 px-4 text-black font-medium">
                      ${o.supplier_name || 'CJ Dropshipping'}
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-white border border-black text-black">
                        ${o.supplier_status || 'AWAITING_SUPPLIER'}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right font-black text-black font-mono">
                      ${Utils.formatCurrency(o.total_amount)}
                    </td>
                    <td class="py-3 px-4 text-center">
                      <button onclick="SuppliersComponent.pushSingle(${o.id}, '${o.supplier_name || 'CJ Dropshipping'}')" class="btn-primary text-xs py-1 px-3 shadow-sm">
                        Push to API
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  async pushSingle(orderId, supplierName) {
    try {
      await API.pushToSupplier(orderId, supplierName);
      Utils.showToast(`Order pushed to ${supplierName} API successfully!`);
      this.render(document.getElementById('main-content'));
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  },

  async bulkPushAll() {
    try {
      const data = await API.getSuppliersHub();
      const ids = (data.pendingSupplierOrders || []).map(o => o.id);
      if (ids.length === 0) return;
      await API.bulkPushToSupplier(ids);
      Utils.showToast(`Successfully dispatched ${ids.length} orders to suppliers!`);
      this.render(document.getElementById('main-content'));
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  }
};
