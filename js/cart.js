// منطق سلة التسوق: إضافة، إزالة، تحديث الكمية، حساب الإجماليات

let cart = [];

function loadCart() {
  const saved = localStorage.getItem('ahmadi_cart');
  if (saved) cart = JSON.parse(saved);
  updateCartBadge();
}

function saveCart() {
  localStorage.setItem('ahmadi_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(pid, qty = 1) {
  const p = products.find(x => x.id === pid);
  if (!p || p.stock <= 0) { showToast('المنتج غير متوفر'); return; }
  const ex = cart.find(c => c.id === pid);
  if (ex) {
    if (ex.qty + qty <= p.stock) ex.qty += qty;
    else { showToast('الكمية المطلوبة غير متوفرة'); return; }
  } else {
    if (qty <= p.stock) cart.push({ id: pid, qty });
    else { showToast('الكمية المطلوبة غير متوفرة'); return; }
  }
  saveCart();
  showToast('تمت الإضافة ✅');
  if (state.currentPage === 'cart') renderCart();
}

function changeQty(pid, delta) {
  const ci = cart.find(c => c.id === pid);
  if (!ci) return;
  const p = products.find(x => x.id === pid);
  const newQty = ci.qty + delta;
  if (newQty <= 0) cart = cart.filter(c => c.id !== pid);
  else if (newQty > p.stock) { showToast('الكمية المطلوبة غير متوفرة'); return; }
  else ci.qty = newQty;
  saveCart();
  if (state.currentPage === 'cart') renderCart();
}

function removeFromCart(pid) {
  cart = cart.filter(c => c.id !== pid);
  saveCart();
  if (state.currentPage === 'cart') renderCart();
}

function updateCartBadge() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const b = document.getElementById('cartBadge');
  if (b) {
    b.textContent = total;
    b.style.display = total > 0 ? 'flex' : 'none';
  }
}

function renderCart() {
  // تعريفها في orders.js أو main.js، لكن نضعها هنا لاستدعائها
  if (typeof renderCartPage === 'function') renderCartPage();
}
