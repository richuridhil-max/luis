// LUISCART Admin Single Page Application (SPA) Controller

const App = {
  currentRoute: 'dashboard',
  activeOrderId: null,
  notifications: [
    { title: 'New Dropship Order #LC41510 placed', time: '10m ago', icon: '🛍️' },
    { title: 'Auto-pushed to CJ Dropshipping', time: '25m ago', icon: '🚀' },
    { title: 'WhatsApp COD OTP verified by Aarav', time: '1h ago', icon: '⚡' },
    { title: 'Courier dispatch: Delhivery Surface in-transit', time: '2h ago', icon: '🚚' }
  ],

  async init() {
    console.log('LUISCART E-Commerce Platform initialized.');
    this.initTheme();
    this.setupEventListeners();
    
    // Check & Enforce 4-Digit Security PIN Lock
    if (window.AppLock) {
      await AppLock.init();
    }

    this.navigate('dashboard');
  },

  initTheme() {
    const savedTheme = localStorage.getItem('luiscart_theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    this.updateThemeButton();
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('luiscart_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('luiscart_theme', 'dark');
    }
    this.updateThemeButton();
    Utils.showToast(`Switched to ${isDark ? 'Light' : 'Dark'} mode`, 'info');
  },

  updateThemeButton() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark');
    btn.innerHTML = isDark
      ? `<i data-lucide="sun" class="w-4 h-4 text-white"></i>`
      : `<i data-lucide="moon" class="w-4 h-4 text-black"></i>`;
    if (window.lucide) lucide.createIcons();
  },

  setupEventListeners() {
    // Keyboard shortcut: Ctrl + K for quick search in active page
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('order-search-input') || document.getElementById('prod-search');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  },

  navigate(route, param = null) {
    this.currentRoute = route;

    // Update dynamic top header page title
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) {
      const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Orders',
        'order-details': `Order #${param || this.activeOrderId || ''}`,
        'suppliers': 'Suppliers Hub',
        'products': 'Products & Margins',
        'billing': 'Profit & Loss',
        'pos': 'Create Order',
        'settings': 'Store Settings'
      };
      pageTitleEl.textContent = titles[route] || 'LUISCART Admin';
    }

    // Close mobile drawer on navigation
    this.toggleMobileSidebar(true);

    // Update active nav links in sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-route');
      const icon = link.querySelector('i, svg');
      if (target === route) {
        link.classList.add('bg-black', 'text-white', 'font-bold', 'shadow-xs');
        link.classList.remove('text-slate-800', 'hover:bg-slate-100', 'hover:text-black', 'dark:text-slate-200');
        if (icon) {
          icon.className = 'w-4 h-4 text-white';
        }
      } else {
        link.classList.remove('bg-black', 'text-white', 'font-bold', 'shadow-xs');
        link.classList.add('text-slate-800', 'hover:bg-slate-100', 'hover:text-black', 'dark:text-slate-200');
        if (icon) {
          icon.className = 'w-4 h-4 text-slate-700';
        }
      }
    });

    // Update active nav links in mobile bottom app bar
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      const target = btn.getAttribute('data-mobile-route');
      if (target === route) {
        btn.classList.add('text-black', 'dark:text-white', 'font-extrabold');
        btn.classList.remove('text-slate-500', 'font-medium');
      } else {
        btn.classList.remove('text-black', 'dark:text-white', 'font-extrabold');
        btn.classList.add('text-slate-500', 'font-medium');
      }
    });

    const mainContainer = document.getElementById('main-content');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (route) {
      case 'dashboard':
        DashboardComponent.render(mainContainer);
        break;
      case 'orders':
        OrdersComponent.render(mainContainer);
        break;
      case 'order-details':
        OrderDetailsComponent.render(mainContainer, param || this.activeOrderId);
        break;
      case 'customers':
        CustomersComponent.render(mainContainer);
        break;
      case 'products':
        ProductsComponent.render(mainContainer);
        break;
      case 'inventory':
        InventoryComponent.render(mainContainer);
        break;
      case 'shipping':
        ShippingComponent.render(mainContainer);
        break;
      case 'suppliers':
        SuppliersComponent.render(mainContainer);
        break;
      case 'billing':
        BillingComponent.render(mainContainer);
        break;
      case 'discounts':
        DiscountsComponent.render(mainContainer);
        break;
      case 'pos':
        PosSimulatorComponent.render(mainContainer);
        break;
      case 'settings':
        SettingsComponent.render(mainContainer);
        break;
      default:
        DashboardComponent.render(mainContainer);
    }

    // Refresh Lucide icons after route changes
    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  openOrderDetails(orderId) {
    this.activeOrderId = orderId;
    this.navigate('order-details', orderId);
  },

  openCustomerDetails(customerId) {
    CustomersComponent.open360Drawer(customerId);
  },

  handleGlobalSearch(query) {
    const q = query.trim();
    if (!q) return;

    OrdersComponent.searchQuery = q;
    this.navigate('orders');
  },

  toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');
  },

  toggleMobileSidebar(forceClose = false) {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('mobile-backdrop');
    if (!sidebar) return;

    if (forceClose || !sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
      if (backdrop) backdrop.classList.add('hidden');
    } else {
      sidebar.classList.remove('-translate-x-full');
      if (backdrop) backdrop.classList.remove('hidden');
    }
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
