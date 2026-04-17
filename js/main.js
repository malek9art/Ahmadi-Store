// الملف الرئيسي: ينسق عمل الملفات ويدير التنقل بين الصفحات (SPA) والواجهة

let state = {
  currentPage: 'home',
  selectedLocation: null,
  editingProductId: null,
  deleteCallback: null,
  editingBankId: null,
  editingExtraId: null,
  shopCategory: 'all',
  ordersFilterStatus: 'all',
  reviewOrderId: null
};

// دوال عامة
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
function loadData(key, fallback) { try { const local = localStorage.getItem(key); return local ? JSON.parse(local) : fallback; } catch { return fallback; } }

// التنقل
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  state.currentPage = page;
  const isAdmin = page === 'admin';
  document.getElementById('mainHeader').style.display = isAdmin ? 'none' : '';
  document.getElementById('mainFooter').style.display = isAdmin ? 'none' : '';
  
  if (page === 'admin') {
    if (!currentUser || !isAdminUser) {
      showToast('يجب تسجيل الدخول كمسؤول للوصول إلى لوحة التحكم');
      navigateTo('home');
      return;
    }
    document.getElementById('adminUserName').textContent = currentUser.displayName || currentUser.email;
    switchAdminTab('products');
  }
  if (page === 'my-orders' && !currentUser) {
    showToast('يجب تسجيل الدخول لعرض طلباتك');
    navigateTo('home');
    return;
  }
  
  if (page === 'home') { renderFeatured(); initHeroSlider(); renderReviewsSlider(); }
  if (page === 'shop') { renderShop(); setupSearchListener(); }
  if (page === 'offers') renderOffers();
  if (page === 'cart') renderCartPage();
  if (page === 'my-orders') renderMyOrders();
  history.pushState(null, null, page === 'home' ? '/' : `/${page}`);
}

// تحديث واجهة المصادقة
function updateAuthUI() {
  const authArea = document.getElementById('authArea');
  if (currentUser) {
    const displayName = currentUser.displayName || currentUser.email.split('@')[0];
    authArea.innerHTML = `<div class="relative inline-block text-right">
      <button onclick="toggleUserDropdown()" class="flex items-center gap-1 bg-white/50 px-3 py-1.5 rounded-xl"><i class="fas fa-user-circle text-xl"></i><span>${displayName}</span><i class="fas fa-chevron-down text-xs"></i></button>
      <div id="userDropdown" class="hidden absolute left-0 mt-2 w-48 glass rounded-xl shadow-lg z-50">
        <button onclick="navigateTo('my-orders');closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-teal-50"><i class="fas fa-clipboard-list me-2"></i>طلباتي</button>
        ${isAdminUser ? `<button onclick="navigateTo('admin');closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-teal-50"><i class="fas fa-cog me-2"></i>لوحة التحكم</button>` : ''}
        <button onclick="signOutUser();closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-red-50 text-red-600"><i class="fas fa-sign-out-alt me-2"></i>تسجيل الخروج</button>
      </div>
    </div>`;
  } else {
    authArea.innerHTML = `<button onclick="openClientAuthModal()" class="text-sm font-semibold px-3 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50">دخول</button><button onclick="openClientAuthModal(true)" class="btn-pri text-sm px-3 py-1.5">حساب جديد</button>`;
  }
}

// دوال عرض الصفحات
function renderShop() {
  let filtered = state.shopCategory === 'all' ? products : products.filter(p => p.category === state.shopCategory);
  const query = document.getElementById('searchInput')?.value.trim().toLowerCase();
  if (query) filtered = performLiveSearch(query);
  document.getElementById('shopGrid').innerHTML = filtered.map(createProductCard).join('');
}

function setupSearchListener() {
  const input = document.getElementById('searchInput');
  if (input) input.addEventListener('input', () => renderShop());
}

// ... دوال أخرى (فتح مودالات، خريطة، سلة، إلخ) من الكود الأصلي مع الاستعانة بالوظائف من الملفات الأخرى

// بدء التطبيق
function initialLoad() {
  loadCart();
  loadOrders();
  loadSettings();
  // تحميل المنتجات عبر المستمع
  setupProductsListener();
  setupOrdersListener();
  setupSettingsListener();
}

initialLoad();
window.addEventListener('load', () => {
  navigateTo('home');
});
