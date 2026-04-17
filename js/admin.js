// لوحة التحكم: إدارة المنتجات والطلبات (بطاقات) والإعدادات والآراء

let bankAccounts = [];
let extraPaymentMethods = [];
let codMessage = 'سيتم الدفع عند استلام الطلب.';
let deliverySettings = { name: 'أحمد', phone: '777229775' };
let reviews = [];

const settingsRef = database.ref('settings');
const reviewsRef = database.ref('reviews');

function loadSettings() {
  bankAccounts = loadData('ahmadi_bank_accounts', []);
  extraPaymentMethods = loadData('ahmadi_extra_payment_methods', []);
  codMessage = loadData('ahmadi_cod_message', 'سيتم الدفع عند استلام الطلب.');
  deliverySettings = loadData('ahmadi_delivery', { name: 'أحمد', phone: '777229775' });
  reviews = loadData('ahmadi_reviews', []);
}

function setupSettingsListener() {
  settingsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.bankAccounts) { bankAccounts = data.bankAccounts; localStorage.setItem('ahmadi_bank_accounts', JSON.stringify(bankAccounts)); }
      if (data.extraPaymentMethods) { extraPaymentMethods = data.extraPaymentMethods; localStorage.setItem('ahmadi_extra_payment_methods', JSON.stringify(extraPaymentMethods)); }
      if (data.codMessage) { codMessage = data.codMessage; localStorage.setItem('ahmadi_cod_message', codMessage); }
      if (data.delivery) { deliverySettings = data.delivery; localStorage.setItem('ahmadi_delivery', JSON.stringify(deliverySettings)); }
    }
    if (state.currentPage === 'cart') { updateBankSelect(); renderExtraPaymentMethods(); }
    if (state.currentPage === 'admin' && !document.getElementById('admin-settings').classList.contains('hidden')) {
      renderBankAccountsList();
      renderExtraPaymentMethodsList();
    }
  });
  reviewsRef.on('value', (snapshot) => {
    reviews = snapshot.val() || [];
    localStorage.setItem('ahmadi_reviews', JSON.stringify(reviews));
    if (state.currentPage === 'home') renderReviewsSlider();
    if (state.currentPage === 'admin') renderAdminReviews();
  });
}

