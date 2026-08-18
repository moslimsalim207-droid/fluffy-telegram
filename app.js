/* ================== وكالة الدويحي — تطبيق ملف واحد (SPA) ================== */
/* التوجيه بين الصفحات يتم عبر location.hash، وكل البيانات محفوظة في localStorage */

/* ---------- الحسابات (auth) ---------- */
const DEFAULT_ACCOUNT = {
  fullname: "ضيف الدويحي",
  phone: "0000000000",
  email: "guest@dawahi.com",
  password: "dawahi123",
  isAdmin: false
};
const ADMIN_ACCOUNT = {
  fullname: "مدير النظام",
  phone: "0900000000",
  email: "admin@dawahi.com",
  password: "admin123",
  isAdmin: true
};
const USERS_KEY = "dawahi_users";
const SESSION_KEY = "dawahi_session";

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function findUserByEmail(email) {
  email = (email || "").trim().toLowerCase();
  if (email === ADMIN_ACCOUNT.email) return ADMIN_ACCOUNT;
  if (email === DEFAULT_ACCOUNT.email) return DEFAULT_ACCOUNT;
  return getUsers().find(u => u.email.toLowerCase() === email) || null;
}
function doRegister(fullname, phone, email, password, confirmPassword) {
  fullname = (fullname || "").trim();
  phone = (phone || "").trim();
  email = (email || "").trim().toLowerCase();
  const nameParts = fullname.split(/\s+/).filter(Boolean);
  if (nameParts.length < 3) return { ok: false, error: "name" };
  if (!/^[0-9+\s-]{8,15}$/.test(phone)) return { ok: false, error: "phone" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "email" };
  if (!password || password.length < 6) return { ok: false, error: "passwordShort" };
  if (password !== confirmPassword) return { ok: false, error: "passwordMatch" };
  if (findUserByEmail(email)) return { ok: false, error: "exists" };
  const users = getUsers();
  users.push({ fullname, phone, email, password, isAdmin: false });
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: fullname, email, isAdmin: false }));
  return { ok: true };
}
function doLogin(email, password) {
  email = (email || "").trim().toLowerCase();
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.fullname, email: user.email, isAdmin: !!user.isAdmin }));
    return true;
  }
  return false;
}
function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}
function doLogout() {
  localStorage.removeItem(SESSION_KEY);
  location.hash = '#/login';
}

/* ---------- الحجوزات ---------- */
const BOOKINGS_KEY = "dawahi_bookings";
function genBookingCode() { return "DWH-" + Math.random().toString(16).slice(2, 12).toUpperCase(); }
function getBookings() {
  const raw = localStorage.getItem(BOOKINGS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveBookings(list) { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list)); }
function addBooking({ kind, title, details, price, destination, seat, vehicleLabel, vehicleNo }) {
  const list = getBookings();
  const code = genBookingCode();
  list.unshift({ code, kind, title, details: details || "", price, destination: destination || "", seat: seat || "", vehicleLabel: vehicleLabel || "", vehicleNo: vehicleNo || "", status: "مؤكدة", created_at: new Date().toISOString() });
  saveBookings(list);
  return code;
}
function getBookingByCode(code) { return getBookings().find(b => b.code === code) || null; }
function cancelBookingByCode(code) {
  const list = getBookings();
  const b = list.find(x => x.code === code);
  if (!b) return false;
  b.status = "ملغاة";
  saveBookings(list);
  return true;
}

/* ---------- بيانات الفنادق ---------- */
const DEFAULT_HOTELS = {
  royal7: { name: "برج الدويحي الملكي", stars: 7, city: "الخرطوم - السودان", scope: "local", image: "", rooms: [
    { type: "single", label: "غرفة مفردة ملكية",  capacity: "شخص واحد", price: 150000 },
    { type: "double", label: "غرفة مزدوجة ملكية", capacity: "شخصان",    price: 220000 },
    { type: "family", label: "جناح عائلي ملكي",   capacity: "4 أشخاص",  price: 380000 }
  ]},
  diamond6: { name: "فندق الواحة الماسية", stars: 6, city: "الخرطوم - السودان", scope: "local", rooms: [
    { type: "single", label: "غرفة مفردة ديلوكس",  capacity: "شخص واحد", price: 110000 },
    { type: "double", label: "غرفة مزدوجة ديلوكس", capacity: "شخصان",    price: 170000 },
    { type: "family", label: "جناح عائلي ديلوكس",  capacity: "4 أشخاص",  price: 290000 }
  ]},
  palm5: { name: "فندق النخيل الذهبي", stars: 5, city: "الخرطوم - السودان", scope: "local", rooms: [
    { type: "single", label: "غرفة مفردة",  capacity: "شخص واحد", price: 35000 },
    { type: "double", label: "غرفة مزدوجة", capacity: "شخصان",    price: 55000 },
    { type: "family", label: "جناح عائلي",  capacity: "4 أشخاص",  price: 95000 }
  ]},
  ufuq4: { name: "فندق الأفق", stars: 4, city: "الخرطوم - السودان", scope: "local", rooms: [
    { type: "single", label: "غرفة مفردة",  capacity: "شخص واحد", price: 25000 },
    { type: "double", label: "غرفة مزدوجة", capacity: "شخصان",    price: 40000 },
    { type: "family", label: "جناح عائلي",  capacity: "4 أشخاص",  price: 70000 }
  ]},
  musafir3: { name: "فندق المسافر", stars: 3, city: "بورتسودان - السودان", scope: "local", rooms: [
    { type: "single", label: "غرفة مفردة",  capacity: "شخص واحد", price: 15000 },
    { type: "double", label: "غرفة مزدوجة", capacity: "شخصان",    price: 25000 },
    { type: "family", label: "جناح عائلي",  capacity: "4 أشخاص",  price: 45000 }
  ]},
  dubai7: { name: "فندق برج الدويحي - دبي", stars: 7, city: "دبي - الإمارات", scope: "intl", rooms: [
    { type: "single", label: "غرفة مفردة ملكية",  capacity: "شخص واحد", price: 400000 },
    { type: "double", label: "غرفة مزدوجة ملكية", capacity: "شخصان",    price: 600000 },
    { type: "family", label: "جناح عائلي ملكي",   capacity: "4 أشخاص",  price: 950000 }
  ]},
  cairo5: { name: "فندق النيل الدولي - القاهرة", stars: 5, city: "القاهرة - مصر", scope: "intl", rooms: [
    { type: "single", label: "غرفة مفردة ديلوكس",  capacity: "شخص واحد", price: 90000 },
    { type: "double", label: "غرفة مزدوجة ديلوكس", capacity: "شخصان",    price: 140000 },
    { type: "family", label: "جناح عائلي",         capacity: "4 أشخاص",  price: 230000 }
  ]},
  jeddah4: { name: "فندق الكورنيش - جدة", stars: 4, city: "جدة - السعودية", scope: "intl", rooms: [
    { type: "single", label: "غرفة مفردة",  capacity: "شخص واحد", price: 70000 },
    { type: "double", label: "غرفة مزدوجة", capacity: "شخصان",    price: 110000 },
    { type: "family", label: "جناح عائلي",  capacity: "4 أشخاص",  price: 190000 }
  ]}
};
const HOTELS_KEY = "dawahi_hotels_data";
function loadHotels() {
  const raw = localStorage.getItem(HOTELS_KEY);
  if (raw) { try { return JSON.parse(raw); } catch (e) { /* fall through */ } }
  const clone = JSON.parse(JSON.stringify(DEFAULT_HOTELS));
  localStorage.setItem(HOTELS_KEY, JSON.stringify(clone));
  return clone;
}
function saveHotels() { localStorage.setItem(HOTELS_KEY, JSON.stringify(HOTELS)); }
let HOTELS = loadHotels();
const DEFAULT_HOTEL_ID = "palm5";
function starsToText(n) { return "★".repeat(n); }
function getHotel(id) { return HOTELS[id] || HOTELS[DEFAULT_HOTEL_ID]; }
function slugify(str) {
  return "h_" + str.toString().trim().toLowerCase()
    .replace(/[\u0617-\u061A\u064B-\u0652]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "_")
    .replace(/^_+|_+$/g, "") + "_" + Math.random().toString(16).slice(2, 6);
}

