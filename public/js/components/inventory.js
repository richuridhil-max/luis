// LUISCART Clean & Simple Inventory Management & Audit Logs

const InventoryComponent = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const [prodData, logs] = await Promise.all([
        API.getProducts({}),
        API.getInventoryLogs()
      ]);
      this.renderView(container, prodData, logs);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load inventory: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, prodData, logs) {
    const products = prodData.products;
    const lowStockItems = products.filter(p => p.stock_quantity <= p.low_stock_threshold);

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              Inventory Control & Movement Log
            </h1>
            <p class="text-xs text-zinc-500">Stock balance monitoring, threshold warnings, and immutable movement history.</p>
          </div>
          <button onclick="ProductsComponent.openAddProductModal()" class="btn-primary text-xs shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add SKU
          </button>
        </div>

        <!-- Critical Low Stock Alerts Banner -->
        ${lowStockItems.length > 0 ? `
          <div class="app-card p-5 border-2 border-black bg-white">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2 text-black font-black text-xs uppercase tracking-wider">
                <span class="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                <span>Attention Required: ${lowStockItems.length} Products at or below threshold</span>
              </div>
              <span class="text-xs text-black font-bold">Procurement Sync</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${lowStockItems.map(item => `
                <div class="bg-white p-3 rounded-xl border border-zinc-200 flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <img src="${item.image_url}" class="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
                    <div>
                      <p class="text-xs font-bold text-black line-clamp-1">${item.title}</p>
                      <span class="text-[10px] text-black font-mono font-bold">${item.sku}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-black text-black font-mono">${item.stock_quantity} Left</span>
                    <button onclick="ProductsComponent.openRestockModal(${item.id}, '${item.title.replace(/'/g, "\\'")}', ${item.stock_quantity})" class="block mt-1 text-[10px] px-2 py-0.5 bg-black text-white rounded font-bold hover:bg-zinc-800 transition">
                      Restock
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Inventory Stock Audit Logs Table -->
        <div class="app-card p-4 sm:p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-base text-black">Stock Movement Audit Trail</h3>
              <p class="text-xs text-zinc-500">Timestamped ledger of additions, order deductions, returns & restocks</p>
            </div>
            <span class="text-xs text-zinc-500 font-mono hidden sm:inline">Recent Movements</span>
          </div>

          <!-- MOBILE CARDS VIEW (< md) -->
          <div class="md:hidden divide-y divide-zinc-200 space-y-3">
            ${logs.map(log => {
              const isPositive = log.change_amount > 0;
              return `
                <div class="pt-3 first:pt-0 space-y-1.5">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="font-mono font-bold text-black text-xs">${log.sku}</span>
                      <p class="font-bold text-black text-xs leading-tight line-clamp-1">${log.product_title}</p>
                    </div>
                    <span class="font-mono font-black text-sm text-black">
                      ${isPositive ? '+' : ''}${log.change_amount}
                    </span>
                  </div>

                  <div class="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs font-mono">
                    <span class="text-zinc-500 text-[11px]">Prev: ${log.previous_stock}</span>
                    <span class="font-bold text-black">Balance: ${log.new_stock} units</span>
                    <span class="text-[10px] text-zinc-500">${log.reason}</span>
                  </div>

                  <p class="text-[10px] text-zinc-400 font-mono">${Utils.formatDate(log.created_at)}</p>
                </div>
              `;
            }).join('')}
          </div>

          <!-- DESKTOP TABLE VIEW (>= md) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 uppercase tracking-wider font-bold">
                <tr>
                  <th class="py-2.5 px-4">Date & Time</th>
                  <th class="py-2.5 px-4">Product SKU & Title</th>
                  <th class="py-2.5 px-4 text-center">Change</th>
                  <th class="py-2.5 px-4 text-center">Previous</th>
                  <th class="py-2.5 px-4 text-center">New Balance</th>
                  <th class="py-2.5 px-4">Reason / Source</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 text-xs">
                ${logs.map(log => {
                  const isPositive = log.change_amount > 0;
                  return `
                    <tr class="hover:bg-zinc-50">
                      <td class="py-3 px-4 font-mono text-zinc-500">${Utils.formatDate(log.created_at)}</td>
                      <td class="py-3 px-4">
                        <span class="font-mono font-bold text-black mr-2">${log.sku}</span>
                        <span class="text-black">${log.product_title}</span>
                      </td>
                      <td class="py-3 px-4 text-center font-mono font-black text-black">
                        ${isPositive ? '+' : ''}${log.change_amount}
                      </td>
                      <td class="py-3 px-4 text-center font-mono text-zinc-500">${log.previous_stock}</td>
                      <td class="py-3 px-4 text-center font-mono font-bold text-black">${log.new_stock}</td>
                      <td class="py-3 px-4 text-zinc-700">
                        <span class="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[11px] font-medium">${log.reason}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
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
