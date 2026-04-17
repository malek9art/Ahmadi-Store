// ======================== تهيئة Firebase والمتغيرات العامة ========================
const firebaseConfig = {
  apiKey: "AIzaSyAUqC9pJdso4molT-x38wDLkPMw4q28cCg",
  authDomain: "alahmdistore.firebaseapp.com",
  databaseURL: "https://alahmdistore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alahmdistore",
  storageBucket: "alahmdistore.firebasestorage.app",
  messagingSenderId: "950748647259",
  appId: "1:950748647259:web:f15e4e0ae619abdf50547e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// ======================== المتغيرات العامة (State) ========================
const RATES = { YER: 1, SAR: 140, USD: 530 };
const CUR_SYMBOLS = { YER: 'ر.ي', SAR: 'ر.س', USD: '$' };

// سيتم تعريف state في main.js لكننا نعرّفها هنا للاستخدام في الملفات الأخرى
// نستخدم كائن window.appState لتخزين الحالة المشتركة
window.appState = {
  currentPage: 'home',
  cart: [],
  selectedLocation: null,
  editingProductId: null,
  deleteCallback: null,
  editingBankId: null,
  editingExtraId: null,
  shopCategory: 'all',
  ordersFilterStatus: 'all',
  reviewOrderId: null,
  currentUser: null,
  isAdminUser: false,
  deliverySettings: { name: 'أحمد', phone: '777229775' },
  bankAccounts: [],
  extraPaymentMethods: [],
  codMessage: 'سيتم الدفع عند استلام الطلب.',
  products: [],
  orders: [],
  reviews: [],
  previousPage: null // لتتبع الصفحة السابقة للرجوع
};

// مراجع Firebase
const productsRef = database.ref('products');
const ordersRef = database.ref('orders');
const settingsRef = database.ref('settings');
const reviewsRef = database.ref('reviews');
const usersRef = database.ref('users');

// ======================== دوال المزامنة مع localStorage و Firebase ========================
function saveData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
  if (key === 'ahmadi_products') productsRef.set(val);
  else if (key === 'ahmadi_orders') ordersRef.set(val);
  else if (key === 'ahmadi_bank_accounts') settingsRef.child('bankAccounts').set(val);
  else if (key === 'ahmadi_extra_payment_methods') settingsRef.child('extraPaymentMethods').set(val);
  else if (key === 'ahmadi_cod_message') settingsRef.child('codMessage').set(val);
  else if (key === 'ahmadi_delivery') settingsRef.child('delivery').set(val);
  else if (key === 'ahmadi_reviews') reviewsRef.set(val);
}

function loadData(key, fallback) {
  try {
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : fallback;
  } catch {
    return fallback;
  }
}

function getDefaultProducts() {
  return [
    { id: '1', name: 'iPhone 15 Pro Max', currency: 'USD', price: 950, originalPrice: 1199, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&q=80'], featured: true, isOnSale: true, allowCOD: true, stock: 5, lowStockThreshold: 4, category: 'جوالات', description: 'أحدث إصدار من آيفون' },
    { id: '2', name: 'Samsung Galaxy S24 Ultra', currency: 'SAR', price: 3200, originalPrice: 4199, images: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=300&q=80'], featured: true, isOnSale: true, allowCOD: true, stock: 3, lowStockThreshold: 4, category: 'جوالات', description: 'جالاكسي S24 الترا' },
    { id: '3', name: 'شاحن سريع 65W', currency: 'YER', price: 12000, originalPrice: 18000, images: [], featured: false, isOnSale: true, allowCOD: true, stock: 20, lowStockThreshold: 4, category: 'اكسسوارات', description: 'شاحن سريع متوافق' },
    { id: '4', name: 'سماعات AirPods Pro 2', currency: 'USD', price: 180, originalPrice: 249, images: ['https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=300&q=80'], featured: true, isOnSale: true, allowCOD: true, stock: 8, lowStockThreshold: 4, category: 'اكسسوارات', description: 'سماعات لاسلكية' },
    { id: '5', name: 'كفر حماية ضد الصدمات', currency: 'YER', price: 5000, originalPrice: 8000, images: [], featured: false, isOnSale: true, allowCOD: true, stock: 2, lowStockThreshold: 4, category: 'اكسسوارات', description: 'كفر متين' },
    { id: '6', name: 'Xiaomi 14 Pro', currency: 'SAR', price: 1800, originalPrice: 2499, images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'], featured: true, isOnSale: true, allowCOD: true, stock: 4, lowStockThreshold: 4, category: 'جوالات', description: 'شاومي 14 برو' }
  ];
}

// تحميل البيانات الأولية من localStorage
function initialLoadFromLocal() {
  window.appState.products = loadData('ahmadi_products', getDefaultProducts());
  window.appState.orders = loadData('ahmadi_orders', []);
  window.appState.bankAccounts = loadData('ahmadi_bank_accounts', []);
  window.appState.extraPaymentMethods = loadData('ahmadi_extra_payment_methods', []);
  window.appState.codMessage = loadData('ahmadi_cod_message', 'سيتم الدفع عند استلام الطلب.');
  window.appState.deliverySettings = loadData('ahmadi_delivery', { name: 'أحمد', phone: '777229775' });
  window.appState.reviews = loadData('ahmadi_reviews', []);
}

// إعداد مستمعي Firebase
function setupDataListeners() {
  productsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      window.appState.products = data;
      localStorage.setItem('ahmadi_products', JSON.stringify(data));
    } else {
      window.appState.products = getDefaultProducts();
      localStorage.setItem('ahmadi_products', JSON.stringify(window.appState.products));
      if (window.appState.currentUser && window.appState.isAdminUser) productsRef.set(window.appState.products);
    }
    if (typeof updateUIAfterProducts === 'function') updateUIAfterProducts();
  });

  ordersRef.on('value', (snapshot) => {
    window.appState.orders = snapshot.val() || [];
    localStorage.setItem('ahmadi_orders', JSON.stringify(window.appState.orders));
    if (window.appState.currentPage === 'dashboard') renderAdminOrdersCards();
    if (window.appState.currentPage === 'my-orders') renderMyOrders();
  });

  settingsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.bankAccounts) { window.appState.bankAccounts = data.bankAccounts; localStorage.setItem('ahmadi_bank_accounts', JSON.stringify(data.bankAccounts)); }
      if (data.extraPaymentMethods) { window.appState.extraPaymentMethods = data.extraPaymentMethods; localStorage.setItem('ahmadi_extra_payment_methods', JSON.stringify(data.extraPaymentMethods)); }
      if (data.codMessage) { window.appState.codMessage = data.codMessage; localStorage.setItem('ahmadi_cod_message', data.codMessage); }
      if (data.delivery) { window.appState.deliverySettings = data.delivery; localStorage.setItem('ahmadi_delivery', JSON.stringify(data.delivery)); }
    }
    if (window.appState.currentPage === 'cart') { 
      if (typeof updateBankSelect === 'function') updateBankSelect(); 
      if (typeof renderExtraPaymentMethods === 'function') renderExtraPaymentMethods(); 
    }
    if (window.appState.currentPage === 'dashboard' && document.getElementById('admin-settings') && !document.getElementById('admin-settings').classList.contains('hidden')) {
      if (typeof renderBankAccountsList === 'function') renderBankAccountsList();
      if (typeof renderExtraPaymentMethodsList === 'function') renderExtraPaymentMethodsList();
    }
  });

  reviewsRef.on('value', (snapshot) => {
    window.appState.reviews = snapshot.val() || [];
    localStorage.setItem('ahmadi_reviews', JSON.stringify(window.appState.reviews));
    if (window.appState.currentPage === 'home') renderReviewsSlider();
    if (window.appState.currentPage === 'dashboard') renderAdminReviews();
  });
}