/* ---------- الثيم ---------- */
function setTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add('theme-' + theme);
}

/* ---------- عناصر مشتركة ---------- */
function footerNote() {
  return `<div class="footer-note">وكالة الدويحي للسفر والسياحة — رحلتك تبدأ من هنا</div>`;
}
function navbarLoggedIn() {
  const s = getSession();
  const username = s ? s.username : '';
  const adminLink = s && s.isAdmin ? `<a href="#/admin" style="color:var(--gold-soft)">⚙️ لوحة التحكم</a>` : '';
  return `
  <div class="navbar">
    <div class="brand">وكالة الدويحي ✦ <span>للسفر والسياحة</span></div>
    <div class="nav-links">
      <a href="#/hotels">الفنادق</a>
      <a href="#/my-bookings">حجوزاتي</a>
      <a href="#/home">الرئيسية</a>
      ${adminLink}
      <span style="color:var(--sand)">${username}</span>
      <a href="#" class="btn small danger" onclick="doLogout(); return false;">خروج</a>
      <span class="nav-controls">
        <button type="button" class="theme-btn" onclick="setTheme('light')">☀️</button>
        <button type="button" class="theme-btn" onclick="setTheme('dark')">🌙</button>
      </span>
    </div>
  </div>`;
}
function navbarGuest() {
  return `
  <div class="navbar">
    <div class="brand" id="brandText">وكالة الدويحي ✦ <span id="subBrandText">للسفر والسياحة</span></div>
    <div class="nav-links">
      <a href="#/login" class="btn small" id="loginNavLabel">تسجيل الدخول</a>
      <span class="nav-controls">
        <button type="button" class="lang-btn" onclick="setLang('ar')">🇸🇦 عربي</button>
        <button type="button" class="lang-btn" onclick="setLang('en')">🇬🇧 English</button>
        <button type="button" class="theme-btn" onclick="setTheme('light')">☀️</button>
        <button type="button" class="theme-btn" onclick="setTheme('dark')">🌙</button>
      </span>
    </div>
  </div>`;
}

/* ---------- تسجيل الدخول / التسجيل (مع دعم لغتين) ---------- */
const TR = {
  brand: {ar:'وكالة الدويحي ✦', en:'Dawahi Agency ✦'},
  subBrand: {ar:'للسفر والسياحة', en:'Travel & Tourism'},
  login: {ar:'تسجيل الدخول', en:'Login'},
  welcome: {ar:'وكالة الدويحي للسفر والسياحة', en:'Dawahi Travel & Tourism Agency'},
  titleRegister: {ar:'إنشاء حساب جديد', en:'Create New Account'},
  fullname: {ar:'الاسم الثلاثي', en:'Full Name (3 parts)'},
  phone: {ar:'رقم الهاتف', en:'Phone Number'},
  email: {ar:'البريد الإلكتروني', en:'Email'},
  password: {ar:'كلمة المرور', en:'Password'},
  confirmPassword: {ar:'إعادة كلمة المرور', en:'Confirm Password'},
  loginButton: {ar:'تسجيل الدخول', en:'Login'},
  btnRegister: {ar:'إنشاء الحساب', en:'Create Account'},
  haveAccount: {ar:'لديك حساب بالفعل؟', en:'Already have an account?'},
  noAccount: {ar:'ليس لديك حساب؟', en:"Don't have an account?"},
  registerLink: {ar:'إنشاء حساب جديد', en:'Create new account'},
  footer: {ar:'وكالة الدويحي للسفر والسياحة — رحلتك تبدأ من هنا', en:'Dawahi Travel & Tourism — Your journey starts here'},
  errName: {ar:'يرجى كتابة الاسم الثلاثي كاملاً (ثلاث كلمات على الأقل)', en:'Please enter your full name (at least 3 parts)'},
  errPhone: {ar:'رقم الهاتف غير صحيح', en:'Invalid phone number'},
  errEmail: {ar:'البريد الإلكتروني غير صحيح', en:'Invalid email address'},
  errPasswordShort: {ar:'كلمة المرور يجب ألا تقل عن 6 أحرف', en:'Password must be at least 6 characters'},
  errPasswordMatch: {ar:'كلمة المرور وإعادة كلمة المرور غير متطابقتين', en:'Passwords do not match'},
  errExists: {ar:'هذا البريد الإلكتروني مسجّل بالفعل، جرّب تسجيل الدخول', en:'This email is already registered, try logging in'},
  errLogin: {ar:'البريد الإلكتروني أو كلمة المرور غير صحيحة', en:'Incorrect email or password'},
};
let currentLang = 'ar';

function setLang(lang) {
  currentLang = lang;
  const body = document.getElementById('pageBody');
  const html = document.getElementById('htmlRoot');
  body.classList.remove('lang-ar', 'lang-en');
  body.classList.add('lang-' + lang);
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const brandText = document.getElementById('brandText');
  if (brandText && brandText.childNodes[0]) brandText.childNodes[0].textContent = TR.brand[lang] + ' ';
  setText('subBrandText', TR.subBrand[lang]);
  setText('loginNavLabel', TR.login[lang]);
  setText('welcomeText', TR.welcome[lang]);
  setText('footerText', TR.footer[lang]);
  document.getElementById('pageTitle').textContent = TR.welcome[lang];

  setText('titleLogin', TR.login[lang]);
  setText('labelEmail', TR.email[lang]);
  setText('labelPassword', TR.password[lang]);
  setText('btnLogin', TR.loginButton[lang]);
  setText('noAccountText', TR.noAccount[lang]);
  setText('registerLink', TR.registerLink[lang]);

  setText('titleRegister', TR.titleRegister[lang]);
  setText('labelFullname', TR.fullname[lang]);
  setText('labelPhone', TR.phone[lang]);
  setText('labelConfirmPassword', TR.confirmPassword[lang]);
  setText('btnRegister', TR.btnRegister[lang]);
  setText('haveAccountText', TR.haveAccount[lang]);
  setText('loginLink', TR.login[lang]);
}

function renderLogin() {
  return `
  ${navbarGuest()}
  <div class="wrap">
    <div class="form-box card glow-form">
      <h2 class="center" id="titleLogin">تسجيل الدخول</h2>
      <p class="subtitle center" id="welcomeText">وكالة الدويحي للسفر والسياحة</p>
      <div class="flash error" id="flashMsg" style="display:none"></div>
      <form id="loginForm" onsubmit="return handleLogin(event)">
        <label id="labelEmail">البريد الإلكتروني</label>
        <input type="email" name="email" id="emailInput" required>
        <label id="labelPassword">كلمة المرور</label>
        <input type="password" name="password" id="passwordInput" required>
        <div class="center" style="margin-top:20px">
          <button class="btn" type="submit" style="width:100%" id="btnLogin">تسجيل الدخول</button>
        </div>
      </form>
      <p class="center" style="margin-top:10px">
        <span id="noAccountText">ليس لديك حساب؟</span>
        <a href="#/register" style="color:var(--gold-soft); font-weight:700" id="registerLink">إنشاء حساب جديد</a>
      </p>
    </div>
  </div>
  <div class="footer-note" id="footerText">وكالة الدويحي للسفر والسياحة — رحلتك تبدأ من هنا</div>`;
}
function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const flash = document.getElementById('flashMsg');
  flash.className = 'flash error';
  const ok = doLogin(form.email.value, form.password.value);
  if (!ok) {
    flash.textContent = TR.errLogin[currentLang];
    flash.style.display = 'block';
    return false;
  }
  location.hash = '#/home';
  return false;
}

