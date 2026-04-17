// تهيئة Firebase وإعدادات config ودوال المصادقة الأساسية

const firebaseConfig = {
  apiKey: "AIzaSyAUqC9pJdso4molT-x38wDLkPMw4q28cCg",
  authDomain: "alahmdistore.firebaseapp.com",
  databaseURL: "https://alahmdistore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alahmdistore",
  storageBucket: "alahmdistore.firebasestorage.app",
  messagingSenderId: "950748647259",
  appId: "1:950748647259:web:f15e4e0ae619abdf50547e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// متغيرات عامة متعلقة بالمصادقة
let currentUser = null;
let isAdminUser = false;

// مراقبة حالة المستخدم
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    const snapshot = await database.ref(`users/${user.uid}/isAdmin`).once('value');
    isAdminUser = snapshot.val() === true;
    if (state.currentPage === 'admin') document.getElementById('adminUserName').textContent = user.displayName || user.email;
  } else {
    isAdminUser = false;
  }
  updateAuthUI();
});

// دوال المصادقة الأساسية (يتم استدعاؤها من main.js)
async function signIn(email, password) {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    closeClientAuthModal();
    showToast('تم تسجيل الدخول بنجاح');
  } catch (error) {
    document.getElementById('authError').textContent = error.message;
    document.getElementById('authError').classList.remove('hidden');
  }
}

async function signUp(email, password, fullName, phone, address) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await user.updateProfile({ displayName: fullName });
    await database.ref(`users/${user.uid}`).set({
      fullName, email, phone, address,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    closeClientAuthModal();
    showToast('تم إنشاء الحساب بنجاح');
  } catch (error) {
    document.getElementById('authError').textContent = error.message;
    document.getElementById('authError').classList.remove('hidden');
  }
}

async function signOutUser() {
  try { await auth.signOut(); showToast('تم تسجيل الخروج'); }
  catch (error) { showToast('حدث خطأ: ' + error.message); }
}

// مصادقة المسؤول
async function authenticateAdmin(email, password) {
  const errorEl = document.getElementById('adminAuthErr');
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const snapshot = await database.ref(`users/${user.uid}/isAdmin`).once('value');
    const isAdmin = snapshot.val() === true;
    if (isAdmin) {
      currentUser = user;
      isAdminUser = true;
      closeAdminAuthModal();
      navigateTo('admin');
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
}

function adminSignOut() {
  signOutUser();
  navigateTo('home');
}
