// ======================== الملف الرئيسي - تنسيق التنقل وبدء التطبيق ========================

// تعريف كائن app ليكون متاحاً عالمياً
window.app = {};

// دوال المصادقة
app.openClientAuthModal = function(signUp = false) {
  document.getElementById('clientAuthModal').classList.add('show');
  document.getElementById('authError').classList.add('hidden');
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  document.getElementById('authFullName').value = '';
  document.getElementById('authPhone').value = '';
  document.getElementById('authAddress').value = '';
  if (signUp) app.toggleSignUpMode(true);
  else {
    document.getElementById('extraFields').classList.add('hidden');
    document.getElementById('signUpSubmitBtn').classList.add('hidden');
    document.getElementById('signUpToggleBtn').classList.remove('hidden');
  }
};

app.closeClientAuthModal = function() {
  document.getElementById('clientAuthModal').classList.remove('show');
};

app.toggleSignUpMode = function(forceSignUp = false) {
  const extra = document.getElementById('extraFields');
  const signUpBtn = document.getElementById('signUpSubmitBtn');
  const toggleBtn = document.getElementById('signUpToggleBtn');
  if (forceSignUp || extra.classList.contains('hidden')) {
    extra.classList.remove('hidden');
    signUpBtn.classList.remove('hidden');
    toggleBtn.classList.add('hidden');
  } else {
    extra.classList.add('hidden');
    signUpBtn.classList.add('hidden');
    toggleBtn.classList.remove('hidden');
  }
};

app.signIn = async function() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  if (!email || !password) {
    document.getElementById('authError').textContent = 'يرجى إدخال البريد وكلمة المرور';
    document.getElementById('authError').classList.remove('hidden');
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, password);
    app.closeClientAuthModal();
    showToast('تم تسجيل الدخول بنجاح');
  } catch (error) {
    document.getElementById('authError').textContent = error.message;
    document.getElementById('authError').classList.remove('hidden');
  }
};

app.signUp = async function() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const fullName = document.getElementById('authFullName').value.trim();
  const phone = document.getElementById('authPhone').value.trim();
  const address = document.getElementById('authAddress').value.trim();
  if (!email || !password || !fullName || !phone || !address) {
    document.getElementById('authError').textContent = 'جميع الحقول مطلوبة';
    document.getElementById('authError').classList.remove('hidden');
    return;
  }
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await user.updateProfile({ displayName: fullName });
    await database.ref(`users/${user.uid}`).set({
      fullName, email, phone, address,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    app.closeClientAuthModal();
    showToast('تم إنشاء الحساب بنجاح');
  } catch (error) {
    document.getElementById('authError').textContent = error.message;
    document.getElementById('authError').classList.remove('hidden');
  }
};

app.signOut = async function() {
  try {
    await auth.signOut();
    showToast('تم تسجيل الخروج');
  } catch (error) {
    showToast('حدث خطأ: ' + error.message);
  }
};

app.openAdminAuthModal = function() {
  document.getElementById('adminAuthModal').classList.add('show');
  document.getElementById('adminAuthEmail').value = '';
  document.getElementById('adminAuthPass').value = '';
  document.getElementById('adminAuthErr').classList.add('hidden');
};

app.closeAdminAuthModal = function() {
  document.getElementById('adminAuthModal').classList.remove('show');
};

app.authenticateAdmin = async function() {
  const email = document.getElementById('adminAuthEmail').value.trim();
  const password = document.getElementById('adminAuthPass').value;
  const errorEl = document.getElementById('adminAuthErr');
  if (!email || !password) {
    errorEl.textContent = 'يرجى إدخال البريد وكلمة المرور';
    errorEl.classList.remove('hidden');
    return;
  }
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const snapshot = await database.ref(`users/${user.uid}/isAdmin`).once('value');
    const isAdmin = snapshot.val() === true;
    if (isAdmin) {
      window.appState.currentUser = user;
      window.appState.isAdminUser = true;
      app.closeAdminAuthModal();
      app.navigateTo('dashboard');
      showToast('مرحباً بك في لوحة التحكم');
    } else {
      await auth.signOut();
      errorEl.textContent = 'هذا الحساب ليس لديه صلاحية المسؤول';
      errorEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error('خطأ في تسجيل دخول المسؤول:', error);
    errorEl.textContent = 'بيانات الدخول غير صحيحة';
    errorEl.classList.remove('hidden');
  }
};