function renderRegister() {
  return `
  ${navbarGuest()}
  <div class="wrap">
    <div class="form-box card glow-form">
      <h2 class="center" id="titleRegister">إنشاء حساب جديد</h2>
      <p class="subtitle center" id="welcomeText">وكالة الدويحي للسفر والسياحة</p>
      <div class="flash error" id="flashMsg" style="display:none"></div>
      <form id="registerForm" onsubmit="return handleRegister(event)">
        <label id="labelFullname">الاسم الثلاثي</label>
        <input type="text" name="fullname" id="fullnameInput" placeholder="مثال: أحمد محمد علي" required>
        <label id="labelPhone">رقم الهاتف</label>
        <input type="tel" name="phone" id="phoneInput" placeholder="09XXXXXXXX" required>
        <label id="labelEmail">البريد الإلكتروني</label>
        <input type="email" name="email" id="emailInput" required>
        <label id="labelPassword">كلمة المرور</label>
        <input type="password" name="password" id="passwordInput" required>
        <label id="labelConfirmPassword">إعادة كلمة المرور</label>
        <input type="password" name="confirmPassword" id="confirmPasswordInput" required>
        <div class="center" style="margin-top:20px">
          <button class="btn" type="submit" style="width:100%" id="btnRegister">إنشاء الحساب</button>
        </div>
      </form>
      <p class="center" style="margin-top:16px">
        <span id="haveAccountText">لديك حساب بالفعل؟</span>
        <a href="#/login" style="color:var(--gold-soft); font-weight:700" id="loginLink">تسجيل الدخول</a>
      </p>
    </div>
  </div>
  <div class="footer-note" id="footerText">وكالة الدويحي للسفر والسياحة — رحلتك تبدأ من هنا</div>`;
}
function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const flash = document.getElementById('flashMsg');
  flash.className = 'flash error';
  const result = doRegister(form.fullname.value, form.phone.value, form.email.value, form.password.value, form.confirmPassword.value);
  if (!result.ok) {
    const messages = {
      name: TR.errName[currentLang], phone: TR.errPhone[currentLang], email: TR.errEmail[currentLang],
      passwordShort: TR.errPasswordShort[currentLang], passwordMatch: TR.errPasswordMatch[currentLang], exists: TR.errExists[currentLang],
    };
    flash.textContent = messages[result.error] || messages.exists;
    flash.style.display = 'block';
    return false;
  }
  location.hash = '#/home';
  return false;
}

/* ---------- بيانات الرحلات ---------- */
function tripRow(t, kindKey) {
  return `<div class="flight-row"><div><div class="route">${t.route}</div><div class="subtitle">${t.subtitle}</div></div><div class="price">${t.price.toLocaleString('en-US')} ج.س</div><a class="btn small" href="#/select-class?kind=${kindKey}&route=${encodeURIComponent(t.route)}">اختيار الدرجة</a></div>`;
}
const LOCAL_LAND_TRIPS = {
  taxi: [
    { route: 'الخرطوم (المطار) ✕ الخرطوم بحري', subtitle: 'حجز فوري - يصل خلال 10-15 دقيقة', price: 6000 },
    { route: 'الخرطوم ✕ أم درمان', subtitle: 'حجز فوري - يصل خلال 15-20 دقيقة', price: 5500 },
    { route: 'الخرطوم ✕ ودمدني - ولاية الجزيرة', subtitle: 'مدة الرحلة تقريباً 2س', price: 35000 },
    { route: 'الخرطوم ✕ سنار', subtitle: 'مدة الرحلة تقريباً 3س', price: 48000 }
  ],
  bus: [
    { route: 'الخرطوم 🚌 بورتسودان - ولاية البحر الأحمر', subtitle: 'مغادرة 07:00 - وصول 17:00 (10س)', price: 28000 },
    { route: 'الخرطوم 🚌 كسلا - ولاية كسلا', subtitle: 'مغادرة 08:00 - وصول 15:00 (7س)', price: 22000 },
    { route: 'الخرطوم 🚌 الأبيض - ولاية شمال كردفان', subtitle: 'مغادرة 09:00 - وصول 15:30 (6س 30د)', price: 18000 },
    { route: 'الخرطوم 🚌 نيالا - ولاية جنوب دارفور', subtitle: 'مغادرة 06:00 - وصول 20:00 (14س)', price: 40000 },
    { route: 'الخرطوم 🚌 مدني - ولاية الجزيرة', subtitle: 'مغادرة 07:00 - وصول 09:30 (2س 30د)', price: 20000 }
  ],
  coach: [
    { route: 'الخرطوم 🚍 القضارف - ولاية القضارف', subtitle: 'خدمة حافلة ممتازة VIP - مغادرة 07:30 - وصول 13:30 (6س)', price: 32000 },
    { route: 'الخرطوم 🚍 الدمازين - ولاية النيل الأزرق', subtitle: 'خدمة حافلة ممتازة VIP - مغادرة 06:30 - وصول 14:00 (7س 30د)', price: 36000 },
    { route: 'الخرطوم 🚍 الفاشر - ولاية شمال دارفور', subtitle: 'خدمة نوم Sleeper - مغادرة 05:00 - وصول (اليوم التالي) 06:00', price: 60000 }
  ]
};
const LOCAL_AIRLINES = [
  { id: 'sudanair', name: 'الخطوط الجوية السودانية' },
  { id: 'badr', name: 'بدر إيرلاينز' },
  { id: 'target', name: 'طيران تارجت' }
];
const LOCAL_FLIGHTS = [
  { route: 'الخرطوم ✈ بورتسودان', subtitle: 'مغادرة 08:00 - وصول 09:15 (1س 15د)', price: 45000 },
  { route: 'الخرطوم ✈ نيالا', subtitle: 'مغادرة 11:30 - وصول 13:00 (1س 30د)', price: 52000 },
  { route: 'الخرطوم ✈ كسلا', subtitle: 'مغادرة 15:00 - وصول 16:00 (1س)', price: 38000 },
  { route: 'الخرطوم ✈ الفاشر', subtitle: 'مغادرة 10:00 - وصول 11:45 (1س 45د)', price: 56000 }
];
const INTL_BUS_COMPANIES = [
  { id: 'nileblue', name: 'حافلات النيل الأزرق' },
  { id: 'baraka', name: 'بركة السودان للنقل' },
  { id: 'fastline', name: 'الخط السريع' }
];
const INTL_BUS_ROUTES = [
  { route: 'الخرطوم 🚌 القاهرة (عبر أسوان)', subtitle: 'مغادرة 06:00 - وصول (اليوم التالي) 14:00', price: 95000 },
  { route: 'كسلا 🚌 القضارف - الحدود الإثيوبية', subtitle: 'مغادرة 07:30 - وصول 13:00 (5س 30د)', price: 30000 },
  { route: 'الخرطوم 🚌 جوبا - جنوب السودان', subtitle: 'مغادرة 05:00 - وصول (اليوم التالي) 18:00', price: 120000 }
];
const INTL_AIRLINES = LOCAL_AIRLINES;
const INTL_FLIGHTS = [
  { route: 'الخرطوم ✈ القاهرة', subtitle: 'مغادرة 09:00 - وصول 12:30 (2س 30د)', price: 210000 },
  { route: 'الخرطوم ✈ دبي', subtitle: 'مغادرة 14:00 - وصول 19:30 (3س 30د)', price: 320000 },
  { route: 'الخرطوم ✈ جدة', subtitle: 'مغادرة 20:00 - وصول 22:30 (2س 30د)', price: 250000 },
  { route: 'الخرطوم ✈ إسطنبول', subtitle: 'مغادرة 23:00 - وصول 04:30 (4س 30د)', price: 410000 }
];
const INTL_BOAT_COMPANIES = [
  { id: 'wadihalfa', name: 'معديات وادي حلفا النيلية' },
  { id: 'portsudansea', name: 'خطوط بورتسودان البحرية' },
  { id: 'royalnile', name: 'بواخر النيل الملكية' }
];
const INTL_BOAT_ROUTES = [
  { route: 'وادي حلفا ⛴ أسوان (مصر)', subtitle: 'مغادرة الأحد 12:00 - وصول الاثنين 08:00 (نهرية)', price: 55000 },
  { route: 'بورتسودان ⛴ جدة (السعودية)', subtitle: 'مغادرة 18:00 - وصول اليوم التالي 06:00 (12س)', price: 180000 },
  { route: 'بورتسودان ⛴ سواكن', subtitle: 'مغادرة 09:00 - وصول 11:30 (2س 30د)', price: 20000 }
];

