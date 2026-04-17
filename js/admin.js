// ======================== دوال لوحة التحكم ========================

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
  document.getElementById('admin-' + tab).classList.remove('hidden');
  document.querySelectorAll('.admin-sidebar a').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.admin-sidebar a[onclick*="${tab}"]`);
  if (activeLink) activeLink.classList.add('active');

  if (tab === 'settings') {
    document.getElementById('deliveryNameInput').value = window.appState.deliverySettings.name;
    document.getElementById('deliveryPhoneInput').value = window.appState.deliverySettings.phone;
    document.getElementById('codMessageInput').value = window.appState.codMessage;
    renderBankAccountsList();
    renderExtraPaymentMethodsList();
  }
  if (tab === 'products') renderAdminProducts();
  if (tab === 'orders') renderAdminOrdersCards();
  if (tab === 'reviews') renderAdminReviews();
}

function renderBankAccountsList() {
  const container = document.getElementById('bankAccountsList');
  container.innerHTML = window.appState.bankAccounts.map(b => {
    const accStr = [];
    if (b.accounts?.YER) accStr.push(`YER: ${b.accounts.YER}`);
    if (b.accounts?.SAR) accStr.push(`SAR: ${b.accounts.SAR}`);
    if (b.accounts?.USD) accStr.push(`USD: ${b.accounts.USD}`);
    return `<div class="flex items-center justify-between bg-slate-800 p-3 rounded-xl">
      <div>
        <span class="font-bold text-white">${b.bankName}</span>
        <span class="text-slate-400 text-sm block">${b.accountName} - ${accStr.join(' | ')}</span>
        <span class="text-xs ${b.active ? 'text-green-400' : 'text-red-400'}">${b.active ? 'نشط' : 'معطل'}</span>
      </div>
      <div class="flex gap-2">
        <button onclick="app.editBankAccount('${b.id}')" class="text-blue-400"><i class="fas fa-edit"></i></button>
        <button onclick="app.toggleBankActive('${b.id}')" class="text-yellow-400"><i class="fas fa-power-off"></i></button>
        <button onclick="app.requestDelete('bank','${b.id}')" class="text-red-400"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function renderExtraPaymentMethodsList() {
  const container = document.getElementById('extraPaymentMethodsList');
  container.innerHTML = window.appState.extraPaymentMethods.map(m => `
    <div class="flex items-center justify-between bg-slate-800 p-3 rounded-xl">
      <div>
        <span class="font-bold text-white">${m.name}</span>
        <span class="text-slate-400 text-sm block">${m.accountId} - ${m.owner}</span>
        <span class="text-xs ${m.active ? 'text-green-400' : 'text-red-400'}">${m.active ? 'نشط' : 'معطل'}</span>
      </div>
      <div class="flex gap-2">
        <button onclick="app.editExtraPayment('${m.id}')" class="text-blue-400"><i class="fas fa-edit"></i></button>
        <button onclick="app.toggleExtraActive('${m.id}')" class="text-yellow-400"><i class="fas fa-power-off"></i></button>
        <button onclick="app.requestDelete('extra','${m.id}')" class="text-red-400"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function openBankAccountForm(id = null) {
  window.appState.editingBankId = id;
  const bank = id ? window.appState.bankAccounts.find(b => b.id === id) : null;
  document.getElementById('bankFormTitle').textContent = id ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي';
  document.getElementById('bankAccountFormContent').innerHTML = `
    <div class="space-y-3">
      <input id="bankName" class="w-full p-3 rounded-xl border" placeholder="اسم البنك" value="${bank?.bankName || ''}">
      <input id="accountName" class="w-full p-3 rounded-xl border" placeholder="اسم صاحب الحساب" value="${bank?.accountName || ''}">
      <input id="accYER" class="w-full p-3 rounded-xl border" placeholder="رقم الحساب (ريال يمني)" value="${bank?.accounts?.YER || ''}">
      <input id="accSAR" class="w-full p-3 rounded-xl border" placeholder="رقم الحساب (ريال سعودي)" value="${bank?.accounts?.SAR || ''}">
      <input id="accUSD" class="w-full p-3 rounded-xl border" placeholder="رقم الحساب (دولار)" value="${bank?.accounts?.USD || ''}">
      <input id="iban" class="w-full p-3 rounded-xl border" placeholder="IBAN (اختياري)" value="${bank?.iban || ''}">
      <label class="flex items-center gap-2"><input type="checkbox" id="bankActive" ${bank?.active ? 'checked' : ''}> نشط</label>
      <button onclick="app.saveBankAccount()" class="btn-pri w-full">حفظ</button>
    </div>
  `;
  document.getElementById('bankAccountFormOverlay').classList.add('show');
}

function closeBankAccountForm() {
  document.getElementById('bankAccountFormOverlay').classList.remove('show');
}

function saveBankAccount() {
  const name = document.getElementById('bankName').value.trim();
  const accountName = document.getElementById('accountName').value.trim();
  const accYER = document.getElementById('accYER').value.trim();
  const accSAR = document.getElementById('accSAR').value.trim();
  const accUSD = document.getElementById('accUSD').value.trim();
  if (!name || !accountName || (!accYER && !accSAR && !accUSD)) {
    showToast('يرجى إدخال اسم البنك واسم الحساب ورقم حساب واحد على الأقل');
    return;
  }
  const bank = {
    id: window.appState.editingBankId || generateId(),
    bankName: name,
    accountName,
    accounts: { YER: accYER, SAR: accSAR, USD: accUSD },
    iban: document.getElementById('iban').value.trim(),
    active: document.getElementById('bankActive').checked
  };
  if (window.appState.editingBankId) {
    const idx = window.appState.bankAccounts.findIndex(b => b.id === window.appState.editingBankId);
    if (idx !== -1) window.appState.bankAccounts[idx] = bank;
  } else {
    window.appState.bankAccounts.push(bank);
  }
  saveData('ahmadi_bank_accounts', window.appState.bankAccounts);
  closeBankAccountForm();
  renderBankAccountsList();
  showToast('تم الحفظ');
}

function toggleBankActive(id) {
  const bank = window.appState.bankAccounts.find(b => b.id === id);
  if (bank) {
    bank.active = !bank.active;
    saveData('ahmadi_bank_accounts', window.appState.bankAccounts);
    renderBankAccountsList();
  }
}

function editBankAccount(id) {
  openBankAccountForm(id);
}

function openExtraPaymentForm(id = null) {
  window.appState.editingExtraId = id;
  const method = id ? window.appState.extraPaymentMethods.find(m => m.id === id) : null;
  document.getElementById('extraFormTitle').textContent = id ? 'تعديل طريقة دفع' : 'إضافة طريقة دفع';
  document.getElementById('extraPaymentFormContent').innerHTML = `
    <div class="space-y-3">
      <input id="extraName" class="w-full p-3 rounded-xl border" placeholder="اسم الطريقة (مثلاً: حاسب كريمي)" value="${method?.name || ''}">
      <input id="extraAccountId" class="w-full p-3 rounded-xl border" placeholder="رقم الحساب أو المعرف" value="${method?.accountId || ''}">
      <input id="extraOwner" class="w-full p-3 rounded-xl border" placeholder="اسم صاحب الحساب" value="${method?.owner || ''}">
      <label class="flex items-center gap-2"><input type="checkbox" id="extraActive" ${method?.active ? 'checked' : ''}> نشط</label>
      <button onclick="app.saveExtraPayment()" class="btn-pri w-full">حفظ</button>
    </div>
  `;
  document.getElementById('extraPaymentFormOverlay').classList.add('show');
}

function closeExtraPaymentForm() {
  document.getElementById('extraPaymentFormOverlay').classList.remove('show');
}

function saveExtraPayment() {
  const name = document.getElementById('extraName').value.trim();
  const accountId = document.getElementById('extraAccountId').value.trim();
  const owner = document.getElementById('extraOwner').value.trim();
  if (!name || !accountId || !owner) {
    showToast('جميع الحقول مطلوبة');
    return;
  }
  const method = {
    id: window.appState.editingExtraId || generateId(),
    name, accountId, owner,
    active: document.getElementById('extraActive').checked
  };
  if (window.appState.editingExtraId) {
    const idx = window.appState.extraPaymentMethods.findIndex(m => m.id === window.appState.editingExtraId);
    if (idx !== -1) window.appState.extraPaymentMethods[idx] = method;
  } else {
    window.appState.extraPaymentMethods.push(method);
  }
  saveData('ahmadi_extra_payment_methods', window.appState.extraPaymentMethods);
  closeExtraPaymentForm();
  renderExtraPaymentMethodsList();
  showToast('تم الحفظ');
}

function toggleExtraActive(id) {
  const m = window.appState.extraPaymentMethods.find(m => m.id === id);
  if (m) {
    m.active = !m.active;
    saveData('ahmadi_extra_payment_methods', window.appState.extraPaymentMethods);
    renderExtraPaymentMethodsList();
  }
}

function editExtraPayment(id) {
  openExtraPaymentForm(id);
}

function saveSettings() {
  window.appState.deliverySettings = {
    name: document.getElementById('deliveryNameInput').value,
    phone: document.getElementById('deliveryPhoneInput').value
  };
  window.appState.codMessage = document.getElementById('codMessageInput').value;
  saveData('ahmadi_delivery', window.appState.deliverySettings);
  saveData('ahmadi_cod_message', window.appState.codMessage);
  showToast('تم حفظ الإعدادات ✅');
}

function renderAdminProducts() {
  const tbody = document.getElementById('adminProductTable');
  tbody.innerHTML = window.appState.products.map(p => {
    const primaryImage = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
    const disc = calcDiscount(p.originalPrice, p.price);
    const stockStatus = getStockStatus(p);
    return `<tr class="border-b border-slate-700">
      <td class="p-3"><div class="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">${primaryImage ? `<img src="${primaryImage}" class="w-full h-full object-contain p-1">` : '<i class="fas fa-image"></i>'}</div></td>
      <td class="p-3">${p.name}</td><td class="p-3">${p.currency}</td>
      <td class="p-3">${formatPrice(p.price, p.currency)}</td><td class="p-3">${p.originalPrice ? formatPrice(p.originalPrice, p.currency) : '-'}</td>
      <td class="p-3">${disc}%</td><td class="p-3">${p.stock}</td>
      <td class="p-3 ${stockStatus.class}">${stockStatus.text}</td>
      <td class="p-3"><button onclick="app.editProduct('${p.id}')" class="text-blue-400 me-2"><i class="fas fa-edit"></i></button><button onclick="app.requestDelete('product','${p.id}')" class="text-red-400"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join('');
}

function filterOrdersByStatus(status) {
  window.appState.ordersFilterStatus = status;
  document.querySelectorAll('.status-filter-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.status-filter-btn[data-status="${status}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  renderAdminOrdersCards();
}

function renderAdminOrdersCards() {
  const container = document.getElementById('adminOrdersCards');
  let filteredOrders = window.appState.orders;
  if (window.appState.ordersFilterStatus !== 'all') {
    filteredOrders = window.appState.orders.filter(o => o.status === window.appState.ordersFilterStatus);
  }
  if (filteredOrders.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center col-span-full py-8">لا توجد طلبات</p>';
    return;
  }
  
  let html = '';
  filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(order => {
    const statusMap = {
      pending: 'قيد الانتظار', confirmed: 'تم التأكيد', out_for_delivery: 'جاري التوصيل',
      delivered: 'تم التسليم', cancelled: 'ملغي'
    };
    const statusText = statusMap[order.status] || order.status;
    const statusClass = {
      pending: 'status-pending', confirmed: 'status-confirmed', out_for_delivery: 'status-out_for_delivery',
      delivered: 'status-delivered', cancelled: 'status-cancelled'
    }[order.status] || '';
    const totalsHtml = Object.entries(order.totalsByCurrency || {}).map(([cur, val]) => `${val.toLocaleString()} ${CUR_SYMBOLS[cur]}`).join(' + ');
    const locationLink = order.location ? `<a href="https://maps.google.com/?q=${order.location.lat},${order.location.lng}" target="_blank" class="text-teal-400 text-sm"><i class="fas fa-map-marker-alt"></i> عرض الموقع</a>` : '';
    
    let actions = '';
    if (order.status === 'pending') {
      actions += `<button onclick="app.updateOrderStatus('${order.id}', 'confirmed')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs"><i class="fas fa-check me-1"></i>تأكيد الطلب</button>`;
    }
    if (order.status === 'confirmed') {
      actions += `<button onclick="app.updateOrderStatus('${order.id}', 'out_for_delivery')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs"><i class="fas fa-truck me-1"></i>بدء التوصيل</button>`;
    }
    if (order.status === 'out_for_delivery') {
      actions += `<button onclick="app.updateOrderStatus('${order.id}', 'delivered')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs"><i class="fas fa-check-double me-1"></i>تأكيد الاستلام</button>`;
    }
    if (order.status !== 'cancelled' && order.status !== 'delivered') {
      actions += `<button onclick="app.updateOrderStatus('${order.id}', 'cancelled')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs"><i class="fas fa-times me-1"></i>إلغاء</button>`;
    }
    actions += `<button onclick="app.printWaybill('${order.id}')" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs"><i class="fas fa-print me-1"></i>طباعة</button>`;
    actions += `<button onclick="app.sendWhatsAppNotification('${order.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs"><i class="fab fa-whatsapp me-1"></i>واتساب</button>`;
    
    html += `<div class="order-card">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-bold text-white text-lg">طلب #${order.orderNumber || order.id.slice(-8)}</h3>
          <p class="text-xs text-slate-400">${new Date(order.date).toLocaleString('ar')}</p>
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="text-sm text-slate-300 mb-2">
        <p><i class="fas fa-user me-1"></i> ${order.customer.name}</p>
        <p><i class="fas fa-phone me-1"></i> <a href="tel:+967${order.customer.phone}" class="text-teal-400">${order.customer.phone}</a></p>
        <p><i class="fas fa-map-marker-alt me-1"></i> ${order.customer.address}</p>
        ${locationLink}
      </div>
      <div class="text-sm mb-2">
        <span class="font-semibold">الإجمالي:</span> ${totalsHtml}
      </div>
      <div class="flex flex-wrap gap-2 mt-3">
        ${actions}
        <button onclick="app.toggleOrderDetails('${order.id}')" class="text-teal-400 text-sm underline">عرض التفاصيل</button>
      </div>
      <div id="orderDetails-${order.id}" class="hidden mt-4 pt-3 border-t border-slate-700">
        <!-- سيتم ملؤها عند الطلب -->
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function toggleOrderDetails(orderId) {
  const detailsDiv = document.getElementById(`orderDetails-${orderId}`);
  if (!detailsDiv) return;
  if (detailsDiv.classList.contains('hidden')) {
    const order = window.appState.orders.find(o => o.id === orderId);
    if (!order) return;
    let itemsHtml = `<table class="w-full text-xs"><thead><tr><th class="p-1">المنتج</th><th class="p-1">الكمية</th><th class="p-1">السعر</th></tr></thead><tbody>`;
    order.items.forEach(item => {
      itemsHtml += `<tr><td class="p-1">${item.name}</td><td class="p-1">${item.qty}</td><td class="p-1">${formatPrice(item.price, item.currency)}</td></tr>`;
    });
    itemsHtml += `</tbody></table>`;
    const address = order.customer.address;
    const locationLink = order.location ? `<a href="https://maps.google.com/?q=${order.location.lat},${order.location.lng}" target="_blank" class="text-teal-400">عرض على الخريطة</a>` : '';
    detailsDiv.innerHTML = `
      <h4 class="font-bold text-white mb-2">المنتجات المطلوبة:</h4>
      ${itemsHtml}
      <p class="mt-3"><strong>العنوان:</strong> ${address} ${locationLink}</p>
    `;
    detailsDiv.classList.remove('hidden');
  } else {
    detailsDiv.classList.add('hidden');
  }
}

function updateOrderStatus(orderId, newStatus) {
  const order = window.appState.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  saveData('ahmadi_orders', window.appState.orders);
  renderAdminOrdersCards();
  showToast(`تم تحديث حالة الطلب`);
}

function printWaybill(orderId) {
  const order = window.appState.orders.find(o => o.id === orderId);
  if (!order) return;
  const itemsHtml = order.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${formatPrice(i.price, i.currency)}</td><td>${i.currency}</td></tr>`).join('');
  const totalsHtml = Object.entries(order.totalsByCurrency || {}).map(([cur, val]) => `<div>${val.toLocaleString()} ${CUR_SYMBOLS[cur]}</div>`).join('');
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  printWindow.document.write(`
    <html dir="rtl">
      <head><title>بويصلة شحن - ${order.orderNumber}</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>body { font-family: 'Tajawal', sans-serif; padding: 20px; } @media print { .no-print { display: none; } }</style>
      </head>
      <body>
        <div class="max-w-4xl mx-auto border p-6 rounded-lg" id="printSection">
          <div class="flex items-center justify-between mb-6">
            <img src="https://i.ibb.co/XZxvN2gR/IMG-edit-1123054760450025.png" class="w-16 h-16 object-contain">
            <h2 class="text-2xl font-bold">بويصلة شحن</h2>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><strong>رقم البويصلة:</strong> ${order.orderNumber}</div>
            <div><strong>تاريخ الطلب:</strong> ${new Date(order.date).toLocaleString('ar')}</div>
            <div><strong>العميل:</strong> ${order.customer.name}</div>
            <div><strong>رقم الجوال:</strong> ${order.customer.phone}</div>
            <div class="col-span-2"><strong>العنوان:</strong> ${order.customer.address}</div>
          </div>
          <table class="w-full border mb-4">
            <thead><tr class="bg-gray-100"><th class="p-2">المنتج</th><th class="p-2">الكمية</th><th class="p-2">السعر</th><th class="p-2">العملة</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="mb-4"><strong>الإجماليات:</strong> ${totalsHtml}</div>
          <div class="flex justify-between items-end">
            <div id="qrcodeContainer"></div>
            <div class="no-print"><button onclick="window.print()" class="bg-teal-600 text-white px-4 py-2 rounded">طباعة</button></div>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
        <script>
          new QRCode(document.getElementById('qrcodeContainer'), {
            text: '${order.orderNumber}',
            width: 100, height: 100
          });
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function sendWhatsAppNotification(orderId) {
  const order = window.appState.orders.find(o => o.id === orderId);
  if (!order) return;
  const itemsText = order.items.map(i => `• ${i.name} (${i.qty} × ${formatPrice(i.price, i.currency)})`).join('\n');
  const totalsText = Object.entries(order.totalsByCurrency || {}).map(([cur, val]) => `${val.toLocaleString()} ${CUR_SYMBOLS[cur]}`).join(' + ');
  const mapLink = order.location ? `https://maps.google.com/?q=${order.location.lat},${order.location.lng}` : 'غير محدد';
  const delivery = window.appState.deliverySettings;
  const message = `🌟 *مركز الأحمدي - تفاصيل طلبك* 🌟\n\n` +
    `مرحباً ${order.customer.name}،\n` +
    `رقم الطلب: *${order.orderNumber}*\n` +
    `تاريخ الطلب: ${new Date(order.date).toLocaleString('ar')}\n\n` +
    `📦 *تفاصيل الطلب:*\n${itemsText}\n\n` +
    `💰 *الإجمالي:* ${totalsText}\n` +
    `📍 *عنوان التوصيل:* ${order.customer.address}\n` +
    `🗺️ *رابط الموقع:* ${mapLink}\n\n` +
    `🚚 *مندوب التوصيل:* ${delivery.name}\n` +
    `📞 *للتواصل:* +967${delivery.phone}\n\n` +
    `شكراً لثقتكم بمركز الأحمدي 🙏`;
  const encoded = encodeURIComponent(message);
  const phone = order.customer.phone.replace(/^0+/, '');
  window.open(`https://wa.me/967${phone}?text=${encoded}`, '_blank');
}

function renderAdminReviews() {
  const tbody = document.getElementById('adminReviewsTable');
  if (window.appState.reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-400">لا توجد آراء</td></tr>';
    return;
  }
  let html = '';
  window.appState.reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(rev => {
    const product = window.appState.products.find(p => p.id === rev.productId);
    const statusText = rev.status === 'pending' ? 'قيد المراجعة' : rev.status === 'approved' ? 'مقبول' : 'مرفوض';
    const statusColor = rev.status === 'pending' ? 'text-yellow-400' : rev.status === 'approved' ? 'text-green-400' : 'text-red-400';
    const starsHtml = Array(5).fill(0).map((_, i) => i < rev.rating ? '<i class="fas fa-star text-yellow-500"></i>' : '<i class="far fa-star text-yellow-500"></i>').join('');
    const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('ar') : '';
    let actions = '';
    if (rev.status === 'pending') {
      actions += `<button onclick="app.updateReviewStatus('${rev.id}', 'approved')" class="text-green-400 mr-2"><i class="fas fa-check"></i></button>`;
      actions += `<button onclick="app.updateReviewStatus('${rev.id}', 'rejected')" class="text-red-400 mr-2"><i class="fas fa-times"></i></button>`;
    }
    actions += `<button onclick="app.deleteReview('${rev.id}')" class="text-gray-400"><i class="fas fa-trash"></i></button>`;
    html += `<tr class="border-b border-slate-700">
      <td class="p-2">${rev.userName || 'عميل'}</td>
      <td class="p-2">${product?.name || rev.productId}</td>
      <td class="p-2">${starsHtml}</td>
      <td class="p-2">${rev.comment || '-'}</td>
      <td class="p-2 ${statusColor}">${statusText}</td>
      <td class="p-2">${dateStr}</td>
      <td class="p-2">${actions}</td>
    </tr>`;
  });
  tbody.innerHTML = html;
}

function updateReviewStatus(reviewId, newStatus) {
  const review = window.appState.reviews.find(r => r.id === reviewId);
  if (review) {
    review.status = newStatus;
    saveData('ahmadi_reviews', window.appState.reviews);
    renderAdminReviews();
    if (window.appState.currentPage === 'home') renderReviewsSlider();
    showToast(`تم تحديث حالة التقييم`);
  }
}

function deleteReview(reviewId) {
  window.appState.reviews = window.appState.reviews.filter(r => r.id !== reviewId);
  saveData('ahmadi_reviews', window.appState.reviews);
  renderAdminReviews();
  if (window.appState.currentPage === 'home') renderReviewsSlider();
  showToast('تم حذف التقييم');
}

// دوال المنتجات (نموذج الإضافة/التعديل)
function openProductForm(id = null) {
  window.appState.editingProductId = id;
  const p = id ? window.appState.products.find(x => x.id === id) : null;
  document.getElementById('productFormTitle').textContent = id ? 'تعديل منتج' : 'إضافة منتج جديد';
  let html = `
    <div class="space-y-3">
      <input id="prodName" class="w-full p-3 rounded-xl border" placeholder="اسم المنتج (عربي)" value="${p?.name || ''}">
      <textarea id="prodDesc" class="w-full p-3 rounded-xl border" placeholder="وصف المنتج">${p?.description || ''}</textarea>
      <select id="prodCurrency" class="w-full p-3 rounded-xl border">
        <option value="YER" ${p?.currency === 'YER' ? 'selected' : ''}>ريال يمني (YER)</option>
        <option value="SAR" ${p?.currency === 'SAR' ? 'selected' : ''}>ريال سعودي (SAR)</option>
        <option value="USD" ${p?.currency === 'USD' ? 'selected' : ''}>دولار أمريكي (USD)</option>
      </select>
      <input id="prodPrice" type="number" step="0.01" class="w-full p-3 rounded-xl border" placeholder="السعر الحالي" value="${p?.price || ''}">
      <input id="prodOriginalPrice" type="number" step="0.01" class="w-full p-3 rounded-xl border" placeholder="السعر الأصلي (اختياري)" value="${p?.originalPrice || ''}">
      <label class="flex items-center gap-2"><input type="checkbox" id="prodFeatured" ${p?.featured ? 'checked' : ''}> عرض مميز</label>
      <label class="flex items-center gap-2"><input type="checkbox" id="prodAllowCOD" ${p?.allowCOD !== false ? 'checked' : ''}> إمكانية الدفع عند الاستلام</label>
      <input id="prodStock" type="number" class="w-full p-3 rounded-xl border" placeholder="كمية المخزون" value="${p?.stock || 0}">
      <input id="prodThreshold" type="number" class="w-full p-3 rounded-xl border" placeholder="حد التنبيه (افتراضي 4)" value="${p?.lowStockThreshold || 4}">
      <select id="prodCategory" class="w-full p-3 rounded-xl border">
        <option value="جوالات" ${p?.category === 'جوالات' ? 'selected' : ''}>جوالات</option>
        <option value="اكسسوارات" ${p?.category === 'اكسسوارات' ? 'selected' : ''}>اكسسوارات</option>
        <option value="صيانة" ${p?.category === 'صيانة' ? 'selected' : ''}>صيانة</option>
      </select>
      <div><label class="block font-semibold mb-1">روابط الصور</label><div id="imageUrlsContainer"></div><button type="button" onclick="app.addImageUrlField()" class="text-sm text-teal-600"><i class="fas fa-plus"></i> إضافة رابط صورة</button></div>
      <button onclick="app.saveProduct()" class="btn-pri w-full">حفظ المنتج</button>
    </div>
  `;
  document.getElementById('productFormContent').innerHTML = html;
  const container = document.getElementById('imageUrlsContainer');
  const images = p?.images || (p?.image ? [p.image] : []);
  images.forEach(url => addImageUrlField(url));
  if (images.length === 0) addImageUrlField('');
  document.getElementById('productFormOverlay').classList.add('show');
}

function addImageUrlField(value = '') {
  const container = document.getElementById('imageUrlsContainer');
  const div = document.createElement('div');
  div.className = 'flex gap-2 mb-2';
  div.innerHTML = `<input type="text" class="flex-1 p-2 rounded-xl border image-url-input" placeholder="رابط الصورة" value="${value}">
    <button type="button" onclick="this.parentElement.remove()" class="text-red-500"><i class="fas fa-times"></i></button>`;
  container.appendChild(div);
}

function saveProduct() {
  const name = document.getElementById('prodName').value.trim();
  if (!name) {
    showToast('اسم المنتج مطلوب');
    return;
  }
  const images = Array.from(document.querySelectorAll('.image-url-input')).map(i => i.value.trim()).filter(u => u);
  const price = sanitizeNumber(parseFloat(document.getElementById('prodPrice').value), 0);
  const originalPrice = sanitizeNumber(parseFloat(document.getElementById('prodOriginalPrice').value), 0);
  const stock = sanitizeNumber(parseInt(document.getElementById('prodStock').value), 0);
  const threshold = sanitizeNumber(parseInt(document.getElementById('prodThreshold').value), 4);

  const product = {
    id: window.appState.editingProductId || generateId(),
    name,
    description: document.getElementById('prodDesc').value.trim(),
    currency: document.getElementById('prodCurrency').value,
    price: price,
    originalPrice: originalPrice || null,
    featured: document.getElementById('prodFeatured').checked,
    isOnSale: originalPrice > price,
    allowCOD: document.getElementById('prodAllowCOD').checked,
    stock: stock,
    lowStockThreshold: threshold,
    category: document.getElementById('prodCategory').value,
    images: images
  };
  if (window.appState.editingProductId) {
    const idx = window.appState.products.findIndex(p => p.id === window.appState.editingProductId);
    if (idx !== -1) window.appState.products[idx] = product;
  } else {
    window.appState.products.push(product);
  }
  saveData('ahmadi_products', window.appState.products);
  closeProductForm();
  renderAdminProducts();
  showToast('تم حفظ المنتج');
}

function editProduct(id) {
  openProductForm(id);
}

function closeProductForm() {
  document.getElementById('productFormOverlay').classList.remove('show');
}

// دوال الحذف العامة
function requestDelete(type, id) {
  let msg = '';
  if (type === 'product') msg = 'هل أنت متأكد من حذف المنتج؟';
  else if (type === 'order') msg = 'هل أنت متأكد من حذف الطلب؟';
  else if (type === 'bank') msg = 'هل أنت متأكد من حذف الحساب البنكي؟';
  else if (type === 'extra') msg = 'هل أنت متأكد من حذف طريقة الدفع؟';
  window.appState.deleteCallback = () => {
    if (type === 'product') {
      window.appState.products = window.appState.products.filter(p => p.id !== id);
      saveData('ahmadi_products', window.appState.products);
    } else if (type === 'order') {
      window.appState.orders = window.appState.orders.filter(o => o.id !== id);
      saveData('ahmadi_orders', window.appState.orders);
    } else if (type === 'bank') {
      window.appState.bankAccounts = window.appState.bankAccounts.filter(b => b.id !== id);
      saveData('ahmadi_bank_accounts', window.appState.bankAccounts);
      renderBankAccountsList();
    } else if (type === 'extra') {
      window.appState.extraPaymentMethods = window.appState.extraPaymentMethods.filter(m => m.id !== id);
      saveData('ahmadi_extra_payment_methods', window.appState.extraPaymentMethods);
      renderExtraPaymentMethodsList();
    }
    if (window.appState.currentPage === 'dashboard') {
      renderAdminProducts();
      renderAdminOrdersCards();
    }
    document.getElementById('deleteOverlay').classList.remove('show');
  };
  document.getElementById('deleteMsg').textContent = msg;
  document.getElementById('deleteOverlay').classList.add('show');
}

function confirmDelete() {
  if (window.appState.deleteCallback) window.appState.deleteCallback();
}

function cancelDelete() {
  document.getElementById('deleteOverlay').classList.remove('show');
}
