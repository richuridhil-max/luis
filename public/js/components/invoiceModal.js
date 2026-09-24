// LUISCART Tax Invoice Modal & Print Template

const InvoiceModal = {
  async show(orderId) {
    try {
      const order = await API.getOrder(orderId);
      const settings = await API.getSettings();
      this.renderModal(order, settings);
    } catch (e) {
      Utils.showToast('Failed to load invoice: ' + e.message, 'error');
    }
  },

  renderModal(order, settings) {
    const invoiceNum = 'INV-' + order.order_number.replace('#LC', '');
    const dateStr = Utils.formatDateOnly(order.created_at);

    // CGST and SGST split (9% each for standard 18% GST)
    const totalGst = order.tax_amount || 0;
    const cgst = Math.round(totalGst / 2);
    const sgst = totalGst - cgst;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="app-card w-full max-w-3xl my-3 sm:my-8 bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-2xl overflow-hidden print:shadow-none max-h-[95vh] overflow-y-auto">
        <!-- Modal Toolbar (Hidden on Print) -->
        <div class="no-print bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-bold text-white text-sm truncate">LUISCART Invoice</span>
            <span class="text-xs text-slate-400 font-mono hidden sm:inline">${invoiceNum}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="window.print()" class="btn-primary px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              <span>Print / PDF</span>
            </button>
            <button onclick="this.closest('.fixed').remove()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold">
              ✕
            </button>
          </div>
        </div>

        <!-- Printable Invoice Sheet -->
        <div id="printable-area" class="p-4 sm:p-8 bg-white text-slate-800 text-xs">
          <!-- Top Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-5 sm:pb-6">
            <div>
              <div class="flex items-center gap-3">
                <img src="/assets/luiscart-logo.png" class="h-12 sm:h-14 w-auto object-contain rounded" alt="LUISCART" />
              </div>
              <p class="font-bold text-sm sm:text-base tracking-wide text-slate-900 mt-2 uppercase">LUISCART RETAIL VENTURES PRIVATE LIMITED</p>
              <p class="text-slate-600 text-[11px] max-w-sm mt-0.5">${settings.address_line1 || 'High Street Phoenix, Lower Parel'}, ${settings.city || 'Mumbai'}, ${settings.state || 'Maharashtra'} - ${settings.postal_code || '400013'}</p>
              <p class="text-slate-600 text-[11px] mt-1 font-mono"><strong>GSTIN:</strong> ${settings.gstin || '27AABCL1234F1Z8'} | <strong>PAN:</strong> ${settings.pan || 'AABCL1234F'}</p>
              <p class="text-slate-600 text-[11px] font-mono"><strong>Email:</strong> ${settings.email || 'concierge@luiscart.com'}</p>
            </div>

            <div class="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <span class="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider rounded">TAX INVOICE</span>
              <p class="font-mono text-base font-bold text-slate-900 mt-2 sm:mt-3">${invoiceNum}</p>
              <p class="text-slate-600 mt-1">Invoice Date: <strong>${dateStr}</strong></p>
              <p class="text-slate-600">Order ID: <strong class="font-mono">${order.order_number}</strong></p>
              <p class="text-slate-600">Payment: <strong>${order.payment_method} (${order.payment_status})</strong></p>
            </div>
          </div>

          <!-- Billing & Shipping Information -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 my-5 sm:my-6">
            <div class="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
              <h4 class="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 border-b pb-1">Billed To:</h4>
              <p class="font-bold text-slate-900 text-sm">${order.customer_name}</p>
              <p class="text-slate-600 mt-1">${order.billing_address || order.shipping_address}</p>
              <p class="text-slate-600 mt-1 font-mono">Phone: ${order.customer_phone}</p>
              <p class="text-slate-600 font-mono">Email: ${order.customer_email}</p>
            </div>

            <div class="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
              <h4 class="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 border-b pb-1">Shipped To:</h4>
              <p class="font-bold text-slate-900 text-sm">${order.customer_name}</p>
              <p class="text-slate-600 mt-1">${order.shipping_address}</p>
              <p class="text-slate-600 mt-1 font-mono">Courier: <strong>${order.courier_partner || 'Surface Delivery'}</strong></p>
              <p class="text-slate-600 font-mono">AWB: <strong>${order.tracking_number || 'Pending'}</strong></p>
            </div>
          </div>

          <!-- Items Table -->
          <div class="overflow-x-auto mb-6">
            <table class="w-full text-left border border-slate-200 text-xs">
            <thead class="bg-black text-white font-bold uppercase text-[10px]">
              <tr>
                <th class="py-2.5 px-3">#</th>
                <th class="py-2.5 px-3">Item Description</th>
                <th class="py-2.5 px-3 font-mono">HSN Code</th>
                <th class="py-2.5 px-3 text-right">Qty</th>
                <th class="py-2.5 px-3 text-right">Unit Price</th>
                <th class="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${order.items.map((item, idx) => `
                <tr class="hover:bg-slate-50">
                  <td class="py-2 px-3 text-slate-500 font-mono">${idx + 1}</td>
                  <td class="py-2 px-3">
                    <p class="font-bold text-slate-900">${item.title}</p>
                    <span class="text-[10px] text-slate-500 font-mono">SKU: ${item.sku}</span>
                  </td>
                  <td class="py-2 px-3 font-mono text-slate-600">9102.11</td>
                  <td class="py-2 px-3 text-right font-bold text-slate-800">${item.quantity}</td>
                  <td class="py-2 px-3 text-right font-mono text-slate-800">${Utils.formatCurrency(item.price)}</td>
                  <td class="py-2 px-3 text-right font-mono font-bold text-slate-900">${Utils.formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          </div>

          <!-- Financial Calculation Table -->
          <div class="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-8">
            <div class="text-[11px] text-slate-600 space-y-1">
              <p class="font-bold text-slate-900 uppercase">Declaration & Terms:</p>
              <p>1. Certified that all particulars and goods values mentioned are true and correct.</p>
              <p>2. Goods once sold are covered under LUISCART 14-day warranty guarantee.</p>
              <p>3. This is an authentic computer generated tax invoice requiring no physical signature.</p>
              <div class="mt-4 pt-3 flex items-center gap-3">
                <div class="w-16 h-16 border-2 border-slate-900 p-1 flex items-center justify-center font-mono text-[9px] text-center font-bold">
                  LUISCART<br>VERIFIED
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-900">Digitally Signed By:</p>
                  <p class="text-[10px] text-slate-700">LUISCART Dispatch Hub</p>
                  <p class="text-[9px] text-slate-500 font-mono">${order.order_number} • ${dateStr}</p>
                </div>
              </div>
            </div>

            <div class="w-full sm:w-72 bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal (Gross Value):</span>
                <span class="font-mono">${Utils.formatCurrency(order.subtotal)}</span>
              </div>
              ${order.discount_amount > 0 ? `
                <div class="flex justify-between text-black font-bold">
                  <span>Discount Applied (${order.discount_code || 'Promo'}):</span>
                  <span class="font-mono">- ${Utils.formatCurrency(order.discount_amount)}</span>
                </div>
              ` : ''}
              <div class="flex justify-between text-slate-600">
                <span>CGST (9%):</span>
                <span class="font-mono">${Utils.formatCurrency(cgst)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>SGST (9%):</span>
                <span class="font-mono">${Utils.formatCurrency(sgst)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Shipping & Insurance:</span>
                <span class="font-mono">${order.shipping_fee > 0 ? Utils.formatCurrency(order.shipping_fee) : 'FREE'}</span>
              </div>
              <div class="flex justify-between pt-2 border-t-2 border-slate-900 font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span class="font-mono text-base">${Utils.formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
};
