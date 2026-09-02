/* وكالة جامعة البطانة للسفر والسياحة — طبقة الحسابات والإدارة */
(function () {
  'use strict';

  const BRAND = 'وكالة جامعة البطانة للسفر والسياحة';
  const ADMIN_WA = '249905632405';
  const RECOVERY_KEY = 'batana_recovery_requests';
  const VISITOR_KEY = 'batana_visitor_count';
  const SEEN_KEY = 'batana_visitor_seen';
  const OLD_ADMIN_EMAIL = (typeof ADMIN_ACCOUNT !== 'undefined' && ADMIN_ACCOUNT.email) || 'admin@dawahi.com';

  function read(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (_) { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function session() { return typeof getSession === 'function' ? getSession() : null; }
  function users() { return typeof getUsers === 'function' ? getUsers() : []; }
  function recoveryRequests() { return read(RECOVERY_KEY, []); }
  function saveRecovery(list) { write(RECOVERY_KEY, list); }

  // عداد زوار بسيط للنسخة الحالية. في الإنتاج يجب نقله إلى الخادم/قاعدة البيانات.
  function trackVisitor() {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const count = Number(localStorage.getItem(VISITOR_KEY) || '0') + 1;
    localStorage.setItem(VISITOR_KEY, String(count));
    sessionStorage.setItem(SEEN_KEY, '1');
  }
  trackVisitor();

  function setBrandText() {
    document.title = BRAND;
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = BRAND;
  }
  setBrandText();

  function renderRecoveryRequest() {
    return `
      <div class="wrap">
        <div class="form-box card glow-form">
          <h2 class="center">استعادة كلمة المرور</h2>
          <p class="subtitle center">أرسل بيانات الحساب للمراجعة من الإدارة</p>
          <div class="flash" id="recoveryMsg" style="display:none"></div>
          <form onsubmit="return batanaSubmitRecovery(event)">
            <label>الاسم الثلاثي</label>
            <input name="fullname" required placeholder="مثال: أحمد محمد علي">
            <label>رقم الهاتف</label>
            <input name="phone" required placeholder="09XXXXXXXX">
            <label>البريد الإلكتروني</label>
            <input name="email" type="email" required>
            <button class="btn" type="submit" style="width:100%;margin-top:18px">إرسال طلب الاستعادة</button>
          </form>
          <p class="center" style="margin-top:16px"><a href="#/login">العودة لتسجيل الدخول</a></p>
        </div>
      </div>`;
  }

  window.batanaSubmitRecovery = function (e) {
    e.preventDefault();
    const f = e.target;
    const fullname = f.fullname.value.trim();
    const phone = f.phone.value.trim();
    const email = f.email.value.trim().toLowerCase();
    if (fullname.split(/\s+/).filter(Boolean).length < 3) return alert('يرجى إدخال الاسم الثلاثي');
    if (!email || !phone) return alert('يرجى إكمال البيانات');
    const list = recoveryRequests();
    list.unshift({
      id: 'REC-' + Date.now().toString(36).toUpperCase(),
      fullname, phone, email,
      status: 'قيد المراجعة',
      created_at: new Date().toISOString()
    });
    saveRecovery(list);
    const msg = document.getElementById('recoveryMsg');
    if (msg) {
      msg.className = 'flash ok';
      msg.style.display = 'block';
      msg.textContent = 'تم إرسال الطلب. ستتم مراجعته من الإدارة.';
    }
    f.reset();
    return false;
  };

  // استبدال شاشة تسجيل الدخول بإضافة رابط استعادة كلمة المرور.
  const originalRenderLogin = window.renderLogin;
  window.renderLogin = function () {
    const html = originalRenderLogin ? originalRenderLogin() : '';
    return html.replace('</form>', '</form><p class="center" style="margin-top:12px"><a href="#/forgot-password" style="color:var(--gold-soft);font-weight:700">نسيت كلمة المرور؟</a></p>');
  };

  // ربط الحجوزات بالمستخدم الحالي وجعلها قيد المراجعة بدلاً من التأكيد الفوري.
  const originalAddBooking = window.addBooking;
  window.addBooking = function (data) {
    const code = originalAddBooking ? originalAddBooking(data) : ('BAT-' + Date.now());
    const list = read(typeof BOOKINGS_KEY !== 'undefined' ? BOOKINGS_KEY : 'dawahi_bookings', []);
    const item = list.find(b => b.code === code);
    const s = session();
    if (item) {
      item.user_email = s ? s.email : '';
      item.user_name = s ? s.username : '';
      item.status = 'قيد المراجعة';
      write(typeof BOOKINGS_KEY !== 'undefined' ? BOOKINGS_KEY : 'dawahi_bookings', list);
    }
    return code;
  };

  function adminGuard() {
    const s = session();
    return !!(s && s.isAdmin);
  }

  function waLink(text) {
    return 'https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(text);
  }

  window.batanaApproveBooking = function (code) {
    if (!adminGuard()) return;
    const key = typeof BOOKINGS_KEY !== 'undefined' ? BOOKINGS_KEY : 'dawahi_bookings';
    const list = read(key, []);
    const b = list.find(x => x.code === code);
    if (!b) return;
    b.status = 'مؤكدة';
    b.reviewed_at = new Date().toISOString();
    write(key, list);
    location.hash = '#/admin';
  };

  window.batanaRejectBooking = function (code) {
    if (!adminGuard()) return;
    const key = typeof BOOKINGS_KEY !== 'undefined' ? BOOKINGS_KEY : 'dawahi_bookings';
    const list = read(key, []);
    const b = list.find(x => x.code === code);
    if (!b) return;
    b.status = 'مرفوضة';
    b.reviewed_at = new Date().toISOString();
    write(key, list);
    location.hash = '#/admin';
  };

  window.batanaApproveRecovery = function (id) {
    if (!adminGuard()) return;
    const list = recoveryRequests();
    const r = list.find(x => x.id === id);
    if (!r) return;
    const user = users().find(u => String(u.email).toLowerCase() === String(r.email).toLowerCase());
    if (!user) { alert('لم يتم العثور على حساب بهذا البريد الإلكتروني.'); return; }
    const temp = 'BT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    user.password = temp;
    const allUsers = users();
    const idx = allUsers.findIndex(u => String(u.email).toLowerCase() === String(r.email).toLowerCase());
    if (idx >= 0) { allUsers[idx] = user; localStorage.setItem('dawahi_users', JSON.stringify(allUsers)); }
    r.status = 'تمت الموافقة';
    r.temp_password = temp;
    r.reviewed_at = new Date().toISOString();
    saveRecovery(list);
    const text = `وكالة جامعة البطانة للسفر والسياحة\nتمت الموافقة على طلب استعادة كلمة المرور.\nالاسم: ${r.fullname}\nالبريد: ${r.email}\nكلمة المرور المؤقتة: ${temp}\nيرجى تغييرها بعد تسجيل الدخول.`;
    window.open(waLink(text), '_blank', 'noopener');
    location.hash = '#/admin';
  };

  window.batanaRejectRecovery = function (id) {
    if (!adminGuard()) return;
    const list = recoveryRequests();
    const r = list.find(x => x.id === id);
    if (!r) return;
    r.status = 'مرفوض';
    r.reviewed_at = new Date().toISOString();
    saveRecovery(list);
    location.hash = '#/admin';
  };

  function adminDashboard() {
    const allUsers = users();
    const key = typeof BOOKINGS_KEY !== 'undefined' ? BOOKINGS_KEY : 'dawahi_bookings';
    const bookings = read(key, []);
    const requests = recoveryRequests();
    const pendingBookings = bookings.filter(b => b.status === 'قيد المراجعة');
    const pendingRecovery = requests.filter(r => r.status === 'قيد المراجعة');
    return `
      ${typeof navbarLoggedIn === 'function' ? navbarLoggedIn() : ''}
      <div class="wrap">
        <h1>⚙️ لوحة مدير ${esc(BRAND)}</h1>
        <p class="subtitle">إدارة الطلبات والحسابات واستعادة كلمات المرور</p>
        <div class="grid">
          <div class="card center"><h3>👥 المستخدمون</h3><div class="price">${allUsers.length}</div></div>
          <div class="card center"><h3>👁️ الزوار</h3><div class="price">${Number(localStorage.getItem(VISITOR_KEY) || 0)}</div></div>
          <div class="card center"><h3>🧾 الحجوزات</h3><div class="price">${bookings.length}</div></div>
          <div class="card center"><h3>🔑 طلبات الاستعادة</h3><div class="price">${pendingRecovery.length}</div></div>
        </div>

        <div class="admin-card" style="margin-top:24px">
          <h2>🧾 طلبات الحجز قيد المراجعة (${pendingBookings.length})</h2>
          ${pendingBookings.length ? pendingBookings.map(b => `
            <div class="flight-row">
              <div><div class="route">${esc(b.title)}</div><div class="subtitle">${esc(b.code)} — ${esc(b.user_name || '')} — ${esc(b.user_email || '')}</div></div>
              <div class="price">${Number(b.price || 0).toLocaleString('en-US')} ج.س</div>
              <button class="btn small" onclick="batanaApproveBooking('${esc(b.code)}')">موافقة</button>
              <button class="btn small danger" onclick="batanaRejectBooking('${esc(b.code)}')">رفض</button>
            </div>`).join('') : '<p class="subtitle">لا توجد طلبات معلقة.</p>'}
        </div>

        <div class="admin-card" style="margin-top:24px">
          <h2>🔑 طلبات استعادة كلمة المرور (${pendingRecovery.length})</h2>
          ${pendingRecovery.length ? pendingRecovery.map(r => `
            <div class="flight-row">
              <div><div class="route">${esc(r.fullname)}</div><div class="subtitle">${esc(r.phone)} — ${esc(r.email)} — ${esc(r.id)}</div></div>
              <button class="btn small" onclick="batanaApproveRecovery('${esc(r.id)}')">موافقة وإرسال المؤقتة عبر واتساب</button>
              <button class="btn small danger" onclick="batanaRejectRecovery('${esc(r.id)}')">رفض</button>
            </div>`).join('') : '<p class="subtitle">لا توجد طلبات استعادة معلقة.</p>'}
        </div>

        <div class="admin-card" style="margin-top:24px">
          <h2>👥 قاعدة بيانات المستخدمين</h2>
          <div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>الصلاحية</th></tr></thead><tbody>
          ${allUsers.map(u => `<tr><td>${esc(u.fullname)}</td><td>${esc(u.phone)}</td><td>${esc(u.email)}</td><td>${u.isAdmin ? 'مدير' : 'مستخدم'}</td></tr>`).join('')}
          </tbody></table></div>
        </div>

        <div class="admin-card" style="margin-top:24px">
          <h2>⚠️ ملاحظة تشغيلية</h2>
          <p class="subtitle">هذه النسخة تحفظ البيانات في localStorage داخل المتصفح. الإرسال الآلي الحقيقي عبر WhatsApp وقاعدة بيانات مركزية يحتاجان Backend وWhatsApp Business API.</p>
        </div>
      </div>`;
  }

  const originalRenderAdmin = window.renderAdmin;
  window.renderAdmin = function () { return adminDashboard(); };

  // توسيع الراوتر الحالي بدون المساس بباقي صفحات السفر.
  const originalRouter = window.router;
  window.router = function () {
    const raw = location.hash.slice(1) || '/login';
    const path = raw.split('?')[0];
    if (path === '/forgot-password') {
      const app = document.getElementById('app');
      app.innerHTML = (typeof navbarGuest === 'function' ? navbarGuest() : '') + renderRecoveryRequest() + (typeof footerNote === 'function' ? footerNote() : '');
      setBrandText();
      window.scrollTo(0, 0);
      return;
    }
    if (path === '/admin' && !adminGuard()) {
      location.hash = '#/login';
      return;
    }
    if (typeof originalRouter === 'function') originalRouter();
    setBrandText();
  };

  window.removeEventListener('hashchange', originalRouter);
  window.addEventListener('hashchange', window.router);
  window.removeEventListener('DOMContentLoaded', originalRouter);
  window.addEventListener('DOMContentLoaded', window.router);

  // إعادة تشغيل الراوتر بعد تحميل طبقة التعديلات.
  if (location.hash === '#/admin' && !adminGuard()) location.hash = '#/login';
  else window.router();
})();