app.adminSignOut = function() {
  app.signOut();
  app.navigateTo('home');
};

app.toggleUserDropdown = function() {
  document.getElementById('userDropdown').classList.toggle('hidden');
};

app.closeUserDropdown = function() {
  document.getElementById('userDropdown').classList.add('hidden');
};

app.toggleMobileMenu = function() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
};

// التنقل
app.navigateTo = function(page) {
  // حفظ الصفحة السابقة للرجوع
  if (page !== 'product-detail' && window.appState.currentPage !== 'product-detail') {
    window.appState.previousPage = window.appState.currentPage;
  }
  
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.remove('hidden');
  window.appState.currentPage = page;
  
  // إظهار/إخفاء الهيدر والفوتر
  const isAdmin = page === 'dashboard';
  document.getElementById('mainHeader').style.display = isAdmin ? 'none' : '';
  document.getElementById('mainFooter').style.display = isAdmin ? 'none' : '';
  
  // تحديث الروابط النشطة
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) link.classList.add('active');
  });
  
  // تحديث hash
  if (page === 'home') window.location.hash = '/';
  else window.location.hash = '/' + page;
  
  // تحميل المحتوى
  if (page === 'dashboard') {
    if (!window.appState.currentUser || !window.appState.isAdminUser) {
      showToast('يجب تسجيل الدخول كمسؤول للوصول إلى لوحة التحكم');
      app.navigateTo('home');
      return;
    }
    document.getElementById('adminUserName').textContent = window.appState.currentUser.displayName || window.appState.currentUser.email;
    switchAdminTab('products');
  }
  if (page === 'my-orders' && !window.appState.currentUser) {
    showToast('يجب تسجيل الدخول لعرض طلباتك');
    app.navigateTo('home');
    return;
  }
  
  if (page === 'home') { renderFeatured(); initHeroSlider(); renderReviewsSlider(); }
  if (page === 'shop') renderShop();
  if (page === 'offers') renderOffers();
  if (page === 'cart') renderCart();
  if (page === 'my-orders') renderMyOrders();
  if (page === 'product-detail') {
    // تم ملء التفاصيل مسبقاً
  }
  
  app.toggleMobileMenu(); // إغلاق القائمة الجوال
};

app.goBack = function() {
  if (window.appState.previousPage) {
    app.navigateTo(window.appState.previousPage);
  } else {
    app.navigateTo('home');
  }
};