// ======================== دوال مساعدة ========================
function calcDiscount(orig, cur) {
  if (!orig || orig <= cur) return 0;
  return Math.round(((orig - cur) / orig) * 100);
}

function toYER(amount, currency) {
  return amount * (RATES[currency] || 1);
}

function formatPrice(p, cur) {
  return `${p.toLocaleString()} ${CUR_SYMBOLS[cur] || cur}`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = window.appState.orders.length + 1;
  const padded = count.toString().padStart(4, '0');
  return `AHM-${year}-${padded}`;
}

function sanitizeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : (num < 0 ? 0 : num);
}

// ======================== مراقبة حالة المصادقة ========================
auth.onAuthStateChanged(async (user) => {
  window.appState.currentUser = user;
  if (user) {
    const snapshot = await database.ref(`users/${user.uid}/isAdmin`).once('value');
    window.appState.isAdminUser = snapshot.val() === true;
    if (window.appState.currentPage === 'dashboard') {
      document.getElementById('adminUserName').textContent = user.displayName || user.email;
    }
  } else {
    window.appState.isAdminUser = false;
  }
  updateAuthUI();
  updateAdminLinks();
});

function updateAuthUI() {
  const authArea = document.getElementById('authArea');
  const mobileAuthArea = document.getElementById('mobileAuthArea');
  if (window.appState.currentUser) {
    const displayName = window.appState.currentUser.displayName || window.appState.currentUser.email.split('@')[0];
    authArea.innerHTML = `<div class="relative inline-block text-right">
      <button onclick="app.toggleUserDropdown()" class="flex items-center gap-1 bg-white/50 px-3 py-1.5 rounded-xl"><i class="fas fa-user-circle text-xl"></i><span>${displayName}</span><i class="fas fa-chevron-down text-xs"></i></button>
      <div id="userDropdown" class="hidden absolute left-0 mt-2 w-48 glass rounded-xl shadow-lg z-50">
        <button onclick="app.navigateTo('my-orders');app.closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-teal-50"><i class="fas fa-clipboard-list me-2"></i>طلباتي</button>
        <button onclick="app.signOut();app.closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-red-50 text-red-600"><i class="fas fa-sign-out-alt me-2"></i>تسجيل الخروج</button>
      </div>
    </div>`;
    mobileAuthArea.innerHTML = `<span class="font-bold">${displayName}</span><button onclick="app.navigateTo('my-orders');app.toggleMobileMenu()" class="text-teal-600">طلباتي</button><button onclick="app.signOut();app.toggleMobileMenu()" class="text-red-500 text-sm">تسجيل الخروج</button>`;
  } else {
    authArea.innerHTML = `<button onclick="app.openClientAuthModal()" class="text-sm font-semibold px-3 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50">دخول</button><button onclick="app.openClientAuthModal(true)" class="btn-pri text-sm px-3 py-1.5">حساب جديد</button>`;
    mobileAuthArea.innerHTML = `<button onclick="app.openClientAuthModal();app.toggleMobileMenu()" class="nav-link">تسجيل الدخول</button><button onclick="app.openClientAuthModal(true);app.toggleMobileMenu()" class="nav-link">حساب جديد</button>`;
  }
}

function updateAdminLinks() {
  const adminLinks = document.querySelectorAll('#adminNavLink, #mobileAdminLink');
  if (window.appState.isAdminUser) {
    adminLinks.forEach(link => link.classList.remove('hidden'));
  } else {
    adminLinks.forEach(link => link.classList.add('hidden'));
  }
}

// دوال المصادقة الأساسية (ستُضاف إلى كائن app في main.js)