/* ---------- الرئيسية: نوع السفر (محلي / دولي) ---------- */
function renderHome() {
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <h1>نوع السفر</h1>
    <p class="subtitle">اختر نوع الرحلة - الدولة: <b style="color:var(--gold-soft)">السودان</b></p>
    <div class="grid">
      <a class="airline-card" href="#/local-type"><div class="emoji-big">🗺️</div><h3>محلي</h3><div class="badge">داخل السودان</div></a>
      <a class="airline-card" href="#/intl-type"><div class="emoji-big">🌍</div><h3>دولي</h3><div class="badge">خارج السودان</div></a>
      <a class="airline-card" href="#/hotels"><div class="emoji-big">🏨</div><h3>الفنادق</h3><div class="badge">محلية ودولية</div></a>
    </div>
  </div>
  ${footerNote()}`;
}

/* ---------- السفر المحلي ---------- */
function renderLocalType() {
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/home">→ رجوع</a>
    <h1 style="margin-top:14px">السفر المحلي</h1>
    <p class="subtitle">داخل السودان - اختر وسيلة السفر</p>
    <div class="grid">
      <a class="airline-card" href="#/local-land"><div class="emoji-big">🚗</div><h3>بري</h3><div class="badge">تكاسي، باصات، حافلات</div></a>
      <a class="airline-card" href="#/local-air"><div class="emoji-big">✈️</div><h3>جوي</h3><div class="badge">شركات الطيران</div></a>
    </div>
  </div>
  ${footerNote()}`;
}
function renderLocalLand() {
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/local-type">→ رجوع</a>
    <h1 style="margin-top:14px">🚗 السفر البري المحلي</h1>
    <p class="subtitle">وجهات الرحلات في ولايات السودان</p>
    <div class="tabs">
      <a class="tab active" id="landTabTaxi" onclick="localLandShowTab('taxi')">🚕 تكاسي</a>
      <a class="tab" id="landTabBus" onclick="localLandShowTab('bus')">🚌 باصات</a>
      <a class="tab" id="landTabCoach" onclick="localLandShowTab('coach')">🚍 حافلات</a>
    </div>
    <div class="card" id="landPanelTaxi">${LOCAL_LAND_TRIPS.taxi.map(t => tripRow(t, 'local-taxi')).join('')}</div>
    <div class="card" id="landPanelBus" style="display:none">${LOCAL_LAND_TRIPS.bus.map(t => tripRow(t, 'local-bus')).join('')}</div>
    <div class="card" id="landPanelCoach" style="display:none">${LOCAL_LAND_TRIPS.coach.map(t => tripRow(t, 'local-coach')).join('')}</div>
  </div>
  ${footerNote()}`;
}
function localLandShowTab(tab) {
  document.getElementById('landPanelTaxi').style.display = tab === 'taxi' ? 'block' : 'none';
  document.getElementById('landPanelBus').style.display = tab === 'bus' ? 'block' : 'none';
  document.getElementById('landPanelCoach').style.display = tab === 'coach' ? 'block' : 'none';
  document.getElementById('landTabTaxi').classList.toggle('active', tab === 'taxi');
  document.getElementById('landTabBus').classList.toggle('active', tab === 'bus');
  document.getElementById('landTabCoach').classList.toggle('active', tab === 'coach');
}
function renderLocalAir() {
  const cards = LOCAL_AIRLINES.map(a => `<a class="airline-card" href="#/local-air-flights?airline=${a.id}"><div class="emoji-big">✈️</div><h3>${a.name}</h3><div class="badge">محلي</div></a>`).join('');
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/local-type">→ رجوع</a>
    <h1 style="margin-top:14px">✈️ السفر الجوي المحلي</h1>
    <p class="subtitle">اختر شركة الطيران المناسبة</p>
    <div class="grid">${cards}</div>
  </div>
  ${footerNote()}`;
}
function renderLocalAirFlights(airlineId) {
  const airline = LOCAL_AIRLINES.find(a => a.id === airlineId) || LOCAL_AIRLINES[0];
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/local-air">→ رجوع</a>
    <h1 style="margin-top:14px">✈️ ${airline.name}</h1>
    <p class="subtitle">وجهات السفر المحلية داخل ولايات السودان</p>
    <div class="card">${LOCAL_FLIGHTS.map(t => tripRow(t, 'local-flight')).join('')}</div>
  </div>
  ${footerNote()}`;
}

/* ---------- السفر الدولي ---------- */
function renderIntlType() {
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/home">→ رجوع</a>
    <h1 style="margin-top:14px">السفر الدولي</h1>
    <p class="subtitle">خارج السودان - اختر وسيلة السفر</p>
    <div class="grid">
      <a class="airline-card" href="#/intl-land"><div class="emoji-big">🚌</div><h3>بري</h3><div class="badge">شركات الباصات</div></a>
      <a class="airline-card" href="#/intl-air"><div class="emoji-big">✈️</div><h3>جوي</h3><div class="badge">شركات الطيران</div></a>
      <a class="airline-card" href="#/intl-sea"><div class="emoji-big">⛴</div><h3>بحري</h3><div class="badge">شركات البواخر</div></a>
    </div>
  </div>
  ${footerNote()}`;
}
function renderIntlLand() {
  const cards = INTL_BUS_COMPANIES.map(c => `<a class="airline-card" href="#/intl-bus-company?co=${c.id}"><div class="emoji-big">🚌</div><h3>${c.name}</h3><div class="badge">دولي</div></a>`).join('');
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/intl-type">→ رجوع</a>
    <h1 style="margin-top:14px">🚌 السفر البري الدولي</h1>
    <p class="subtitle">اختر شركة الباصات</p>
    <div class="grid">${cards}</div>
  </div>
  ${footerNote()}`;
}
function renderIntlBusCompany(coId) {
  const co = INTL_BUS_COMPANIES.find(c => c.id === coId) || INTL_BUS_COMPANIES[0];
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/intl-land">→ رجوع</a>
    <h1 style="margin-top:14px">🚌 ${co.name}</h1>
    <p class="subtitle">وجهة الرحلة الدولية وسعرها</p>
    <div class="card">${INTL_BUS_ROUTES.map(t => tripRow(t, 'intl-bus')).join('')}</div>
  </div>
  ${footerNote()}`;
}
function renderIntlAir() {
  const cards = INTL_AIRLINES.map(a => `<a class="airline-card" href="#/intl-air-flights?airline=${a.id}"><div class="emoji-big">✈️</div><h3>${a.name}</h3><div class="badge">دولي</div></a>`).join('');
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/intl-type">→ رجوع</a>
    <h1 style="margin-top:14px">✈️ السفر الجوي الدولي</h1>
    <p class="subtitle">اختر شركة الطيران المناسبة</p>
    <div class="grid">${cards}</div>
  </div>
  ${footerNote()}`;
}
function renderIntlAirFlights(airlineId) {
  const airline = INTL_AIRLINES.find(a => a.id === airlineId) || INTL_AIRLINES[0];
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/intl-air">→ رجوع</a>
    <h1 style="margin-top:14px">✈️ ${airline.name}</h1>
    <p class="subtitle">وجهات السفر الدولية</p>
    <div class="card">${INTL_FLIGHTS.map(t => tripRow(t, 'intl-flight')).join('')}</div>
  </div>
  ${footerNote()}`;
}
function renderIntlSea() {
  const cards = INTL_BOAT_COMPANIES.map(c => `<a class="airline-card" href="#/intl-boat-company?co=${c.id}"><div class="emoji-big">⛴</div><h3>${c.name}</h3><div class="badge">دولي</div></a>`).join('');
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/intl-type">→ رجوع</a>
    <h1 style="margin-top:14px">⛴ السفر البحري الدولي</h1>
    <p class="subtitle">اختر شركة البواخر</p>
    <div class="grid">${cards}</div>
  </div>
  ${footerNote()}`;
}
function renderIntlBoatCompany(coId) {
  const co = INTL_BOAT_COMPANIES.find(c => c.id === coId) || INTL_BOAT_COMPANIES[0];
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <a class="btn secondary small" href="#/intl-sea">→ رجوع</a>
    <h1 style="margin-top:14px">⛴ ${co.name}</h1>
    <p class="subtitle">وجهة الرحلة وسعرها</p>
    <div class="card">${INTL_BOAT_ROUTES.map(t => tripRow(t, 'intl-boat')).join('')}</div>
  </div>
  ${footerNote()}`;
}

