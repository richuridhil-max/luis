// LUISCART Clean & Simple Dropshipping Operations Dashboard

const DashboardComponent = {
  currentPeriod: '30d',
  revenueChartInstance: null,
  orderChartInstance: null,

  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    `;

    try {
      const data = await API.getDashboard(this.currentPeriod);
      this.renderView(container, data);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-zinc-100 border border-black rounded-xl text-black">
          <p class="font-bold">Failed to load dropshipping metrics.</p>
          <p class="text-sm mt-1 text-zinc-600">${err.message}</p>
          <button onclick="DashboardComponent.render(document.getElementById('main-content'))" class="mt-4 px-4 py-2 bg-black hover:bg-zinc-800 rounded-lg text-white font-bold text-sm">Retry</button>
        </div>
      `;
    }
  },

  renderView(container, data) {
    const kpis = data.kpis;
    const orderAnalytics = data.orderAnalytics;
    const inv = data.inventoryStatus;
    const cust = data.customerAnalytics;

    container.innerHTML = `
      <div class="space-y-6">

        <!-- 1. Header & Period Switcher -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-black flex items-center gap-2">
              <span>Operations Dashboard</span>
              <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-black text-white font-bold border border-black">Live Sync</span>
            </h1>
            <p class="text-xs text-zinc-600 mt-1">Real-time revenue, ad spend (Meta/Google), blended ROAS, sourcing costs & RTO protection.</p>
          </div>

          <!-- Segmented Period Switcher (Clean & Uncluttered) -->
          <div class="inline-flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-300 text-xs">
            ${this.renderPeriodButton('today', 'Today')}
            ${this.renderPeriodButton('7d', '7 Days')}
            ${this.renderPeriodButton('30d', '30 Days')}
            ${this.renderPeriodButton('this_year', 'This Year')}
          </div>
        </div>

        <!-- 2. Core Dropshipping KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <!-- 1. Total Revenue -->
          ${this.renderKpiCard({
            title: 'Total Revenue',
            value: Utils.formatCurrency(kpis.totalRevenue.value),
            subtext: `${this.renderTrendBadge(kpis.totalRevenue.percentChange)} vs previous period`,
            icon: 'banknote',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}

          <!-- 2. Ad Spend -->
          ${this.renderKpiCard({
            title: 'Ad Spend (Meta/Google)',
            value: Utils.formatCurrency(kpis.adSpend.value),
            subtext: `${this.renderTrendBadge(kpis.adSpend.percentChange)} marketing spend`,
            icon: 'flame',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}

          <!-- 3. Blended ROAS -->
          ${this.renderKpiCard({
            title: 'Blended ROAS',
            value: (kpis.roas.value || 0) + 'x',
            subtext: `<span class="text-black font-bold">${kpis.roas.value >= 2.0 ? 'Profitable Scale' : 'Optimizing'}</span> • Target: 3.5x`,
            icon: 'trending-up',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}

          <!-- 4. Supplier COGS -->
          ${this.renderKpiCard({
            title: 'Supplier COGS',
            value: Utils.formatCurrency(kpis.supplierCogs.value),
            subtext: `Direct CJ / 3PL sourcing cost`,
            icon: 'truck',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}

          <!-- 5. Net Dropship Profit -->
          ${this.renderKpiCard({
            title: 'Net Profit (After Ads)',
            value: Utils.formatCurrency(kpis.estimatedProfit.value),
            subtext: `After Ad Spend, COGS & RTOs`,
            icon: 'coins',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}

          <!-- 6. Total Orders -->
          ${this.renderKpiCard({
            title: 'Total Orders',
            value: Utils.formatNumber(kpis.totalOrders.value) + ' orders',
            subtext: `<span class="text-black font-bold">${kpis.totalOrders.prepaidCount || 0} Prepaid</span> • <span class="text-black font-bold">${kpis.totalOrders.codCount || 0} COD</span>`,
            icon: 'shopping-bag',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}

          <!-- 7. RTO Rate % -->
          ${this.renderKpiCard({
            title: 'RTO Rate %',
            value: (kpis.rtoRate.value || 0) + '%',
            subtext: `<span class="font-bold text-black">${kpis.rtoRate.rtoCount || 0} Returns</span> to Origin`,
            icon: 'rotate-ccw',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}

          <!-- 8. Pending COD Remittance -->
          ${this.renderKpiCard({
            title: 'Pending COD Cash',
            value: Utils.formatCurrency(kpis.pendingPayments.value),
            subtext: `Awaiting courier remittance`,
            icon: 'clock',
            colorClass: 'text-black bg-zinc-100 border border-zinc-200'
          })}
        </div>

        <!-- 5. Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 app-card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-base text-black flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-black"></span>
                  Revenue & Sales Trend
                </h3>
                <p class="text-xs text-zinc-500">Daily gross revenue vs net sales after discounts</p>
              </div>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-black">
                ${data.revenueTrend.length} Days Activity
              </span>
            </div>
            <div class="h-72 w-full relative">
              <canvas id="revenueChart"></canvas>
            </div>
          </div>

          <div class="app-card p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-base text-black flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-black"></span>
                  Order Funnel Status
                </h3>
                <span class="text-xs text-zinc-500">Fulfillment Pipeline</span>
              </div>
              <div class="h-56 relative flex items-center justify-center">
                <canvas id="orderStatusChart"></canvas>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-200 text-xs">
              <div class="flex justify-between items-center py-1">
                <span class="text-black font-bold">● Delivered</span>
                <span class="font-black text-black">${orderAnalytics.DELIVERED.count}</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-zinc-700 font-semibold">● Shipped</span>
                <span class="font-black text-black">${orderAnalytics.SHIPPED.count}</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-zinc-600 font-semibold">● Processing</span>
                <span class="font-black text-black">${orderAnalytics.PROCESSING.count}</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-zinc-500 font-semibold">● Returned / RTO</span>
                <span class="font-black text-black">${orderAnalytics.RETURNED.count}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. Winning Products & Delivery Health -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 app-card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-base text-black">Winning Viral Dropship Products</h3>
                <p class="text-xs text-zinc-500">Top revenue generating items, volume sold, supplier source & margins</p>
              </div>
              <button onclick="App.navigate('products')" class="text-xs text-black hover:underline font-bold">View Catalog →</button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr class="text-xs text-black border-b border-zinc-200 pb-2">
                    <th class="py-2.5 font-bold">Product</th>
                    <th class="py-2.5 font-bold">Supplier</th>
                    <th class="py-2.5 font-bold text-right">Units Sold</th>
                    <th class="py-2.5 font-bold text-right">Revenue</th>
                    <th class="py-2.5 font-bold text-right">Gross Profit</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200">
                  ${data.topProducts.map(p => `
                    <tr class="hover:bg-zinc-50 transition">
                      <td class="py-3 flex items-center gap-3">
                        <img src="${p.image_url}" class="w-10 h-10 rounded-lg object-cover border border-zinc-300 shrink-0" />
                        <div>
                          <p class="font-bold text-black line-clamp-1">${p.title}</p>
                          <span class="text-xs text-zinc-600 font-mono">${p.sku}</span>
                        </div>
                      </td>
                      <td class="py-3 text-xs">
                        <span class="px-2 py-0.5 rounded bg-zinc-100 text-black border border-zinc-200 font-semibold">
                          ${p.supplier_name || 'CJ Dropshipping'}
                        </span>
                      </td>
                      <td class="py-3 text-right font-bold text-black font-mono">${p.units_sold}</td>
                      <td class="py-3 text-right font-bold text-black font-mono">${Utils.formatCurrency(p.total_revenue)}</td>
                      <td class="py-3 text-right font-bold text-black font-mono">
                        ${Utils.formatCurrency(p.gross_profit)}
                        <span class="text-[10px] block text-zinc-500 font-normal">${p.margin_pct}% margin</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- COD Protection & Courier Health -->
          <div class="app-card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-base text-black">COD & Delivery Health</h3>
                <p class="text-xs text-zinc-500">Protection from RTO returns</p>
              </div>
              <button onclick="OrdersComponent.filterStatus('NEW'); App.navigate('orders')" class="text-xs text-black hover:underline font-bold">Pending COD →</button>
            </div>

            <div class="space-y-4">
              <div class="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex justify-between items-center">
                <div>
                  <span class="text-xs text-zinc-500 font-medium">COD Share</span>
                  <p class="text-xl font-black text-black font-mono">${Math.round(((kpis.totalOrders.codCount || 0) / (kpis.totalOrders.value || 1)) * 100)}%</p>
                </div>
                <div class="text-right">
                  <span class="text-xs text-zinc-500 font-medium">Prepaid Share</span>
                  <p class="text-xl font-black text-black font-mono">${Math.round(((kpis.totalOrders.prepaidCount || 0) / (kpis.totalOrders.value || 1)) * 100)}%</p>
                </div>
              </div>

              <div>
                <h4 class="text-xs uppercase tracking-wider text-black font-bold mb-2">Active Courier Partners</h4>
                <div class="space-y-2 text-xs">
                  <div class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span class="font-bold text-black">Delhivery Surface</span>
                    <span class="text-black font-mono font-bold">Fastest (24h)</span>
                  </div>
                  <div class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span class="font-bold text-black">Bluedart Air Express</span>
                    <span class="text-black font-mono font-bold">Priority Air</span>
                  </div>
                  <div class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span class="font-bold text-black">Shadowfax & XpressBees</span>
                    <span class="text-zinc-600 font-mono font-semibold">Standard Metro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. Recent Transactions (Mobile Cards + Desktop Table) -->
        <div class="app-card p-4 sm:p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-base text-black">Live Dropshipping Orders</h3>
              <p class="text-xs text-zinc-500">Real-time incoming orders with COD verification & supplier fulfillment</p>
            </div>
            <button onclick="App.navigate('orders')" class="btn-secondary text-xs shadow-xs">
              All Orders →
            </button>
          </div>

          <!-- Mobile Cards View (< md) -->
          <div class="md:hidden divide-y divide-zinc-200 -mx-4">
            ${data.recentTransactions.map(tx => `
              <div class="p-3.5 space-y-2 hover:bg-zinc-50 transition cursor-pointer" onclick="App.openOrderDetails(${tx.id})">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-black text-xs text-black">${tx.order_number}</span>
                  ${Utils.renderStatusBadge(tx.order_status)}
                </div>
                <div class="flex items-center justify-between text-xs">
                  <div>
                    <p class="font-bold text-black">${tx.customer_name}</p>
                    <span class="text-[11px] text-zinc-500 font-mono">${tx.payment_method} ${tx.payment_method === 'COD' ? (tx.cod_verified ? '• <span class="text-black font-bold">Verified</span>' : '• <span class="text-zinc-500 font-bold">Unverified</span>') : ''}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-mono font-bold text-black text-sm">${Utils.formatCurrency(tx.total_amount)}</span>
                    <span class="block text-[10px] text-zinc-500">Via ${tx.supplier_name || 'CJ'}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Desktop Table View (>= md) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-zinc-100 border-b border-zinc-200 text-xs text-black uppercase tracking-wider font-bold">
                <tr>
                  <th class="py-2.5 px-3">Order ID</th>
                  <th class="py-2.5 px-3">Customer</th>
                  <th class="py-2.5 px-3">Payment</th>
                  <th class="py-2.5 px-3">COD Status</th>
                  <th class="py-2.5 px-3">Assigned Supplier</th>
                  <th class="py-2.5 px-3">Fulfillment Status</th>
                  <th class="py-2.5 px-3 text-right">Amount</th>
                  <th class="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 text-xs">
                ${data.recentTransactions.map(tx => `
                  <tr class="hover:bg-zinc-50 transition">
                    <td class="py-3 px-3 font-mono font-black text-black cursor-pointer hover:underline" onclick="App.openOrderDetails(${tx.id})">${tx.order_number}</td>
                    <td class="py-3 px-3 font-bold text-black">${tx.customer_name}</td>
                    <td class="py-3 px-3 font-mono text-black"><span class="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono font-bold">${tx.payment_method}</span></td>
                    <td class="py-3 px-3">
                      ${tx.payment_method === 'COD' ? (tx.cod_verified ? '<span class="text-black font-bold">✓ Verified</span>' : '<span class="text-zinc-600 font-bold">Pending</span>') : '<span class="text-zinc-500">Prepaid</span>'}
                    </td>
                    <td class="py-3 px-3 text-black font-medium">${tx.supplier_name || 'CJ Dropshipping'}</td>
                    <td class="py-3 px-3">${Utils.renderStatusBadge(tx.order_status)}</td>
                    <td class="py-3 px-3 text-right font-black text-black font-mono">${Utils.formatCurrency(tx.total_amount)}</td>
                    <td class="py-3 px-3 text-center">
                      <button onclick="App.openOrderDetails(${tx.id})" class="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-black text-black rounded text-xs font-bold transition">View</button>
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
      this.initCharts(data);
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  renderPeriodButton(periodKey, label) {
    const isActive = this.currentPeriod === periodKey;
    const activeClass = isActive
      ? 'bg-black text-white font-bold shadow-xs'
      : 'text-slate-700 hover:text-black hover:bg-slate-200/80';

    return `
      <button onclick="DashboardComponent.switchPeriod('${periodKey}')" class="px-3 py-1.5 rounded-lg text-xs transition font-semibold ${activeClass}">
        ${label}
      </button>
    `;
  },

  async switchPeriod(newPeriod) {
    this.currentPeriod = newPeriod;
    await this.render(document.getElementById('main-content'));
  },

  renderKpiCard({ title, value, subtext, icon, colorClass }) {
    const isCurrency = typeof value === 'string' && value.includes('₹');
    return `
      <div class="app-card p-3 sm:p-5 relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between gap-1">
          <span class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">${title}</span>
          <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${colorClass} shrink-0">
            <i data-lucide="${icon}" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
          </div>
        </div>
        <div class="mt-2 sm:mt-3">
          <span class="text-base sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 ${isCurrency ? 'font-mono' : 'font-sans'} truncate block">${value}</span>
          <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">${subtext}</p>
        </div>
      </div>
    `;
  },

  renderTrendBadge(percent) {
    if (!percent || percent === 0) {
      return `<span class="text-zinc-500 font-semibold text-xs">0%</span>`;
    }
    const isPos = percent > 0;
    const arrow = isPos ? '↑' : '↓';
    return `<span class="text-black font-extrabold text-xs">${arrow} ${Math.abs(percent)}%</span>`;
  },

  initCharts(data) {
    const revCtx = document.getElementById('revenueChart');
    if (revCtx) {
      if (this.revenueChartInstance) {
        this.revenueChartInstance.destroy();
      }

      const labels = data.revenueTrend.map(r => r.date_str.split('-').slice(1).join('/'));
      const revenues = data.revenueTrend.map(r => r.daily_revenue);
      const netSales = data.revenueTrend.map(r => r.net_sales);

      this.revenueChartInstance = new Chart(revCtx, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['No Data'],
          datasets: [
            {
              label: 'Gross Sales (₹)',
              data: revenues.length > 0 ? revenues : [0],
              borderColor: '#000000',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderWidth: 2.5,
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointBackgroundColor: '#000000'
            },
            {
              label: 'Net Sales (₹)',
              data: netSales.length > 0 ? netSales : [0],
              borderColor: '#52525b',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.35,
              pointRadius: 3,
              pointBackgroundColor: '#52525b'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#000000',
                font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: { color: '#000000', font: { weight: '600' } }
            },
            y: {
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: {
                color: '#000000',
                font: { weight: '600' },
                callback: (val) => '₹' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
              }
            }
          }
        }
      });
    }

    const orderCtx = document.getElementById('orderStatusChart');
    if (orderCtx) {
      if (this.orderChartInstance) {
        this.orderChartInstance.destroy();
      }

      const analytics = data.orderAnalytics;
      const statusLabels = ['Delivered', 'Shipped', 'Processing', 'Confirmed', 'New', 'Returned'];
      const statusCounts = [
        analytics.DELIVERED.count,
        analytics.SHIPPED.count,
        analytics.PROCESSING.count,
        analytics.CONFIRMED.count,
        analytics.NEW.count,
        analytics.RETURNED.count + analytics.CANCELLED.count
      ];

      this.orderChartInstance = new Chart(orderCtx, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [
            {
              data: statusCounts,
              backgroundColor: [
                '#000000',
                '#27272a',
                '#52525b',
                '#71717a',
                '#a1a1aa',
                '#d4d4d8'
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          cutout: '70%'
        }
      });
    }
  }
};
