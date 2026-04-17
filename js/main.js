// ======================== js/main.js ========================
// المنسق الرئيسي: إدارة التنقل (SPA) وتهيئة الواجهة والهيدر وفوتر وتنسيق الملفات

// ---------- المتغيرات العامة للحالة ----------
let state = {
  currentPage: 'home',
  selectedLocation: null,
  editingProductId: null,
  deleteCallback: null,
  editingBankId: null,
  editingExtraId: null,
  shopCategory: 'all',
  ordersFilterStatus: 'all',
  reviewOrderId: null,
  currentDetailProduct: null
};

// دوال مساعدة عامة
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function loadData(key, fallback) {
  try {
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : fallback;
  } catch {
    return fallback;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- تهيئة الصفحة عند التحميل ----------
function initialLoad() {
  loadCart();
  loadOrders();
  loadSettings();
  // تحميل المنتجات عبر المستمع من products.js
  if (typeof setupProductsListener === 'function') setupProductsListener();
  if (typeof setupOrdersListener === 'function') setupOrdersListener();
  if (typeof setupSettingsListener === 'function') setupSettingsListener();
  buildHeader();
  updateCartBadge();
}

// بناء الهيدر والفوتر ديناميكياً
function buildHeader() {
  const header = document.getElementById('mainHeader');
  if (!header) return;
  header.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <img src="https://i.ibb.co/XZxvN2gR/IMG-edit-1123054760450025.png" alt="شعار مركز الأحمدي" class="w-10 h-10 rounded-xl object-contain" loading="lazy" onerror="this.style.background='linear-gradient(135deg,#008080,#006666)';this.alt='الأحمدي';">
        <span id="headerStoreName" class="font-extrabold text-lg hidden sm:block" style="color:var(--pri-d)">مركز الأحمدي</span>
      </div>
      <nav class="hidden md:flex items-center gap-6">
        <a href="#" class="nav-link" data-page="home">الرئيسية</a>
        <a href="#" class="nav-link" data-page="shop">المتجر</a>
        <a href="#" class="nav-link" data-page="offers">العروض</a>
        <a href="#" class="nav-link" data-page="contact">اتصل بنا</a>
        <button class="nav-link flex items-center gap-1 text-sm font-semibold admin-nav-btn" style="color:var(--pri-d); display: none;">
          <i class="fas fa-cog"></i> لوحة التحكم
        </button>
      </nav>
      <div class="flex items-center gap-3">
        <div id="authArea" class="auth-buttons"></div>
        <button class="relative p-2 rounded-xl hover:bg-white/50 transition" id="cartBtn">
          <i class="fas fa-shopping-cart" style="width:22px;height:22px;color:var(--pri-d)"></i>
          <span id="cartBadge" class="cart-badge" style="display:none">0</span>
        </button>
        <button id="mobileMenuBtn" class="md:hidden p-2 rounded-xl hover:bg-white/50 transition">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </div>
    <div id="mobileMenu" class="md:hidden hidden px-4 pb-4">
      <div class="glass p-4 flex flex-col gap-3">
        <a href="#" class="nav-link" data-page="home">الرئيسية</a>
        <a href="#" class="nav-link" data-page="shop">المتجر</a>
        <a href="#" class="nav-link" data-page="offers">العروض</a>
        <a href="#" class="nav-link" data-page="contact">اتصل بنا</a>
        <button class="nav-link flex items-center gap-1 admin-nav-btn" style="display: none;"><i class="fas fa-cog"></i> لوحة التحكم</button>
        <div id="mobileAuthArea" class="flex flex-col gap-2 pt-2 border-t border-slate-200"></div>
      </div>
    </div>
  `;
  // ربط الأحداث
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.page);
      document.getElementById('mobileMenu')?.classList.add('hidden');
    });
  });
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!currentUser || !isAdminUser) {
        openAdminAuthModal();
      } else {
        navigateTo('admin');
      }
      document.getElementById('mobileMenu')?.classList.add('hidden');
    });
  });
  document.getElementById('cartBtn').addEventListener('click', () => navigateTo('cart'));
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('hidden');
  });
  updateAuthUI();
}

// تحديث واجهة المصادقة في الهيدر والموبايل
function updateAuthUI() {
  const authArea = document.getElementById('authArea');
  const mobileAuthArea = document.getElementById('mobileAuthArea');
  const adminBtns = document.querySelectorAll('.admin-nav-btn');
  if (!authArea) return;

  if (currentUser) {
    const displayName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'مستخدم');
    authArea.innerHTML = `
      <div class="relative inline-block text-right">
        <button onclick="toggleUserDropdown()" class="flex items-center gap-1 bg-white/50 px-3 py-1.5 rounded-xl">
          <i class="fas fa-user-circle text-xl"></i><span>${displayName}</span><i class="fas fa-chevron-down text-xs"></i>
        </button>
        <div id="userDropdown" class="hidden absolute left-0 mt-2 w-48 glass rounded-xl shadow-lg z-50">
          <button onclick="navigateTo('my-orders');closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-teal-50"><i class="fas fa-clipboard-list me-2"></i>طلباتي</button>
          ${isAdminUser ? `<button onclick="navigateTo('admin');closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-teal-50"><i class="fas fa-cog me-2"></i>لوحة التحكم</button>` : ''}
          <button onclick="signOutUser();closeUserDropdown()" class="block w-full text-right px-4 py-2 hover:bg-red-50 text-red-600"><i class="fas fa-sign-out-alt me-2"></i>تسجيل الخروج</button>
        </div>
      </div>`;
    mobileAuthArea.innerHTML = `
      <span class="font-bold">${displayName}</span>
      <button onclick="navigateTo('my-orders');document.getElementById('mobileMenu').classList.add('hidden')" class="text-teal-600">طلباتي</button>
      ${isAdminUser ? `<button onclick="navigateTo('admin');document.getElementById('mobileMenu').classList.add('hidden')" class="text-teal-600">لوحة التحكم</button>` : ''}
      <button onclick="signOutUser();document.getElementById('mobileMenu').classList.add('hidden')" class="text-red-500 text-sm">تسجيل الخروج</button>`;
    adminBtns.forEach(btn => btn.style.display = isAdminUser ? 'flex' : 'none');
  } else {
    authArea.innerHTML = `
      <button onclick="openClientAuthModal()" class="text-sm font-semibold px-3 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50">دخول</button>
      <button onclick="openClientAuthModal(true)" class="btn-pri text-sm px-3 py-1.5">حساب جديد</button>`;
    mobileAuthArea.innerHTML = `
      <button onclick="openClientAuthModal();document.getElementById('mobileMenu').classList.add('hidden')" class="nav-link">تسجيل الدخول</button>
      <button onclick="openClientAuthModal(true);document.getElementById('mobileMenu').classList.add('hidden')" class="nav-link">حساب جديد</button>`;
    adminBtns.forEach(btn => btn.style.display = 'none');
  }
}

window.toggleUserDropdown = () => document.getElementById('userDropdown')?.classList.toggle('hidden');
window.closeUserDropdown = () => document.getElementById('userDropdown')?.classList.add('hidden');

// ---------- التنقل بين الصفحات (SPA) ----------
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.remove('hidden');
  state.currentPage = page;
  const isAdmin = page === 'admin';
  const header = document.getElementById('mainHeader');
  const footer = document.getElementById('mainFooter');
  if (header) header.style.display = isAdmin ? 'none' : '';
  if (footer) footer.style.display = isAdmin ? 'none' : '';

  // تحديث الروابط النشطة
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // تحقق من صلاحية الدخول
  if (page === 'admin') {
    if (!currentUser || !isAdminUser) {
      showToast('يجب تسجيل الدخول كمسؤول للوصول إلى لوحة التحكم');
      navigateTo('home');
      return;
    }
    const adminUserEl = document.getElementById('adminUserName');
    if (adminUserEl) adminUserEl.textContent = currentUser.displayName || currentUser.email;
    if (typeof switchAdminTab === 'function') switchAdminTab('products');
  }
  if (page === 'my-orders' && !currentUser) {
    showToast('يجب تسجيل الدخول لعرض طلباتك');
    navigateTo('home');
    return;
  }

  // تحميل بيانات الصفحة
  if (page === 'home') {
    if (typeof renderFeatured === 'function') renderFeatured();
    if (typeof initHeroSlider === 'function') initHeroSlider();
    if (typeof renderReviewsSlider === 'function') renderReviewsSlider();
  }
  if (page === 'shop') {
    if (typeof renderShop === 'function') renderShop();
    if (typeof setupSearchListener === 'function') setupSearchListener();
  }
  if (page === 'offers' && typeof renderOffers === 'function') renderOffers();
  if (page === 'cart' && typeof renderCartPage === 'function') renderCartPage();
  if (page === 'my-orders' && typeof renderMyOrders === 'function') renderMyOrders();
  
  // تحديث عنوان URL
  history.pushState(null, '', page === 'home' ? '/' : `/${page}`);
}

// التنقل عند تغير الهاش
function checkRoute() {
  const hash = window.location.hash.slice(1);
  if (hash) navigateTo(hash);
  else navigateTo('home');
}
window.addEventListener('hashchange', checkRoute);
window.addEventListener('popstate', () => {
  const path = window.location.pathname.slice(1) || 'home';
  navigateTo(path);
});

// ---------- دوال تحديث واجهة المنتجات ----------
function updateUIAfterProducts() {
  if (state.currentPage === 'home') {
    if (typeof renderFeatured === 'function') renderFeatured();
    if (typeof initHeroSlider === 'function') initHeroSlider();
    if (typeof renderReviewsSlider === 'function') renderReviewsSlider();
  }
  if (state.currentPage === 'shop' && typeof renderShop === 'function') renderShop();
  if (state.currentPage === 'offers' && typeof renderOffers === 'function') renderOffers();
  if (state.currentPage === 'admin') {
    if (typeof renderAdminProducts === 'function') renderAdminProducts();
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
  }
}

// ---------- دوال المصادقة (ربط مع firebase.js) ----------
function openClientAuthModal(signUp = false) {
  const modal = document.getElementById('clientAuthModal');
  if (!modal) return;
  // بناء المودال إذا لم يكن موجوداً (اختياري)
  modal.innerHTML = `
    <div class="glass-heavy p-8 w-11/12 max-w-md rounded-3xl">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-bold text-xl" style="color:var(--pri-d)">تسجيل الدخول / حساب جديد</h3>
        <button onclick="closeClientAuthModal()" class="p-1 rounded-lg hover:bg-slate-100"><i class="fas fa-times"></i></button>
      </div>
      <div id="authForm">
        <div class="mb-4"><label class="block text-sm font-semibold mb-1 text-slate-600">البريد الإلكتروني</label><input id="authEmail" type="email" class="w-full p-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:outline-none" placeholder="example@email.com"></div>
        <div class="mb-4 password-wrapper"><label class="block text-sm font-semibold mb-1 text-slate-600">كلمة المرور</label><input id="authPassword" type="password" class="w-full p-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:outline-none" placeholder="********"><i class="toggle-password fas fa-eye" onclick="togglePasswordVisibility('authPassword',this)"></i></div>
        <div id="extraFields" class="hidden">
          <div class="mb-4"><label class="block text-sm font-semibold mb-1 text-slate-600">الاسم الكامل</label><input id="authFullName" type="text" class="w-full p-3 rounded-xl border" placeholder="أدخل اسمك الكامل"></div>
          <div class="mb-4"><label class="block text-sm font-semibold mb-1 text-slate-600">رقم الجوال</label><input id="authPhone" type="tel" class="w-full p-3 rounded-xl border" placeholder="7XXXXXXXX"></div>
          <div class="mb-4"><label class="block text-sm font-semibold mb-1 text-slate-600">العنوان الافتراضي</label><input id="authAddress" type="text" class="w-full p-3 rounded-xl border" placeholder="المدينة - الحي - الشارع"></div>
        </div>
        <p id="authError" class="text-red-500 text-sm mb-3 hidden"></p>
        <div class="flex gap-3">
          <button onclick="signInHandler()" class="btn-pri flex-1">دخول</button>
          <button onclick="toggleSignUpMode()" id="signUpToggleBtn" class="flex-1 p-3 rounded-xl border border-teal-600 text-teal-700 font-bold hover:bg-teal-50 transition">إنشاء حساب</button>
        </div>
        <button id="signUpSubmitBtn" onclick="signUpHandler()" class="btn-pri w-full mt-3 hidden">إنشاء حساب جديد</button>
        <button onclick="closeClientAuthModal()" class="mt-3 text-sm text-slate-500 hover:underline w-full">إلغاء</button>
      </div>
    </div>
  `;
  modal.classList.add('show');
  document.getElementById('authError')?.classList.add('hidden');
  if (signUp) toggleSignUpMode(true);
  else {
    document.getElementById('extraFields')?.classList.add('hidden');
    document.getElementById('signUpSubmitBtn')?.classList.add('hidden');
    document.getElementById('signUpToggleBtn')?.classList.remove('hidden');
  }
}

function closeClientAuthModal() {
  document.getElementById('clientAuthModal')?.classList.remove('show');
}

function toggleSignUpMode(forceSignUp = false) {
  const extra = document.getElementById('extraFields');
  const signUpBtn = document.getElementById('signUpSubmitBtn');
  const toggleBtn = document.getElementById('signUpToggleBtn');
  if (!extra || !signUpBtn || !toggleBtn) return;
  if (forceSignUp || extra.classList.contains('hidden')) {
    extra.classList.remove('hidden');
    signUpBtn.classList.remove('hidden');
    toggleBtn.classList.add('hidden');
  } else {
    extra.classList.add('hidden');
    signUpBtn.classList.add('hidden');
    toggleBtn.classList.remove('hidden');
  }
}

window.signInHandler = function() {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPassword').value;
  if (!email || !pass) {
    document.getElementById('authError').textContent = 'يرجى إدخال البريد وكلمة المرور';
    document.getElementById('authError').classList.remove('hidden');
    return;
  }
  if (typeof signIn === 'function') signIn(email, pass);
};

window.signUpHandler = function() {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPassword').value;
  const name = document.getElementById('authFullName').value.trim();
  const phone = document.getElementById('authPhone').value.trim();
  const address = document.getElementById('authAddress').value.trim();
  if (!email || !pass || !name || !phone || !address) {
    document.getElementById('authError').textContent = 'جميع الحقول مطلوبة';
    document.getElementById('authError').classList.remove('hidden');
    return;
  }
  if (typeof signUp === 'function') signUp(email, pass, name, phone, address);
};

window.togglePasswordVisibility = (inputId, icon) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
};

// ---------- مودال مسؤول ----------
function openAdminAuthModal() {
  const modal = document.getElementById('adminAuthModal');
  if (!modal) return;
  modal.innerHTML = `
    <div class="glass-heavy p-8 w-11/12 max-w-sm text-center rounded-3xl">
      <div class="text-5xl mb-4"><i class="fas fa-lock"></i></div>
      <h3 class="font-bold text-xl mb-4" style="color:var(--pri-d)">دخول لوحة التحكم</h3>
      <input id="adminAuthEmail" type="email" class="w-full p-3 rounded-xl border mb-3" placeholder="البريد الإلكتروني">
      <div class="password-wrapper mb-3">
        <input id="adminAuthPass" type="password" class="w-full p-3 rounded-xl border" placeholder="كلمة المرور">
        <i class="toggle-password fas fa-eye" onclick="togglePasswordVisibility('adminAuthPass',this)"></i>
      </div>
      <p id="adminAuthErr" class="text-red-500 text-sm mb-3 hidden">بيانات الدخول غير صحيحة</p>
      <button onclick="authenticateAdminHandler()" class="btn-pri w-full">دخول</button>
      <button onclick="closeAdminAuthModal()" class="mt-3 text-sm text-slate-500 hover:underline">إلغاء</button>
    </div>
  `;
  modal.classList.add('show');
}
function closeAdminAuthModal() { document.getElementById('adminAuthModal')?.classList.remove('show'); }
window.authenticateAdminHandler = function() {
  const email = document.getElementById('adminAuthEmail').value.trim();
  const pass = document.getElementById('adminAuthPass').value;
  if (!email || !pass) {
    document.getElementById('adminAuthErr').textContent = 'يرجى إدخال البيانات';
    document.getElementById('adminAuthErr').classList.remove('hidden');
    return;
  }
  if (typeof authenticateAdmin === 'function') authenticateAdmin(email, pass);
};

// ---------- تفاصيل المنتج (صفحة مستقلة) ----------
window.openProductDetail = function(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  state.currentDetailProduct = p;
  const modal = document.getElementById('productDetailModal');
  const disc = calcDiscount(p.originalPrice, p.price);
  const stockStatus = getStockStatus(p);
  const images = p.images?.length ? p.images : (p.image ? [p.image] : []);
  let imagesHtml = images.length 
    ? `<div class="mb-4"><img id="mainProductImage" src="${images[0]}" class="w-full h-64 object-contain rounded-2xl bg-gray-100 p-4"></div>
       ${images.length > 1 ? `<div class="flex gap-2 overflow-x-auto pb-2">${images.map((img,i)=>`<img src="${img}" class="w-16 h-16 object-cover rounded-lg border-2 ${i===0?'border-teal-500':''}" onclick="document.getElementById('mainProductImage').src='${img}'">`).join('')}</div>`:''}`
    : `<div class="w-full h-64 flex items-center justify-center bg-gray-100 rounded-2xl text-6xl"><i class="fas fa-mobile-alt"></i></div>`;
  
  modal.innerHTML = `
    <div class="glass-heavy p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-auto rounded-3xl">
      <button onclick="closeProductDetail()" class="back-button mb-4"><i class="fas fa-arrow-right me-2"></i> رجوع</button>
      <div class="grid md:grid-cols-2 gap-6">
        <div>${imagesHtml}</div>
        <div>
          <h2 class="text-2xl font-black mb-2" style="color:var(--pri-d)">${p.name}</h2>
          <div class="my-4">
            ${p.originalPrice > p.price ? `<span class="price-old text-lg">${formatPrice(p.originalPrice, p.currency)}</span> <span class="badge-disc static inline-block mx-2">-${disc}%</span>` : ''}
            <span class="price-new text-2xl">${formatPrice(p.price, p.currency)}</span>
          </div>
          <p class="text-slate-600 mb-4">${p.description || 'لا يوجد وصف'}</p>
          <div class="space-y-2 text-sm mb-6">
            <div><i class="fas fa-box me-2"></i> ${stockStatus.text}</div>
            <div><i class="fas fa-tag me-2"></i> الفئة: ${p.category}</div>
            <div><i class="fas fa-credit-card me-2"></i> ${p.allowCOD ? 'الدفع عند الاستلام متاح' : 'غير متاح للدفع عند الاستلام'}</div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center border rounded-xl">
              <button onclick="changeDetailQty(-1)" class="px-3 py-2 text-xl">−</button>
              <span id="detailQty" class="w-12 text-center font-bold">1</span>
              <button onclick="changeDetailQty(1)" class="px-3 py-2 text-xl">+</button>
            </div>
            <button onclick="addToCartFromDetail('${p.id}')" class="btn-pri flex-1" ${p.stock<=0?'disabled':''}><i class="fas fa-cart-plus me-2"></i>أضف للسلة</button>
            <button onclick="buyNow('${p.id}')" class="bg-teal-700 text-white px-6 py-3 rounded-xl font-bold">شراء الآن</button>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('show');
};
window.closeProductDetail = () => document.getElementById('productDetailModal')?.classList.remove('show');
window.changeDetailQty = (delta) => {
  const span = document.getElementById('detailQty');
  if (!span) return;
  let val = parseInt(span.textContent) + delta;
  if (val < 1) val = 1;
  const p = state.currentDetailProduct;
  if (p && val > p.stock) { showToast('الكمية غير متوفرة'); return; }
  span.textContent = val;
};
window.addToCartFromDetail = (pid) => {
  const qty = parseInt(document.getElementById('detailQty').textContent);
  if (typeof addToCart === 'function') addToCart(pid, qty);
  closeProductDetail();
};
window.buyNow = (pid) => {
  if (typeof addToCartFromDetail === 'function') addToCartFromDetail(pid);
  navigateTo('cart');
};

// ---------- دوال الخريطة ----------
let map, mapMarker, locationCircle;
function openMapPicker() {
  const overlay = document.getElementById('mapOverlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div class="glass p-4 w-11/12 max-w-lg" style="max-height:85%">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold" style="color:var(--pri-d)"><i class="fas fa-map-marker-alt me-2"></i>حدد موقعك</h3>
        <button onclick="closeMapPicker()" class="p-1 rounded-lg hover:bg-slate-100"><i class="fas fa-times"></i></button>
      </div>
      <div id="mapContainer" style="height:300px;border-radius:12px;"></div>
      <div id="mapPreviewArea" class="map-preview text-slate-600"></div>
      <button onclick="confirmLocation()" class="btn-pri w-full mt-3">تأكيد الموقع</button>
    </div>
  `;
  overlay.classList.add('show');
  setTimeout(() => {
    if (!map) {
      map = L.map('mapContainer').setView([13.58, 44.02], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      map.on('click', e => {
        if (mapMarker) map.removeLayer(mapMarker);
        mapMarker = L.marker(e.latlng).addTo(map);
        state.selectedLocation = e.latlng;
        updateMapPreview(e.latlng);
      });
      // إضافة زر تحديد الموقع
      L.control.locate({position:'topright'}).addTo(map);
    } else {
      map.invalidateSize();
    }
    if (state.selectedLocation) {
      if (mapMarker) map.removeLayer(mapMarker);
      mapMarker = L.marker(state.selectedLocation).addTo(map);
      updateMapPreview(state.selectedLocation);
    }
  }, 200);
}
function closeMapPicker() { document.getElementById('mapOverlay')?.classList.remove('show'); }
function updateMapPreview(latlng) {
  const preview = document.getElementById('mapPreviewArea');
  if (!preview) return;
  const lat = latlng.lat.toFixed(6), lng = latlng.lng.toFixed(6);
  preview.innerHTML = `<i class="fas fa-map-pin" style="color:var(--pri)"></i> الإحداثيات: ${lat}, ${lng} <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="text-teal-600 text-sm"><i class="fas fa-external-link-alt"></i> عرض</a>`;
  const statusEl = document.getElementById('locationStatus');
  if (statusEl) statusEl.innerHTML = `✅ <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="text-teal-600 underline">عرض الموقع المحدد</a>`;
}
function confirmLocation() {
  if (state.selectedLocation) { closeMapPicker(); }
  else showToast('حدد موقعك أولاً');
}

// ---------- بدء التطبيق ----------
document.addEventListener('DOMContentLoaded', () => {
  initialLoad();
  checkRoute();
});
