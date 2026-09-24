// LUISCART Clean & Simple Product Catalog & Margin Engine

const ProductsComponent = {
  currentCategory: 'ALL',
  stockFilter: 'all',
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const data = await API.getProducts({
        category: this.currentCategory,
        stock: this.stockFilter,
        search: this.searchQuery
      });
      this.renderView(container, data);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load products: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, data) {
    const products = data.products;
    const categories = data.categories || [];
    const summary = data.inventorySummary || {};

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Products & Margin Engine
            </h1>
            <p class="text-xs text-slate-500">Catalog management, supplier sourcing costs, CAC estimates, and unit economics.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.location.href='/api/products/export'" class="btn-secondary text-xs shadow-sm">
              <i data-lucide="download" class="w-4 h-4"></i>
              Export CSV
            </button>
            <button onclick="ProductsComponent.openAddProductModal()" class="btn-primary text-xs shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              Add New Product
            </button>
          </div>
        </div>

        <!-- Dropship Unit Economics Overview -->
        ${(() => {
          const avgPrice = products.length ? Math.round(products.reduce((acc, p) => acc + p.price, 0) / products.length) : 0;
          const avgCost = products.length ? Math.round(products.reduce((acc, p) => acc + (p.cost_price || p.price * 0.4), 0) / products.length) : 0;
          const avgMargin = avgPrice > 0 ? Math.round(((avgPrice - avgCost) / avgPrice) * 100) : 0;
          return `
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div class="app-card p-3 sm:p-4">
                <span class="text-[11px] sm:text-xs text-zinc-500 font-bold uppercase">Active Products</span>
                <p class="text-xl sm:text-2xl font-black text-black mt-1">${products.length} SKUs</p>
                <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">Live on storefront</p>
              </div>

              <div class="app-card p-3 sm:p-4">
                <span class="text-[11px] sm:text-xs text-black font-bold uppercase">Avg Selling Price</span>
                <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${Utils.formatCurrency(avgPrice)}</p>
                <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">Store catalog average</p>
              </div>

              <div class="app-card p-3 sm:p-4">
                <span class="text-[11px] sm:text-xs text-black font-bold uppercase">Sourcing Cost</span>
                <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${Utils.formatCurrency(avgCost)}</p>
                <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">CJ / Supplier base cost</p>
              </div>

              <div class="app-card p-3 sm:p-4">
                <span class="text-[11px] sm:text-xs text-black font-bold uppercase">Avg Margin</span>
                <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${avgMargin}%</p>
                <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">Gross margin</p>
              </div>
            </div>
          `;
        })()}

        <!-- Filters & Search -->
        <div class="app-card p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="relative w-full md:w-80">
            <input
              type="text"
              id="prod-search"
              placeholder="Search product title, SKU, category..."
              value="${this.searchQuery}"
              oninput="ProductsComponent.debounceSearch(this.value)"
              class="w-full bg-white border border-zinc-300 rounded-xl px-4 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black pl-9 pr-8"
            />
            <i data-lucide="search" class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5"></i>
            ${this.searchQuery ? `
              <button onclick="ProductsComponent.clearSearch()" class="absolute right-2.5 top-2 text-zinc-400 hover:text-black p-0.5 text-xs font-bold" title="Clear search">✕</button>
            ` : ''}
          </div>

          <!-- Category and Stock toggles -->
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <select id="prod-category-filter" onchange="ProductsComponent.filterCategory(this.value)" class="flex-1 md:flex-initial bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-black font-medium focus:border-black">
              <option value="ALL">All Categories</option>
              ${categories.map(c => `<option value="${c}" ${this.currentCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>

            <select id="prod-stock-filter" onchange="ProductsComponent.filterStock(this.value)" class="flex-1 md:flex-initial bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-black font-medium focus:border-black">
              <option value="all" ${this.stockFilter === 'all' ? 'selected' : ''}>All Stock</option>
              <option value="low" ${this.stockFilter === 'low' ? 'selected' : ''}>Low Stock (≤ 20)</option>
              <option value="out" ${this.stockFilter === 'out' ? 'selected' : ''}>Out of Stock</option>
            </select>
          </div>
        </div>

        <!-- Product Catalog (Dual View: Mobile Cards & Desktop Table) -->
        <div class="app-card overflow-hidden">
          <!-- MOBILE CARDS VIEW (< md) -->
          <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
            ${products.length === 0 ? `
              <div class="py-12 text-center text-slate-400 text-xs">
                No products found matching your filter criteria.
              </div>
            ` : products.map(p => {
              const isLow = p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
              const isOut = p.stock_quantity === 0;
              const stockBadgeClass = isOut
                ? 'bg-zinc-100 text-black border border-black line-through font-bold'
                : (isLow ? 'bg-white text-black border-2 border-black font-black' : 'bg-black text-white font-bold');

              return `
                <div class="pt-3 first:pt-0 space-y-2.5">
                  <div class="flex items-start gap-3">
                    <img src="${p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}" class="w-14 h-14 rounded-xl object-cover border border-zinc-300 shrink-0" />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start justify-between gap-2">
                        <p class="font-bold text-black text-xs leading-tight line-clamp-2">${p.title}</p>
                        <span class="px-2 py-0.5 rounded-full text-[10px] shrink-0 ${stockBadgeClass}">
                          ${p.stock_quantity} left
                        </span>
                      </div>
                      <div class="flex items-center gap-2 mt-1 text-[11px]">
                        <span class="font-mono text-black font-bold">${p.sku}</span>
                        <span class="text-zinc-400">•</span>
                        <span class="text-zinc-600 font-medium">${p.category}</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                    <div>
                      <span class="text-[10px] text-zinc-500 uppercase block font-medium">Selling Price</span>
                      <span class="font-black font-mono text-black text-sm">${Utils.formatCurrency(p.price)}</span>
                    </div>
                    <div class="text-center">
                      <span class="text-[10px] text-zinc-500 uppercase block font-medium">Sourcing Cost</span>
                      <span class="font-mono text-zinc-600 text-xs font-semibold">${Utils.formatCurrency(p.cost_price)}</span>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] text-zinc-500 uppercase block font-medium">Gross Margin</span>
                      <span class="font-black text-black font-mono text-xs">${p.margin_percentage}% (+${Utils.formatCurrency(p.profit_per_unit)})</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-0.5">
                    <button onclick="ProductsComponent.openRestockModal(${p.id}, '${p.title.replace(/'/g, "\\'")}', ${p.stock_quantity})" class="flex-1 py-1.5 bg-white hover:bg-zinc-100 text-black border border-black rounded-lg text-xs font-bold text-center transition">
                      + Restock
                    </button>
                    <button onclick="ProductsComponent.openEditProductModal(${p.id})" class="flex-1 btn-secondary text-xs py-1.5 shadow-xs justify-center">
                      Edit Product
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- DESKTOP TABLE VIEW (>= md) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-zinc-100 border-b border-zinc-200 text-xs text-black uppercase font-bold tracking-wider">
                <tr>
                  <th class="py-3 px-4">Item & SKU</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Supplier</th>
                  <th class="py-3 px-4 text-right">Selling Price</th>
                  <th class="py-3 px-4 text-right">Sourcing Cost</th>
                  <th class="py-3 px-4 text-right">Gross Margin</th>
                  <th class="py-3 px-4 text-center">Stock</th>
                  <th class="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 text-xs">
                ${products.length === 0 ? `
                  <tr>
                    <td colspan="8" class="py-12 text-center text-zinc-400">
                      No products found matching your filter criteria.
                    </td>
                  </tr>
                ` : products.map(p => {
                  const isLow = p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
                  const isOut = p.stock_quantity === 0;
                  const stockBadgeClass = isOut
                    ? 'bg-zinc-100 text-black border border-black line-through font-bold'
                    : (isLow ? 'bg-white text-black border-2 border-black font-black' : 'bg-black text-white font-bold');

                  return `
                    <tr class="hover:bg-zinc-50 transition">
                      <td class="py-3 px-4 flex items-center gap-3">
                        <img src="${p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}" class="w-12 h-12 rounded-xl object-cover border border-zinc-300 shrink-0" />
                        <div>
                          <p class="font-bold text-black text-xs">${p.title}</p>
                          <span class="text-[11px] font-mono text-black font-bold">${p.sku}</span>
                          <span class="text-[10px] text-zinc-500 block">${p.brand}</span>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-zinc-700 font-medium">${p.category}</td>
                      <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-black font-medium">
                          ${p.supplier_name || 'CJ Dropshipping'}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-right font-black text-black font-mono">
                        ${Utils.formatCurrency(p.price)}
                        ${p.compare_price ? `<span class="text-[10px] text-zinc-400 line-through block font-normal">${Utils.formatCurrency(p.compare_price)}</span>` : ''}
                      </td>
                      <td class="py-3 px-4 text-right font-mono text-zinc-600 font-medium">${Utils.formatCurrency(p.cost_price)}</td>
                      <td class="py-3 px-4 text-right">
                        <span class="font-black text-black font-mono">${p.margin_percentage}%</span>
                        <span class="text-[10px] text-zinc-500 block font-mono">+${Utils.formatCurrency(p.profit_per_unit)}</span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] ${stockBadgeClass}">
                          ${p.stock_quantity}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center whitespace-nowrap">
                        <div class="flex items-center justify-center gap-1.5">
                          <button onclick="ProductsComponent.openRestockModal(${p.id}, '${p.title.replace(/'/g, "\\'")}', ${p.stock_quantity})" class="px-2.5 py-1 bg-white hover:bg-zinc-100 text-black border border-black rounded-lg text-xs font-bold transition">
                            + Restock
                          </button>
                          <button onclick="ProductsComponent.openEditProductModal(${p.id})" class="btn-secondary text-xs py-1 px-2.5 shadow-xs">
                            Edit
                          </button>
                        </div>
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
  },

  filterCategory(c) {
    this.currentCategory = c;
    this.render(document.getElementById('main-content'));
  },

  filterStock(s) {
    this.stockFilter = s;
    this.render(document.getElementById('main-content'));
  },

  search(q) {
    this.searchQuery = q.trim();
    this.render(document.getElementById('main-content'));
  },

  openRestockModal(productId, title, currentStock) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="app-card w-full max-w-md p-6 bg-white border border-black shadow-2xl">
        <h3 class="text-base font-bold text-black">Restock Product</h3>
        <p class="text-xs text-zinc-700 mt-1 font-medium">${title}</p>
        <p class="text-xs text-zinc-500 mt-0.5">Current Stock: <strong class="text-black font-mono font-black">${currentStock} units</strong></p>

        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-bold text-black mb-1">Quantity to Add (+)</label>
            <input type="number" id="restock-qty" value="50" min="1" class="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-black font-mono focus:border-black focus:ring-1 focus:ring-black" />
          </div>

          <div>
            <label class="block text-xs font-bold text-black mb-1">Reason / PO Reference</label>
            <input type="text" id="restock-reason" value="CJ Dropshipping Batch Sync" class="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-black focus:border-black focus:ring-1 focus:ring-black" />
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
          <button id="save-restock-btn" class="btn-primary text-xs shadow-xs">Confirm Restock</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#save-restock-btn').onclick = async () => {
      const adjustment = parseInt(modal.querySelector('#restock-qty').value) || 0;
      const reason = modal.querySelector('#restock-reason').value;

      try {
        await API.adjustStock(productId, { adjustment, reason });
        Utils.showToast(`Restocked ${adjustment} units successfully`);
        modal.remove();
        ProductsComponent.render(document.getElementById('main-content'));
      } catch (e) {
        Utils.showToast(e.message, 'error');
      }
    };
  },

  openAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="app-card w-full max-w-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Add Dropshipping Product</h3>
        <p class="text-xs text-slate-500 mt-0.5">Add a new viral item with supplier sourcing cost & margin computation.</p>

        <form id="add-prod-form" class="mt-4 space-y-3 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Product Title</label>
              <input type="text" name="title" required placeholder="e.g. Smart Visual Ear Cleaner" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">SKU</label>
              <input type="text" name="sku" placeholder="e.g. DS-EAR-02" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select name="category" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100">
                <option value="Tech & Gadgets">Tech & Gadgets</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Kitchen & Dining">Kitchen & Dining</option>
                <option value="Home Decor">Home Decor</option>
                <option value="Mobile Accessories">Mobile Accessories</option>
                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                <option value="Automotive & Tools">Automotive & Tools</option>
                <option value="Trending Viral">Trending Viral</option>
              </select>
            </div>
            <div>
              <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
              <select name="supplier_name" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100">
                <option value="CJ Dropshipping">CJ Dropshipping</option>
                <option value="AliExpress Direct">AliExpress Direct</option>
                <option value="Roposo Clout">Roposo Clout</option>
                <option value="Private Sourcing Agent">Private Sourcing Agent</option>
              </select>
            </div>
            <div>
              <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Brand</label>
              <input type="text" name="brand" value="LUISCART Tech" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div>
              <label class="block font-bold text-black mb-1">Selling Price (₹)</label>
              <input type="number" id="inp-price" name="price" required value="1499" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black font-mono" />
            </div>
            <div>
              <label class="block font-bold text-black mb-1">Supplier Cost (₹)</label>
              <input type="number" id="inp-cost" name="cost_price" required value="380" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black font-mono" />
            </div>
            <div>
              <label class="block font-medium text-zinc-500 mb-1">Compare MRP (₹)</label>
              <input type="number" name="compare_price" value="2499" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black font-mono" />
            </div>
          </div>

          <!-- Dynamic Margin Indicator -->
          <div id="margin-preview" class="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex justify-between items-center text-xs">
            <span class="text-zinc-700">Estimated Gross Margin:</span>
            <span class="font-black text-black font-mono text-sm">74.6% (+₹1,119 / unit)</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
              <input type="number" name="stock_quantity" value="200" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono" />
            </div>
            <div>
              <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Est. Ad Spend (CAC) (₹)</label>
              <input type="number" name="est_ad_spend" value="280" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono" />
            </div>
          </div>

          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
            <input type="url" name="image_url" value="https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100" />
          </div>

          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Product Description</label>
            <textarea name="description" rows="2" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100" placeholder="Product details, specs, viral features..."></textarea>
          </div>

          <div class="mt-5 flex justify-end gap-3 pt-2">
            <button type="button" onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
            <button type="submit" class="btn-primary text-xs shadow-sm">Save to Catalog</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const priceInp = modal.querySelector('#inp-price');
    const costInp = modal.querySelector('#inp-cost');
    const preview = modal.querySelector('#margin-preview');

    const updateMargin = () => {
      const p = parseFloat(priceInp.value) || 0;
      const c = parseFloat(costInp.value) || 0;
      if (p > 0) {
        const profit = p - c;
        const pct = ((profit / p) * 100).toFixed(1);
        preview.innerHTML = `
          <span class="text-zinc-700">Estimated Gross Margin:</span>
          <span class="font-black text-black font-mono text-sm">${pct}% (${profit >= 0 ? '+' : ''}${Utils.formatCurrency(profit)} / unit)</span>
        `;
      }
    };

    priceInp.oninput = updateMargin;
    costInp.oninput = updateMargin;

    modal.querySelector('#add-prod-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        await API.addProduct(data);
        Utils.showToast('Product added successfully');
        modal.remove();
        ProductsComponent.render(document.getElementById('main-content'));
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };
  },

  async openEditProductModal(productId) {
    try {
      const data = await API.getProducts({});
      const prod = data.products.find(p => p.id === productId);
      if (!prod) return;

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto';
      modal.innerHTML = `
        <div class="app-card w-full max-w-xl p-4 sm:p-6 bg-white border-2 border-black shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
          <h3 class="text-base font-black text-black">Edit Product: ${prod.title}</h3>

          <form id="edit-prod-form" class="mt-4 space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-black mb-1">Product Title</label>
                <input type="text" name="title" value="${prod.title}" required class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Category</label>
                <input type="text" name="category" value="${prod.category}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-black mb-1">Selling Price (₹)</label>
                <input type="number" name="price" value="${prod.price}" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black font-mono" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Sourcing Cost (₹)</label>
                <input type="number" name="cost_price" value="${prod.cost_price}" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black font-mono" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Compare Price (₹)</label>
                <input type="number" name="compare_price" value="${prod.compare_price || ''}" class="w-full bg-white border border-zinc-300 rounded-lg p-2 text-black font-mono" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-black mb-1">Image URL</label>
              <input type="url" name="image_url" value="${prod.image_url || ''}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black" />
            </div>

            <div class="mt-5 flex justify-end gap-3 pt-2">
              <button type="button" onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
              <button type="submit" class="btn-primary text-xs shadow-sm">Save Changes</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#edit-prod-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updateData = Object.fromEntries(formData.entries());

        try {
          await API.updateProduct(productId, updateData);
          Utils.showToast('Product updated successfully');
          modal.remove();
          ProductsComponent.render(document.getElementById('main-content'));
        } catch (err) {
          Utils.showToast(err.message, 'error');
        }
      };
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  },

  filterCategory(cat) {
    this.currentCategory = cat;
    this.render(document.getElementById('main-content'));
  },

  filterStock(stock) {
    this.stockFilter = stock;
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
  }
};
