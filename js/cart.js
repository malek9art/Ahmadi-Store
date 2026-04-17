// ======================== دوال السلة والدفع ========================

function addToCart(pid) {
  const p = window.appState.products.find(x => x.id === pid);
  if (!p || p.stock <= 0) {
    showToast('المنتج غير متوفر');
    return;
  }
  const ex = window.appState.cart.find(c => c.id === pid);
  if (ex) {
    if (ex.qty < p.stock) ex.qty++;
    else {
      showToast('الكمية المطلوبة غير متوفرة');
      return;
    }
  } else {
    window.appState.cart.push({ id: pid, qty: 1 });
  }
  updateCartBadge();
  showToast('تمت الإضافة ✅');
}

function updateCartBadge() {
  const total = window.appState.cart.reduce((s, c) => s + c.qty, 0);
  const b = document.getElementById('cartBadge');
  b.textContent = total;
  b.style.display = total > 0 ? 'flex' : 'none';
}

function renderCart() {
  const empty = document.getElementById('cartEmpty');
  const content = document.getElementById('cartContent');
  if (window.appState.cart.length === 0) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  content.classList.remove('hidden');

  let itemsHtml = `<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="border-b"><tr><th class="p-2 text-right">المنتج</th><th class="p-2 text-right">الكمية</th><th class="p-2 text-right">السعر الأصلي</th><th class="p-2 text-right">السعر بعد التخفيض</th><th class="p-2 text-right">الخصم</th><th class="p-2 text-right">الإجمالي</th></tr></thead><tbody>`;
  const totalsByCurrency = { YER: 0, SAR: 0, USD: 0 };
  let totalOriginal = 0, totalAfterDiscount = 0;

  window.appState.cart.forEach(ci => {
    const p = window.appState.products.find(x => x.id === ci.id);
    if (!p) return;
    const sub = p.price * ci.qty;
    const origSub = (p.originalPrice || p.price) * ci.qty;
    const discountPercent = calcDiscount(p.originalPrice, p.price);
    totalsByCurrency[p.currency] = (totalsByCurrency[p.currency] || 0) + sub;
    totalOriginal += origSub;
    totalAfterDiscount += sub;
    const primaryImg = (p.images && p.images[0]) ? p.images[0] : '';
    itemsHtml += `<tr class="border-b">
      <td class="p-2 flex items-center gap-2"><div class="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">${primaryImg ? `<img src="${primaryImg}" class="w-full h-full object-contain p-1">` : '<i class="fas fa-box"></i>'}</div><span>${p.name}</span></td>
      <td class="p-2">
        <div class="flex items-center gap-1">
          <button onclick="app.changeQty('${p.id}',-1)" class="w-6 h-6 rounded bg-slate-100"><i class="fas fa-minus text-xs"></i></button>
          <span>${ci.qty}</span>
          <button onclick="app.changeQty('${p.id}',1)" class="w-6 h-6 rounded bg-slate-100"><i class="fas fa-plus text-xs"></i></button>
          <button onclick="app.removeFromCart('${p.id}')" class="text-red-500 ml-2"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
      <td class="p-2"><span class="price-old">${formatPrice(p.originalPrice || p.price, p.currency)}</span></td>
      <td class="p-2"><span class="font-bold text-teal-700">${formatPrice(p.price, p.currency)}</span></td>
      <td class="p-2">${discountPercent > 0 ? `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">-${discountPercent}%</span>` : '-'}</td>
      <td class="p-2 font-bold">${formatPrice(sub, p.currency)}</td>
    </tr>`;
  });
  itemsHtml += `</tbody></table></div>`;
  document.getElementById('cartItemsTable').innerHTML = itemsHtml;

  let summaryHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div><span class="text-slate-600">إجمالي السعر الأصلي:</span> <span class="font-bold">${totalOriginal.toLocaleString()} (مختلف العملات)</span></div>
    <div><span class="text-slate-600">إجمالي التوفير:</span> <span class="font-bold text-green-600">${(totalOriginal - totalAfterDiscount).toLocaleString()}</span></div>
  </div>`;
  summaryHtml += `<div class="mt-4"><h4 class="font-bold mb-2">المبلغ الصافي النهائي حسب العملات:</h4><div class="grid grid-cols-1 sm:grid-cols-3 gap-3">`;
  for (let cur of ['YER', 'SAR', 'USD']) {
    if (totalsByCurrency[cur] > 0) {
      summaryHtml += `<div class="bg-teal-50 p-3 rounded-xl text-center"><span class="block text-sm">${CUR_SYMBOLS[cur]}</span><span class="text-xl font-black">${totalsByCurrency[cur].toLocaleString()} ${CUR_SYMBOLS[cur]}</span></div>`;
    }
  }
  summaryHtml += `</div></div>`;
  document.getElementById('cartSummary').innerHTML = summaryHtml;

  updateBankSelect();
  renderExtraPaymentMethods();
  checkCODAvailability();
}

function updateBankSelect() {
  const select = document.getElementById('bankSelect');
  const activeBanks = window.appState.bankAccounts.filter(b => b.active);
  let options = '';
  activeBanks.forEach(b => {
    const accNumbers = [];
    if (b.accounts?.YER) accNumbers.push(`YER: ${b.accounts.YER}`);
    if (b.accounts?.SAR) accNumbers.push(`SAR: ${b.accounts.SAR}`);
    if (b.accounts?.USD) accNumbers.push(`USD: ${b.accounts.USD}`);
    options += `<option value="${b.id}">${b.bankName} - ${b.accountName} (${accNumbers.join(', ')})</option>`;
  });
  select.innerHTML = options || '<option>لا توجد حسابات بنكية نشطة</option>';
  updateBankDetails();
  select.onchange = updateBankDetails;
}

function updateBankDetails() {
  const select = document.getElementById('bankSelect');
  const bankId = select.value;
  const bank = window.appState.bankAccounts.find(b => b.id === bankId);
  const detailsDiv = document.getElementById('selectedBankDetails');
  if (bank) {
    let details = `<strong>${bank.bankName}</strong><br>اسم المستفيد: ${bank.accountName}<br>`;
    if (bank.accounts?.YER) details += `ريال يمني: ${bank.accounts.YER}<br>`;
    if (bank.accounts?.SAR) details += `ريال سعودي: ${bank.accounts.SAR}<br>`;
    if (bank.accounts?.USD) details += `دولار: ${bank.accounts.USD}<br>`;
    if (bank.iban) details += `IBAN: ${bank.iban}`;
    detailsDiv.innerHTML = details;
  } else {
    detailsDiv.innerHTML = '<span class="text-slate-400">اختر حساباً لعرض التفاصيل</span>';
  }
}

function renderExtraPaymentMethods() {
  const container = document.getElementById('extraPaymentMethods');
  const activeMethods = window.appState.extraPaymentMethods.filter(m => m.active);
  if (activeMethods.length === 0) {
    container.innerHTML = '';
    return;
  }
  let html = '<div class="mt-4"><h4 class="font-bold mb-2">طرق دفع إضافية:</h4>';
  activeMethods.forEach(m => {
    html += `<label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
      <input type="radio" name="paymentMethod" value="extra_${m.id}" class="w-5 h-5 accent-teal-600">
      <span class="font-medium">${m.name} - ${m.owner} (${m.accountId})</span>
    </label>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function togglePaymentMethod(method) {
  document.getElementById('bankSelection').style.display = method === 'bank' ? 'block' : 'none';
  if (method === 'cod') {
    const codAvailable = checkCODAvailability();
    if (!codAvailable) {
      document.querySelector('input[value="cod"]').checked = false;
      document.querySelector('input[value="bank"]').checked = true;
      togglePaymentMethod('bank');
      showToast('بعض المنتجات لا تدعم الدفع عند الاستلام');
    }
  }
}

function checkCODAvailability() {
  const allAllowCOD = window.appState.cart.every(ci => {
    const p = window.appState.products.find(x => x.id === ci.id);
    return p && p.allowCOD !== false;
  });
  const codRadio = document.querySelector('input[value="cod"]');
  const warning = document.getElementById('codWarning');
  const codLabel = document.getElementById('codLabel');
  if (!allAllowCOD) {
    if (codRadio) codRadio.disabled = true;
    if (warning) warning.classList.remove('hidden');
    if (codLabel) codLabel.style.opacity = '0.6';
  } else {
    if (codRadio) codRadio.disabled = false;
    if (warning) warning.classList.add('hidden');
    if (codLabel) codLabel.style.opacity = '1';
  }
  return allAllowCOD;
}

function changeQty(pid, d) {
  const ci = window.appState.cart.find(c => c.id === pid);
  if (!ci) return;
  const p = window.appState.products.find(x => x.id === pid);
  const newQty = ci.qty + d;
  if (newQty <= 0) {
    window.appState.cart = window.appState.cart.filter(c => c.id !== pid);
  } else if (newQty > p.stock) {
    showToast('الكمية المطلوبة غير متوفرة');
    return;
  } else {
    ci.qty = newQty;
  }
  updateCartBadge();
  renderCart();
}

function removeFromCart(pid) {
  window.appState.cart = window.appState.cart.filter(c => c.id !== pid);
  updateCartBadge();
  renderCart();
}