/* ---------- الفنادق (محلية ودولية في قسم واحد) ---------- */
function hotelsGrid(scope) {
  const entries = Object.entries(HOTELS).filter(([id, h]) => h.scope === scope);
  return `<div class="grid">` + entries.map(([id, h]) => `
    <a class="hotel-card" href="#/hotel-rooms?hotel=${id}">
      <div class="hotel-img-wrap">${h.image ? `<img src="${h.image}" alt="${h.name}">` : `<div class="emoji-big">🏨</div>`}</div>
      <div class="hotel-card-body"><h3>${h.name}</h3><div class="stars">${starsToText(h.stars)}</div><div class="badge">${h.city}</div></div>
    </a>
  `).join('') + `</div>`;
}
function renderHotels() {
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <h1>🏨 الفنادق</h1>
    <p class="subtitle">فنادق محلية ودولية</p>
    <div class="tabs">
      <a class="tab active" id="hotelScopeLocal" onclick="hotelsShowScope('local')">محلية</a>
      <a class="tab" id="hotelScopeIntl" onclick="hotelsShowScope('intl')">دولية</a>
    </div>
    <div id="hotelsPanelLocal">${hotelsGrid('local')}</div>
    <div id="hotelsPanelIntl" style="display:none">${hotelsGrid('intl')}</div>
  </div>
  ${footerNote()}`;
}
function hotelsShowScope(scope) {
  document.getElementById('hotelsPanelLocal').style.display = scope === 'local' ? 'block' : 'none';
  document.getElementById('hotelsPanelIntl').style.display = scope === 'intl' ? 'block' : 'none';
  document.getElementById('hotelScopeLocal').classList.toggle('active', scope === 'local');
  document.getElementById('hotelScopeIntl').classList.toggle('active', scope === 'intl');
}

/* ---------- اختيار الدرجة (عام لكل وسائل النقل: محلي/دولي × بري/جوي/بحري) ---------- */
const SELECT_CLASS_DATA = {
  'local-taxi': {
    title: 'تكسي محلي — داخل السودان',
    subtitle: 'اختر الدرجة المناسبة لرحلتك',
    kind: 'taxi',
    classes: [
      {name:'VIP', price:12000},
      {name:'مريح', price:8000},
      {name:'اقتصادي', price:5500}
    ],
    bookTitlePrefix: 'رحلة تكسي محلية — ',
    bookDetails: 'تكسي محلي داخل السودان',
    confirmLabel: 'تأكيد الحجز'
  },
  'local-bus': {
    title: 'باصات محلية — داخل السودان',
    subtitle: 'اختر الدرجة المناسبة لرحلتك',
    kind: 'bus',
    classes: [
      {name:'ممتاز VIP', price:38000},
      {name:'عادي', price:28000}
    ],
    bookTitlePrefix: 'رحلة باص محلية — ',
    bookDetails: 'باصات محلية داخل السودان',
    confirmLabel: 'تأكيد الحجز وإصدار التذكرة'
  },
  'local-coach': {
    title: 'حافلات محلية — خدمة ممتازة',
    subtitle: 'اختر الدرجة المناسبة لرحلتك',
    kind: 'bus',
    classes: [
      {name:'نوم (Sleeper)', price:55000},
      {name:'ممتاز VIP', price:38000}
    ],
    bookTitlePrefix: 'رحلة حافلة محلية — ',
    bookDetails: 'حافلات ممتازة داخل السودان',
    confirmLabel: 'تأكيد الحجز وإصدار التذكرة'
  },
  'local-flight': {
    title: 'رحلات جوية محلية',
    subtitle: 'اختر الدرجة المناسبة لرحلتك',
    kind: 'flight',
    classes: [
      {name:'الدرجة الأولى', price:120000},
      {name:'درجة رجال الأعمال والمستثمرين', price:85000},
      {name:'الدرجة الثانية', price:60000},
      {name:'الدرجة العادية', price:45000}
    ],
    bookTitlePrefix: 'رحلة جوية محلية — ',
    bookDetails: 'طيران محلي داخل السودان',
    confirmLabel: 'تأكيد الحجز وإصدار التذكرة'
  },
  'intl-bus': {
    title: 'باصات دولية',
    subtitle: 'اختر الدرجة المناسبة لرحلتك',
    kind: 'bus',
    classes: [
      {name:'نوم (Sleeper)', price:55000},
      {name:'ممتاز VIP', price:38000},
      {name:'عادي', price:28000}
    ],
    bookTitlePrefix: 'رحلة باص دولية — ',
    bookDetails: 'باصات دولية عبر الحدود',
    confirmLabel: 'تأكيد الحجز وإصدار التذكرة'
  },
  'intl-flight': {
    title: 'رحلات جوية دولية',
    subtitle: 'اختر الدرجة المناسبة لرحلتك',
    kind: 'flight',
    classes: [
      {name:'الدرجة الأولى', price:320000},
      {name:'درجة رجال الأعمال والمستثمرين', price:210000},
      {name:'الدرجة الثانية', price:140000},
      {name:'الدرجة العادية', price:95000}
    ],
    bookTitlePrefix: 'رحلة جوية دولية — ',
    bookDetails: 'طيران دولي',
    confirmLabel: 'تأكيد الحجز وإصدار التذكرة'
  },
  'intl-boat': {
    title: 'بواخر دولية',
    subtitle: 'اختر الدرجة المناسبة لرحلتك',
    kind: 'boat',
    classes: [
      {name:'كابينة VIP', price:95000},
      {name:'كابينة عادية', price:70000},
      {name:'درجة عامة', price:55000}
    ],
    bookTitlePrefix: 'رحلة بحرية دولية — ',
    bookDetails: 'بواخر دولية',
    confirmLabel: 'تأكيد الحجز وإصدار التذكرة'
  }
};
let scSelected = { name: '', price: 0 };
let scRouteContext = { route: '' };

function generateSeatNumber() {
  const row = Math.floor(Math.random() * 30) + 1;
  const letters = 'ABCDEF';
  return row + letters[Math.floor(Math.random() * letters.length)];
}
function generateVehicleInfo(kind) {
  if (kind === 'flight') {
    const codes = ['SD', 'BD', 'TG'];
    const code = codes[Math.floor(Math.random() * codes.length)];
    const num = Math.floor(100 + Math.random() * 800);
    return { label: 'رقم الرحلة', value: code + num };
  }
  if (kind === 'boat') {
    const num = Math.floor(10 + Math.random() * 89);
    return { label: 'رقم الرحلة البحرية', value: 'NL-' + num };
  }
  // taxi / bus / land vehicles → plate number
  const letters = ['أ', 'ب', 'ج', 'د', 'خ', 'س', 'ص'];
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const digits = Math.floor(1000 + Math.random() * 8999);
  return { label: 'رقم اللوحة', value: `${digits} ${l1} ${l2} — سودان` };
}
function extractDestination(route) {
  if (!route) return '';
  const parts = route.split(/[✕✈⛴🚌🚍]/).map(s => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 1] : route;
}

function renderSelectClass(kindKeyRaw, routeRaw) {
  const kindKey = SELECT_CLASS_DATA[kindKeyRaw] ? kindKeyRaw : 'local-flight';
  const d = SELECT_CLASS_DATA[kindKey];
  scRouteContext = { route: routeRaw || '' };
  const optsHtml = d.classes.map(c => `
    <div class="class-opt" onclick="scChoose('${c.name.replace(/'/g, "\\'")}', ${c.price})">
      <h3>${c.name}</h3>
      <div class="price">${c.price.toLocaleString('en-US')} ج.س</div>
    </div>`).join('');
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <h1>اختيار الدرجة</h1>
    <div class="card">
      <h3>${d.title}</h3>
      ${routeRaw ? `<p class="subtitle">الرحلة: <b style="color:var(--gold-soft)">${routeRaw}</b></p>` : ''}
      <p class="subtitle">${d.subtitle}</p>
      <div class="class-grid">${optsHtml}</div>
      <div id="confirmBox" style="display:none; margin-top:20px">
        <p class="subtitle">الدرجة المختارة: <b id="chosenClass" style="color:var(--gold-soft)"></b> — <span class="price" id="chosenPrice"></span></p>
        <button class="btn" onclick="scConfirm('${kindKey}')" id="confirmBtn">${d.confirmLabel}</button>
        <div class="flash error" id="bookFlash" style="display:none; margin-top:10px"></div>
      </div>
    </div>
  </div>
  ${footerNote()}`;
}
function scChoose(name, price) {
  scSelected = { name, price };
  document.getElementById('chosenClass').textContent = name;
  document.getElementById('chosenPrice').textContent = price.toLocaleString('en-US') + ' ج.س';
  document.getElementById('confirmBox').style.display = 'block';
}
function scConfirm(kindKey) {
  const d = SELECT_CLASS_DATA[kindKey];
  const btn = document.getElementById('confirmBtn');
  btn.disabled = true;
  btn.textContent = 'جارٍ الحجز...';
  const vehicle = generateVehicleInfo(d.kind);
  const destination = extractDestination(scRouteContext.route) || d.title;
  const code = addBooking({
    kind: d.kind,
    title: d.bookTitlePrefix + scSelected.name,
    details: scRouteContext.route ? scRouteContext.route : d.bookDetails,
    price: scSelected.price,
    destination: destination,
    seat: generateSeatNumber(),
    vehicleLabel: vehicle.label,
    vehicleNo: vehicle.value
  });
  location.hash = '#/booking-detail?code=' + encodeURIComponent(code);
}

