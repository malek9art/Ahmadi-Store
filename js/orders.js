// ======================== دوال الطلبات والخريطة ========================

let map = null;
let mapMarker = null;
let locationCircle = null;
let locateControl = null;
let recenterControl = null;

function openMapPicker() {
  document.getElementById('mapOverlay').classList.add('show');
  setTimeout(() => {
    if (!map) {
      map = L.map('mapContainer').setView([13.58, 44.02], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      map.on('click', e => {
        if (mapMarker) map.removeLayer(mapMarker);
        if (locationCircle) map.removeLayer(locationCircle);
        mapMarker = L.marker(e.latlng).addTo(map);
        window.appState.selectedLocation = e.latlng;
        updateMapPreview(e.latlng);
      });

      map.on('locationfound', onLocationFound);
      map.on('locationerror', onLocationError);

      addCustomMapControls();
    } else {
      map.invalidateSize();
      if (!locateControl) addCustomMapControls();
    }

    if (window.appState.selectedLocation) {
      if (mapMarker) map.removeLayer(mapMarker);
      if (locationCircle) map.removeLayer(locationCircle);
      mapMarker = L.marker(window.appState.selectedLocation).addTo(map);
      updateMapPreview(window.appState.selectedLocation);
    }
  }, 200);
}

function addCustomMapControls() {
  const LocateControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-locate');
      const link = L.DomUtil.create('a', '', container);
      link.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
      link.title = 'تحديد موقعي الحالي';
      link.href = '#';

      L.DomEvent.on(link, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        container.classList.add('loading');
        map.locate({ setView: true, maxZoom: 18, enableHighAccuracy: true });
      });

      map.on('locationfound locationerror', () => {
        container.classList.remove('loading');
      });

      return container;
    }
  });

  const RecenterControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-locate leaflet-control-recenter');
      const link = L.DomUtil.create('a', '', container);
      link.innerHTML = '<i class="fas fa-location-arrow"></i>';
      link.title = 'إعادة التمركز على الموقع المحدد';
      link.href = '#';

      L.DomEvent.on(link, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        if (window.appState.selectedLocation) {
          map.setView(window.appState.selectedLocation, 18);
        } else {
          showToast('لم يتم تحديد موقع بعد');
        }
      });

      return container;
    }
  });

  locateControl = new LocateControl();
  recenterControl = new RecenterControl();
  map.addControl(locateControl);
  map.addControl(recenterControl);
}

function onLocationFound(e) {
  const radius = e.accuracy / 2;
  const latlng = e.latlng;

  if (mapMarker) map.removeLayer(mapMarker);
  if (locationCircle) map.removeLayer(locationCircle);

  mapMarker = L.marker(latlng).addTo(map)
    .bindPopup(`<b>موقعك الحالي</b><br>دقة التحديد: ${Math.round(e.accuracy)} متر`).openPopup();

  locationCircle = L.circle(latlng, { radius: radius, color: '#008080', fillColor: '#00a0a0', fillOpacity: 0.2, weight: 1 }).addTo(map);

  window.appState.selectedLocation = latlng;
  updateMapPreview(latlng);

  showToast('تم تحديد موقعك الحالي');
}

function onLocationError(e) {
  let message = 'تعذر تحديد موقعك. ';
  if (e.code === 1) message += 'الرجاء السماح بالوصول إلى الموقع.';
  else if (e.code === 2) message += 'الموقع غير متاح حالياً.';
  else if (e.code === 3) message += 'انتهت مهلة تحديد الموقع.';
  else message += 'تأكد من تفعيل خدمة الموقع.';
  showToast(message);
  const controlDiv = document.querySelector('.leaflet-control-locate');
  if (controlDiv) controlDiv.classList.remove('loading');
}

function updateMapPreview(latlng) {
  const preview = document.getElementById('mapPreviewArea');
  if (!preview) return;
  const lat = latlng.lat.toFixed(6);
  const lng = latlng.lng.toFixed(6);
  const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  preview.innerHTML = `
    <i class="fas fa-map-pin" style="color: var(--pri);"></i>
    <span>الإحداثيات: ${lat}, ${lng}</span>
    <a href="${googleMapsLink}" target="_blank" class="text-teal-600 text-sm"><i class="fas fa-external-link-alt"></i> عرض في خرائط Google</a>
  `;
  const statusEl = document.getElementById('locationStatus');
  if (statusEl) {
    statusEl.innerHTML = `✅ <a href="${googleMapsLink}" target="_blank" class="text-teal-600 underline">عرض الموقع المحدد</a>`;
  }
}

function closeMapPicker() {
  document.getElementById('mapOverlay').classList.remove('show');
}

function confirmLocation() {
  if (window.appState.selectedLocation) {
    closeMapPicker();
  } else {
    showToast('حدد موقعك أولاً');
  }
}

