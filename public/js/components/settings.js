// LUISCART Clean & Simple Store Settings Component

const SettingsComponent = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const [settings, security] = await Promise.all([
        API.getSettings(),
        API.getSecurityStatus()
      ]);
      this.renderView(container, settings, security);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load settings: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, settings, security = {}) {
    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              Store Settings & Legal Identifiers
            </h1>
            <p class="text-xs text-zinc-500">Business registration, GSTIN, default tax rate, courier fee rules, and theme preferences.</p>
          </div>
        </div>

        <!-- Store Profile Form -->
        <div class="app-card p-4 sm:p-6">
          <h3 class="font-bold text-sm text-black mb-4 border-b border-zinc-200 pb-2">Business Profile & Tax Identifiers</h3>

          <form id="settings-form" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-black mb-1">Store Name</label>
                <input type="text" name="store_name" value="${settings.store_name || 'LUISCART'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-bold focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Brand Tagline</label>
                <input type="text" name="tagline" value="${settings.tagline || 'Modern Dropshipping'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black focus:ring-1 focus:ring-black" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-black mb-1">GSTIN Number</label>
                <input type="text" name="gstin" value="${settings.gstin || '27AABCL1234F1Z8'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Company PAN</label>
                <input type="text" name="pan" value="${settings.pan || 'AABCL1234F'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-black mb-1">Support Email</label>
                <input type="email" name="email" value="${settings.email || 'support@luiscart.com'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Support Phone</label>
                <input type="text" name="support_phone" value="${settings.support_phone || '+91 98200 12345'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-black mb-1">Dispatch / Fulfillment Address</label>
              <input type="text" name="address_line1" value="${settings.address_line1 || 'LUISCART Warehouse Hub, Lower Parel'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black focus:ring-1 focus:ring-black" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label class="block font-bold text-black mb-1">City</label>
                <input type="text" name="city" value="${settings.city || 'Mumbai'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">State</label>
                <input type="text" name="state" value="${settings.state || 'Maharashtra'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">PIN Code</label>
                <input type="text" name="postal_code" value="${settings.postal_code || '400013'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div>
                <label class="block font-bold text-black mb-1">Default GST Rate (%)</label>
                <input type="number" name="tax_rate_standard" value="${settings.tax_rate_standard || '18'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Standard Shipping Fee (₹)</label>
                <input type="number" name="shipping_fee_standard" value="${settings.shipping_fee_standard || '99'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono" />
              </div>
              <div>
                <label class="block font-bold text-black mb-1">Free Shipping Threshold (₹)</label>
                <input type="number" name="free_shipping_threshold" value="${settings.free_shipping_threshold || '999'}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono" />
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-zinc-200">
              <button type="submit" class="w-full sm:w-auto btn-primary text-xs py-2.5 px-4 justify-center shadow-sm">
                Save Store Settings
              </button>
            </div>
          </form>
        </div>

        <!-- Security & 4-Digit PIN Lock Management -->
        <div class="app-card p-4 sm:p-6 border-2 border-black bg-white">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                🔒
              </div>
              <div>
                <h3 class="font-black text-sm text-black">Store Security & 4-Digit PIN Lock</h3>
                <p class="text-xs text-zinc-500">Protect revenue figures, customer phone numbers, and margins from unauthorized access.</p>
              </div>
            </div>
            <div>
              ${security.isPinSet ? `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-black border border-black">
                  <span class="w-2 h-2 rounded-full bg-black"></span>
                  PIN Lock Active
                </span>
              ` : `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-300">
                  <span class="w-2 h-2 rounded-full bg-zinc-400"></span>
                  Not Configured
                </span>
              `}
            </div>
          </div>

          <div class="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onclick="AppLock.lock()"
              class="px-4 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
            >
              <span>🔒</span>
              <span>Lock Store Now</span>
            </button>

            ${security.isPinSet ? `
              <button
                type="button"
                onclick="AppLock.openChangePinModal()"
                class="px-4 py-2.5 bg-white border-2 border-black text-black hover:bg-zinc-100 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
              >
                <span>🔑</span>
                <span>Change 4-Digit PIN</span>
              </button>

              <button
                type="button"
                onclick="SettingsComponent.handleResetPin()"
                class="px-4 py-2.5 bg-white border border-zinc-300 text-zinc-700 hover:text-black hover:border-black rounded-xl text-xs font-bold transition shadow-xs"
              >
                Reset / Remove PIN
              </button>
            ` : `
              <button
                type="button"
                onclick="AppLock.showSetupScreen()"
                class="px-4 py-2.5 bg-white border-2 border-black text-black hover:bg-zinc-100 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
              >
                <span>✨</span>
                <span>Set Up 4-Digit PIN</span>
              </button>
            `}
          </div>
        </div>

        <!-- System Reset & Diagnostics -->
        <div class="app-card p-6 border-2 border-black bg-white">
          <h3 class="font-black text-sm text-black mb-1">Database & Operations Reset</h3>
          <p class="text-xs text-zinc-600 mb-4">Re-seed the SQLite database with viral dropshipping SKUs, orders, and clean test metrics.</p>

          <button onclick="SettingsComponent.resetDatabase()" class="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition shadow-sm">
            Re-Seed Sample Dropshipping Data
          </button>
        </div>
      </div>
    `;

    document.getElementById('settings-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        await API.updateSettings(data);
        Utils.showToast('Store settings saved successfully!');
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  async handleResetPin() {
    if (!confirm('Are you sure you want to reset and remove the 4-digit security PIN?')) return;
    try {
      await API.resetPin();
      sessionStorage.removeItem('luiscart_unlocked');
      Utils.showToast('Security PIN removed.', 'info');
      SettingsComponent.render(document.getElementById('main-content'));
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async resetDatabase() {
    if (!confirm('Are you sure you want to reset and re-seed the dropshipping database?')) return;
    try {
      await API.resetData();
      Utils.showToast('Database reset and seeded with winning dropship items!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      Utils.showToast('Failed to reset: ' + e.message, 'error');
    }
  }
};
