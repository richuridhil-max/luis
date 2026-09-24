// LUISCART Clean & Simple Discounts & Coupon Engine Component

const DiscountsComponent = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const coupons = await API.getCoupons();
      this.renderView(container, coupons);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load coupons: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, coupons) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              Discounts & Promo Codes
            </h1>
            <p class="text-xs text-zinc-500">Manage promotional coupons, minimum cart thresholds, and customer checkout incentives.</p>
          </div>
          <button onclick="DiscountsComponent.openAddCouponModal()" class="btn-primary text-xs shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Create Promo Code
          </button>
        </div>

        <!-- Coupons Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${coupons.map(c => {
            const isActive = c.is_active === 1;
            return `
              <div class="app-card p-5 relative overflow-hidden ${isActive ? '' : 'opacity-60'}">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-black text-sm text-black tracking-wider px-2.5 py-1 bg-zinc-100 border border-black rounded-lg">
                    ${c.code}
                  </span>
                  <button onclick="DiscountsComponent.toggleStatus(${c.id})" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold transition ${isActive ? 'bg-black text-white' : 'bg-white border border-zinc-400 text-zinc-600'}">
                    ${isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div class="mt-4 space-y-1 text-xs text-zinc-700">
                  <p class="text-base font-black text-black">
                    ${c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : (c.discount_type === 'FIXED' ? `₹${c.discount_value} FLAT OFF` : 'FREE SHIPPING')}
                  </p>
                  <p class="text-zinc-600">Min. Order: <strong class="text-black">₹${c.min_order_value.toLocaleString('en-IN')}</strong></p>
                  <p class="text-zinc-600">Times Used: <strong class="text-black font-mono font-bold">${c.times_used}</strong> / ${c.usage_limit}</p>
                </div>

                <!-- Progress bar of usage -->
                <div class="mt-4 pt-3 border-t border-zinc-200">
                  <div class="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-black h-1.5 rounded-full" style="width: ${Math.min(100, (c.times_used / c.usage_limit) * 100)}%"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  async toggleStatus(id) {
    try {
      await API.toggleCoupon(id);
      Utils.showToast('Coupon status updated');
      this.render(document.getElementById('main-content'));
    } catch (e) {
      Utils.showToast(e.message, 'error');
    }
  },

  openAddCouponModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="app-card w-full max-w-md p-6 bg-white border-2 border-black shadow-2xl">
        <h3 class="text-base font-black text-black">Create Promo Code</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Define discounts for storefront shoppers.</p>

        <form id="add-coupon-form" class="mt-4 space-y-3 text-xs">
          <div>
            <label class="block font-bold text-black mb-1">Coupon Code (Uppercase)</label>
            <input type="text" name="code" required placeholder="e.g. FLASH20" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono uppercase focus:ring-1 focus:ring-black" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-black mb-1">Type</label>
              <select name="discount_type" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-black mb-1">Discount Value</label>
              <input type="number" name="discount_value" required value="10" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-black mb-1">Min Order Value (₹)</label>
              <input type="number" name="min_order_value" value="999" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
            </div>
            <div>
              <label class="block font-bold text-black mb-1">Usage Limit</label>
              <input type="number" name="usage_limit" value="500" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-3 pt-2">
            <button type="button" onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
            <button type="submit" class="btn-primary text-xs shadow-sm">Save Promo Code</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#add-coupon-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        await API.createCoupon(data);
        Utils.showToast(`Coupon ${data.code} created successfully`);
        modal.remove();
        DiscountsComponent.render(document.getElementById('main-content'));
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };
  }
};