// دوال إضافية
app.togglePasswordVisibility = function(inputId, icon) {
  const input = document.getElementById(inputId);
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

// ربط دوال المنتجات والسلة والإدارة
app.addToCart = addToCart;
app.filterShop = filterShop;
app.openProductDetail = openProductDetail;
app.changeDetailQty = changeDetailQty;
app.addToCartFromDetail = addToCartFromDetail;
app.buyNow = buyNow;
app.changeQty = changeQty;
app.removeFromCart = removeFromCart;
app.togglePaymentMethod = togglePaymentMethod;
app.openMapPicker = openMapPicker;
app.closeMapPicker = closeMapPicker;
app.confirmLocation = confirmLocation;
app.placeOrder = placeOrder;
app.openReviewForm = openReviewForm;
app.closeReviewForm = closeReviewForm;
app.submitReviews = submitReviews;
app.switchAdminTab = switchAdminTab;
app.openBankAccountForm = openBankAccountForm;
app.closeBankAccountForm = closeBankAccountForm;
app.saveBankAccount = saveBankAccount;
app.toggleBankActive = toggleBankActive;
app.editBankAccount = editBankAccount;
app.openExtraPaymentForm = openExtraPaymentForm;
app.closeExtraPaymentForm = closeExtraPaymentForm;
app.saveExtraPayment = saveExtraPayment;
app.toggleExtraActive = toggleExtraActive;
app.editExtraPayment = editExtraPayment;
app.saveSettings = saveSettings;
app.filterOrdersByStatus = filterOrdersByStatus;
app.updateOrderStatus = updateOrderStatus;
app.printWaybill = printWaybill;
app.sendWhatsAppNotification = sendWhatsAppNotification;
app.toggleOrderDetails = toggleOrderDetails;
app.updateReviewStatus = updateReviewStatus;
app.deleteReview = deleteReview;
app.openProductForm = openProductForm;
app.addImageUrlField = addImageUrlField;
app.saveProduct = saveProduct;
app.editProduct = editProduct;
app.closeProductForm = closeProductForm;
app.requestDelete = requestDelete;
app.confirmDelete = confirmDelete;
app.cancelDelete = cancelDelete;

// سلايدر الهيرو
let currentSlide = 0, slideInterval, sliderPaused = false;
function initHeroSlider() {
  const offers = window.appState.products.filter(p => p.isOnSale && p.originalPrice > p.price);
  const container = document.getElementById('heroSliderContainer');
  const sliderSection = document.getElementById('heroSliderSection');
  if (offers.length === 0) {
    container.innerHTML = `<div class="text-center py-20 text-white"><h2 class="text-3xl font-black">مرحباً بكم في مركز الأحمدي</h2><p class="text-teal-100 mt-4">أفضل العروض على الجوالات ومستلزماتها</p></div>`;
    return;
  }
  
  function renderSlide(index) {
    const p = offers[index];
    const disc = calcDiscount(p.originalPrice, p.price);
    const primaryImage = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
    container.innerHTML = `<div class="flex flex-col md:flex-row items-center gap-6 glass-heavy p-6 md:p-10 text-white">
      <div class="flex-1 text-center md:text-right">
        <span class="inline-block bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold mb-3"><i class="fas fa-fire me-1"></i>عرض خاص -${disc}%</span>
        <h2 class="text-2xl md:text-4xl font-black mb-2">${p.name}</h2>
        <div class="flex items-center justify-center md:justify-start gap-4 mb-4">
          <span class="price-old text-white/70">${formatPrice(p.originalPrice, p.currency)}</span>
          <span class="price-new text-3xl md:text-4xl" style="color:#fff">${formatPrice(p.price, p.currency)}</span>
        </div>
        <button onclick="app.addToCart('${p.id}'); app.navigateTo('cart')" class="btn-pri text-lg px-8"><i class="fas fa-shopping-cart me-2"></i>تسوق الآن</button>
      </div>
      <div class="flex-1 flex justify-center">
        ${primaryImage ? `<img src="${primaryImage}" alt="${p.name}" class="max-h-56 object-contain rounded-2xl" style="filter:drop-shadow(0 8px 16px rgba(0,0,0,0.2))">` : `<div class="text-8xl"><i class="fas fa-mobile-alt"></i></div>`}
      </div>
    </div>`;
    updateDots(offers.length);
  }
  
  function updateDots(len) {
    let dotsHtml = '';
    for (let i = 0; i < len; i++) dotsHtml += `<span class="slider-dot ${i === currentSlide ? 'active' : ''}" onclick="app.goToSlide(${i})"></span>`;
    document.getElementById('sliderDots').innerHTML = dotsHtml;
  }
  
  app.goToSlide = (i) => { currentSlide = i; renderSlide(i); resetInterval(); };
  function nextSlide() { if (!sliderPaused) { currentSlide = (currentSlide + 1) % offers.length; renderSlide(currentSlide); } }
  function prevSlide() { currentSlide = (currentSlide - 1 + offers.length) % offers.length; renderSlide(currentSlide); resetInterval(); }
  function resetInterval() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 5000); }
  
  document.getElementById('sliderPrev').onclick = () => { prevSlide(); resetInterval(); };
  document.getElementById('sliderNext').onclick = () => { nextSlide(); resetInterval(); };
  sliderSection.onmouseenter = () => { sliderPaused = true; };
  sliderSection.onmouseleave = () => { sliderPaused = false; };
  
  renderSlide(0);
  resetInterval();
}

