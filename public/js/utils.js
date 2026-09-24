// LUISCART Utility Helpers

const Utils = {
  formatCurrency(value) {
    if (value === undefined || value === null) return '₹0';
    const num = Math.round(Number(value));
    return '₹' + num.toLocaleString('en-IN');
  },

  formatNumber(value) {
    if (value === undefined || value === null) return '0';
    return Number(value).toLocaleString('en-IN');
  },

  formatDate(isoStr, includeTime = true) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
    }
    return d.toLocaleDateString('en-IN', options);
  },

  formatDateOnly(isoStr) {
    return this.formatDate(isoStr, false);
  },

  formatRelative(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return this.formatDateOnly(isoStr);
  },

  getStatusLabel(status) {
    const map = {
      NEW: 'New Order',
      CONFIRMED: 'Confirmed',
      PROCESSING: 'Processing',
      PACKED: 'Packed',
      SHIPPED: 'Shipped',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      RETURN_REQUESTED: 'Return Requested',
      RETURNED: 'Returned',
      REFUNDED: 'Refunded'
    };
    return map[status] || status;
  },

  renderStatusBadge(status) {
    const label = this.getStatusLabel(status);
    return `<span class="badge-status badge-${status}"><span class="w-1.5 h-1.5 rounded-full bg-current"></span>${label}</span>`;
  },

  renderPaymentBadge(status) {
    const map = {
      PAID: 'Paid',
      PENDING: 'Pending',
      REFUNDED: 'Refunded',
      FAILED: 'Failed'
    };
    const s = status || 'PENDING';
    return `<span class="badge-status badge-${s}"><span class="w-1.5 h-1.5 rounded-full bg-current"></span>${map[s] || s}</span>`;
  },

  renderTagBadge(tag) {
    const colors = {
      VIP: 'bg-black text-white border-black font-extrabold',
      REGULAR: 'bg-white text-black border-black font-bold',
      NEW: 'bg-zinc-100 text-black border-zinc-300 font-semibold',
      AT_RISK: 'bg-white text-zinc-500 border-zinc-400 border-dashed font-semibold'
    };
    const cls = colors[tag] || 'bg-white text-black border-zinc-300';
    return `<span class="px-2.5 py-0.5 text-xs rounded-full border ${cls}">${tag || 'REGULAR'}</span>`;
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-msg bg-white text-black border-2 border-black shadow-xl';

    const icon = type === 'success'
      ? `<svg class="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`
      : `<svg class="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    toast.innerHTML = `
      <div class="flex items-center gap-3">
        ${icon}
        <span class="text-xs sm:text-sm font-bold text-black">${message}</span>
      </div>
      <button class="text-black hover:bg-zinc-100 font-bold text-xs p-1 rounded ml-3" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  },

  downloadFile(content, fileName, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
