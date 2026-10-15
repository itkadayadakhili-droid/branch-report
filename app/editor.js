// واجهة الإدخال: تبني الحقول من المخطط أدناه، وتحدّث المعاينة، وتحفظ وتفتح ملفات البيانات.
(function () {
  const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return isFinite(n) ? n : 0; };
  const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0.0');

  let D, R;
  function getPath(path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), D); }
  function setPath(path, value) {
    const keys = path.split('.');
    let o = D;
    keys.slice(0, -1).forEach((k) => { if (o[k] == null) o[k] = {}; o = o[k]; });
    o[keys[keys.length - 1]] = value;
  }
  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (base && typeof base === 'object' && over && typeof over === 'object') {
      const out = { ...base };
      Object.keys(over).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
      return out;
    }
    return over !== undefined ? over : base;
  }

  // ===== أدوات بناء المخطط (تستعملها ملفات التقارير) =====
  const T = (k, label, extra) => ({ k, label, type: 'text', ...extra });
  const N = (k, label) => ({ k, label, type: 'number' });
  const pairs = (k, label, extra) => ({ k, label, type: 'table', cols: [{ k: 'label', label: 'البند', ...(extra && extra.labelGroups ? { type: 'grouped', groups: extra.labelGroups } : {}) }, { k: 'value', label: 'العدد', type: 'number' }], ...extra });
  const list = (k, label) => ({ k, label, type: 'list' });
  const info = (fn) => ({ type: 'info', fn });

  window.EditorKit = { T, N, pairs, list, info, num, pct };

  // ===== أدوات DOM =====
  const $ = (sel, root = document) => root.querySelector(sel);
  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  function autoGrow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; }

  // ===== التحديث والحفظ =====
  let renderTimer, saveTimer;
  function changed(opts = {}) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => { renderPreview(); refreshInfos(); }, opts.now ? 0 : 120);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(R.storeKey, JSON.stringify(D)); setStatus('محفوظ تلقائياً على هذا الجهاز'); } catch (e) { setStatus('تعذّر الحفظ التلقائي – احفظ الملف يدوياً'); }
    }, 400);
  }
  function setStatus(t) { $('#status').textContent = t; }

  // ===== بناء الحقول =====
  const infoNodes = [];
  function refreshInfos() { infoNodes.forEach(({ node, fn }) => { const t = fn(D); node.textContent = t; node.classList.toggle('warn', t.includes('⚠')); }); refreshRules(); }
  // ===== الشروط (R.rules): كل شرط = { page, text, fields, test(D), detail(D) } =====
  function activeRules() {
    return (R.rules || []).filter((r) => !(r.page && D.hidden && D.hidden[r.page]));
  }
  function failedRules() { return activeRules().filter((r) => !r.test(D)); }
  function refreshRules() {
    const box = $('#rules');
    document.querySelectorAll('#form .invalid').forEach((e) => e.classList.remove('invalid'));
    if (!box) return;
    const rules = activeRules();
    const bad = rules.filter((r) => !r.test(D));
    bad.forEach((r) => ((typeof r.fields === 'function' ? r.fields(D) : r.fields) || []).forEach((p) => {
      const inp = $(`#form [data-path="${CSS.escape(p)}"]`);
      if (inp) inp.classList.add('invalid');
    }));
    box.classList.toggle('ok', bad.length === 0);
    box.replaceChildren(
      el('div', { class: 'rules-head' }, bad.length ? `⚠ ${bad.length} من ${rules.length} شروط غير محققة — لا يمكن تصدير PDF قبل تصحيحها` : `✓ كل الشروط محققة (${rules.length})`),
      ...rules.map((r) => {
        const ok = r.test(D);
        return el('div', { class: 'rule' + (ok ? ' ok' : ' bad'), onclick: () => { if (r.page) { openSection(r.page); scrollToPage(r.page); } } },
          el('span', { class: 'mark' }, ok ? '✓' : '✕'),
          el('span', {}, r.text + (!ok && r.detail ? ` — ${r.detail(D)}` : '')));
      }));
    const btn = $('#btn-pdf');
    if (btn) btn.classList.toggle('blocked', bad.length > 0);
  }


  function textInput(path, type) {
    const v = getPath(path) ?? '';
    const common = { 'data-path': path, oninput: (e) => { setPath(path, e.target.value); if (type === 'textarea') autoGrow(e.target); changed(); } };
    if (type === 'textarea') { const t = el('textarea', { ...common, rows: 2 }); t.value = v; requestAnimationFrame(() => autoGrow(t)); return t; }
    const i = el('input', { ...common, type: 'text', inputmode: type === 'number' ? 'decimal' : undefined, class: type === 'number' ? 'num' : '' });
    i.value = v;
    return i;
  }


  // قائمة منسدلة مجمّعة (مثل قائمة المخالفات في نظام الشكاوى) مع إمكانية كتابة بند غير موجود
  function groupedSelect(path, groups) {
    const all = Object.values(groups).flat();
    const wrap = el('div', { class: 'gsel' });
    const showInput = (val) => {
      const i = el('input', { type: 'text', 'data-path': path, placeholder: 'اكتب اسم البند', oninput: (e) => { setPath(path, e.target.value); changed(); } });
      i.value = val;
      const back = el('button', { type: 'button', class: 'gsel-back', title: 'الاختيار من القائمة', onclick: () => showSelect() }, '☰');
      wrap.replaceChildren(i, back);
      i.focus();
    };
    const showSelect = () => {
      const cur = String(getPath(path) ?? '');
      const s = el('select', { 'data-path': path, onchange: (e) => {
        if (e.target.value === '__custom__') { showInput(''); return; }
        setPath(path, e.target.value); changed();
      } });
      s.append(el('option', { value: '' }, '- اختر -'));
      if (cur && !all.includes(cur)) s.append(el('optgroup', { label: 'مُدخل يدوياً' }, el('option', { value: cur }, cur)));
      Object.entries(groups).forEach(([g, items]) => s.append(el('optgroup', { label: g }, items.map((n) => el('option', { value: n }, n)))));
      s.append(el('optgroup', { label: '—' }, el('option', { value: '__custom__' }, '✎ كتابة بند غير موجود في القائمة...')));
      s.value = cur;
      wrap.replaceChildren(s);
    };
    showSelect();
    return wrap;
  }


  // حقل صورة: يختار المستخدم صورة من جهازه، تُصغَّر وتُحفظ داخل ملف البيانات (تعمل بدون إنترنت)
  function buildImageField(f) {
    const wrap = el('div', { class: 'field img-field' });
    const loadImage = (file) => {
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          const sc = Math.min(1, 1600 / Math.max(im.width, im.height));
          const c = document.createElement('canvas');
          c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          setPath(f.k, c.toDataURL('image/jpeg', 0.85));
          render(); changed({ now: true });
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    };
    const render = () => {
      const v = getPath(f.k);
      const file = el('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); } });
      wrap.replaceChildren(
        el('span', {}, f.label), file,
        v ? el('img', { src: v, class: 'img-prev', alt: '' }) : null,
        el('div', { class: 'img-btns' },
          el('button', { type: 'button', class: 'add', onclick: () => file.click() }, v ? '🔄 تغيير الصورة' : '📁 اختيار صورة من الجهاز'),
          v ? el('button', { type: 'button', class: 'add del', onclick: () => { setPath(f.k, ''); render(); changed({ now: true }); } }, '✕ إزالة') : null));
    };
    render();
    return wrap;
  }

  function buildField(f) {
    if (f.type === 'info') { const node = el('div', { class: 'info' }); infoNodes.push({ node, fn: f.fn }); return node; }
    if (f.type === 'month') {
      const s = el('select', { 'data-path': f.k, onchange: (e) => { setPath(f.k, e.target.value); changed({ now: true }); } },
        MONTHS.map((m) => el('option', { value: m }, m)));
      if (!MONTHS.includes(D.month)) s.prepend(el('option', { value: D.month }, D.month));
      s.value = D.month;
      return el('label', { class: 'field' }, el('span', {}, f.label), s);
    }
    if (f.type === 'select') {
      const s = el('select', { 'data-path': f.k, onchange: (ev) => { setPath(f.k, ev.target.value); changed({ now: true }); } },
        f.options.map((o) => el('option', { value: o }, o)));
      s.value = getPath(f.k) ?? f.options[0];
      return el('label', { class: 'field' }, el('span', {}, f.label), s);
    }
    if (f.type === 'text' || f.type === 'number' || f.type === 'textarea') {
      return el('label', { class: 'field' + (f.type === 'number' ? ' inline' : '') }, el('span', {}, f.label), textInput(f.k, f.type));
    }
    if (f.type === 'list') return buildList(f);
    if (f.type === 'image') return buildImageField(f);
    if (f.type === 'grouped') return el('div', { class: 'field' }, el('span', {}, f.label), groupedSelect(f.k, f.groups));
    if (f.type === 'table') return buildTable(f);
    return el('div', {}, '');
  }

  function rowButtons(arr, i, rebuild) {
    const move = (d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; rebuild(); changed(); };
    return el('div', { class: 'row-btns' },
      el('button', { type: 'button', title: 'للأعلى', onclick: () => move(-1) }, '▲'),
      el('button', { type: 'button', title: 'للأسفل', onclick: () => move(1) }, '▼'),
      el('button', { type: 'button', title: 'حذف', class: 'del', onclick: () => { arr.splice(i, 1); rebuild(); changed(); } }, '✕'));
  }

  function buildList(f) {
    const wrap = el('div', { class: 'group' });
    const rebuild = () => {
      if (!Array.isArray(getPath(f.k))) setPath(f.k, []);
      const arr = getPath(f.k);
      wrap.replaceChildren(el('div', { class: 'group-title' }, `${f.label} (${arr.length})`));
      arr.forEach((_, i) => {
        wrap.append(el('div', { class: 'list-row' }, el('span', { class: 'idx' }, String(i + 1)), textInput(`${f.k}.${i}`, 'textarea'), rowButtons(arr, i, rebuild)));
      });
      wrap.append(el('button', { type: 'button', class: 'add', onclick: () => { arr.push(''); rebuild(); changed(); } }, '+ إضافة بند'));
    };
    rebuild();
    return wrap;
  }

  function buildTable(f) {
    const wrap = el('div', { class: 'group' });
    const numCols = f.cols.filter((c) => c.type === 'number');
    const rebuild = () => {
      let arr = getPath(f.k);
      if (!Array.isArray(arr)) { setPath(f.k, []); arr = getPath(f.k); }
      const head = el('div', { class: 'group-title' }, `${f.label} (${arr.length})`);
      if (f.sortKey) {
        const cb = el('input', { type: 'checkbox', onchange: (e) => { setPath(f.sortKey, e.target.checked); changed(); } });
        cb.checked = !!getPath(f.sortKey);
        head.append(el('label', { class: 'sort' }, cb, ' ترتيب تنازلي تلقائي'));
      }
      wrap.replaceChildren(head);
      const wide = f.cols.length > 2;
      arr.forEach((row, i) => {
        const cells = f.cols.map((c) => {
          const inp = c.type === 'grouped' ? groupedSelect(`${f.k}.${i}.${c.k}`, c.groups) : textInput(`${f.k}.${i}.${c.k}`, c.type);
          return wide ? el('label', { class: 'cell' + (c.type === 'number' ? ' n' : c.type === 'textarea' ? ' full' : '') }, el('small', {}, c.label), inp) : inp;
        });
        wrap.append(el('div', { class: 'table-row' + (wide ? ' wide' : '') }, ...cells, rowButtons(arr, i, rebuild)));
      });
      wrap.append(el('button', { type: 'button', class: 'add', onclick: () => {
        const blank = {}; f.cols.forEach((c) => { blank[c.k] = c.type === 'number' ? 0 : ''; }); arr.push(blank); rebuild(); changed();
      } }, '+ إضافة صف'));
      if (numCols.length === 1 && !wide) {
        const node = el('div', { class: 'info' });
        const fn = () => {
          const s = (getPath(f.k) || []).reduce((a, r) => a + num(r[numCols[0].k]), 0);
          if (!f.compare) return `المجموع: ${s}`;
          const t = num(getPath(f.compare));
          return `المجموع: ${s}` + (s !== t ? ` — ⚠ لا يساوي الإجمالي المُدخل (${t})` : ' — مطابق للإجمالي');
        };
        infoNodes.push({ node, fn });
        wrap.append(node);
        requestAnimationFrame(refreshInfos);
      }
    };
    rebuild();
    return wrap;
  }

  function buildForm() {
    const form = $('#form');
    form.replaceChildren();
    infoNodes.length = 0;
    if ((R.rules || []).length) form.append(el('div', { id: 'rules', class: 'rules' }));
    R.schema.forEach((sec, idx) => {
      const isPage = sec.id !== 'general';
      const body = el('div', { class: 'sec-body' }, sec.fields.map(buildField));
      const head = el('div', { class: 'sec-head', onclick: (e) => { if (e.target.closest('.show')) return; details.open = !details.open; if (details.open && isPage) scrollToPage(sec.id); } },
        el('span', { class: 'sec-no' }, isPage ? (sec.no || sec.id.slice(1)) : '⚙'),
        el('span', { class: 'sec-title' }, sec.title));
      if (isPage) {
        const cb = el('input', { type: 'checkbox', onchange: (e) => { D.hidden = D.hidden || {}; D.hidden[sec.id] = !e.target.checked; changed({ now: true }); } });
        cb.checked = !(D.hidden && D.hidden[sec.id]);
        head.append(el('label', { class: 'show', title: 'إظهار الصفحة في التقرير' }, cb, ' إظهار'));
      }
      const details = el('div', { class: 'sec' + (idx === 0 ? ' open' : ''), 'data-sec': sec.id }, head, body);
      Object.defineProperty(details, 'open', { get() { return this.classList.contains('open'); }, set(v) { this.classList.toggle('open', v); } });
      form.append(details);
    });
    refreshInfos();
  }

  // ===== المعاينة =====
  // تسميات الأعمدة: الكلمة لا تُقطع أبداً (كلمة تحت كلمة)، وإذا كانت كلمة أعرض من عمودها يصغر الخط حتى تتسع
  function fitWords(root) {
    // في نسخة الإدخال فقط تكون المعاينة مخفية، فنُظهرها مؤقتاً خارج الشاشة لنقيس
    const box = $('#preview');
    const hidden = box && !box.offsetParent;
    if (hidden) box.setAttribute('style', 'display:block !important; position:fixed; left:-30000px; top:0; width:900px;');
    root.querySelectorAll('[data-fitw]').forEach((e) => {
      let fs = parseFloat(getComputedStyle(e).fontSize);
      for (let k = 0; k < 24 && e.scrollWidth > e.clientWidth + 0.5 && fs > 6.5; k++) { fs -= 0.25; e.style.fontSize = fs + 'px'; }
    });
    if (hidden) box.removeAttribute('style');
  }
  function renderPreview() {
    const pages = $('#pages');
    pages.innerHTML = window.renderReport(D, R.pages);
    fitWords(pages);
    // R.noInlineEdit: نسخ الإدخال المبسّطة لا تسمح بتعديل النصوص من المعاينة
    if (!R.noInlineEdit) pages.querySelectorAll('[data-edit]').forEach((s) => s.setAttribute('contenteditable', 'plaintext-only'));
    document.title = R.fileName(D).split('-').join(' ');
    fitZoom();
  }
  function fitZoom() {
    const wrap = $('#preview');
    const z = Math.min(1.1, (wrap.clientWidth - 48) / 794);
    $('#pages').style.zoom = z > 0 ? z : 1;
  }
  function scrollToPage(id) {
    const p = $(`#pages [data-page="${id}"]`);
    if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function openSection(id) {
    document.querySelectorAll('.sec').forEach((s) => s.classList.toggle('open', s.dataset.sec === id));
    const s = $(`.sec[data-sec="${id}"]`);
    if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // تعديل النصوص مباشرة من المعاينة
  function wirePreviewEditing() {
    const pages = $('#pages');
    pages.addEventListener('input', (e) => {
      const t = e.target.closest('[data-edit]');
      if (!t) return;
      const path = t.dataset.edit;
      const old = String(getPath(path) ?? '');
      let v = t.textContent;
      if (old.includes('{الشهر}') && D.month) v = v.split(D.month).join('{الشهر}');
      if (old.includes('{السنة}') && D.year) v = v.split(D.year).join('{السنة}');
      setPath(path, v);
      const inp = $(`#form [data-path="${CSS.escape(path)}"]`);
      if (inp) inp.value = v;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { try { localStorage.setItem(R.storeKey, JSON.stringify(D)); setStatus('محفوظ تلقائياً على هذا الجهاز'); } catch (err) {} }, 400);
    });
    pages.addEventListener('focusout', (e) => { if (e.target.closest('[data-edit]')) changed(); });
    pages.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.closest('[data-edit]')) { e.preventDefault(); e.target.blur(); } });
    pages.addEventListener('click', (e) => { const p = e.target.closest('[data-page]'); if (p) openSection(p.dataset.page); });
  }

  // ===== الملفات =====

  // ===== إقرار المسؤولية قبل الحفظ والتصدير (R.disclaimer) =====
  function acknowledge(action) {
    if (!R.disclaimer) return Promise.resolve(true);
    return new Promise((resolve) => {
      D.meta = D.meta || {};
      const cb = el('input', { type: 'checkbox' });
      const name = el('input', { type: 'text', placeholder: 'الاسم والرتبة' });
      name.value = D.meta.enteredBy || '';
      const ok = el('button', { type: 'button', class: 'ack-ok' }, `أقرّ وأتابع ${action}`);
      const cancel = el('button', { type: 'button', class: 'ack-cancel' }, 'إلغاء');
      const sync = () => { ok.disabled = !(cb.checked && name.value.trim()); };
      cb.onchange = sync; name.oninput = sync; sync();
      const overlay = el('div', { class: 'ack-overlay' },
        el('div', { class: 'ack-box', role: 'dialog' },
          el('div', { class: 'ack-title' }, '⚠ إقرار بالمسؤولية عن صحة البيانات'),
          el('div', { class: 'ack-text' }, R.disclaimer),
          el('label', { class: 'ack-field' }, el('span', {}, 'اسم مُدخل البيانات'), name),
          el('label', { class: 'ack-check' }, cb, ' أقرّ بأنني راجعت البيانات المُدخلة، وأتحمّل المسؤولية الكاملة عن صحتها.'),
          el('div', { class: 'ack-btns' }, ok, cancel)));
      const close = (v) => { overlay.remove(); resolve(v); };
      ok.onclick = () => {
        D.meta.enteredBy = name.value.trim();
        D.meta.acknowledgedAt = new Date().toLocaleString('ar-SY');
        try { localStorage.setItem(R.storeKey, JSON.stringify(D)); } catch (e) {}
        close(true);
      };
      cancel.onclick = () => close(false);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
      document.body.append(overlay);
      name.focus();
    });
  }

  // ينزّل ملف البيانات (JSON) مع ختم نوع التقرير ليتعرّف عليه برنامج المحصلة
  function downloadJson() {
    if (R.kind) { D._kind = R.kind; D._exportedAt = new Date().toISOString(); }
    // داخل تطبيق الموبايل: يحفظه التطبيق في مجلد التنزيلات (التنزيل العادي لا يعمل داخل التطبيقات)
    if (window.AndroidBridge) { window.AndroidBridge.saveFile(`${R.fileName(D)}.json`, JSON.stringify(D, null, 2)); return; }
    const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `${R.fileName(D)}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function saveFile() {
    if (!(await acknowledge('الحفظ'))) return;
    downloadJson();
    setStatus('تم حفظ ملف البيانات في مجلد التنزيلات');
  }
  function openFile(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        D = deepMerge(clone(R.data), JSON.parse(r.result));
        buildForm(); changed({ now: true }); setStatus(`تم فتح الملف: ${file.name}`);
      } catch (e) { alert('تعذّر قراءة الملف. تأكد أنه ملف بيانات محفوظ من هذا البرنامج.'); }
    };
    r.readAsText(file, 'utf-8');
  }

  // ===== التشغيل =====
  function init() {
    R = window.REPORT;
    document.querySelector('.brand-name').textContent = R.title;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(R.storeKey) || 'null'); } catch (e) {}
    D = deepMerge(clone(R.data), saved || {});

    $('#btn-open').onclick = () => $('#file').click();
    $('#file').onchange = (e) => { if (e.target.files[0]) openFile(e.target.files[0]); e.target.value = ''; };
    $('#btn-save').onclick = saveFile;
    $('#btn-pdf').onclick = async () => {
      const bad = failedRules();
      if (bad.length) { alert('لا يمكن تصدير التقرير قبل تحقيق الشروط التالية:\n\n' + bad.map((r) => '• ' + r.text + (r.detail ? ' — ' + r.detail(D) : '')).join('\n')); return; }
      if (!(await acknowledge('التصدير'))) return;
      if (R.exportDataWithPdf) { downloadJson(); setStatus('تم حفظ ملف البيانات في التنزيلات — أرسله مع ملف PDF'); }
      renderPreview();
      // داخل تطبيق الموبايل: نافذة الطباعة في أندرويد («حفظ كملف PDF»)
      if (window.AndroidBridge) setTimeout(() => window.AndroidBridge.print(R.fileName(D)), 300);
      else setTimeout(() => window.print(), 50);
    };
    $('#btn-reset').onclick = () => {
      if (!confirm('سيتم استبدال كل البيانات الحالية ببيانات القالب الأصلي. هل تريد المتابعة؟\nاحفظ ملف بياناتك أولاً إن كنت تحتاجه.')) return;
      D = clone(R.data); buildForm(); changed({ now: true });
    };
    window.addEventListener('resize', fitZoom);
    window.addEventListener('beforeprint', () => { $('#pages').style.zoom = 1; });
    window.addEventListener('afterprint', fitZoom);

    buildForm();
    wirePreviewEditing();
    // واجهة للتقارير التي تضيف أزراراً خاصة (مثل استيراد تقارير الأفرع في المحصلة)
    window.EditorAPI = {
      get: () => D,
      replace: (nd) => { D = nd; buildForm(); changed({ now: true }); },
      refresh: () => { buildForm(); changed({ now: true }); },
      status: setStatus, el
    };
    if (R.onInit) R.onInit(window.EditorAPI);
    renderPreview();
    setStatus(saved ? 'تم استرجاع آخر بيانات محفوظة' : 'جاهز');
    if (document.fonts) document.fonts.ready.then(() => { renderPreview(); fitZoom(); });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