function placeOrder() {
  const name = document.getElementById('delName').value.trim();
  const phone = document.getElementById('delPhone').value.trim();
  const address = document.getElementById('delAddress').value.trim();
  if (!name || !phone || !address) {
    showToast('املأ بيانات التوصيل');
    return;
  }
  const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentMethodEl) {
    showToast('اختر طريقة الدفع');
    return;
  }
  const paymentMethodValue = paymentMethodEl.value;
  let paymentMethod = paymentMethodValue;
  let selectedBank = null, selectedExtra = null;
  if (paymentMethodValue === 'bank') {
    const bankId = document.getElementById('bankSelect').value;
    selectedBank = window.appState.bankAccounts.find(b => b.id === bankId);
    if (!selectedBank) {
      showToast('الرجاء اختيار حساب بنكي');
      return;
    }
  } else if (paymentMethodValue.startsWith('extra_')) {
    const extraId = paymentMethodValue.replace('extra_', '');
    selectedExtra = window.appState.extraPaymentMethods.find(m => m.id === extraId);
    paymentMethod = 'extra';
  }

  for (let ci of window.appState.cart) {
    const p = window.appState.products.find(x => x.id === ci.id);
    if (p) {
      const currentStock = sanitizeNumber(p.stock, 0);
      const qty = sanitizeNumber(ci.qty, 0);
      if (currentStock < qty) {
        showToast(`المنتج ${p.name} غير متوفر بالكمية المطلوبة`);
        return;
      }
      p.stock = currentStock - qty;
    }
  }
  saveData('ahmadi_products', window.appState.products);

  const totalsByCurrency = { YER: 0, SAR: 0, USD: 0 };
  const items = window.appState.cart.map(ci => {
    const p = window.appState.products.find(x => x.id === ci.id);
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
    location: window.appState.selectedLocation,
    items: items,
    totalsByCurrency: totalsByCurrency,
    status: 'pending',
    paymentMethod,
    bankDetails: selectedBank,
    extraPaymentDetails: selectedExtra,
    userId: window.appState.currentUser ? window.appState.currentUser.uid : null
  };
  window.appState.orders.push(order);
  saveData('ahmadi_orders', window.appState.orders);
  window.appState.cart = [];
  window.appState.selectedLocation = null;
  updateCartBadge();
  ['delName', 'delPhone', 'delAddress'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('locationStatus').innerHTML = '';
  app.navigateTo('order-success');
}

function renderMyOrders() {
  if (!window.appState.currentUser) return;
  const myOrders = window.appState.orders.filter(o => o.userId === window.appState.currentUser.uid);
  const container = document.getElementById('myOrdersList');
  if (myOrders.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 py-8">لا توجد طلبات سابقة</p>';
    return;
  }
  let html = '';
  myOrders.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(order => {
    const statusMap = {
      pending: 'قيد الانتظار', confirmed: 'تم التأكيد', out_for_delivery: 'جاري التوصيل',
      delivered: 'تم التسليم', cancelled: 'ملغي'
    };
    const statusText = statusMap[order.status] || order.status;
    const statusClass = {
      pending: 'status-pending', confirmed: 'status-confirmed', out_for_delivery: 'status-out_for_delivery',
      delivered: 'status-delivered', cancelled: 'status-cancelled'
    }[order.status] || '';
    const itemsList = order.items.map(i => `${i.name} (${i.qty})`).join('، ');
    const totalsHtml = Object.entries(order.totalsByCurrency || {}).map(([cur, val]) => `${val.toLocaleString()} ${CUR_SYMBOLS[cur]}`).join(' + ') || '0';
    
    html += `<div class="glass p-4">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h4 class="font-bold">طلب رقم: ${order.orderNumber || order.id.slice(-8)}</h4>
          <p class="text-xs text-slate-500">${new Date(order.date).toLocaleString('ar')}</p>
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <p class="text-sm mb-2">${itemsList}</p>
      <p class="font-bold text-sm mb-3">الإجمالي: ${totalsHtml}</p>`;
      
    if (order.status === 'delivered') {
      const reviewedProductIds = window.appState.reviews.filter(r => r.orderId === order.id).map(r => r.productId);
      const unreviewedItems = order.items.filter(i => !reviewedProductIds.includes(i.productId));
      if (unreviewedItems.length > 0) {
        html += `<button onclick="app.openReviewForm('${order.id}')" class="text-sm bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg"><i class="fas fa-star me-1"></i>تقييم المنتجات</button>`;
      } else {
        html += `<span class="text-xs text-green-600"><i class="fas fa-check-circle"></i> تم التقييم</span>`;
      }
    }
    html += `</div>`;
  });
  container.innerHTML = html;
}

// دوال آراء العملاء
function renderReviewsSlider() {
  const approvedReviews = window.appState.reviews.filter(r => r.status === 'approved');
  const container = document.getElementById('reviewsSliderContainer');
  if (approvedReviews.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-center w-full py-8">لا توجد آراء حالياً</p>';
    return;
  }
  let html = '';
  approvedReviews.forEach(rev => {
    const product = window.appState.products.find(p => p.id === rev.productId);
    const starsHtml = Array(5).fill(0).map((_, i) => i < rev.rating ? '<i class="fas fa-star text-yellow-500"></i>' : '<i class="far fa-star text-yellow-500"></i>').join('');
    const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('ar') : '';
    html += `<div class="review-card glass p-4">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600"><i class="fas fa-user"></i></div>
        <div><h4 class="font-bold">${rev.userName || 'عميل'}</h4><p class="text-xs text-slate-500">${dateStr}</p></div>
      </div>
      <div class="mb-2">${starsHtml}</div>
      <p class="text-sm mb-1"><span class="font-semibold">${product?.name || 'منتج'}</span></p>
      <p class="text-sm text-slate-600">${rev.comment || ''}</p>
    </div>`;
  });
  container.innerHTML = html;
  const slider = container;
  document.getElementById('reviewPrevBtn').onclick = () => { slider.scrollBy({ left: -320, behavior: 'smooth' }); };
  document.getElementById('reviewNextBtn').onclick = () => { slider.scrollBy({ left: 320, behavior: 'smooth' }); };
}
