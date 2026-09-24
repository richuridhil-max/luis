// LUISCART Clean & Simple Customer Management & CRM Component

const CustomersComponent = {
  currentTag: 'ALL',
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const data = await API.getCustomers({
        tag: this.currentTag,
        search: this.searchQuery
      });
      this.renderView(container, data);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load customer CRM: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, data) {
    const customers = data.customers;
    const stats = data.stats || {};

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Customers & CRM
            </h1>
            <p class="text-xs text-slate-500">Customer directory, order history, lifetime value, and WhatsApp contact shortcuts.</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="window.location.href='/api/customers/export'" class="btn-secondary text-xs shadow-sm">
              <i data-lucide="download" class="w-4 h-4"></i>
              Export Customers CSV
            </button>
          </div>
        </div>

        <!-- CRM Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div class="app-card p-3 sm:p-4">
            <span class="text-[11px] sm:text-xs text-zinc-500 font-bold uppercase">Total Customers</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1">${stats.total_customers || 0}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">Profiles in CRM</p>
          </div>

          <div class="app-card p-3 sm:p-4">
            <span class="text-[11px] sm:text-xs text-black font-bold uppercase">VIP Repeat</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${stats.vip_customers || 0}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">High volume accounts</p>
          </div>

          <div class="app-card p-3 sm:p-4">
            <span class="text-[11px] sm:text-xs text-black font-bold uppercase">New Buyers</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${stats.new_customers || 0}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">Recent first-time orders</p>
          </div>

          <div class="app-card p-3 sm:p-4">
            <span class="text-[11px] sm:text-xs text-black font-bold uppercase">At-Risk</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${stats.at_risk_customers || 0}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">Re-targeting candidate</p>
          </div>
        </div>

        <!-- Search & Filter Bar -->
        <div class="app-card p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="relative w-full md:w-80">
            <input
              type="text"
              id="cust-search"
              placeholder="Search by name, email, phone, city..."
              value="${this.searchQuery}"
              oninput="CustomersComponent.debounceSearch(this.value)"
              class="w-full bg-white border border-zinc-300 rounded-xl px-4 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black pl-9 pr-8"
            />
            <i data-lucide="search" class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5"></i>
            ${this.searchQuery ? `
              <button onclick="CustomersComponent.clearSearch()" class="absolute right-2.5 top-2 text-zinc-400 hover:text-black p-0.5 text-xs font-bold" title="Clear search">✕</button>
            ` : ''}
          </div>

          <!-- Tag filters -->
          <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            ${['ALL', 'VIP', 'REGULAR', 'NEW', 'AT_RISK'].map(t => `
              <button onclick="CustomersComponent.filterTag('${t}')" class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${this.currentTag === t ? 'bg-black text-white shadow-xs' : 'text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-200'}">
                ${t}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Customers Directory (Dual View: Mobile Cards & Desktop Table) -->
        <div class="app-card overflow-hidden">
          <!-- MOBILE CARDS VIEW (< md) -->
          <div class="md:hidden divide-y divide-zinc-200 p-3 space-y-3">
            ${customers.length === 0 ? `
              <div class="py-12 text-center text-zinc-400 text-xs">
                No customers found matching your search.
              </div>
            ` : customers.map(c => `
              <div class="pt-3 first:pt-0 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h4 class="font-bold text-black text-sm">${c.first_name} ${c.last_name}</h4>
                    <p class="text-[11px] text-zinc-500">${c.city}, ${c.state}</p>
                  </div>
                  <div>
                    ${Utils.renderTagBadge(c.tag)}
                  </div>
                </div>

                <div class="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-[10px] text-zinc-500 uppercase block font-medium">Total Orders</span>
                    <span class="font-bold text-black">${c.orders_count} orders</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] text-zinc-500 uppercase block font-medium">Lifetime Spend</span>
                    <span class="font-black font-mono text-black text-sm">${Utils.formatCurrency(c.total_spent)}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <a href="tel:${c.phone}" class="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">
                    📞 Call
                  </a>
                  <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}" target="_blank" class="px-3 py-1.5 bg-white hover:bg-zinc-100 text-black border border-black rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition flex-1">
                    💬 WhatsApp
                  </a>
                  <button onclick="CustomersComponent.open360Drawer(${c.id})" class="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">
                    Profile
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- DESKTOP TABLE VIEW (>= md) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-zinc-100 border-b border-zinc-200 text-xs text-black uppercase tracking-wider font-bold">
                <tr>
                  <th class="py-3 px-4">Customer Name</th>
                  <th class="py-3 px-4">Contact</th>
                  <th class="py-3 px-4">Location</th>
                  <th class="py-3 px-4 text-center">Tag</th>
                  <th class="py-3 px-4 text-right">Orders</th>
                  <th class="py-3 px-4 text-right">Total Spent</th>
                  <th class="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 text-xs">
                ${customers.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-12 text-center text-zinc-400">
                      No customers found matching your search.
                    </td>
                  </tr>
                ` : customers.map(c => `
                  <tr class="hover:bg-zinc-50 transition">
                    <td class="py-3 px-4">
                      <p class="font-bold text-black text-sm">${c.first_name} ${c.last_name}</p>
                      <span class="text-[10px] text-zinc-400">Since ${Utils.formatDateOnly(c.created_at)}</span>
                    </td>
                    <td class="py-3 px-4">
                      <p class="text-black font-mono font-medium">${c.phone}</p>
                      <p class="text-[11px] text-zinc-500">${c.email}</p>
                    </td>
                    <td class="py-3 px-4 text-zinc-700">
                      ${c.city}, ${c.state}
                    </td>
                    <td class="py-3 px-4 text-center">
                      ${Utils.renderTagBadge(c.tag)}
                    </td>
                    <td class="py-3 px-4 text-right font-bold text-black">
                      ${c.orders_count}
                    </td>
                    <td class="py-3 px-4 text-right font-mono font-black text-black">
                      ${Utils.formatCurrency(c.total_spent)}
                    </td>
                    <td class="py-3 px-4 text-center">
                      <button onclick="CustomersComponent.open360Drawer(${c.id})" class="btn-secondary text-xs py-1 px-3 shadow-xs">
                        Profile
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

  filterTag(tag) {
    this.currentTag = tag;
    this.render(document.getElementById('main-content'));
  },

  searchTimer: null,
  debounceSearch(q) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.search(q);
    }, 280);
  },

  search(q) {
    this.searchQuery = q.trim();
    this.render(document.getElementById('main-content'));
  },

  clearSearch() {
    this.searchQuery = '';
    this.render(document.getElementById('main-content'));
  },

  async open360Drawer(customerId) {
    try {
      const cust = await API.getCustomer(customerId);

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto';
      modal.innerHTML = `
        <div class="app-card w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 my-4 sm:my-8 shadow-2xl max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">${cust.first_name} ${cust.last_name}</h3>
              <p class="text-xs text-slate-500">${cust.city}, ${cust.state} • ${cust.country}</p>
            </div>
            <div>
              ${Utils.renderTagBadge(cust.tag)}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:gap-4 my-4">
            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
              <span class="text-zinc-500 font-bold block uppercase text-[10px]">Total Spend</span>
              <p class="text-base sm:text-lg font-black text-black font-mono mt-0.5">${Utils.formatCurrency(cust.total_spent)}</p>
            </div>
            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
              <span class="text-zinc-500 font-bold block uppercase text-[10px]">Total Orders</span>
              <p class="text-base sm:text-lg font-black text-black mt-0.5">${cust.orders_count} Orders</p>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <p class="text-black"><b>Phone:</b> <span class="font-mono font-medium">${cust.phone}</span></p>
            <p class="text-black"><b>Email:</b> <span class="font-mono font-medium">${cust.email}</span></p>
            <p class="text-black"><b>Address:</b> ${cust.shipping_address || 'Same as primary'}</p>
          </div>

          <!-- Order History -->
          <div class="mt-4 pt-3 border-t border-zinc-200">
            <h4 class="text-xs uppercase tracking-wider font-bold text-black mb-2">Order History</h4>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              ${(cust.orders || []).map(o => `
                <div class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                  <div>
                    <span class="font-black text-black font-mono">${o.order_number}</span>
                    <span class="text-[10px] text-zinc-400 ml-2 font-medium">${Utils.formatDateOnly(o.created_at)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    ${Utils.renderStatusBadge(o.order_status)}
                    <span class="font-black font-mono text-black">${Utils.formatCurrency(o.total_amount)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button onclick="this.closest('.fixed').remove()" class="btn-primary text-xs">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  }
};
