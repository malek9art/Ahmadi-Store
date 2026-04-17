// ======================== دوال المنتجات ========================

function getStockStatus(p) {
  if (p.stock <= 0) return { text: 'نفذ من المخزون', class: 'stock-out' };
  if (p.stock <= (p.lowStockThreshold || 4)) return { text: `سارع بالطلب - فقط ${p.stock} قطع`, class: 'stock-low' };
  return { text: 'متوفر', class: 'stock-in' };
}

function createProductCard(p) {
  const disc = calcDiscount(p.originalPrice, p.price);
  const primaryImage = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
  const stockStatus = getStockStatus(p);
  const isOutOfStock = p.stock <= 0;
  const imgHtml = primaryImage 
    ? `<img src="${primaryImage}" alt="${p.name}" loading="lazy" onerror="this.style.background='#e2e8f0'; this.src='';">` 
    : `<div style="height:180px;display:flex;align-items:center;justify-content:center;font-size:64px;background:linear-gradient(145deg,#f0fdfa,#ccfbf1);border-radius:24px 24px 0 0"><i class="fas fa-mobile-alt"></i></div>`;
  
  return `<div class="card-product glass" onclick="app.openProductDetail('${p.id}')">
    <div class="relative">
      ${disc > 0 ? `<span class="badge-disc"><i class="fas fa-tag me-1"></i>-${disc}%</span>` : ''}
      <span class="stock-badge ${stockStatus.class}"><i class="fas fa-box me-1"></i>${stockStatus.text}</span>
      ${imgHtml}
    </div>
    <div class="p-4">
      <h3 class="font-bold text-md mb-2">${p.name}</h3>
      <div class="mb-3">
        ${p.originalPrice > p.price ? `<span class="price-old">${formatPrice(p.originalPrice, p.currency)}</span><br>` : ''}
        <span class="price-new">${formatPrice(p.price, p.currency)}</span>
      </div>
      <div class="add-to-cart-overlay" onclick="event.stopPropagation()">
        <button onclick="app.addToCart('${p.id}')" class="btn-pri w-full text-sm py-2.5" ${isOutOfStock ? 'disabled' : ''}>
          <i class="fas fa-cart-plus me-1"></i>${isOutOfStock ? 'نفذ المخزون' : 'أضف للسلة'}
        </button>
      </div>
    </div>
  </div>`;
}

function renderFeatured() {
  const featured = window.appState.products.filter(p => p.featured);
  const grid = document.getElementById('featuredGrid');
  if (grid) {
    grid.innerHTML = featured.length ? featured.map(createProductCard).join('') : '<p class="text-slate-400 col-span-full text-center py-8">لا توجد عروض مميزة</p>';
  }
}