// عرض الطلبات كبطاقات في لوحة التحكم
function renderAdminOrders() {
  const container = document.getElementById('adminOrderCards'); // تأكد من وجود عنصر بالـ id هذا في HTML
  if (!container) {
    // قد يكون الجدول القديم موجوداً، سنقوم بإنشاء حاوية البطاقات
    const tab = document.getElementById('admin-orders');
    tab.innerHTML = `<h2 class="text-xl font-bold text-white mb-4"><i class="fas fa-truck me-2"></i>إدارة الطلبات</h2>
      <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button onclick="filterOrdersByStatus('all')" class="px-4 py-1.5 rounded-full glass text-sm font-semibold status-filter-btn active" data-status="all">الكل</button>
        <button onclick="filterOrdersByStatus('pending')" class="px-4 py-1.5 rounded-full glass text-sm font-semibold status-filter-btn" data-status="pending">قيد الانتظار</button>
        <button onclick="filterOrdersByStatus('confirmed')" class="px-4 py-1.5 rounded-full glass text-sm font-semibold status-filter-btn" data-status="confirmed">تم التأكيد</button>
        <button onclick="filterOrdersByStatus('out_for_delivery')" class="px-4 py-1.5 rounded-full glass text-sm font-semibold status-filter-btn" data-status="out_for_delivery">جاري التوصيل</button>
        <button onclick="filterOrdersByStatus('delivered')" class="px-4 py-1.5 rounded-full glass text-sm font-semibold status-filter-btn" data-status="delivered">تم التسليم</button>
        <button onclick="filterOrdersByStatus('cancelled')" class="px-4 py-1.5 rounded-full glass text-sm font-semibold status-filter-btn" data-status="cancelled">ملغي</button>
      </div>
      <div id="adminOrderCardsContainer" class="space-y-4"></div>`;
    renderAdminOrders();
    return;
  }
  let filtered = orders;
  if (state.ordersFilterStatus !== 'all') filtered = orders.filter(o => o.status === state.ordersFilterStatus);
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  let html = '';
  filtered.forEach(order => {
    const statusMap = { pending: 'قيد الانتظار', confirmed: 'تم التأكيد', out_for_delivery: 'جاري التوصيل', delivered: 'تم التسليم', cancelled: 'ملغي' };
    const statusText = statusMap[order.status];
    const totalsStr = Object.entries(order.totalsByCurrency).map(([cur, val]) => `${val.toLocaleString()} ${CUR_SYMBOLS[cur]}`).join(' + ');
    const locationLink = order.location ? `<a href="https://maps.google.com/?q=${order.location.lat},${order.location.lng}" target="_blank" class="text-teal-400"><i class="fas fa-map-marker-alt"></i> عرض الموقع</a>` : '';
    html += `<div class="order-card bg-gray-800 text-white">
      <div class="order-card-header">
        <div><span class="order-number text-teal-300">${order.orderNumber}</span> <span class="text-xs text-gray-400">${new Date(order.date).toLocaleString('ar')}</span></div>
        <span class="order-status-badge status-${order.status}">${statusText}</span>
      </div>
      <div class="text-sm"><i class="fas fa-user"></i> ${order.customer.name} | <i class="fas fa-phone"></i> <a href="tel:+967${order.customer.phone}" class="text-teal-300">${order.customer.phone}</a></div>
      <div class="text-sm mt-1"><i class="fas fa-map-pin"></i> ${order.customer.address}</div>
      <div class="text-sm mt-1"><i class="fas fa-credit-card"></i> ${order.paymentMethod === 'bank' ? 'تحويل بنكي' : (order.paymentMethod === 'extra' ? (order.extraPaymentDetails?.name || 'طريقة إضافية') : 'دفع عند الاستلام')}</div>
      <div class="text-sm mt-1 font-bold">الإجمالي: ${totalsStr}</div>
      <button onclick="toggleAdminOrderDetails('${order.id}')" class="text-teal-400 text-sm mt-2"><i class="fas fa-chevron-down"></i> عرض التفاصيل</button>
      <div id="adminOrderDetails_${order.id}" class="order-details-expanded hidden">
        <p class="font-semibold mt-2">المنتجات:</p>
        <ul class="list-disc list-inside text-sm">${order.items.map(i => `<li>${i.name} - ${i.qty} × ${formatPrice(i.price, i.currency)}</li>`).join('')}</ul>
        ${locationLink}
        <div class="flex flex-wrap gap-2 mt-3">
          ${order.status === 'pending' ? `<button onclick="updateOrderStatus('${order.id}', 'confirmed')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">تأكيد الطلب</button>` : ''}
          ${order.status === 'confirmed' ? `<button onclick="updateOrderStatus('${order.id}', 'out_for_delivery')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">بدء التوصيل</button>` : ''}
          ${order.status === 'out_for_delivery' ? `<button onclick="updateOrderStatus('${order.id}', 'delivered')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs">تأكيد الاستلام</button>` : ''}
          ${order.status !== 'cancelled' && order.status !== 'delivered' ? `<button onclick="updateOrderStatus('${order.id}', 'cancelled')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">إلغاء الطلب</button>` : ''}
          <button onclick="printWaybill('${order.id}')" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"><i class="fas fa-print"></i> طباعة</button>
          <button onclick="sendWhatsAppNotification('${order.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"><i class="fab fa-whatsapp"></i> واتساب</button>
        </div>
      </div>
    </div>`;
  });
  container.innerHTML = html || '<p class="text-slate-400 text-center py-8">لا توجد طلبات</p>';
}

function toggleAdminOrderDetails(orderId) {
  document.getElementById(`adminOrderDetails_${orderId}`).classList.toggle('hidden');
}

// ... دوال إدارة المنتجات والإعدادات والآراء (مماثلة للإصدار السابق مع تعديلات طفيفة)
