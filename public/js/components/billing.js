// LUISCART Clean & Simple Financials, P&L & Billing Component

const BillingComponent = {
  currentTab: 'pnl',

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const [pnl, invoices] = await Promise.all([
        API.getProfitAndLoss('30d'),
        API.getInvoices()
      ]);
      this.renderView(container, { pnl, invoices });
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white border-2 border-black rounded-xl text-black">
          <p>Failed to load financial ledger: ${err.message}</p>
        </div>
      `;
    }
  },

  renderView(container, { pnl, invoices }) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Financials & P&L Statement
            </h1>
            <p class="text-xs text-slate-500">Live dropshipping Profit & Loss, ad spend overheads, RTO loss ledger, and GST invoicing.</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="BillingComponent.openAddExpenseModal()" class="btn-primary text-xs shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              Log Operating Expense
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto whitespace-nowrap">
          <button onclick="BillingComponent.switchTab('pnl')" class="px-3.5 sm:px-4 py-2 rounded-xl transition shrink-0 ${this.currentTab === 'pnl' ? 'bg-black text-white font-bold shadow-xs' : 'text-slate-700 hover:text-black hover:bg-slate-100'}">
            P&L Statement
          </button>
          <button onclick="BillingComponent.switchTab('invoices')" class="px-3.5 sm:px-4 py-2 rounded-xl transition shrink-0 ${this.currentTab === 'invoices' ? 'bg-black text-white font-bold shadow-xs' : 'text-slate-700 hover:text-black hover:bg-slate-100'}">
            Tax Invoices (${invoices.length})
          </button>
          <button onclick="BillingComponent.switchTab('expenses')" class="px-3.5 sm:px-4 py-2 rounded-xl transition shrink-0 ${this.currentTab === 'expenses' ? 'bg-black text-white font-bold shadow-xs' : 'text-slate-700 hover:text-black hover:bg-slate-100'}">
            Operating Expenses (${pnl.expensesList ? pnl.expensesList.length : 0})
          </button>
        </div>

        <!-- Dynamic Tab Content -->
        <div id="billing-tab-content">
          ${this.currentTab === 'pnl' ? this.renderPnlTab(pnl) : (this.currentTab === 'invoices' ? this.renderInvoicesTab(invoices) : this.renderExpensesTab(pnl))}
        </div>
      </div>
    `;

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render(document.getElementById('main-content'));
  },

  renderPnlTab(pnl) {
    return `
      <div class="space-y-6">
        <!-- Top Metrics -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div class="app-card p-3.5 sm:p-5">
            <span class="text-[11px] sm:text-xs text-zinc-500 font-bold uppercase">Gross Revenue</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${Utils.formatCurrency(pnl.grossSales)}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5">${pnl.paidOrdersCount} Paid Orders</p>
          </div>

          <div class="app-card p-3.5 sm:p-5">
            <span class="text-[11px] sm:text-xs text-black font-bold uppercase">Gross Profit</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${Utils.formatCurrency(pnl.grossProfit)}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5">${pnl.grossMarginPct}% Margin</p>
          </div>

          <div class="app-card p-3.5 sm:p-5">
            <span class="text-[11px] sm:text-xs text-black font-bold uppercase">Net Dropship Profit</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${Utils.formatCurrency(pnl.netProfit)}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5">${pnl.netMarginPct}% Net Bottom-Line</p>
          </div>

          <div class="app-card p-3.5 sm:p-5">
            <span class="text-[11px] sm:text-xs text-black font-bold uppercase">GST Collected</span>
            <p class="text-xl sm:text-2xl font-black text-black mt-1 font-mono">${Utils.formatCurrency(pnl.gstCollected)}</p>
            <p class="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">18% GST Ledger</p>
          </div>
        </div>

        <!-- Full P&L Breakdown Table -->
        <div class="app-card p-4 sm:p-6">
          <h3 class="font-bold text-base text-black mb-4">Dropshipping P&L Statement (INR ₹)</h3>

          <div class="space-y-3 divide-y divide-zinc-200 text-sm">
            <!-- Revenue -->
            <div class="pt-2 flex justify-between items-center text-zinc-800">
              <span class="font-bold">Gross Customer Sales</span>
              <span class="font-mono font-black text-black">${Utils.formatCurrency(pnl.grossSales)}</span>
            </div>
            <div class="pt-2 flex justify-between items-center text-zinc-700">
              <span>Less: Promo Discounts & Coupons Given</span>
              <span class="font-mono font-bold text-black">- ${Utils.formatCurrency(pnl.discountsGiven)}</span>
            </div>
            <div class="pt-2 flex justify-between items-center font-bold text-black bg-zinc-100 p-2.5 rounded-lg border border-zinc-200">
              <span>Net Sales Revenue</span>
              <span class="font-mono text-base font-black">${Utils.formatCurrency(pnl.netSales)}</span>
            </div>

            <!-- COGS -->
            <div class="pt-2 flex justify-between items-center text-zinc-700">
              <span>Less: Supplier Product Sourcing Costs (CJ / 3PL COGS)</span>
              <span class="font-mono font-bold text-black">- ${Utils.formatCurrency(pnl.cogs)}</span>
            </div>
            <div class="pt-2 flex justify-between items-center font-bold text-black bg-zinc-100 p-2.5 rounded-lg border border-zinc-200">
              <span>Gross Profit (Margin: ${pnl.grossMarginPct}%)</span>
              <span class="font-mono text-base font-black">${Utils.formatCurrency(pnl.grossProfit)}</span>
            </div>

            <!-- Operating Expenses -->
            <div class="pt-2 space-y-1.5 pl-4 text-xs text-zinc-700">
              <p class="font-bold text-black text-sm -ml-4 pt-2">Operating Expenses Breakdown:</p>
              ${pnl.expensesByCategory.map(exp => `
                <div class="flex justify-between">
                  <span>● ${exp.category}</span>
                  <span class="font-mono text-black font-semibold">- ${Utils.formatCurrency(exp.total)}</span>
                </div>
              `).join('')}
            </div>

            <div class="pt-2 flex justify-between items-center text-zinc-800 font-bold">
              <span>Total Operating Expenses</span>
              <span class="font-mono font-black text-black">- ${Utils.formatCurrency(pnl.totalOperatingExpenses)}</span>
            </div>

            <!-- Final Net Profit -->
            <div class="pt-4 flex justify-between items-center font-black text-base text-black bg-zinc-100 p-4 rounded-xl border border-black">
              <span>Net Profit (Bottom Line)</span>
              <span class="font-mono text-xl font-black text-black">${Utils.formatCurrency(pnl.netProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderInvoicesTab(invoices) {
    return `
      <div class="app-card overflow-hidden">
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm">Tax Invoices Directory</h3>
            <p class="text-xs text-slate-500">GST compliant tax invoices for all settled client orders</p>
          </div>
        </div>

        <!-- MOBILE CARDS VIEW (< md) -->
        <div class="md:hidden divide-y divide-zinc-200 p-3 space-y-3">
          ${invoices.length === 0 ? `
            <div class="py-12 text-center text-zinc-400 text-xs">No invoices found.</div>
          ` : invoices.map(inv => `
            <div class="pt-3 first:pt-0 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="font-mono font-bold text-black text-xs">${inv.invoice_number}</span>
                  <span class="text-zinc-500 text-[11px] block font-mono">Order: ${inv.order_number}</span>
                </div>
                <span class="text-[11px] text-zinc-500 font-mono">${Utils.formatDateOnly(inv.created_at)}</span>
              </div>

              <div class="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                <div>
                  <p class="font-bold text-black">${inv.customer_name}</p>
                  <span class="text-[10px] text-zinc-500 font-mono">${inv.customer_email}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-zinc-500 uppercase block font-medium">Total</span>
                  <span class="font-mono font-black text-black text-sm">${Utils.formatCurrency(inv.total_amount)}</span>
                </div>
              </div>

              <div class="pt-1">
                <button onclick="InvoiceModal.show(${inv.id})" class="w-full btn-secondary text-xs py-1.5 shadow-sm justify-center">
                  View / Print Invoice
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
                <th class="py-3 px-4">Invoice #</th>
                <th class="py-3 px-4">Order #</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Billed To</th>
                <th class="py-3 px-4 text-right">Taxable Value</th>
                <th class="py-3 px-4 text-right">GST (18%)</th>
                <th class="py-3 px-4 text-right">Total (INR)</th>
                <th class="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 text-xs">
              ${invoices.map(inv => `
                <tr class="hover:bg-zinc-50">
                  <td class="py-3 px-4 font-mono font-bold text-black">${inv.invoice_number}</td>
                  <td class="py-3 px-4 font-mono text-zinc-700">${inv.order_number}</td>
                  <td class="py-3 px-4 text-zinc-500 font-mono">${Utils.formatDateOnly(inv.created_at)}</td>
                  <td class="py-3 px-4">
                    <p class="font-bold text-black">${inv.customer_name}</p>
                    <span class="text-[10px] text-zinc-500 font-mono">${inv.customer_email}</span>
                  </td>
                  <td class="py-3 px-4 text-right font-mono text-zinc-700">${Utils.formatCurrency(inv.subtotal - inv.discount_amount)}</td>
                  <td class="py-3 px-4 text-right font-mono text-black font-semibold">${Utils.formatCurrency(inv.tax_amount)}</td>
                  <td class="py-3 px-4 text-right font-mono font-black text-black">${Utils.formatCurrency(inv.total_amount)}</td>
                  <td class="py-3 px-4 text-center">
                    <button onclick="InvoiceModal.show(${inv.id})" class="btn-secondary text-xs py-1 px-2.5 shadow-sm">
                      View / Print
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderExpensesTab(pnl) {
    const list = pnl.expensesList || [];
    return `
      <div class="app-card overflow-hidden">
        <div class="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-black text-sm">Operating Expenses Log</h3>
            <p class="text-xs text-zinc-500">Ad spend (Meta/Google), influencer UGC, WhatsApp bot & carrier RTO losses</p>
          </div>
          <button onclick="BillingComponent.openAddExpenseModal()" class="btn-primary text-xs shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add Expense
          </button>
        </div>

        <!-- MOBILE CARDS VIEW (< md) -->
        <div class="md:hidden divide-y divide-zinc-200 p-3 space-y-3">
          ${list.length === 0 ? `
            <div class="py-12 text-center text-zinc-400 text-xs">No expenses logged.</div>
          ` : list.map(exp => `
            <div class="pt-3 first:pt-0 space-y-1.5">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="font-bold text-black text-xs">${exp.title}</h4>
                  <span class="text-[10px] text-zinc-500 font-mono">${exp.date}</span>
                </div>
                <span class="font-mono font-bold text-black text-xs">${Utils.formatCurrency(exp.amount)}</span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-zinc-500">
                <span class="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-black font-semibold text-[10px]">${exp.category}</span>
                <span>${exp.notes || '—'}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- DESKTOP TABLE VIEW (>= md) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 uppercase tracking-wider font-bold">
              <tr>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Title & Description</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Notes</th>
                <th class="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 text-xs">
              ${list.map(exp => `
                <tr class="hover:bg-zinc-50">
                  <td class="py-3 px-4 font-mono text-zinc-600">${exp.date}</td>
                  <td class="py-3 px-4 font-bold text-black">${exp.title}</td>
                  <td class="py-3 px-4"><span class="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-black font-semibold">${exp.category}</span></td>
                  <td class="py-3 px-4 text-zinc-600">${exp.notes || '—'}</td>
                  <td class="py-3 px-4 text-right font-mono font-black text-black">${Utils.formatCurrency(exp.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openAddExpenseModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="app-card w-full max-w-md p-6 bg-white border-2 border-black shadow-2xl">
        <h3 class="text-base font-black text-black">Log Business Expense</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Records against dropshipping P&L to compute net profit.</p>

        <form id="add-expense-form" class="mt-4 space-y-3 text-xs">
          <div>
            <label class="block font-bold text-black mb-1">Expense Title</label>
            <input type="text" name="title" required placeholder="e.g. Meta Ads Instagram Reels Campaign" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black focus:ring-1 focus:ring-black" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-black mb-1">Category</label>
              <select name="category" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black">
                <option value="Ad Spend">Ad Spend (Meta/Google)</option>
                <option value="Marketing">Marketing / UGC</option>
                <option value="RTO Loss">RTO Loss / Couriers</option>
                <option value="Software">Software (WhatsApp Bot)</option>
                <option value="Platform Fee">Platform Fee (Shopify/CDN)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-black mb-1">Amount (₹)</label>
              <input type="number" name="amount" required placeholder="15000" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-black mb-1">Date Incurred</label>
            <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black font-mono focus:ring-1 focus:ring-black" />
          </div>

          <div>
            <label class="block font-bold text-black mb-1">Audit Notes</label>
            <textarea name="notes" rows="2" class="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-black" placeholder="Campaign ID, vendor reference..."></textarea>
          </div>

          <div class="mt-5 flex justify-end gap-3 pt-2">
            <button type="button" onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">Cancel</button>
            <button type="submit" class="btn-primary text-xs shadow-sm">Record Expense</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#add-expense-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        await API.addExpense(data);
        Utils.showToast('Expense logged successfully');
        modal.remove();
        BillingComponent.render(document.getElementById('main-content'));
      } catch (err) {
        Utils.showToast(err.message, 'error');
      }
    };
  }
};
