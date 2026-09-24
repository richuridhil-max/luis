// LUISCART Shipping Label (4x6 Thermal Format)

const ShippingLabelModal = {
  async show(orderId) {
    try {
      const order = await API.getOrder(orderId);
      this.renderModal(order);
    } catch (e) {
      Utils.showToast('Failed to load shipping label: ' + e.message, 'error');
    }
  },

  renderModal(order) {
    const courier = order.courier_partner || 'Bluedart Express';
    const awb = order.tracking_number || `BD${Math.floor(10000000 + Math.random() * 90000000)}IN`;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="app-card w-full max-w-md my-4 sm:my-8 bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-2xl overflow-hidden print:shadow-none max-h-[95vh] overflow-y-auto">
        <!-- Toolbar (Hidden on Print) -->
        <div class="no-print bg-slate-900 text-white p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between">
          <span class="font-bold text-white text-sm">4x6 Shipping Label</span>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="btn-primary px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow">
              Print Label
            </button>
            <button onclick="this.closest('.fixed').remove()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold">
              ✕
            </button>
          </div>
        </div>

        <!-- Printable 4x6 Label Area -->
        <div id="printable-area" class="p-4 sm:p-6 bg-white text-slate-900 font-mono text-xs border-2 border-black m-1 sm:m-2 rounded">
          <!-- Carrier Header -->
          <div class="flex justify-between items-center border-b-2 border-black pb-3">
            <div>
              <span class="text-lg sm:text-xl font-extrabold tracking-wider uppercase">${courier}</span>
              <p class="text-[10px] font-sans font-bold text-slate-600">EXPRESS SURFACE / AIR PRIORITY</p>
            </div>
            <div class="text-right">
              <span class="text-xs sm:text-sm font-bold bg-black text-white px-2 py-0.5 rounded">AIR</span>
              <p class="text-[10px] mt-0.5">BOM / DEL-04</p>
            </div>
          </div>

          <!-- Barcode Visual Placeholder -->
          <div class="my-3 sm:my-4 text-center">
            <div class="h-12 sm:h-14 w-full flex items-center justify-center tracking-[4px] font-extrabold text-xl sm:text-2xl select-none" style="letter-spacing: 4px; font-family: 'Courier New', monospace;">
              ||| | |||| || | ||||| || ||| | |||
            </div>
            <p class="text-xs font-bold tracking-widest mt-1">AWB: ${awb}</p>
          </div>

          <!-- Destination Consignee Details -->
          <div class="border-t-2 border-b-2 border-black py-2.5 sm:py-3 my-2 space-y-1">
            <p class="text-[10px] uppercase font-sans font-bold text-slate-600">DELIVER TO (CONSIGNEE):</p>
            <p class="text-sm font-extrabold font-sans">${order.customer_name}</p>
            <p class="font-sans text-xs">${order.shipping_address}</p>
            <p class="text-xs font-bold mt-1">TEL: ${order.customer_phone}</p>
          </div>

          <!-- Shipper Return Address & Package Specs -->
          <div class="grid grid-cols-2 gap-2 text-[10px] pt-1">
            <div>
              <p class="uppercase font-sans font-bold text-slate-600">SHIPPER (RETURN ADDRESS):</p>
              <p class="font-bold">LUISCART LOGISTICS HUB</p>
              <p>Warehouse C-12, Lower Parel</p>
              <p>Mumbai, MH - 400013</p>
              <p>Ph: +91 98200 12345</p>
            </div>

            <div class="text-right space-y-1">
              <p><strong>Order #:</strong> ${order.order_number}</p>
              <p><strong>Payment:</strong> ${order.payment_status === 'PAID' ? 'PREPAID' : 'COD'}</p>
              <p><strong>Weight:</strong> 1.25 KG</p>
              <p><strong>Pieces:</strong> 1 Box (Sealed)</p>
              <p><strong>Value:</strong> ₹${order.total_amount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <!-- Security Footer -->
          <div class="border-t border-black pt-2 mt-3 flex justify-between items-center text-[9px]">
            <span>LUISCART E-COMMERCE LOGISTICS</span>
            <span class="font-bold">DO NOT ACCEPT IF TAMPERED</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
};