/* ---------- حجوزاتي ---------- */
function renderMyBookings() {
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <h1>حجوزاتي</h1>
    <div class="card" id="bookingsCard"><p>جارٍ التحميل...</p></div>
  </div>
  ${footerNote()}`;
}
function refreshMyBookingsList() {
  const bookingsCard = document.getElementById('bookingsCard');
  if (!bookingsCard) return;
  const list = getBookings();
  if (list.length === 0) { bookingsCard.innerHTML = '<p>لا توجد حجوزات حتى الآن.</p>'; return; }
  bookingsCard.innerHTML = list.map(b => `
    <div class="flight-row">
      <div>
        <div class="route">${b.title}</div>
        <div class="subtitle">${b.code} — ${b.details || ''}
          <span class="badge ${b.status === 'ملغاة' ? 'cancel' : 'ok'}">${b.status}</span>
        </div>
      </div>
      <div class="price">${b.price.toLocaleString('en-US')} ج.س</div>
      <a class="btn small secondary" href="#/booking-detail?code=${encodeURIComponent(b.code)}">التفاصيل</a>
      ${b.status !== 'ملغاة' ? `<button class="btn small danger" onclick="cancelBooking('${b.code}')">إلغاء</button>` : ''}
    </div>
  `).join('');
}
function cancelBooking(code) {
  if (!confirm('هل أنت متأكد من الإلغاء؟')) return;
  cancelBookingByCode(code);
  refreshMyBookingsList();
}

/* ---------- تفاصيل الحجز ---------- */
function renderBookingDetail(code) {
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <h1>تفاصيل الحجز — <span id="bkCode">...</span> <span class="badge ok" id="bkStatus"></span></h1>
    <div class="card" id="bkCard"><p>جارٍ التحميل...</p></div>
  </div>
  ${footerNote()}`;
}
function refreshBookingDetail(code) {
  const card = document.getElementById('bkCard');
  if (!card) return;
  if (!code) { card.innerHTML = '<p>لا يوجد رقم حجز محدد. <a href="#/my-bookings">اذهب إلى حجوزاتي</a></p>'; return; }
  const b = getBookingByCode(code);
  if (!b) { card.innerHTML = '<p>الحجز غير موجود</p>'; return; }
  document.getElementById('bkCode').textContent = b.code;
  const statusBadge = document.getElementById('bkStatus');
  statusBadge.textContent = b.status;
  statusBadge.className = 'badge ' + (b.status === 'ملغاة' ? 'cancel' : 'ok');

  const kindLabels = {
    flight: 'تفاصيل الرحلة', taxi: 'تفاصيل رحلة التكسي', bus: 'تفاصيل رحلة الباص',
    boat: 'تفاصيل رحلة الباخرة', hotel: 'حجز الفندق'
  };
  const ticketRowsHtml = (b.destination || b.seat || b.vehicleNo) ? `
    <div class="admin-grid-2" style="margin:14px 0">
      ${b.destination ? `<div><label style="margin-top:0">الوجهة</label><p class="price" style="margin:0">${b.destination}</p></div>` : ''}
      ${b.seat ? `<div><label style="margin-top:0">رقم المقعد</label><p class="price" style="margin:0">${b.seat}</p></div>` : ''}
      ${b.vehicleNo ? `<div><label style="margin-top:0">${b.vehicleLabel || 'رقم اللوحة'}</label><p class="price" style="margin:0">${b.vehicleNo}</p></div>` : ''}
    </div>` : '';
  card.innerHTML = `
    <h3>${kindLabels[b.kind] || 'تفاصيل الحجز'}</h3>
    <p>${b.title}<br>${b.details || ''}<br>
    السعر: <span class="price">${b.price.toLocaleString('en-US')} ج.س</span></p>
    ${ticketRowsHtml}
    <a class="btn" href="#" onclick="alert('في النسخة الحقيقية سيتم تحميل ملف PDF للتذكرة'); return false;">تحميل التذكرة PDF</a>
    <a class="btn secondary" href="#/my-bookings">حجوزاتي</a>
    <a class="btn secondary" href="#/home">🏠 الصفحة الرئيسية</a>
    ${b.status !== 'ملغاة' ? `<button class="btn danger" onclick="cancelBookingDetail('${b.code}')">إلغاء الحجز</button>` : ''}
  `;
}
function cancelBookingDetail(code) {
  if (!confirm('هل أنت متأكد من الإلغاء؟')) return;
  cancelBookingByCode(code);
  refreshBookingDetail(code);
}