// دوال التقييم (نقلنا بعضها من orders.js)
function openReviewForm(orderId) {
  const order = window.appState.orders.find(o => o.id === orderId);
  if (!order) return;
  window.appState.reviewOrderId = orderId;
  const unreviewedItems = order.items.filter(item => {
    return !window.appState.reviews.some(r => r.orderId === orderId && r.productId === item.productId);
  });
  if (unreviewedItems.length === 0) {
    showToast('تم تقييم جميع المنتجات مسبقاً');
    return;
  }
  let formHtml = `<div class="space-y-4">`;
  unreviewedItems.forEach(item => {
    const product = window.appState.products.find(p => p.id === item.productId);
    formHtml += `<div class="border-b pb-3">
      <p class="font-bold mb-2">${product?.name || item.name}</p>
      <div class="mb-2"><label class="block text-sm mb-1">التقييم</label>
        <div class="flex gap-1 star-rating" data-product="${item.productId}">
          ${[1,2,3,4,5].map(n => `<i class="far fa-star cursor-pointer text-xl" onclick="app.setRating(this, '${item.productId}', ${n})" data-value="${n}"></i>`).join('')}
        </div>
        <input type="hidden" id="rating_${item.productId}" value="0">
      </div>
      <div><label class="block text-sm mb-1">تعليق (اختياري)</label>
        <textarea id="comment_${item.productId}" rows="2" class="w-full p-2 rounded-xl border" placeholder="اكتب رأيك..."></textarea>
      </div>
    </div>`;
  });
  formHtml += `<button onclick="app.submitReviews()" class="btn-pri w-full mt-4">حفظ التقييمات</button></div>`;
  document.getElementById('reviewFormContent').innerHTML = formHtml;
  document.getElementById('reviewFormOverlay').classList.add('show');
}

app.setRating = function(starElement, productId, value) {
  const parent = starElement.parentElement;
  const stars = parent.querySelectorAll('i');
  stars.forEach((star, index) => {
    if (index < value) {
      star.className = 'fas fa-star text-xl text-yellow-500';
    } else {
      star.className = 'far fa-star text-xl';
    }
  });
  document.getElementById(`rating_${productId}`).value = value;
};

app.submitReviews = async function() {
  const order = window.appState.orders.find(o => o.id === window.appState.reviewOrderId);
  if (!order) return;
  const unreviewedItems = order.items.filter(item => {
    return !window.appState.reviews.some(r => r.orderId === order.id && r.productId === item.productId);
  });
  const newReviews = [];
  for (let item of unreviewedItems) {
    const rating = parseInt(document.getElementById(`rating_${item.productId}`).value);
    if (!rating || rating < 1) {
      showToast(`يرجى تقييم ${item.name}`);
      return;
    }
    const comment = document.getElementById(`comment_${item.productId}`).value.trim();
    newReviews.push({
      id: generateId(),
      orderId: order.id,
      productId: item.productId,
      userId: window.appState.currentUser.uid,
      userName: window.appState.currentUser.displayName || window.appState.currentUser.email,
      rating: rating,
      comment: comment,
      status: 'pending',
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
  }
  const updatedReviews = [...window.appState.reviews];
  newReviews.forEach(r => updatedReviews.push(r));
  window.appState.reviews = updatedReviews;
  saveData('ahmadi_reviews', window.appState.reviews);
  app.closeReviewForm();
  renderMyOrders();
  showToast('تم إرسال التقييمات للمراجعة');
};

// البحث الحي
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (window.appState.currentPage === 'shop') {
        liveSearch(e.target.value);
      } else {
        // إذا لم نكن في صفحة المتجر، ننتقل إليها مع البحث
        app.navigateTo('shop');
        setTimeout(() => liveSearch(e.target.value), 50);
      }
    });
  }
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      if (window.appState.currentPage === 'shop') {
        liveSearch(e.target.value);
      } else {
        app.navigateTo('shop');
        setTimeout(() => liveSearch(e.target.value), 50);
      }
    });
  }
  
  // معالجة تغيير hash
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1); // إزالة #
    if (hash === '' || hash === '/') app.navigateTo('home');
    else if (hash === '/dashboard') app.navigateTo('dashboard');
    else if (hash.startsWith('/')) app.navigateTo(hash.slice(1));
  });
  
  // تحميل أولي
  initialLoadFromLocal();
  setupDataListeners();
  updateCartBadge();
  
  // تحديد الصفحة الأولية
  const hash = window.location.hash.slice(1);
  if (hash === '' || hash === '/') app.navigateTo('home');
  else if (hash === '/dashboard') app.navigateTo('dashboard');
  else if (hash.startsWith('/')) app.navigateTo(hash.slice(1));
  else app.navigateTo('home');
});
