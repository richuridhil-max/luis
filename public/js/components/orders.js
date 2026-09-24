// LUISCART Clean & Simple Order Management Component

const OrdersComponent = {
  currentStatus: 'ALL',
  currentPage: 1,
  limit: 20,
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const params = {
        page: this.currentPage,
        limit: this.limit
      };
      if (this.currentStatus !== 'ALL') params.status = this.currentStatus;
      if (this.searchQuery) params.search = this.searchQuery;

      const data = await API.getOrders(params);
      this.renderView(container, data);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-zinc-100 border border-black rounded-xl text-black">
          <p class="font-bold">Failed to load orders.</p>
          <p class="text-sm mt-1 text-zinc-600">${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, rawData = {}) {
    const orders = rawData.orders || (Array.isArray(rawData) ? rawData : []);
    const pagination = rawData.pagination || { page: 1, limit: 20, total: orders.length, totalPages: 1 };
    const badgeCounts = rawData.badgeCounts || rawData.statusBadgeCounts || { ALL: orders.length, NEW: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
    const tabs = [
      { key: 'ALL', label: 'All Orders', badgeKey: 'ALL' },
      { key: 'NEW', label: 'New / Pending COD', badgeKey: 'NEW' },
      { key: 'CONFIRMED,PROCESSING,PACKED', label: 'Ready for Supplier', badgeKey: 'CONFIRMED' },
      { key: 'SHIPPED,OUT_FOR_DELIVERY', label: 'Shipped (In Transit)', badgeKey: 'SHIPPED' },
      { key: 'DELIVERED', label: 'Delivered', badgeKey: 'DELIVERED' },
      { key: 'CANCELLED,RETURN_REQUESTED,RETURNED,REFUNDED', label: 'Cancelled / RTO', badgeKey: 'CANCELLED' }
    ];

    container.innerHTML = `
      <div class="space-y-5">
        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Order Management
            </h1>
            <p class="text-xs text-slate-500">Track, process, dispatch, and manage customer sales orders across all lifecycle stages.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="OrdersComponent.exportCSV()" class="btn-secondary text-xs shadow-sm">
              <i data-lucide="download" class="w-4 h-4"></i>
              Export CSV
            </button>
            <button onclick="App.navigate('pos')" class="btn-primary text-xs shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              New Order
            </button>
          </div>
        </div>

        <!-- Search Bar & Status Filters Tabs -->
        <div class="app-card p-4 space-y-4">
          <div class="relative w-full max-w-md">
            <input
              type="text"
              id="order-search-input"
              placeholder="Search by order #, customer, phone, or AWB..."
              value="${this.searchQuery}"
              oninput="OrdersComponent.debounceSearch(this.value)"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white pl-9 pr-8"
            />
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
            ${this.searchQuery ? `
              <button onclick="OrdersComponent.clearSearch()" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 text-xs font-bold" title="Clear search">✕</button>
            ` : ''}
          </div>

          <!-- Status Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3">
            ${tabs.map(tab => {
              const isActive = this.currentStatus === tab.key;
              const count = badgeCounts[tab.badgeKey || tab.key] || 0;
              const activeCls = isActive
                ? 'bg-black text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-200';
              const badgeCls = isActive
                ? 'bg-neutral-800 text-white'
                : 'bg-slate-100 text-slate-700';

              return `
                <button onclick="OrdersComponent.filterStatus('${tab.key}')" class="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-2 transition ${activeCls}">
                  ${tab.label}
                  <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${badgeCls}">${count}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Orders Card List (Mobile) + Table (Desktop) -->
        <div class="app-card overflow-hidden">
          <!-- Mobile Cards View (< md) -->
          <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            ${orders.length === 0 ? `
              <div class="py-12 text-center text-zinc-400 text-xs">
                No orders found matching this filter.
              </div>
            ` : orders.map(o => `
              <div class="p-4 space-y-3 hover:bg-zinc-50 transition cursor-pointer" onclick="App.openOrderDetails(${o.id})">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-black text-xs text-black">${o.order_number}</span>
                    <span class="text-[10px] text-zinc-400">•</span>
                    <span class="text-[11px] text-zinc-600 font-medium">${Utils.formatDateOnly(o.created_at)}</span>
                  </div>
                  ${Utils.renderStatusBadge(o.order_status)}
                </div>

                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-bold text-black text-sm">${o.customer_name}</p>
                    <p class="text-[11px] text-zinc-600 font-mono mt-0.5">${o.customer_phone}</p>
                    <p class="text-[11px] text-zinc-700 mt-1 line-clamp-1">${o.items_count} item${o.items_count > 1 ? 's' : ''}: ${o.items_summary || ''}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="font-mono font-black text-black text-base">${Utils.formatCurrency(o.total_amount)}</span>
                    <div class="mt-1">${Utils.renderPaymentBadge(o.payment_status)}</div>
                  </div>
                </div>

                <div class="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                  <div class="text-[11px] text-zinc-600 font-mono truncate max-w-[200px]">
                    ${o.courier_partner ? `${o.courier_partner} (${o.tracking_number || 'Pending'})` : 'No Courier Assigned'}
                  </div>
                  <button onclick="App.openOrderDetails(${o.id})" class="px-3 py-1 bg-white hover:bg-zinc-100 border border-black text-black rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs">
                    <span>Manage</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Desktop Table View (>= md) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-zinc-100 border-b border-zinc-200 text-xs text-black uppercase font-bold tracking-wider">
                <tr>
                  <th class="py-3 px-4">Order ID</th>
                  <th class="py-3 px-4">Customer</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Items</th>
                  <th class="py-3 px-4 text-right">Amount</th>
                  <th class="py-3 px-4">Payment</th>
                  <th class="py-3 px-4">Order Status</th>
                  <th class="py-3 px-4">Logistics / Courier</th>
                  <th class="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 text-xs">
                ${orders.length === 0 ? `
                  <tr>
                    <td colspan="9" class="py-12 text-center text-zinc-400">
                      No orders found matching this filter.
                    </td>
                  </tr>
                ` : orders.map(o => `
                  <tr class="hover:bg-zinc-50 transition cursor-pointer" onclick="if(!event.target.closest('button') && !event.target.closest('a')) App.openOrderDetails(${o.id})">
                    <td class="py-3 px-4">
                      <a href="javascript:void(0)" onclick="App.openOrderDetails(${o.id})" class="font-mono font-black text-black hover:underline">
                        ${o.order_number}
                      </a>
                    </td>
                    <td class="py-3 px-4">
                      <p class="font-bold text-black text-xs">${o.customer_name}</p>
                      <p class="text-[11px] text-zinc-600 font-mono">${o.customer_phone}</p>
                    </td>
                    <td class="py-3 px-4 text-xs text-zinc-600 whitespace-nowrap font-medium">
                      ${Utils.formatDate(o.created_at)}
                    </td>
                    <td class="py-3 px-4">
                      <span class="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-black">
                        ${o.items_count} item${o.items_count > 1 ? 's' : ''}
                      </span>
                      <p class="text-[11px] text-zinc-600 line-clamp-1 max-w-[200px] mt-0.5">${o.items_summary || ''}</p>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <span class="font-black text-black font-mono text-sm">${Utils.formatCurrency(o.total_amount)}</span>
                    </td>
                    <td class="py-3 px-4">
                      ${Utils.renderPaymentBadge(o.payment_status)}
                      <span class="text-[10px] text-zinc-600 block mt-0.5 font-mono font-bold">${o.payment_method}</span>
                    </td>
                    <td class="py-3 px-4">
                      ${Utils.renderStatusBadge(o.order_status)}
                    </td>
                    <td class="py-3 px-4">
                      ${o.courier_partner ? `
                        <div class="text-xs">
                          <span class="font-bold text-black">${o.courier_partner}</span>
                          <span class="block text-[11px] font-mono text-black font-semibold">${o.tracking_number || 'No AWB'}</span>
                        </div>
                      ` : `
                        <span class="text-xs text-zinc-400 italic">Unassigned</span>
                      `}
                    </td>
                    <td class="py-3 px-4 text-center whitespace-nowrap">
                      <button onclick="App.openOrderDetails(${o.id})" class="px-3 py-1 bg-white hover:bg-zinc-100 border border-black text-black rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-xs">
                        <span>Manage</span>
                        <span class="text-[10px]">→</span>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          ${pagination.totalPages > 1 ? `
            <div class="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>Showing Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total orders)</span>
              <div class="flex items-center gap-2">
                <button
                  ${pagination.page <= 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''}
                  onclick="OrdersComponent.changePage(${pagination.page - 1})"
                  class="btn-secondary text-xs shadow-sm py-1.5 px-3"
                >Previous</button>
                <button
                  ${pagination.page >= pagination.totalPages ? 'disabled class="opacity-40 cursor-not-allowed"' : ''}
                  onclick="OrdersComponent.changePage(${pagination.page + 1})"
                  class="btn-secondary text-xs shadow-sm py-1.5 px-3"
                >Next</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  filterStatus(status) {
    this.currentStatus = status;
    this.currentPage = 1;
    this.render(document.getElementById('main-content'));
  },

  handleSearch(query) {
    this.searchQuery = query.trim();
    this.currentPage = 1;
    this.render(document.getElementById('main-content'));
  },

  searchTimer: null,
  debounceSearch(query) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.handleSearch(query);
    }, 280);
  },

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.render(document.getElementById('main-content'));
  },

  changePage(page) {
    this.currentPage = page;
    this.render(document.getElementById('main-content'));
  },

  exportCSV() {
    window.location.href = '/api/orders/export';
  },

  quickStatusModal(orderId, currentStatus, orderNumber) {
    const statuses = [
      { value: 'NEW', label: 'New / Pending COD' },
      { value: 'CONFIRMED', label: 'Confirmed / Ready for Supplier' },
      { value: 'SHIPPED', label: 'Shipped (In Transit)' },
      { value: 'DELIVERED', label: 'Delivered' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'RETURNED', label: 'Returned to Origin (RTO)' }
    ];

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="app-card w-full max-w-md p-6 bg-white border border-black shadow-2xl">
        <h3 class="text-base font-bold text-black">Update Status: ${orderNumber}</h3>
        <p class="text-xs text-zinc-600 mt-1">Current status: <span class="font-black text-black">${currentStatus}</span></p>

        <div class="mt-4 space-y-3">
          <label class="block text-xs font-bold text-black">Select New Status</label>
          <select id="quick-status-select" class="w-full bg-white border border-black rounded-xl p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black">
            ${statuses.map(s => `<option value="${s.value}" ${s.value === currentStatus ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>

          <label class="block text-xs font-bold text-black">Audit / Timeline Note</label>
          <input type="text" id="quick-status-note" placeholder="Reason or update memo..." class="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
          <button id="quick-status-submit" class="btn-primary text-xs shadow-sm">Save Status</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#quick-status-submit').onclick = async () => {
      const newStatus = modal.querySelector('#quick-status-select').value;
      const note = modal.querySelector('#quick-status-note').value;
      try {
        await API.updateOrderStatus(orderId, newStatus, note);
        Utils.showToast(`Order ${orderNumber} updated to ${newStatus}`);
        modal.remove();
        OrdersComponent.render(document.getElementById('main-content'));
      } catch (e) {
        Utils.showToast(e.message, 'error');
      }
    };
  }
};