function filterShop(cat) {
  window.appState.shopCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.filter-btn[data-cat="${cat}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  renderShop();
}

function renderShop() {
  const filtered = window.appState.shopCategory === 'all' 
    ? window.appState.products 
    : window.appState.products.filter(p => p.category === window.appState.shopCategory);
  const grid = document.getElementById('shopGrid');
  if (grid) {
    grid.innerHTML = filtered.length ? filtered.map(createProductCard).join('') : '<p class="text-slate-400 col-span-full text-center py-8">لا توجد منتجات</p>';
  }
}

function renderOffers() {
  const offers = window.appState.products.filter(p => p.originalPrice > p.price);
  const grid = document.getElementById('offersGrid');
  if (grid) {
    grid.innerHTML = offers.length ? offers.map(createProductCard).join('') : '<p class="text-slate-400 col-span-full text-center py-8">لا توجد عروض</p>';
  }
}

// البحث الحي
function liveSearch(query) {
  const term = query.trim().toLowerCase();
  if (term === '') {
    renderShop();
    return;
  }
  const filtered = window.appState.products.filter(p => 
    p.name.toLowerCase().includes(term) || 
    (p.description && p.description.toLowerCase().includes(term))
  );
  const grid = document.getElementById('shopGrid');
  if (grid) {
    grid.innerHTML = filtered.length ? filtered.map(createProductCard).join('') : '<p class="text-slate-400 col-span-full text-center py-8">لا توجد نتائج</p>';
  }
}

// تحديث واجهة المستخدم بعد تحميل المنتجات
function updateUIAfterProducts() {
  if (window.appState.currentPage === 'home') { 
    renderFeatured(); 
    if (typeof initHeroSlider === 'function') initHeroSlider(); 
    renderReviewsSlider(); 
  }
  if (window.appState.currentPage === 'shop') renderShop();
  if (window.appState.currentPage === 'offers') renderOffers();
  if (window.appState.currentPage === 'dashboard') { 
    if (typeof renderAdminProducts === 'function') renderAdminProducts(); 
    if (typeof renderAdminOrdersCards === 'function') renderAdminOrdersCards(); 
    if (typeof renderAdminReviews === 'function') renderAdminReviews(); 
  }
}

// دوال تفاصيل المنتج
function openProductDetail(productId) {
  window.appState.previousPage = window.appState.currentPage;
  const p = window.appState.products.find(x => x.id === productId);
  if (!p) return;
  
  const disc = calcDiscount(p.originalPrice, p.price);
  const stockStatus = getStockStatus(p);
  const images = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);
  
  let imagesHtml = '';
  if (images.length) {
    imagesHtml = `<div class="mb-4"><img id="mainProductImage" src="${images[0]}" class="w-full h-64 object-contain rounded-2xl bg-gray-100 p-4"></div>`;
    if (images.length > 1) {
      imagesHtml += `<div class="flex gap-2 overflow-x-auto pb-2">`;
      images.forEach((img, idx) => {
        imagesHtml += `<img src="${img}" class="w-16 h-16 object-cover rounded-lg border-2 ${idx === 0 ? 'border-teal-500' : 'border-transparent'} cursor-pointer" onclick="document.getElementById('mainProductImage').src='${img}'">`;
      });
      imagesHtml += `</div>`;
    }
  } else {
    imagesHtml = `<div class="w-full h-64 flex items-center justify-center bg-gray-100 rounded-2xl text-6xl"><i class="fas fa-mobile-alt"></i></div>`;
  }
  
  const container = document.getElementById('productDetailContainer');
  container.innerHTML = `
    <div>
      <h2 class="text-2xl font-black mb-4" style="color:var(--pri-d)">${p.name}</h2>
      ${imagesHtml}
      <div class="my-4">
        ${p.originalPrice > p.price ? `<span class="price-old text-lg">${formatPrice(p.originalPrice, p.currency)}</span> <span class="badge-disc static inline-block mx-2">-${disc}%</span>` : ''}
        <span class="price-new text-2xl">${formatPrice(p.price, p.currency)}</span>
      </div>
      <p class="text-slate-600 mb-4">${p.description || 'لا يوجد وصف'}</p>
      <div class="flex items-center gap-4 mb-4 flex-wrap">
        <span class="stock-badge static ${stockStatus.class}">${stockStatus.text}</span>
        <span class="text-sm"><i class="fas fa-tag me-1"></i>الفئة: ${p.category}</span>
        <span class="text-sm"><i class="fas fa-credit-card me-1"></i>${p.allowCOD ? 'الدفع عند الاستلام متاح' : 'غير متاح للدفع عند الاستلام'}</span>
      </div>
      <div class="flex items-center gap-4 mt-6 flex-wrap">
        <div class="flex items-center border rounded-xl">
          <button onclick="app.changeDetailQty(-1)" class="px-3 py-2 text-xl">−</button>
          <span id="detailQty" class="w-12 text-center font-bold">1</span>
          <button onclick="app.changeDetailQty(1)" class="px-3 py-2 text-xl">+</button>
        </div>
        <button onclick="app.addToCartFromDetail('${p.id}')" class="btn-pri flex-1" ${p.stock <= 0 ? 'disabled' : ''}><i class="fas fa-cart-plus me-2"></i>أضف للسلة</button>
        <button onclick="app.buyNow('${p.id}')" class="bg-teal-700 text-white px-6 py-3 rounded-xl font-bold">شراء الآن</button>
      </div>
    </div>
  `;
  
  window.currentDetailProduct = p;
  app.navigateTo('product-detail');
}

function changeDetailQty(delta) {
  const span = document.getElementById('detailQty');
  let val = parseInt(span.textContent) + delta;
  if (val < 1) val = 1;
  const p = window.currentDetailProduct;
  if (p && val > p.stock) {
    showToast('الكمية غير متوفرة');
    return;
  }
  span.textContent = val;
}

function addToCartFromDetail(pid) {
  const qty = parseInt(document.getElementById('detailQty').textContent);
  const p = window.appState.products.find(x => x.id === pid);
  if (!p || p.stock <= 0) {
    showToast('المنتج غير متوفر');
    return;
  }
  const ex = window.appState.cart.find(c => c.id === pid);
  if (ex) {
    if (ex.qty + qty <= p.stock) ex.qty += qty;
    else {
      showToast('الكمية المطلوبة غير متوفرة');
      return;
    }
  } else {
    if (qty <= p.stock) window.appState.cart.push({ id: pid, qty });
    else {
      showToast('الكمية المطلوبة غير متوفرة');
      return;
    }
  }
  updateCartBadge();
  showToast('تمت الإضافة ✅');
  app.goBack();
}

function buyNow(pid) {
  addToCartFromDetail(pid);
  app.navigateTo('cart');
}