/* ---------- غرف الفندق ---------- */
function renderHotelRooms(hotelIdRaw) {
  const hotel = getHotel(hotelIdRaw);
  const actualId = HOTELS[hotelIdRaw] ? hotelIdRaw : DEFAULT_HOTEL_ID;
  const rooms = hotel.rooms.map(r => `
    <div class="card">
      <h3>${r.label}</h3>
      <p class="subtitle">السعة: ${r.capacity}</p>
      <p class="price">${r.price.toLocaleString('en-US')} ج.س / لليلة</p>
      <a class="btn small" href="#/book-room?hotel=${encodeURIComponent(actualId)}&room=${encodeURIComponent(r.type)}">حجز الغرفة</a>
    </div>`).join('');
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    ${hotel.image ? `<img class="hotel-hero" src="${hotel.image}" alt="${hotel.name}">` : ''}
    <h1>${hotel.name} <span class="stars">${starsToText(hotel.stars)}</span></h1>
    <p class="subtitle">${hotel.stars} نجوم</p>
    <p class="subtitle">${hotel.city}</p>
    <div id="roomsList">${rooms}</div>
  </div>
  ${footerNote()}`;
}

/* ---------- حجز الغرفة ---------- */
function nightsBetween(inDate, outDate) {
  const ms = new Date(outDate) - new Date(inDate);
  return Math.max(1, Math.round(ms / 86400000));
}
function renderBookRoom(hotelIdRaw, roomTypeRaw) {
  const hotelId = HOTELS[hotelIdRaw] ? hotelIdRaw : DEFAULT_HOTEL_ID;
  const hotel = HOTELS[hotelId];
  const room = hotel.rooms.find(r => r.type === roomTypeRaw) || hotel.rooms[1];
  window.__bookRoomCtx = { hotel, room };
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <div class="form-box card glow-form">
      <h2 class="center">حجز الغرفة</h2>
      <p class="subtitle center">${hotel.name} (${starsToText(hotel.stars)}) — ${room.label} — ${room.price.toLocaleString('en-US')} ج.س / لليلة</p>
      <form onsubmit="return handleBook(event)">
        <label>تاريخ الوصول</label>
        <input type="date" name="checkin" id="checkinDate" required>
        <label>وقت الوصول (تسجيل الدخول)</label>
        <input type="time" name="checkinTime" id="checkinTime" value="14:00" required>
        <label>تاريخ المغادرة</label>
        <input type="date" name="checkout" id="checkoutDate" required>
        <label>وقت المغادرة (تسجيل الخروج)</label>
        <input type="time" name="checkoutTime" id="checkoutTime" value="12:00" required>
        <p class="subtitle" id="totalPreview" style="margin-top:14px"></p>
        <div class="center" style="margin-top:20px">
          <button class="btn" type="submit" style="width:100%">تأكيد حجز الغرفة</button>
        </div>
      </form>
    </div>
  </div>
  ${footerNote()}`;
}
function afterRenderBookRoom() {
  const checkinDateEl = document.getElementById('checkinDate');
  const checkoutDateEl = document.getElementById('checkoutDate');
  const totalPreview = document.getElementById('totalPreview');
  if (!checkinDateEl) return;
  function updatePreview() {
    const { room } = window.__bookRoomCtx;
    if (!checkinDateEl.value || !checkoutDateEl.value) { totalPreview.textContent = ''; return; }
    if (new Date(checkoutDateEl.value) <= new Date(checkinDateEl.value)) {
      totalPreview.textContent = 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول';
      return;
    }
    const nights = nightsBetween(checkinDateEl.value, checkoutDateEl.value);
    const total = nights * room.price;
    totalPreview.innerHTML = 'عدد الليالي: <b>' + nights + '</b> — الإجمالي: <span class="price">' + total.toLocaleString('en-US') + ' ج.س</span>';
  }
  checkinDateEl.addEventListener('change', updatePreview);
  checkoutDateEl.addEventListener('change', updatePreview);
}
function handleBook(e) {
  e.preventDefault();
  const form = e.target;
  const { hotel, room } = window.__bookRoomCtx;
  const checkin = form.checkin.value, checkinTime = form.checkinTime.value;
  const checkout = form.checkout.value, checkoutTime = form.checkoutTime.value;
  const btn = form.querySelector('button[type=submit]');
  if (new Date(checkout) <= new Date(checkin)) {
    alert('تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول');
    return false;
  }
  btn.disabled = true;
  btn.textContent = 'جارٍ الحجز...';
  const nights = nightsBetween(checkin, checkout);
  const total = nights * room.price;
  const code = addBooking({
    kind: 'hotel',
    title: hotel.name + ' — ' + room.label,
    details: 'تسجيل الدخول: ' + checkin + ' الساعة ' + checkinTime + ' / تسجيل الخروج: ' + checkout + ' الساعة ' + checkoutTime + ' — ' + nights + ' ليالٍ',
    price: total
  });
  location.hash = '#/booking-detail?code=' + encodeURIComponent(code);
  return false;
}

/* ---------- لوحة تحكم الأدمن (تعديل الفنادق والأسعار والصور) ---------- */
function adminRoomRow(hotelId, room) {
  return `
  <div class="admin-room-row">
    <div>
      <label style="margin-top:0">${room.label} <span class="subtitle">(${room.capacity})</span></label>
      <input type="text" id="adm_${hotelId}_label_${room.type}" value="${room.label}">
    </div>
    <div>
      <label style="margin-top:0">السعر / لليلة</label>
      <input type="text" inputmode="numeric" id="adm_${hotelId}_price_${room.type}" value="${room.price}">
    </div>
  </div>`;
}
function adminHotelCard(id, h) {
  return `
  <details class="admin-card" open>
    <summary>${h.name} <span class="badge">${h.scope === 'local' ? 'محلي' : 'دولي'}</span></summary>
    <div style="margin-top:14px">
      <div class="img-preview-wrap">
        <img id="adm_${id}_preview" src="${h.image || ''}" onerror="this.style.display='none'" alt="">
        <div style="flex:1">
          <label style="margin-top:0">صورة الفندق (رابط مباشر)</label>
          <input type="text" id="adm_${id}_imageurl" placeholder="https://..." value="${(h.image || '').startsWith('http') ? h.image : ''}" oninput="adminUpdatePreviewFromUrl('${id}')">
          <label>أو ارفع صورة من جهازك</label>
          <input type="file" accept="image/*" id="adm_${id}_imgfile" onchange="adminPreviewImageFile('${id}', this)">
        </div>
      </div>
      <div class="admin-grid-2">
        <div><label>اسم الفندق</label><input type="text" id="adm_${id}_name" value="${h.name}"></div>
        <div><label>المدينة</label><input type="text" id="adm_${id}_city" value="${h.city}"></div>
        <div><label>عدد النجوم</label><input type="text" inputmode="numeric" id="adm_${id}_stars" value="${h.stars}"></div>
        <div><label>النطاق</label>
          <select id="adm_${id}_scope">
            <option value="local" ${h.scope === 'local' ? 'selected' : ''}>محلي</option>
            <option value="intl" ${h.scope === 'intl' ? 'selected' : ''}>دولي</option>
          </select>
        </div>
      </div>
      <h3 style="margin-top:18px">أسعار الغرف</h3>
      ${h.rooms.map(r => adminRoomRow(id, r)).join('')}
      <div class="center" style="margin-top:16px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
        <button type="button" class="btn" onclick="adminSaveHotel('${id}')">حفظ التعديلات</button>
        <button type="button" class="btn danger" onclick="adminDeleteHotel('${id}')">حذف الفندق</button>
      </div>
      <p class="subtitle center" id="adm_${id}_msg" style="margin-top:8px"></p>
    </div>
  </details>`;
}
function renderAdmin() {
  const entries = Object.entries(HOTELS);
  return `
  ${navbarLoggedIn()}
  <div class="wrap">
    <h1>⚙️ لوحة تحكم الإدارة</h1>
    <p class="subtitle">تعديل بيانات الفنادق، الأسعار، والصور الحية مباشرة</p>

    <div class="admin-card">
      <h3 style="margin-top:0">➕ إضافة فندق جديد</h3>
      <div class="admin-grid-2">
        <div><label>اسم الفندق</label><input type="text" id="newh_name" placeholder="اسم الفندق"></div>
        <div><label>المدينة</label><input type="text" id="newh_city" placeholder="المدينة - الدولة"></div>
        <div><label>عدد النجوم</label><input type="text" inputmode="numeric" id="newh_stars" placeholder="مثال: 5"></div>
        <div><label>النطاق</label>
          <select id="newh_scope">
            <option value="local">محلي</option>
            <option value="intl">دولي</option>
          </select>
        </div>
      </div>
      <label>رابط صورة الفندق (اختياري)</label>
      <input type="text" id="newh_image" placeholder="https://...">
      <div class="admin-grid-2" style="margin-top:8px">
        <div><label>سعر الغرفة المفردة</label><input type="text" inputmode="numeric" id="newh_price_single" value="20000"></div>
        <div><label>سعر الغرفة المزدوجة</label><input type="text" inputmode="numeric" id="newh_price_double" value="35000"></div>
      </div>
      <label>سعر الجناح العائلي</label>
      <input type="text" inputmode="numeric" id="newh_price_family" value="60000">
      <div class="center" style="margin-top:14px">
        <button type="button" class="btn" onclick="adminAddHotel()">إضافة الفندق</button>
      </div>
      <p class="subtitle center" id="newh_msg" style="margin-top:8px"></p>
    </div>

    <h2 style="margin-top:26px">الفنادق الحالية (${entries.length})</h2>
    ${entries.map(([id, h]) => adminHotelCard(id, h)).join('')}
  </div>
  ${footerNote()}`;
}
function adminPreviewImageFile(id, input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    const urlInput = document.getElementById('adm_' + id + '_imageurl');
    if (urlInput) urlInput.value = ''; // الرابط اليدوي يُلغى لصالح الصورة المرفوعة
    input.dataset.base64 = dataUrl;
    const preview = document.getElementById('adm_' + id + '_preview');
    if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}
