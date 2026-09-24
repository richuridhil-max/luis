// LUISCART Clean & Simple Shipping & Logistics Hub Component

const ShippingComponent = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const data = await API.getShippingHub();
      this.renderView(container, data);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load logistics hub: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, data) {
    const carriers = data.carrierStats || [];
    const activeShipments = data.activeShipments || [];

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              Logistics & Courier Tracking
            </h1>
            <p class="text-xs text-zinc-500">Integrated carrier partner dispatches (Delhivery, Bluedart, Shadowfax), AWB tracking, and final-mile status.</p>
          </div>
        </div>

        <!-- Carrier Partner Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          ${carriers.map(c => `
            <div class="app-card p-3.5 sm:p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-black uppercase tracking-wider truncate">${c.courier}</span>
                <span class="w-2 h-2 rounded-full bg-black shrink-0"></span>
              </div>
              <p class="text-xl sm:text-2xl font-black text-black mt-2 font-mono">${c.total_shipments} Parcels</p>
              <div class="flex justify-between text-[11px] sm:text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-200">
                <span>In-Transit: <strong class="text-black font-black font-mono">${c.active_in_transit}</strong></span>
                <span>Delivered: <strong class="text-black font-black font-mono">${c.delivered_count}</strong></span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Active Dispatches & In-Flight Shipments -->
        <div class="app-card p-4 sm:p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-base text-black">Active Shipments In-Flight (${activeShipments.length})</h3>
              <p class="text-xs text-zinc-500">Consignments currently packed, manifested, in-transit, or out for delivery</p>
            </div>
            <span class="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-black text-white shrink-0">
              Live Courier Sync
            </span>
          </div>

          <!-- MOBILE CARDS VIEW (< md) -->
          <div class="md:hidden divide-y divide-zinc-200 space-y-3">
            ${activeShipments.length === 0 ? `
              <div class="py-12 text-center text-zinc-400 text-xs">All dispatches have been fulfilled.</div>
            ` : activeShipments.map(s => `
              <div class="pt-3 first:pt-0 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="font-mono font-bold text-black underline text-xs cursor-pointer" onclick="App.openOrderDetails(${s.id})">${s.order_number}</span>
                    <p class="font-bold text-black text-xs mt-0.5">${s.customer_name}</p>
                  </div>
                  <div>
                    ${Utils.renderStatusBadge(s.shipping_status)}
                  </div>
                </div>

                <div class="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-xs space-y-1">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Carrier:</span>
                    <span class="font-bold text-black">${s.courier_partner || 'Pending'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">AWB:</span>
                    <span class="font-mono font-black text-black">${s.tracking_number || 'Awaiting AWB'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Est. Delivery:</span>
                    <span class="font-mono font-bold text-black">${s.estimated_delivery ? Utils.formatDateOnly(s.estimated_delivery) : 'TBD'}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-0.5">
                  <button onclick="ShippingLabelModal.show(${s.id})" class="btn-secondary text-xs py-1.5 flex-1 justify-center shadow-sm">
                    Shipping Label
                  </button>
                  <button onclick="App.openOrderDetails(${s.id})" class="btn-primary text-xs py-1.5 flex-1 justify-center shadow-sm">
                    View Details
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
                  <th class="py-3 px-4">Consignee</th>
                  <th class="py-3 px-4">Carrier Partner</th>
                  <th class="py-3 px-4">AWB Tracking #</th>
                  <th class="py-3 px-4">Logistics Status</th>
                  <th class="py-3 px-4">Est. Delivery</th>
                  <th class="py-3 px-4 text-center">Live Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 text-xs">
                ${activeShipments.length === 0 ? `
                  <tr><td colspan="7" class="py-8 text-center text-zinc-400">All dispatches have been fulfilled.</td></tr>
                ` : activeShipments.map(s => `
                  <tr class="hover:bg-zinc-50 transition">
                    <td class="py-3 px-4 font-mono font-bold text-black underline cursor-pointer" onclick="App.openOrderDetails(${s.id})">${s.order_number}</td>
                    <td class="py-3 px-4">
                      <p class="font-bold text-black">${s.customer_name}</p>
                      <p class="text-[11px] text-zinc-500 line-clamp-1 max-w-[200px]">${s.shipping_address}</p>
                    </td>
                    <td class="py-3 px-4 font-bold text-black">${s.courier_partner || 'Pending'}</td>
                    <td class="py-3 px-4 font-mono font-black text-black">${s.tracking_number || 'Awaiting AWB'}</td>
                    <td class="py-3 px-4">${Utils.renderStatusBadge(s.shipping_status)}</td>
                    <td class="py-3 px-4 text-zinc-700 font-mono">${s.estimated_delivery ? Utils.formatDateOnly(s.estimated_delivery) : 'TBD'}</td>
                    <td class="py-3 px-4 text-center">
                      <button onclick="ShippingLabelModal.show(${s.id})" class="btn-secondary text-xs py-1 px-2.5 shadow-sm mr-1">Label</button>
                      <button onclick="App.openOrderDetails(${s.id})" class="btn-primary text-xs py-1 px-2.5 shadow-sm">View</button>
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
  }
};
