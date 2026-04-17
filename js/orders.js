// دوال إنشاء الطلب، جلب الطلبات، تحديث حالة الطلب، طباعة البويصلة، إرسال واتساب

let orders = [];
const ordersRef = database.ref('orders');

function loadOrders() {
  const saved = localStorage.getItem('ahmadi_orders');
  if (saved) orders = JSON.parse(saved);
}

function saveOrders() {
  localStorage.setItem('ahmadi_orders', JSON.stringify(orders));
  ordersRef.set(orders);
}

function setupOrdersListener() {
  ordersRef.on('value', (snapshot) => {
    orders = snapshot.val() || [];
    localStorage.setItem('ahmadi_orders', JSON.stringify(orders));
    if (state.currentPage === 'admin') renderAdminOrders();
    if (state.currentPage === 'my-orders') renderMyOrders();
  });
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = orders.length + 1;
  const padded = count.toString().padStart(4, '0');
  return `AHM-${year}-${padded}`;
}

function placeOrder() {
  const name = document.getElementById('delName').value.trim();
  const phone = document.getElementById('delPhone').value.trim();
  const address = document.getElementById('delAddress').value.trim();
  if (!name || !phone || !address) { showToast('املأ بيانات التوصيل'); return; }
  const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentMethodEl) { showToast('اختر طريقة الدفع'); return; }
  const paymentMethodValue = paymentMethodEl.value;
  let paymentMethod = paymentMethodValue;
  let selectedBank = null, selectedExtra = null;
  if (paymentMethodValue === 'bank') {
    const bankId = document.getElementById('bankSelect').value;
    selectedBank = bankAccounts.find(b => b.id === bankId);
    if (!selectedBank) { showToast('الرجاء اختيار حساب بنكي'); return; }
  } else if (paymentMethodValue.startsWith('extra_')) {
    const extraId = paymentMethodValue.replace('extra_', '');
    selectedExtra = extraPaymentMethods.find(m => m.id === extraId);
    paymentMethod = 'extra';
  }
  // خصم المخزون
  for (let ci of cart) {
    const p = products.find(x => x.id === ci.id);
    if (p) {
      const currentStock = sanitizeNumber(p.stock, 0);
      const qty = sanitizeNumber(ci.qty, 0);
      if (currentStock < qty) { showToast(`المنتج ${p.name} غير متوفر بالكمية المطلوبة`); return; }
      p.stock = currentStock - qty;
    }
  }
  saveProducts();
  
  const totalsByCurrency = { YER: 0, SAR: 0, USD: 0 };
  const items = cart.map(ci => {
    const p = products.find(x => x.id === ci.id);
    if (p) {
      totalsByCurrency[p.currency] = (totalsByCurrency[p.currency] || 0) + p.price * ci.qty;
      return { name: p.name, price: p.price, currency: p.currency, qty: ci.qty, productId: p.id };
    }
    return null;
  }).filter(i => i);
  
  const order = {
    id: generateId(),
    orderNumber: generateOrderNumber(),
    date: new Date().toISOString(),
    customer: { name, phone, address },
    location: state.selectedLocation,
    items: items,
    totalsByCurrency: totalsByCurrency,
    status: 'pending',
    paymentMethod,
    bankDetails: selectedBank,
    extraPaymentDetails: selectedExtra,
    userId: currentUser ? currentUser.uid : null
  };
  orders.push(order);
  saveOrders();
  cart = []; state.selectedLocation = null;
  saveCart();
  ['delName','delPhone','delAddress'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('locationStatus').innerHTML = '';
  navigateTo('order-success');
}

// تحديث حالة الطلب
function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  saveOrders();
  renderAdminOrders();
  showToast(`تم تحديث حالة الطلب إلى ${newStatus}`);
}

