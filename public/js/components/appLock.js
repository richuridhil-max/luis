// LUISCART Quick 4-Digit PIN Security Lock
// Pure Monochrome Black & White Theme (GPay / WhatsApp Style)

const AppLock = {
  currentInput: '',
  isVerifying: false,
  setupStep: 1, // 1: Choose PIN, 2: Confirm PIN
  firstChosenPin: '',
  mode: 'lock', // 'lock' | 'setup' | 'change'
  keyboardHandler: null,

  async init() {
    try {
      // STORE OPENING TIME: Always require lock screen first
      sessionStorage.removeItem('luiscart_unlocked');

      const status = await API.getSecurityStatus();
      if (!status.isPinSet) {
        // If no PIN set, prompt setup
        this.showSetupScreen();
        return false;
      }

      if (status.isEnabled) {
        this.showLockScreen();
        return false;
      } else {
        this.removeOverlay();
        return true;
      }
    } catch (err) {
      console.error('Security status check failed:', err);
      return true; // Allow access if offline/server issue
    }
  },

  lock() {
    sessionStorage.removeItem('luiscart_unlocked');
    this.showLockScreen();
  },

  unlockSuccess() {
    sessionStorage.setItem('luiscart_unlocked', 'true');
    this.removeOverlay();
    Utils.showToast('Store Unlocked', 'success');
  },

  removeOverlay() {
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    const overlay = document.getElementById('security-lock-overlay');
    if (overlay) {
      overlay.classList.add('opacity-0', 'transition-opacity', 'duration-200');
      setTimeout(() => overlay.remove(), 200);
    }
  },

  // ==========================================
  // UNLOCK SCREEN (GPay / Phone Lock style)
  // ==========================================
  showLockScreen() {
    this.mode = 'lock';
    this.currentInput = '';
    this.isVerifying = false;

    this.renderKeypadModal({
      title: 'Store Protected',
      subtitle: 'Enter your 4-digit PIN to access LUISCART',
      showForgotOption: true,
      onComplete: async (pin) => {
        await this.handleUnlockPin(pin);
      }
    });
  },

  async handleUnlockPin(pin) {
    if (this.isVerifying) return;
    this.isVerifying = true;

    const messageEl = document.getElementById('pin-message-text');
    if (messageEl) {
      messageEl.textContent = 'Verifying PIN...';
      messageEl.className = 'text-xs font-bold text-black';
    }

    try {
      const res = await API.verifyPin(pin);
      if (res.verified) {
        const dots = document.getElementById('pin-dots-container');
        if (dots) dots.classList.add('pin-success');
        if (navigator.vibrate) navigator.vibrate([30, 40, 30]);

        setTimeout(() => {
          this.unlockSuccess();
        }, 200);
      } else {
        this.triggerErrorAnimation('Incorrect PIN. Please try again.');
      }
    } catch (err) {
      this.triggerErrorAnimation(err.message || 'Verification failed');
    } finally {
      this.isVerifying = false;
    }
  },

  // ==========================================
  // FIRST TIME SETUP FLOW
  // ==========================================
  showSetupScreen() {
    this.mode = 'setup';
    this.setupStep = 1;
    this.firstChosenPin = '';
    this.currentInput = '';
    this.isVerifying = false;

    this.renderKeypadModal({
      title: 'Set Store Security PIN',
      subtitle: 'Create a 4-digit PIN to secure your orders, profits & customer data',
      badge: 'Step 1 of 2: Create PIN',
      onComplete: (pin) => {
        this.handleSetupFirstStep(pin);
      }
    });
  },

  handleSetupFirstStep(pin) {
    this.firstChosenPin = pin;
    this.setupStep = 2;
    this.currentInput = '';

    const titleEl = document.getElementById('pin-modal-title');
    const subtitleEl = document.getElementById('pin-modal-subtitle');
    const badgeEl = document.getElementById('pin-modal-badge');
    const messageEl = document.getElementById('pin-message-text');

    if (titleEl) titleEl.textContent = 'Confirm Security PIN';
    if (subtitleEl) subtitleEl.textContent = 'Re-enter the same 4-digit PIN to confirm';
    if (badgeEl) badgeEl.textContent = 'Step 2 of 2: Confirm PIN';
    if (messageEl) {
      messageEl.textContent = 'Enter PIN again';
      messageEl.className = 'text-xs font-semibold text-zinc-500';
    }

    this.updateDotsDisplay();
  },

  async handleSetupSecondStep(pin) {
    if (pin !== this.firstChosenPin) {
      this.triggerErrorAnimation('PINs do not match. Let’s try again.');
      setTimeout(() => {
        this.showSetupScreen();
      }, 1000);
      return;
    }

    if (this.isVerifying) return;
    this.isVerifying = true;

    const messageEl = document.getElementById('pin-message-text');
    if (messageEl) {
      messageEl.textContent = 'Saving security PIN...';
      messageEl.className = 'text-xs font-bold text-black';
    }

    try {
      await API.setupPin(pin);
      Utils.showToast('Security PIN configured successfully!', 'success');
      this.unlockSuccess();
    } catch (err) {
      this.triggerErrorAnimation(err.message || 'Failed to save PIN');
    } finally {
      this.isVerifying = false;
    }
  },

  // ==========================================
  // CHANGE PIN MODAL (from Settings)
  // ==========================================
  openChangePinModal() {
    const existing = document.getElementById('security-change-pin-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'security-change-pin-modal';
    modal.className = 'fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs';
    modal.innerHTML = `
      <div class="bg-white border-2 border-black rounded-2xl w-full max-w-sm p-6 text-black shadow-2xl relative">
        <button onclick="document.getElementById('security-change-pin-modal').remove()" class="absolute top-4 right-4 w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center text-black font-bold hover:bg-black hover:text-white transition">✕</button>
        
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black">
            🔒
          </div>
          <div>
            <h3 class="font-black text-base text-black">Change Security PIN</h3>
            <p class="text-[11px] text-zinc-500">Update your 4-digit store passkey</p>
          </div>
        </div>

        <form id="change-pin-form" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-black mb-1">Current 4-Digit PIN</label>
            <input type="password" id="current-pin-input" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••" required class="w-full text-center text-xl tracking-widest font-mono font-black p-2.5 bg-white border border-zinc-300 rounded-xl text-black focus:ring-1 focus:ring-black" />
          </div>

          <div>
            <label class="block font-bold text-black mb-1">New 4-Digit PIN</label>
            <input type="password" id="new-pin-input" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••" required class="w-full text-center text-xl tracking-widest font-mono font-black p-2.5 bg-white border border-zinc-300 rounded-xl text-black focus:ring-1 focus:ring-black" />
          </div>

          <div>
            <label class="block font-bold text-black mb-1">Confirm New PIN</label>
            <input type="password" id="confirm-new-pin-input" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••" required class="w-full text-center text-xl tracking-widest font-mono font-black p-2.5 bg-white border border-zinc-300 rounded-xl text-black focus:ring-1 focus:ring-black" />
          </div>

          <div id="change-pin-error" class="hidden text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200"></div>

          <div class="flex gap-2 pt-2">
            <button type="button" onclick="document.getElementById('security-change-pin-modal').remove()" class="flex-1 py-2.5 border border-zinc-300 font-bold rounded-xl text-black hover:bg-zinc-100 transition">
              Cancel
            </button>
            <button type="submit" class="flex-1 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 transition shadow-sm">
              Update PIN
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('change-pin-form').onsubmit = async (e) => {
      e.preventDefault();
      const currentPin = document.getElementById('current-pin-input').value.trim();
      const newPin = document.getElementById('new-pin-input').value.trim();
      const confirmPin = document.getElementById('confirm-new-pin-input').value.trim();
      const errorEl = document.getElementById('change-pin-error');

      if (!/^\d{4}$/.test(newPin)) {
        errorEl.textContent = 'New PIN must be exactly 4 digits (0-9).';
        errorEl.classList.remove('hidden');
        return;
      }
      if (newPin !== confirmPin) {
        errorEl.textContent = 'New PIN and Confirmation do not match.';
        errorEl.classList.remove('hidden');
        return;
      }

      try {
        await API.changePin(currentPin, newPin);
        Utils.showToast('Security PIN successfully updated!', 'success');
        modal.remove();
      } catch (err) {
        errorEl.textContent = err.message || 'Failed to change PIN';
        errorEl.classList.remove('hidden');
      }
    };
  },

  // ==========================================
  // KEYPAD MODAL RENDERING (Monochrome & Mobile)
  // ==========================================
  renderKeypadModal(opts) {
    let overlay = document.getElementById('security-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'security-lock-overlay';
      document.body.appendChild(overlay);
    }

    overlay.className = 'fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-between p-6 sm:p-8 select-none text-black';
    overlay.innerHTML = `
      <!-- Top Brand Header -->
      <div class="w-full max-w-sm flex items-center justify-between pt-2">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-xs shadow-xs">
            LC
          </div>
          <span class="font-black text-sm tracking-tight text-black">LUISCART</span>
        </div>
        ${opts.badge ? `<span id="pin-modal-badge" class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-zinc-100 text-black border border-zinc-300 rounded-full">${opts.badge}</span>` : `<span class="text-[11px] font-bold text-zinc-400">STORE PASSKEY</span>`}
      </div>

      <!-- Main Center Content: Title, PIN Dots & Error message -->
      <div class="w-full max-w-xs flex flex-col items-center text-center my-auto py-4">
        <!-- Shield Lock Icon -->
        <div class="w-16 h-16 rounded-2xl border-2 border-black bg-white flex items-center justify-center text-2xl shadow-sm mb-4">
          <svg class="w-8 h-8 text-black" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2 id="pin-modal-title" class="text-xl sm:text-2xl font-black text-black tracking-tight mb-1">
          ${opts.title}
        </h2>
        <p id="pin-modal-subtitle" class="text-xs text-zinc-500 max-w-xs mb-6">
          ${opts.subtitle}
        </p>

        <!-- 4 PIN Indicator Dots -->
        <div id="pin-dots-container" class="flex items-center justify-center gap-4 py-2 mb-3">
          <div id="pin-dot-0" class="w-4 h-4 rounded-full border-2 border-black bg-white transition-all duration-150"></div>
          <div id="pin-dot-1" class="w-4 h-4 rounded-full border-2 border-black bg-white transition-all duration-150"></div>
          <div id="pin-dot-2" class="w-4 h-4 rounded-full border-2 border-black bg-white transition-all duration-150"></div>
          <div id="pin-dot-3" class="w-4 h-4 rounded-full border-2 border-black bg-white transition-all duration-150"></div>
        </div>

        <!-- Status / Feedback Message -->
        <div class="h-6 flex items-center justify-center">
          <span id="pin-message-text" class="text-xs font-semibold text-zinc-500">
            Tap digits or use keyboard (PIN: 1111)
          </span>
        </div>
      </div>

      <!-- Bottom: Touch Keypad Grid (3x4) -->
      <div class="w-full max-w-xs pb-4">
        <div class="grid grid-cols-3 gap-3 sm:gap-4 justify-items-center">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
            <button
              type="button"
              onclick="AppLock.pressDigit('${num}')"
              class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-black bg-white text-black font-black text-2xl flex items-center justify-center hover:bg-black hover:text-white active:bg-black active:text-white active:scale-95 transition-all shadow-xs"
            >
              ${num}
            </button>
          `).join('')}

          <!-- Clear (C) -->
          <button
            type="button"
            onclick="AppLock.clearAll()"
            class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-zinc-300 bg-white text-zinc-700 font-bold text-xs sm:text-sm flex items-center justify-center hover:border-black hover:text-black active:scale-95 transition-all shadow-xs"
            title="Clear"
          >
            CLEAR
          </button>

          <!-- 0 -->
          <button
            type="button"
            onclick="AppLock.pressDigit('0')"
            class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-black bg-white text-black font-black text-2xl flex items-center justify-center hover:bg-black hover:text-white active:bg-black active:text-white active:scale-95 transition-all shadow-xs"
          >
            0
          </button>

          <!-- Backspace (⌫) -->
          <button
            type="button"
            onclick="AppLock.backspace()"
            class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-zinc-300 bg-white text-black font-black text-xl flex items-center justify-center hover:border-black hover:text-black active:scale-95 transition-all shadow-xs"
            title="Delete"
          >
            ⌫
          </button>
        </div>
      </div>
    `;

    this.attachKeyboardListener();
  },

  attachKeyboardListener() {
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler);
    }
    this.keyboardHandler = (e) => {
      const overlay = document.getElementById('security-lock-overlay');
      if (!overlay || overlay.classList.contains('hidden') || overlay.classList.contains('opacity-0')) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this.pressDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.backspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.clearAll();
      }
    };
    window.addEventListener('keydown', this.keyboardHandler);
  },

  pressDigit(digit) {
    if (this.isVerifying) return;
    if (this.currentInput.length >= 4) return;

    if (navigator.vibrate) navigator.vibrate(15);
    this.currentInput += digit;
    this.updateDotsDisplay();

    if (this.currentInput.length === 4) {
      const pin = this.currentInput;
      if (this.mode === 'lock') {
        this.handleUnlockPin(pin);
      } else if (this.mode === 'setup') {
        if (this.setupStep === 1) {
          this.handleSetupFirstStep(pin);
        } else {
          this.handleSetupSecondStep(pin);
        }
      }
    }
  },

  backspace() {
    if (this.isVerifying) return;
    if (this.currentInput.length > 0) {
      if (navigator.vibrate) navigator.vibrate(10);
      this.currentInput = this.currentInput.slice(0, -1);
      this.updateDotsDisplay();
    }
  },

  clearAll() {
    if (this.isVerifying) return;
    this.currentInput = '';
    this.updateDotsDisplay();
  },

  updateDotsDisplay() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pin-dot-${i}`);
      if (!dot) continue;
      if (i < this.currentInput.length) {
        dot.className = 'w-4 h-4 rounded-full border-2 border-black bg-black scale-110 transition-all duration-150';
      } else {
        dot.className = 'w-4 h-4 rounded-full border-2 border-black bg-white transition-all duration-150';
      }
    }
  },

  triggerErrorAnimation(errorMessage) {
    if (navigator.vibrate) navigator.vibrate([60, 50, 60]);
    const dots = document.getElementById('pin-dots-container');
    const messageEl = document.getElementById('pin-message-text');

    if (dots) {
      dots.classList.remove('pin-shake');
      void dots.offsetWidth;
      dots.classList.add('pin-shake');
    }

    if (messageEl) {
      messageEl.textContent = errorMessage;
      messageEl.className = 'text-xs font-bold text-red-600';
    }

    this.currentInput = '';
    setTimeout(() => {
      this.updateDotsDisplay();
    }, 300);
  }
};

// Immediately attach keyboard listener on load so user can type 1111 right away
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AppLock.attachKeyboardListener());
} else {
  AppLock.attachKeyboardListener();
}
