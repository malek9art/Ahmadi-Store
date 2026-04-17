// إدارة المنتجات: جلب، إضافة، تعديل، حذف، إدارة المخزون، العملات، البحث

const RATES = { YER: 1, SAR: 140, USD: 530 };
const CUR_SYMBOLS = { YER: 'ر.ي', SAR: 'ر.س', USD: '$' };

let products = [];
const productsRef = database.ref('products');

// دوال مساعدة
function calcDiscount(orig, cur) { if (!orig || orig <= cur) return 0; return Math.round(((orig - cur) / orig) * 100); }
function toYER(amount, currency) { return amount * (RATES[currency] || 1); }
function formatPrice(p, cur) { return `${p.toLocaleString()} ${CUR_SYMBOLS[cur] || cur}`; }
function sanitizeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : (num < 0 ? 0 : num);
}
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// الحصول على المنتجات الافتراضية
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

// تحميل المنتجات من Firebase مع مستمع
function setupProductsListener() {
  productsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      products = data;
      localStorage.setItem('ahmadi_products', JSON.stringify(data));
    } else {
      products = getDefaultProducts();
      localStorage.setItem('ahmadi_products', JSON.stringify(products));
      if (currentUser && isAdminUser) productsRef.set(products);
    }
    updateUIAfterProducts();
  });
}

// حفظ المنتجات (يتم استدعاؤها من admin.js و cart.js)
function saveProducts() {
  localStorage.setItem('ahmadi_products', JSON.stringify(products));
  productsRef.set(products);
}

// دالة تحديث واجهة المستخدم بعد تغير المنتجات (تُعرَّف في main.js)
// function updateUIAfterProducts() سيتم تعريفها في main.js

// دوال عرض المنتجات (تُستخدم في main.js)
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
  const imgHtml = primaryImage ? `<img src="${primaryImage}" alt="${p.name}" loading="lazy" onerror="this.style.background='#e2e8f0'; this.src='';">` : `<div style="height:180px;display:flex;align-items:center;justify-content:center;font-size:64px;background:linear-gradient(145deg,#f0fdfa,#ccfbf1);border-radius:24px 24px 0 0"><i class="fas fa-mobile-alt"></i></div>`;
  return `<div class="card-product glass" onclick="openProductDetail('${p.id}')">
    <div class="relative">
      ${disc>0?`<span class="badge-disc"><i class="fas fa-tag me-1"></i>-${disc}%</span>`:''}
      <span class="stock-badge ${stockStatus.class}"><i class="fas fa-box me-1"></i>${stockStatus.text}</span>
      ${imgHtml}
    </div>
    <div class="p-4">
      <h3 class="font-bold text-md mb-2">${p.name}</h3>
      <div class="mb-3">
        ${p.originalPrice>p.price?`<span class="price-old">${formatPrice(p.originalPrice,p.currency)}</span><br>`:''}
        <span class="price-new">${formatPrice(p.price,p.currency)}</span>
      </div>
      <div class="add-to-cart-overlay" onclick="event.stopPropagation()">
        <button onclick="addToCart('${p.id}')" class="btn-pri w-full text-sm py-2.5" ${isOutOfStock?'disabled':''}>
          <i class="fas fa-cart-plus me-1"></i>${isOutOfStock?'نفذ المخزون':'أضف للسلة'}
        </button>
      </div>
    </div>
  </div>`;
}

// دالة البحث المباشر
function performLiveSearch(query) {
  const lowerQuery = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) || 
    (p.description && p.description.toLowerCase().includes(lowerQuery))
  );
}