function adminUpdatePreviewFromUrl(id) {
  const urlInput = document.getElementById('adm_' + id + '_imageurl');
  const preview = document.getElementById('adm_' + id + '_preview');
  if (urlInput && preview && urlInput.value.trim()) {
    preview.style.display = 'block';
    preview.src = urlInput.value.trim();
    const fileInput = document.getElementById('adm_' + id + '_imgfile');
    if (fileInput) { fileInput.value = ''; delete fileInput.dataset.base64; }
  }
}
function adminResolveImage(id, fallback) {
  const fileInput = document.getElementById('adm_' + id + '_imgfile');
  if (fileInput && fileInput.dataset.base64) return fileInput.dataset.base64;
  const urlInput = document.getElementById('adm_' + id + '_imageurl');
  if (urlInput && urlInput.value.trim()) return urlInput.value.trim();
  return fallback || '';
}
function adminSaveHotel(id) {
  const h = HOTELS[id];
  if (!h) return;
  const name = document.getElementById('adm_' + id + '_name').value.trim();
  const city = document.getElementById('adm_' + id + '_city').value.trim();
  const stars = parseInt(document.getElementById('adm_' + id + '_stars').value, 10);
  const scope = document.getElementById('adm_' + id + '_scope').value;
  const msg = document.getElementById('adm_' + id + '_msg');
  if (!name || !city || !stars || stars < 1 || stars > 9) {
    msg.textContent = 'يرجى التأكد من صحة الاسم والمدينة وعدد النجوم';
    msg.style.color = 'var(--danger)';
    return;
  }
  h.name = name;
  h.city = city;
  h.stars = stars;
  h.scope = scope;
  h.image = adminResolveImage(id, h.image);
  h.rooms.forEach(r => {
    const priceEl = document.getElementById('adm_' + id + '_price_' + r.type);
    const labelEl = document.getElementById('adm_' + id + '_label_' + r.type);
    const price = parseInt((priceEl.value || '').toString().replace(/[^0-9]/g, ''), 10);
    if (!isNaN(price) && price > 0) r.price = price;
    if (labelEl.value.trim()) r.label = labelEl.value.trim();
  });
  saveHotels();
  msg.textContent = '✅ تم حفظ التعديلات بنجاح';
  msg.style.color = 'var(--ok)';
}
function adminDeleteHotel(id) {
  const h = HOTELS[id];
  if (!h) return;
  if (!confirm('هل أنت متأكد من حذف فندق "' + h.name + '"؟')) return;
  delete HOTELS[id];
  saveHotels();
  document.getElementById('app').innerHTML = renderAdmin();
}
function adminAddHotel() {
  const name = document.getElementById('newh_name').value.trim();
  const city = document.getElementById('newh_city').value.trim();
  const stars = parseInt(document.getElementById('newh_stars').value, 10);
  const scope = document.getElementById('newh_scope').value;
  const image = document.getElementById('newh_image').value.trim();
  const priceSingle = parseInt(document.getElementById('newh_price_single').value, 10) || 20000;
  const priceDouble = parseInt(document.getElementById('newh_price_double').value, 10) || 35000;
  const priceFamily = parseInt(document.getElementById('newh_price_family').value, 10) || 60000;
  const msg = document.getElementById('newh_msg');
  if (!name || !city || !stars || stars < 1 || stars > 9) {
    msg.textContent = 'يرجى تعبئة اسم الفندق والمدينة وعدد النجوم بشكل صحيح';
    msg.style.color = 'var(--danger)';
    return;
  }
  const id = slugify(name);
  HOTELS[id] = {
    name, stars, city, scope, image,
    rooms: [
      { type: 'single', label: 'غرفة مفردة', capacity: 'شخص واحد', price: priceSingle },
      { type: 'double', label: 'غرفة مزدوجة', capacity: 'شخصان', price: priceDouble },
      { type: 'family', label: 'جناح عائلي', capacity: '4 أشخاص', price: priceFamily }
    ]
  };
  saveHotels();
  document.getElementById('app').innerHTML = renderAdmin();
}

/* ---------- التوجيه (Router) ---------- */
const PROTECTED_PATHS = ['/home',
  '/local-type','/local-land','/local-air','/local-air-flights',
  '/intl-type','/intl-land','/intl-bus-company','/intl-air','/intl-air-flights','/intl-sea','/intl-boat-company',
  '/hotels','/select-class',
  '/my-bookings','/booking-detail','/hotel-rooms','/book-room','/admin'];
const ADMIN_ONLY_PATHS = ['/admin'];

function parseRoute() {
  const raw = location.hash.slice(1) || '/login';
  const [path, queryString] = raw.split('?');
  return { path, params: new URLSearchParams(queryString || '') };
}

function router() {
  const { path, params } = parseRoute();
  const app = document.getElementById('app');

  if (PROTECTED_PATHS.includes(path) && !getSession()) {
    location.hash = '#/login';
    return;
  }
  if (ADMIN_ONLY_PATHS.includes(path) && !(getSession() && getSession().isAdmin)) {
    location.hash = '#/home';
    return;
  }

  switch (path) {
    case '/login':
      app.innerHTML = renderLogin(); break;
    case '/register':
      app.innerHTML = renderRegister(); break;
    case '/home':
      app.innerHTML = renderHome(); break;
    case '/local-type':
      app.innerHTML = renderLocalType(); break;
    case '/local-land':
      app.innerHTML = renderLocalLand(); break;
    case '/local-air':
      app.innerHTML = renderLocalAir(); break;
    case '/local-air-flights':
      app.innerHTML = renderLocalAirFlights(params.get('airline')); break;
    case '/intl-type':
      app.innerHTML = renderIntlType(); break;
    case '/intl-land':
      app.innerHTML = renderIntlLand(); break;
    case '/intl-bus-company':
      app.innerHTML = renderIntlBusCompany(params.get('co')); break;
    case '/intl-air':
      app.innerHTML = renderIntlAir(); break;
    case '/intl-air-flights':
      app.innerHTML = renderIntlAirFlights(params.get('airline')); break;
    case '/intl-sea':
      app.innerHTML = renderIntlSea(); break;
    case '/intl-boat-company':
      app.innerHTML = renderIntlBoatCompany(params.get('co')); break;
    case '/hotels':
      app.innerHTML = renderHotels(); break;
    case '/select-class':
      app.innerHTML = renderSelectClass(params.get('kind'), params.get('route')); break;
    case '/my-bookings':
      app.innerHTML = renderMyBookings(); refreshMyBookingsList(); break;
    case '/booking-detail':
      app.innerHTML = renderBookingDetail(params.get('code')); refreshBookingDetail(params.get('code')); break;
    case '/hotel-rooms':
      app.innerHTML = renderHotelRooms(params.get('hotel') || DEFAULT_HOTEL_ID); break;
    case '/book-room':
      app.innerHTML = renderBookRoom(params.get('hotel') || DEFAULT_HOTEL_ID, params.get('room')); afterRenderBookRoom(); break;
    case '/admin':
      app.innerHTML = renderAdmin(); break;
    default:
      location.hash = '#/login';
      return;
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