// طباعة بويصلة
function printWaybill(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const itemsHtml = order.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${formatPrice(i.price, i.currency)}</td><td>${i.currency}</td></tr>`).join('');
  const totalsHtml = Object.entries(order.totalsByCurrency || {}).map(([cur, val]) => `<div>${val.toLocaleString()} ${CUR_SYMBOLS[cur]}</div>`).join('');
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  printWindow.document.write(`
    <html dir="rtl"><head><title>بويصلة شحن - ${order.orderNumber}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>body { font-family: 'Tajawal', sans-serif; padding: 20px; } @media print { .no-print { display: none; } }</style>
    </head><body><div class="max-w-4xl mx-auto border p-6 rounded-lg" id="printSection">
    <div class="flex items-center justify-between mb-6"><img src="https://i.ibb.co/XZxvN2gR/IMG-edit-1123054760450025.png" class="w-16 h-16 object-contain"><h2 class="text-2xl font-bold">بويصلة شحن</h2></div>
    <div class="grid grid-cols-2 gap-4 mb-4"><div><strong>رقم البويصلة:</strong> ${order.orderNumber}</div><div><strong>تاريخ الطلب:</strong> ${new Date(order.date).toLocaleString('ar')}</div><div><strong>العميل:</strong> ${order.customer.name}</div><div><strong>رقم الجوال:</strong> ${order.customer.phone}</div><div class="col-span-2"><strong>العنوان:</strong> ${order.customer.address}</div></div>
    <table class="w-full border mb-4"><thead><tr class="bg-gray-100"><th class="p-2">المنتج</th><th class="p-2">الكمية</th><th class="p-2">السعر</th><th class="p-2">العملة</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="mb-4"><strong>الإجماليات:</strong> ${totalsHtml}</div>
    <div class="flex justify-between items-end"><div id="qrcodeContainer"></div><div class="no-print"><button onclick="window.print()" class="bg-teal-600 text-white px-4 py-2 rounded">طباعة</button></div></div>
    </div><script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script><script>new QRCode(document.getElementById('qrcodeContainer'), {text: '${order.orderNumber}', width:100, height:100});<\/script></body></html>
  `);
  printWindow.document.close();
}

// إرسال واتساب
function sendWhatsAppNotification(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const itemsText = order.items.map(i => `• ${i.name} (${i.qty} × ${formatPrice(i.price, i.currency)})`).join('\n');
  const totalsText = Object.entries(order.totalsByCurrency || {}).map(([cur, val]) => `${val.toLocaleString()} ${CUR_SYMBOLS[cur]}`).join(' + ');
  const mapLink = order.location ? `https://maps.google.com/?q=${order.location.lat},${order.location.lng}` : 'غير محدد';
  const delivery = deliverySettings;
  const message = `🌟 *مركز الأحمدي - تفاصيل طلبك* 🌟\n\nمرحباً ${order.customer.name}،\nرقم الطلب: *${order.orderNumber}*\nتاريخ الطلب: ${new Date(order.date).toLocaleString('ar')}\n\n📦 *تفاصيل الطلب:*\n${itemsText}\n\n💰 *الإجمالي:* ${totalsText}\n📍 *عنوان التوصيل:* ${order.customer.address}\n🗺️ *رابط الموقع:* ${mapLink}\n\n🚚 *مندوب التوصيل:* ${delivery.name}\n📞 *للتواصل:* +967${delivery.phone}\n\nشكراً لثقتكم بمركز الأحمدي 🙏`;
  const encoded = encodeURIComponent(message);
  const phone = order.customer.phone.replace(/^0+/, '');
  window.open(`https://wa.me/967${phone}?text=${encoded}`, '_blank');
}

// عرض طلباتي (بطاقات)
function renderMyOrders() {
  if (!currentUser) return;
  const myOrders = orders.filter(o => o.userId === currentUser.uid);
  const container = document.getElementById('myOrdersList');
  if (myOrders.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 py-8">لا توجد طلبات سابقة</p>';
    return;
  }
  let html = '';
  myOrders.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(order => {
    const statusMap = { pending: 'قيد الانتظار', confirmed: 'تم التأكيد', out_for_delivery: 'جاري التوصيل', delivered: 'تم التسليم', cancelled: 'ملغي' };
    const statusText = statusMap[order.status] || order.status;
    const itemsList = order.items.map(i => `${i.name} (${i.qty})`).join('، ');
    const totalsHtml = Object.entries(order.totalsByCurrency || {}).map(([cur, val]) => `${val.toLocaleString()} ${CUR_SYMBOLS[cur]}`).join(' + ');
    html += `<div class="order-card">
      <div class="order-card-header">
        <div><h4 class="order-number">طلب رقم: ${order.orderNumber || order.id.slice(-8)}</h4><p class="text-xs text-slate-500">${new Date(order.date).toLocaleString('ar')}</p></div>
        <span class="order-status-badge status-${order.status}">${statusText}</span>
      </div>
      <p class="text-sm mb-2">${itemsList}</p>
      <p class="font-bold text-sm">الإجمالي: ${totalsHtml}</p>
      <button onclick="toggleOrderDetails('${order.id}')" class="text-teal-600 text-sm mt-2"><i class="fas fa-chevron-down"></i> عرض التفاصيل</button>
      <div id="orderDetails_${order.id}" class="order-details-expanded hidden">
        <p class="font-semibold mt-2">المنتجات:</p>
        <ul class="list-disc list-inside text-sm">${order.items.map(i => `<li>${i.name} - ${i.qty} × ${formatPrice(i.price, i.currency)}</li>`).join('')}</ul>
        <p class="mt-2"><i class="fas fa-map-marker-alt"></i> ${order.customer.address}</p>
        ${order.location ? `<a href="https://maps.google.com/?q=${order.location.lat},${order.location.lng}" target="_blank" class="text-teal-600 text-sm"><i class="fas fa-map"></i> عرض الموقع</a>` : ''}
        ${order.status === 'delivered' ? `<button onclick="openReviewForm('${order.id}')" class="btn-pri text-sm mt-3">تقييم المنتجات</button>` : ''}
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function toggleOrderDetails(orderId) {
  const el = document.getElementById(`orderDetails_${orderId}`);
  el.classList.toggle('hidden');
}
