// تقرير أفرع إدارة القضايا والملاحقات المسلكية: نموذج واحد لفرع أو إدارة يكتب المستخدم اسمها.
// البيانات الافتراضية + رسّام الصفحات + مخطط الواجهة.
(function () {
  const { T, N, pairs, list, info, num } = window.EditorKit;

  // ===== الألوان (من دليل التصميم لهذا التقرير) =====
  const C = window.BRANCH_COLORS || {
    dark: '#0D1D41', gold: '#B9A779', cream: '#F7F5F0', border: '#D9CDA8', goldText: '#7A6A45', foot: '#ECE8DF',
    muted: '#2E3140', ink: '#2E3140', red: '#7A6A45', green: '#0D1D41', barLight: '#3B4F7E',
    grad: 'linear-gradient(160deg,#1A2C57,#08142E)', logo: 'assets/dpd-shield.png', logoH: 48, mapLight: '#1F3466'
  };

  const DATA = {
    "entityType": "فرع",
    "entityName": "",
    "month": "أيلول",
    "year": "2026",
    "startPage": 1,
    "headerTitle": "إدارة القضايا والملاحقات المسلكية",
    "headerSub": "وزارة الداخلية — الجمهورية العربية السورية",
    "footerText": "تقرير شهر {الشهر} لأفرع إدارة القضايا والملاحقات المسلكية",
    "hidden": {},
    "b0": {
      "kicker": "تقرير الأعمال المنجزة",
      "title": "أعمال {الجهة}",
      "subtitle": "خلال شهر {الشهر} لعام {السنة}",
      "mode": "تلقائي",
      "image": ""
    },
    "b1": {
      "title": "أعمال {الجهة}",
      "subtitle": "أعمال قسم التحقيق",
      "totalFiles": 0,
      "drugTotal": 0,
      "drugPositive": 0,
      "drugNegative": 0,
      "queries": 0,
      "doneFiles": 0,
      "pendingFiles": 0,
      "pendingLabel": "قيد المتابعة",
      "provenFiles": 0,
      "negatedFiles": 0,
      "chartTitle": "المخالفات الأكثر شيوعاً",
      "sort": true,
      "rows": [],
      "noteTitle": "",
      "noteGroups": []
    },
    "b2": {
      "title": "تتمة أعمال قسم التحقيق",
      "chartTitle": "تصنيف المخالفات تبعاً للمناطق / الأقسام",
      "sort": true,
      "rows": [],
      "noteTitle": "",
      "noteGroups": [],
      "ranksTitle": "تصنيف الشكاوى حسب رتبة وصفة المشكو منه",
      "ranks": [
        {
          "label": "عنصر",
          "value": 0
        },
        {
          "label": "صف ضابط",
          "value": 0
        },
        {
          "label": "ضابط",
          "value": 0
        }
      ]
    },
    "b3": {
      "title": "أعمال قسم القضايا",
      "against": 0,
      "againstDone": 0,
      "againstPending": 0,
      "byMinistry": 0,
      "byDone": 0,
      "byPending": 0,
      "judicialDecisions": 0,
      "ministerDecisions": 0,
      "donutTitle": "حالة القضايا"
    },
    "b4": {
      "title": "تتمة أعمال قسم القضايا",
      "chart1Title": "تصنيف قضايا الدولة حسب نوع القضية",
      "sort1": true,
      "rows1": [],
      "referralsLabel": "عدد الإحالات القضائية",
      "referrals": 0,
      "referralsUnit": "قضية",
      "chart2Title": "تصنيف الاحالات القضائية حسب النوع",
      "sort2": true,
      "rows2": []
    },
    "bd": {
      "title": "أعمال قسم النظارة والسوقيات",
      "subtitle": "حركة الموقوفين والدوريات خلال الشهر",
      "current": 0,
      "month": 0,
      "transferred": 0,
      "released": 0,
      "patrols": 0
    },
    "b5": {
      "title": "أبرز الأعمال المنجزة لقسم التحقيق {الجهة} لشهر {الشهر} لعام {السنة}",
      "items": []
    }
  };

  // ===== أدوات =====
  let D;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), D);
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  // «فرع دمشق» أو «إدارة مكافحة الإرهاب» حسب النوع والاسم الذي يكتبه المستخدم
  function entity() {
    const name = String(D.entityName || '').trim();
    const type = String(D.entityType || '').trim().replace('بدون', '');
    if (!type || name.startsWith(type)) return name;
    return `${type} ${name}`;
  }
  const tok = (s) => String(s ?? '').split('{الجهة}').join(entity()).split('{الشهر}').join(D.month).split('{السنة}').join(D.year);
  const ed = (path) => `<span data-edit="${path}">${esc(tok(get(path)))}</span>`;

  function rowsOf(path, sort) {
    const rows = (get(path) || []).map((r, i) => ({ label: r.label, v: num(r.value), i }));
    if (sort) rows.sort((a, b) => b.v - a.v);
    rows.sort((a, b) => (/أخرى|اخرى/.test(a.label) ? 1 : 0) - (/أخرى|اخرى/.test(b.label) ? 1 : 0));
    return rows;
  }

  function donut(title, segs, centerLabel) {
    const total = segs.reduce((s, x) => s + x.v, 0);
    let acc = 0;
    const stops = total > 0 ? segs.map((x) => { const a = acc; acc += (x.v / total) * 360; return `${x.color} ${a.toFixed(1)}deg ${acc.toFixed(1)}deg`; }).join(',') : `${C.border} 0deg 360deg`;
    return `
        <div style="font-size:13px;font-weight:700;color:${C.dark};text-align:center;">${title}</div>
        <div style="position:relative;width:250px;height:250px;border-radius:50%;background:conic-gradient(${stops});display:flex;align-items:center;justify-content:center;">
          <div style="width:154px;height:154px;border-radius:50%;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:32px;font-weight:900;color:${C.dark};">${total}</div>
            <div style="font-size:13px;color:${C.goldText};">${centerLabel || 'إجمالي'}</div>
          </div>
        </div>
        <div style="display:flex;gap:18px;font-size:11px;font-weight:700;flex-wrap:wrap;justify-content:center;">
          ${segs.map((x) => `<div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:${x.color};display:inline-block;"></span>${x.labelHtml || esc(x.label)} — ${x.v} (%${pct(x.v, total)})</div>`).join('')}
        </div>`;
  }

  // مخطط أعمدة يملأ المساحة المتاحة
  function bars(path, sort, o) {
    const rows = rowsOf(path, sort);
    const max = Math.max(1, ...rows.map((r) => r.v));
    const n = rows.length;
    const w = o.w || (n <= 6 ? 30 : n <= 10 ? 26 : n <= 14 ? 22 : 16);
    const lf = o.lf || (n <= 6 ? 12.5 : n <= 10 ? 11 : n <= 14 ? 9.5 : 8);
    return `
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:${o.gap || 8}px;flex:1;min-height:0;">
        ${rows.map((r) => `<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;flex:1;min-width:0;">
            <div style="font-size:${o.vf || 13}px;font-weight:900;color:${C.dark};">${r.v}</div>
            <div style="width:${w}px;height:${Math.round((r.v / max) * 1000) / 10}%;background:linear-gradient(180deg,${C.barLight || C.dark},${C.dark});border-radius:4px 4px 0 0;"></div>
          </div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;gap:${o.gap || 8}px;">
        ${rows.map((r) => `<div style="flex:1;min-width:0;text-align:center;font-size:${lf}px;font-weight:700;color:${C.dark};word-break:keep-all;overflow-wrap:normal;" data-fitw><span data-edit="${path}.${r.i}.label">${esc(r.label)}</span></div>`).join('')}
      </div>`;
  }

  function header() {
    return `
  <div style="background:${C.dark};padding:16px 40px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:12px;background:#FFFFFF;border-radius:10px;padding:6px 14px;">
      <img src="${C.logo}" alt="" style="height:${C.logoH || 48}px;width:auto;display:block;">
      <div style="display:flex;flex-direction:column;gap:1px;">
        <div style="font-size:14px;font-weight:700;color:${C.dark};">${ed('headerTitle')}</div>
        <div style="font-size:11px;font-weight:500;color:${C.goldText};">${ed('headerSub')}</div>
      </div>
    </div>
    <div style="color:${C.border};font-size:13px;font-weight:500;">${esc(D.month)} ${esc(D.year)}</div>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,${C.gold},${C.border},${C.gold});"></div>`;
  }
  // التذييل: نص التقرير + (اسم الفرع | رقم الصفحة)
  function footer(n) {
    return `
  <div style="margin-top:auto;">
    <div style="height:3px;background:linear-gradient(90deg,${C.gold},${C.border},${C.gold});"></div>
    <div style="padding:12px 40px;display:flex;align-items:center;justify-content:space-between;background:${C.foot || '#ECE8DF'};">
      <span style="color:${C.dark};font-size:14px;font-weight:500;">${esc(tok(D.footerText))}</span>
      ${n !== '' ? `<div style="display:flex;align-items:center;gap:10px;color:${C.dark};"><span style="font-size:14px;font-weight:700;">${esc(entity())}</span><span style="width:1px;height:16px;background:${C.gold};"></span><span style="font-size:15px;font-weight:700;">${n}</span></div>` : ''}
    </div>
  </div>`;
  }
  const title = (path, size) => `
    <div style="display:flex;flex-direction:column;gap:6px;">
      <h1 style="margin:0;font-size:${size || 28}px;font-weight:900;color:${C.dark};text-align:right;line-height:1.35;">${ed(path)}</h1>
      <div style="width:56px;height:3px;background:${C.gold};"></div>
    </div>`;
  const SHADOW = 'box-shadow:0 6px 18px rgba(13,29,65,0.08)';
  const box = (inner, flex, pad) => `<div style="background:#ffffff;border:none;border-radius:16px;${SHADOW};padding:${pad || '18px 24px 12px'};display:flex;flex-direction:column;gap:10px;flex:${flex};min-height:0;">${inner}</div>`;
  // تفصيل «الأخرى» تحت المخطط: سطر واحد (inline) أو كتلة
  function noteBlock(prefix, inline) {
    const p = get(prefix) || {};
    const groups = (p.noteGroups || []).filter((g) => String(g.head || '').trim() || String(g.text || '').trim());
    if (!groups.length) return '';
    const t = String(p.noteTitle || '').trim();
    if (inline) {
      return `<div style="flex:none;border-top:1px solid ${C.border};padding-top:6px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:11px;line-height:1.5;color:${C.ink};">
        ${t ? `<span style="font-weight:900;color:${C.dark};">${esc(tok(t))}:</span>` : ''}
        ${groups.map((g) => `<span style="display:flex;align-items:center;gap:5px;"><span style="background:${C.dark};color:${C.cream};font-weight:900;border-radius:5px;padding:0 7px;">${esc(tok(g.head))}</span><span style="font-weight:500;">${esc(tok(g.text))}</span></span>`).join('')}
      </div>`;
    }
    return `<div style="border-top:1px solid ${C.border};padding-top:8px;display:flex;flex-direction:column;gap:6px;text-align:right;">
        ${t ? `<div style="font-size:13px;font-weight:900;color:${C.dark};">${esc(tok(t))}</div>` : ''}
        ${groups.map((g) => `<div style="font-size:11.5px;font-weight:500;color:${C.ink};line-height:1.8;"><span style="background:${C.dark};color:${C.cream};font-weight:900;border-radius:6px;padding:1px 10px;margin-left:8px;">${esc(tok(g.head))}</span>${esc(tok(g.text))}</div>`).join('')}
      </div>`;
  }
  const boxTitle = (path, size) => `<div style="font-size:${size || 20}px;font-weight:900;color:${C.dark};text-align:center;">${ed(path)}</div>`;

  // ===== الغلاف: خريطة سوريا مع تمييز المحافظة، أو صورة مرفقة للإدارات =====
  const normAr = (t) => String(t ?? '').trim().replace(/^محافظة\s+/, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ');
  function matchGov() {
    const M = window.SYRIA_MAP;
    if (!M) return null;
    const n = normAr(D.entityName);
    return M.gov.find((g) => normAr(g.name) === n) || (M.regions || []).find((g) => normAr(g.name) === n) || null;
  }
  function coverVisual() {
    const M = window.SYRIA_MAP;
    const gov = matchGov();
    const mode = D.b0.mode || 'تلقائي';
    const img = D.b0.image;
    if ((mode === 'صورة' || (mode === 'تلقائي' && !gov)) && img) {
      return `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    }
    if (!M) return '';
    const [bx, by, bw, bh] = M.bbox;
    const sel = gov || null;
    const others = M.gov.filter((g) => g !== sel);
    const fills = others.map((g) => `<path d="${g.d}" fill="#ffffff" fill-opacity="0.07" stroke="${C.border}" stroke-opacity="0.55" stroke-width="1.2" stroke-linejoin="round"/>`).join('');
    const labels = others.map((g) => `<text x="${g.cx}" y="${g.cy}" text-anchor="middle" dominant-baseline="middle" direction="rtl" font-family="Qomra, sans-serif" font-size="15" font-weight="700" fill="${C.cream}" fill-opacity="0.72">${esc(g.name)}</text>`).join('');
    let selected = '';
    if (sel) {
      const label = esc(sel.name);
      const lw = Math.max(92, label.length * 17 + 36);
      const x = sel.cx, y = sel.cy;
      const lx = Math.min(Math.max(x - lw / 2, bx + 8), bx + bw - lw - 8);
      selected = `
        <path d="${sel.d}" fill="${C.gold}" fill-opacity="${sel.region ? 0.78 : 0.9}" stroke="${C.cream}" stroke-width="${sel.region ? 2 : 2.5}" stroke-dasharray="${sel.region ? '7 5' : 'none'}" stroke-linejoin="round" ${sel.region ? 'clip-path="url(#syClip)"' : 'filter="url(#selGlow)"'}/>
        <g>
          <path d="M${x},${y} c-9,-14 -22,-26 -22,-42 a22,22 0 1 1 44,0 c0,16 -13,28 -22,42z" fill="${C.cream}" stroke="${C.dark}" stroke-width="2.5"/>
          <circle cx="${x}" cy="${y - 42}" r="8.5" fill="${C.dark}"/>
          <rect x="${lx}" y="${y - 118}" width="${lw}" height="46" rx="12" fill="${C.cream}" stroke="${C.gold}" stroke-width="2.5"/>
          <text x="${lx + lw / 2}" y="${y - 87}" text-anchor="middle" direction="rtl" font-family="Qomra, sans-serif" font-size="25" font-weight="900" fill="${C.dark}">${label}</text>
        </g>`;
    }
    return `<svg viewBox="${bx} ${by} ${bw} ${bh}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
        <defs>
          <filter id="outGlow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter>
          <clipPath id="syClip"><path d="${M.outline}"/></clipPath>
          <filter id="selGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${C.gold}" flood-opacity="0.7"/></filter>
        </defs>
        <path d="${M.outline}" fill="none" stroke="${C.gold}" stroke-opacity="0.45" stroke-width="10" filter="url(#outGlow)"/>
        <path d="${M.outline}" fill="#ffffff" fill-opacity="0.04"/>
        ${fills}
        <path d="${M.outline}" fill="none" stroke="${C.gold}" stroke-width="2.6" stroke-linejoin="round"/>
        ${labels}
        ${selected}
      </svg>`;
  }

  // ===== الصفحات =====
  const pages = {
    b0() {
      const gov = matchGov();
      const mode = D.b0.mode || 'تلقائي';
      const usingImage = (mode === 'صورة' || (mode === 'تلقائي' && !gov)) && D.b0.image;
      const caption = usingImage ? esc(entity()) : gov ? `موقع ${esc(entity())} على خريطة الجمهورية العربية السورية` : 'الجمهورية العربية السورية';
      return header() + `
  <div style="flex:1;display:flex;flex-direction:column;padding:34px 40px 22px;gap:12px;min-height:0;">
    <div style="font-size:14px;font-weight:700;color:${C.goldText};letter-spacing:.5px;">${ed('b0.kicker')}</div>
    <h1 style="margin:0;font-size:40px;font-weight:900;color:${C.dark};line-height:1.3;text-wrap:balance;">${ed('b0.title')}</h1>
    <div style="width:84px;height:4px;background:${C.gold};border-radius:2px;"></div>
    <div style="font-size:19px;font-weight:500;color:${C.ink};">${ed('b0.subtitle')}</div>
    <div style="flex:1;min-height:0;border-radius:18px;overflow:hidden;border:3px solid ${C.gold};box-shadow:0 12px 30px rgba(13,29,65,0.18);background:radial-gradient(ellipse at 45% 45%, ${C.mapLight || '#24524a'} 0%, ${C.dark} 70%);padding:${usingImage ? 0 : 14}px;">${coverVisual()}</div>
    <div style="display:flex;align-items:center;justify-content:flex-start;font-size:12px;font-weight:700;color:${C.goldText};">
      <span>${caption}</span>
    </div>
    <div style="flex:none;display:flex;flex-direction:column;gap:10px;margin-top:6px;">
      <div style="font-size:14px;font-weight:900;color:${C.dark};">أبرز مؤشرات الشهر</div>
      <div style="display:grid;grid-template-columns:1.6fr 2.4fr;gap:12px;">
        ${(() => {
          const inv = num(D.b1.totalFiles), stateCases = num(D.b3.against) + num(D.b3.byMinistry), refs = num(D.b4.referrals);
          const sub = (items, dark) => `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;border-top:1px solid ${dark ? 'rgba(217,205,168,0.35)' : C.foot || '#ECE8DF'};padding-top:8px;">${items.map(([v, l]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;background:${dark ? 'rgba(255,255,255,0.08)' : C.cream};border-radius:8px;padding:5px 4px;"><div style="font-size:17px;font-weight:900;color:${dark ? C.cream : C.dark};">${v}</div><div style="font-size:10.5px;font-weight:500;color:${dark ? C.border : C.goldText};text-align:center;line-height:1.3;">${l}</div></div>`).join('')}</div>`;
          const card = (dark, total, label, items) => `<div style="background:${dark ? C.grad : '#FFFFFF'};border-top:3px solid ${C.gold};box-shadow:0 5px 12px rgba(13,29,65,0.12);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;"><div style="display:flex;align-items:baseline;justify-content:center;gap:8px;"><div style="font-size:28px;font-weight:900;color:${dark ? C.cream : C.dark};">${total}</div><div style="font-size:12px;font-weight:700;color:${dark ? C.border : C.ink};">${label}</div></div>${sub(items, dark)}</div>`;
          return card(true, inv, 'العدد الكلي للأضابير التحقيقية', [[num(D.b1.doneFiles), 'المنجزة'], [num(D.b1.pendingFiles), 'قيد الإنجاز']])
            + card(false, stateCases + refs, 'العدد الكلي للقضايا', [[stateCases, 'قضايا الدولة'], [refs, 'الإحالات القضائية']]);
        })()}
      </div>
    </div>
  </div>` + footer('');
    },

    b1(n) {
      const p = D.b1;
      const total = num(p.totalFiles), done = num(p.doneFiles), pending = num(p.pendingFiles);
      const proven = num(p.provenFiles), negated = num(p.negatedFiles);
      const pos = num(p.drugPositive), neg = num(p.drugNegative), drugTotal = num(p.drugTotal);
      const card = (v, label, dark, color) => `
        <div style="background:${dark ? C.grad : '#ffffff'};border:none;border-top:3px solid ${C.gold};box-shadow:0 5px 12px rgba(13,29,65,0.12);border-radius:12px;padding:16px 10px;text-align:center;">
          <div style="font-size:33px;font-weight:900;color:${color || (dark ? C.cream : C.dark)};">${v}</div>
          <div style="font-size:14px;font-weight:500;margin-top:6px;line-height:1.5;color:${dark ? C.cream : C.ink};">${label}</div>
        </div>`;
      return header() + `
  <div style="flex:1;display:flex;flex-direction:column;padding:28px 40px 10px;gap:24px;min-height:0;">
    ${title('b1.title')}
    <div style="font-size:26px;font-weight:900;color:${C.dark};text-align:right;">${ed('b1.subtitle')}</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;">
      ${card(total, 'عدد الأضابير التحقيقية الكلي', true)}
      ${card(drugTotal, 'عدد كتب فحص المخدرات الكلية')}
      ${card(pos, 'كتب فحص المخدرات إيجابية', false, C.green)}
      ${card(neg, 'كتب فحص المخدرات سلبية', false, C.red)}
      ${card(num(p.queries), 'عدد الاستعلامات الجنائية')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;background:#ffffff;border:none;border-radius:16px;${SHADOW};padding:24px 20px;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">${donut(`حالة الأضابير التحقيقية (${total})`, [{ label: 'منجزة', v: done, color: C.dark }, { label: p.pendingLabel || 'قيد المتابعة', v: pending, color: C.border }])}</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">${donut(`نتيجة الأضابير المنجزة (${done})`, [{ label: 'مثبتة', v: proven, color: C.green }, { label: 'منفية', v: negated, color: C.red }])}</div>
    </div>
    ${box(boxTitle('b1.chartTitle') + bars('b1.rows', p.sort, { vf: 15 }) + noteBlock('b1', true), 1)}
  </div>` + footer(n);
    },

    b2(n) {
      const ranks = (D.b2.ranks || []).map((r, i) => ({ label: r.label, labelHtml: `<span data-edit="b2.ranks.${i}.label">${esc(r.label)}</span>`, v: num(r.value), color: [C.dark, C.border, C.goldText, C.gold, C.barLight][i % 5] }));
      return header() + `
  <div style="flex:1;display:flex;flex-direction:column;padding:28px 40px 10px;gap:20px;min-height:0;">
    ${title('b2.title')}
    ${box(boxTitle('b2.chartTitle') + bars('b2.rows', D.b2.sort, { gap: 6 }) + noteBlock('b2', false), 1.3)}
    <div style="background:#ffffff;border:none;border-radius:16px;${SHADOW};padding:18px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;flex:1;min-height:0;">
      ${donut(`<span style="font-size:20px;font-weight:900;">${ed('b2.ranksTitle')}</span>`, ranks, 'الإجمالي')}
    </div>
  </div>` + footer(n);
    },

    b3(n) {
      const p = D.b3;
      const total = num(p.against) + num(p.byMinistry);
      const done = num(p.againstDone) + num(p.byDone), pending = num(p.againstPending) + num(p.byPending);
      const card = (v, label, dn, pd) => `
          <div style="background:#ffffff;border:none;border-radius:12px;${SHADOW};padding:22px 14px;text-align:center;">
            <div style="font-size:42px;font-weight:900;color:${C.dark};">${v}</div>
            <div style="font-size:16px;font-weight:500;margin-top:8px;line-height:1.5;color:${C.ink};">${label}</div>
            ${dn != null ? `<div style="display:flex;justify-content:center;gap:14px;margin-top:10px;padding-top:8px;border-top:1px solid ${C.border};font-size:12.5px;font-weight:700;"><span style="color:${C.dark};">منجزة ${dn}</span><span style="color:${C.goldText};">قيد الإنجاز ${pd}</span></div>` : ''}
          </div>`;
      return header() + `
  <div style="flex:1;display:flex;flex-direction:column;padding:28px 40px 10px;gap:24px;min-height:0;">
    ${title('b3.title')}
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:${C.grad};border-radius:16px;border-top:4px solid ${C.border};box-shadow:0 10px 24px rgba(13,29,65,0.25);padding:22px 14px;text-align:center;color:${C.cream};">
        <div style="font-size:46px;font-weight:900;">${total}</div>
        <div style="font-size:17px;font-weight:500;margin-top:8px;line-height:1.5;">العدد الكلي للقضايا</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${card(num(p.against), 'القضايا المقامة على الوزارة', num(p.againstDone), num(p.againstPending))}
        ${card(num(p.byMinistry), 'القضايا المقامة من قبل الوزارة', num(p.byDone), num(p.byPending))}
        ${card(num(p.judicialDecisions), 'عدد القرارات القضائية')}
        ${card(num(p.ministerDecisions), 'عدد القرارات الصادرة عن السيد وزير الداخلية')}
      </div>
    </div>
    <div style="background:#ffffff;border:none;border-radius:16px;${SHADOW};padding:18px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;flex:1;min-height:0;">
      ${donut(`<span style="font-size:20px;font-weight:900;">${ed('b3.donutTitle')}</span>`, [{ label: 'منجزة', v: done, color: C.dark }, { label: 'قيد المتابعة', v: pending, color: C.border }], 'الإجمالي')}
    </div>
  </div>` + footer(n);
    },

    b4(n) {
      const p = D.b4;
      const has1 = (p.rows1 || []).length > 0;
      const has2 = (p.rows2 || []).length > 0;
      return header() + `
  <div style="flex:1;display:flex;flex-direction:column;padding:24px 40px 10px;gap:16px;min-height:0;">
    ${title('b4.title')}
    ${has1 ? box(boxTitle('b4.chart1Title', 18) + bars('b4.rows1', p.sort1, { gap: 6, vf: 11 }), 1.15, '14px 22px 10px') : ''}
    <div dir="rtl" style="background:${C.grad};border-top:3px solid ${C.gold};border-radius:12px;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;color:${C.cream};">
      <div style="font-size:19px;font-weight:700;">${ed('b4.referralsLabel')}</div>
      <div style="display:flex;align-items:baseline;gap:8px;">
        <div style="font-size:38px;font-weight:900;">${num(p.referrals)}</div>
        <div style="font-size:17px;font-weight:500;">${ed('b4.referralsUnit')}</div>
      </div>
    </div>
    ${has2 ? box(boxTitle('b4.chart2Title', 18) + bars('b4.rows2', p.sort2, { gap: 6, vf: 12 }), has1 ? 0.85 : 1, '14px 22px 10px') : ''}
  </div>` + footer(n);
    },

    bd(n) {
      const d = D.bd;
      const current = num(d.current), month = num(d.month), transferred = num(d.transferred), released = num(d.released), patrols = num(d.patrols);
      const out = released + transferred;
      const rp = pct(released, out), tp = out ? 100 - rp : 0;
      const maxV = Math.max(patrols, month, released, transferred, current, 1);
      const bar = (label, v, color) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="flex:1;width:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;">
              <div style="font-size:15px;font-weight:900;color:${C.dark};margin-bottom:4px;">${v}</div>
              <div style="width:46px;height:${Math.round((v / maxV) * 1000) / 10}%;background:${color};border-radius:4px 4px 0 0;"></div>
            </div>
            <div style="font-size:12px;font-weight:700;color:${C.dark};text-align:center;line-height:1.4;min-height:34px;">${label}</div>
          </div>`;
      const kcard = (v, label, dark) => `<div style="background:${dark ? C.grad : '#ffffff'};border-top:3px solid ${C.gold};box-shadow:0 5px 12px rgba(13,29,65,0.12);border-radius:12px;padding:16px 10px;text-align:center;">
          <div style="font-size:36px;font-weight:900;color:${dark ? C.cream : C.dark};">${v}</div>
          <div style="font-size:14px;font-weight:500;margin-top:6px;color:${dark ? C.border : C.goldText};">${label}</div>
        </div>`;
      return header() + `
  <div style="flex:1;display:flex;flex-direction:column;padding:28px 40px 14px;gap:22px;min-height:0;">
    ${title('bd.title')}
    <div style="font-size:20px;font-weight:900;color:${C.dark};text-align:right;">${ed('bd.subtitle')}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${kcard(patrols, 'دورية تم تسييرها', true)}${kcard(month, 'موقوف خلال الشهر')}${kcard(released, 'إخلاء سبيل')}${kcard(transferred, 'موقوف تم تحويله')}
    </div>
    <div style="flex:1;min-height:0;background:#ffffff;border-radius:16px;${SHADOW};padding:18px 24px 14px;display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:18px;font-weight:900;color:${C.dark};text-align:center;">إحصائية قسم النظارة والسوقيات</div>
      <div style="flex:1;min-height:180px;display:flex;align-items:stretch;justify-content:space-around;gap:16px;">
        ${bar('عدد المواقيف الكلي (الحالي)', current, C.dark)}${bar('المواقيف خلال الشهر', month, C.dark)}${bar('الموقوفون المحوّلون', transferred, C.gold)}${bar('إخلاء السبيل', released, C.gold)}${bar('الدوريات المسيّرة', patrols, C.goldText)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px;">
      <div style="background:#ffffff;border-radius:16px;${SHADOW};padding:16px;display:flex;align-items:center;justify-content:center;gap:20px;">
        <div style="width:150px;height:150px;border-radius:50%;background:${out ? `conic-gradient(${C.dark} 0% ${rp}%, ${C.border} ${rp}% 100%)` : C.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <div style="width:92px;height:92px;border-radius:50%;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <span style="font-size:28px;font-weight:900;color:${C.dark};line-height:1;">${out}</span>
            <span style="font-size:11px;font-weight:700;color:${C.goldText};margin-top:3px;">خرجوا من النظارة</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:15px;font-weight:900;color:${C.dark};">مآل موقوفي الشهر</div>
          <div style="display:flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border-radius:50%;background:${C.dark};display:inline-block;"></span><span style="font-size:13px;font-weight:700;color:${C.ink};white-space:nowrap;">إخلاء سبيل – ${released} (%${rp})</span></div>
          <div style="display:flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border-radius:50%;background:${C.border};display:inline-block;"></span><span style="font-size:13px;font-weight:700;color:${C.ink};white-space:nowrap;">تحويل للجهات – ${transferred} (%${tp})</span></div>
        </div>
      </div>
      <div style="background:${C.grad};border-top:3px solid ${C.gold};border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">
        <div style="font-size:46px;font-weight:900;color:${C.cream};">${current}</div>
        <div style="font-size:15px;font-weight:500;color:${C.border};">عدد المواقيف الكلي (الحالي)</div>
      </div>
    </div>
  </div>` + footer(n);
    },

    b5(n) {
      const items = D.b5.items || [];
      return header() + `
  <div style="flex:1;display:flex;flex-direction:column;padding:24px 40px 10px;gap:16px;min-height:0;">
    ${title('b5.title', 24)}
    <div style="display:flex;flex-direction:column;gap:18px;">
      ${items.map((t, i) => `
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <div style="flex-shrink:0;width:34px;height:34px;border-radius:50%;background:${C.dark};color:${C.cream};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;">${i + 1}</div>
          <div style="font-size:14px;font-weight:500;line-height:1.8;color:${C.ink};text-align:right;">${ed(`b5.items.${i}`)}</div>
        </div>`).join('')}
    </div>
  </div>` + footer(n);
    }
  };

  const IDS = ['b0', 'b1', 'b2', 'b3', 'b4', 'bd', 'b5'];
  window.renderReport = function (data) {
    D = data;
    if (D.b2 && /قسم الملاحقات المسلكية|— تتمة قسم التحقيق/.test(String(D.b2.title || ''))) D.b2.title = 'تتمة أعمال قسم التحقيق';
    let n = Math.max(1, Math.floor(num(data.startPage)) || 1);
    return IDS.map((id) => {
      if (data.hidden && data.hidden[id]) return '';
      let inner;
      try { inner = pages[id](id === 'b0' ? '' : n); } catch (e) { inner = `<div style="padding:40px;color:#a1432a;">خطأ في بناء الصفحة: ${esc(e.message)}</div>`; }
      if (id !== 'b0') n += 1;
      return `<section class="page" data-page="${id}" style="display:flex;flex-direction:column;background:${C.cream};direction:rtl;font-family:'Qomra',sans-serif;color:${C.ink};overflow:hidden;">${inner}</section>`;
    }).join('\n');
  };

  // ===== شرط عدم تكرار البند في المخطط الواحد =====
  const norm = (t) => String(t ?? '').trim().replace(/\s+/g, ' ');
  function dupIdx(D, path) {
    const rows = path.split('.').reduce((o, k) => (o == null ? o : o[k]), D) || [];
    const seen = {};
    rows.forEach((r, i) => { const k = norm(r.label); if (k) (seen[k] = seen[k] || []).push(i); });
    return Object.values(seen).filter((a) => a.length > 1).flat();
  }
  // شرط: مجموع صفوف مخطط = رقم مرجعي (يُطبَّق فقط عندما يحتوي المخطط على صفوف)
  function sumRule(page, path, text, target, targetName, targetFields, enabled) {
    const rowsAt = (D) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), D) || [];
    const total = (D) => rowsAt(D).reduce((a, r) => a + num(r.value), 0);
    const active = (D) => rowsAt(D).length > 0 && (!enabled || enabled(D));
    return {
      page, text,
      fields: (D) => rowsAt(D).map((_, i) => `${path}.${i}.value`).concat(targetFields),
      test: (D) => !active(D) || total(D) === target(D),
      detail: (D) => `مجموع المخطط ${total(D)} بينما ${targetName} ${target(D)}`
    };
  }
  function dupRule(page, path, name) {
    return {
      page, text: `عدم تكرار البند في مخطط «${name}»`,
      fields: (D) => dupIdx(D, path).map((i) => `${path}.${i}.label`),
      test: (D) => dupIdx(D, path).length === 0,
      detail: (D) => {
        const rows = path.split('.').reduce((o, k) => (o == null ? o : o[k]), D) || [];
        return 'مكرر: ' + [...new Set(dupIdx(D, path).map((i) => norm(rows[i].label)))].join('، ') + ' — ادمج أعدادها في صف واحد';
      }
    };
  }

  // ===== مخطط الواجهة =====
  const sum = (arr) => (arr || []).reduce((s, r) => s + num(r.value), 0);
  window.REPORT = {
    title: 'محرر تقرير الأفرع',
    storeKey: 'report-editor-branch-sept-v1',
    kind: 'dpd-branch-report',
    exportDataWithPdf: true,
    disclaimer: 'أنت المسؤول عن صحة البيانات المُدخلة في هذا التقرير ودقتها. في حال وجود أي خطأ أو نقص في البيانات تقع المسؤولية كاملة على مُدخل البيانات.',
    data: DATA,
    pages: IDS,
    fileName: (D) => `تقرير-${(D.entityType && D.entityType !== 'بدون' && !String(D.entityName || '').startsWith(D.entityType) ? D.entityType + '-' : '')}${D.entityName}-${D.month}-${D.year}`.split(' ').join('-'),
    rules: [
      {
        page: 'b1', text: 'المنجزة + قيد الإنجاز = عدد الأضابير الكلي',
        fields: ['b1.totalFiles', 'b1.doneFiles', 'b1.pendingFiles'],
        test: (D) => num(D.b1.doneFiles) + num(D.b1.pendingFiles) === num(D.b1.totalFiles),
        detail: (D) => `${num(D.b1.doneFiles)} + ${num(D.b1.pendingFiles)} = ${num(D.b1.doneFiles) + num(D.b1.pendingFiles)} بينما الكلي ${num(D.b1.totalFiles)}`
      },
      {
        page: 'b1', text: 'المثبتة + المنفية = الأضابير المنجزة',
        fields: ['b1.doneFiles', 'b1.provenFiles', 'b1.negatedFiles'],
        test: (D) => num(D.b1.provenFiles) + num(D.b1.negatedFiles) === num(D.b1.doneFiles),
        detail: (D) => `${num(D.b1.provenFiles)} + ${num(D.b1.negatedFiles)} = ${num(D.b1.provenFiles) + num(D.b1.negatedFiles)} بينما المنجزة ${num(D.b1.doneFiles)}`
      },
      {
        page: 'b1', text: 'الإيجابية + السلبية = عدد كتب فحص المخدرات الكلي',
        fields: ['b1.drugTotal', 'b1.drugPositive', 'b1.drugNegative'],
        test: (D) => num(D.b1.drugPositive) + num(D.b1.drugNegative) === num(D.b1.drugTotal),
        detail: (D) => `${num(D.b1.drugPositive)} + ${num(D.b1.drugNegative)} = ${num(D.b1.drugPositive) + num(D.b1.drugNegative)} بينما الكلي ${num(D.b1.drugTotal)}`
      },
      {
        page: 'b3', text: 'القضايا المقامة على الوزارة: المنجزة + قيد الإنجاز = عددها',
        fields: ['b3.against', 'b3.againstDone', 'b3.againstPending'],
        test: (D) => num(D.b3.againstDone) + num(D.b3.againstPending) === num(D.b3.against),
        detail: (D) => `${num(D.b3.againstDone)} + ${num(D.b3.againstPending)} = ${num(D.b3.againstDone) + num(D.b3.againstPending)} بينما العدد ${num(D.b3.against)}`
      },
      {
        page: 'b3', text: 'القضايا المقامة من قبل الوزارة: المنجزة + قيد الإنجاز = عددها',
        fields: ['b3.byMinistry', 'b3.byDone', 'b3.byPending'],
        test: (D) => num(D.b3.byDone) + num(D.b3.byPending) === num(D.b3.byMinistry),
        detail: (D) => `${num(D.b3.byDone)} + ${num(D.b3.byPending)} = ${num(D.b3.byDone) + num(D.b3.byPending)} بينما العدد ${num(D.b3.byMinistry)}`
      },
      sumRule('b1', 'b1.rows', 'مجموع «المخالفات الأكثر شيوعاً» = الأضابير المنجزة', (D) => num(D.b1.doneFiles), 'المنجزة', ['b1.doneFiles']),
      sumRule('b2', 'b2.rows', 'مجموع «تصنيف المخالفات تبعاً للمناطق / الأقسام» = الأضابير المنجزة', (D) => num(D.b1.doneFiles), 'المنجزة', ['b1.doneFiles']),
      sumRule('b4', 'b4.rows1', 'مجموع «تصنيف قضايا الدولة حسب نوع القضية» = القضايا المنجزة', (D) => num(D.b3.againstDone) + num(D.b3.byDone), 'المنجزة', ['b3.againstDone', 'b3.byDone'], (D) => !(D.hidden && D.hidden.b3)),
      sumRule('b4', 'b4.rows2', 'مجموع «تصنيف الإحالات القضائية حسب النوع» = عدد الإحالات القضائية', (D) => num(D.b4.referrals), 'عدد الإحالات', ['b4.referrals']),
      dupRule('b1', 'b1.rows', 'المخالفات الأكثر شيوعاً'),
      dupRule('b4', 'b4.rows1', 'قضايا الدولة حسب نوع القضية'),
      dupRule('b4', 'b4.rows2', 'الإحالات القضائية حسب النوع')
    ],
    schema: [
      { id: 'general', title: 'الجهة والإعدادات العامة', fields: [
        { k: 'entityType', label: 'نوع الجهة', type: 'select', options: ['فرع', 'إدارة', 'بدون'] },
        { k: 'entityName', label: 'المحافظة أو الإدارة (اختر من القائمة أو اكتب اسماً آخر)', type: 'grouped', groups: {
          'المحافظات': ['دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'إدلب', 'دير الزور', 'الرقة', 'الحسكة', 'درعا', 'السويداء', 'القنيطرة', 'البادية'],
          'الإدارات': ['السجون', 'إدارة مكافحة الإرهاب', 'إدارة المطارات والمنافذ البرية', 'إدارة التأهيل والتدريب', 'إدارة مكافحة المخدرات', 'إدارة المهام الخاصة']
        } },
        info((D) => { const n = String(D.entityName || '').trim(), t = String(D.entityType || '').trim().replace('بدون', ''); return `يظهر في التقرير هكذا: «${!t || n.startsWith(t) ? n : t + ' ' + n}»\nاختر «بدون» إن أردت أن يظهر الاسم كما كتبته تماماً.`; }),
        { k: 'month', label: 'الشهر', type: 'month' },
        T('year', 'السنة'),
        N('startPage', 'رقم الصفحة الأولى (لمتابعة الترقيم ضمن التقرير المجمّع)'),
        T('headerTitle', 'عنوان الرأس'), T('headerSub', 'السطر الثاني في الرأس'), T('footerText', 'نص التذييل'),
        info(() => 'تلميح: {الجهة} تُكتب تلقائياً مثل «فرع دمشق»، ويمكن أيضاً استعمال {الشهر} و {السنة} في أي نص.')
      ] },
      { id: 'b0', no: '◈', title: 'الغلاف', fields: [
        T('b0.kicker', 'السطر العلوي'), T('b0.title', 'العنوان'), T('b0.subtitle', 'العنوان الفرعي'),
        { k: 'b0.mode', label: 'شكل الغلاف', type: 'select', options: ['تلقائي', 'خريطة', 'صورة'] },
        info((D) => {
          const n = String(D.entityName || '').trim();
          const norm = (t) => String(t ?? '').trim().replace(/^محافظة\s+/, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
          const gov = window.SYRIA_MAP && (window.SYRIA_MAP.gov.find((g) => norm(g.name) === norm(n)) || (window.SYRIA_MAP.regions || []).find((g) => norm(g.name) === norm(n)));
          const m = D.b0.mode || 'تلقائي';
          if (m === 'خريطة') return gov ? `الخريطة: تمييز ${gov.region ? 'منطقة' : 'محافظة'} ${gov.name}${gov.region ? ' (حدود تقريبية)' : ''}` : `⚠ «${n}» ليست من المحافظات على الخريطة — ستظهر الخريطة بدون تمييز`;
          if (m === 'صورة') return D.b0.image ? 'الغلاف: الصورة المرفقة' : '⚠ لم تُرفق صورة بعد — ستظهر الخريطة بدلاً منها';
          return gov ? `تلقائي: خريطة مع تمييز ${gov.region ? 'منطقة' : 'محافظة'} ${gov.name}${gov.region ? ' (حدود تقريبية)' : ''}` : (D.b0.image ? 'تلقائي: الصورة المرفقة (الجهة ليست محافظة)' : 'تلقائي: الجهة ليست محافظة — أرفق صورة للإدارة، وإلا تظهر الخريطة بدون تمييز');
        }),
        { k: 'b0.image', label: 'صورة الغلاف (للإدارات، أو لاستبدال الخريطة)', type: 'image' }
      ] },
      { id: 'b1', no: '1', title: 'أعمال قسم التحقيق', fields: [
        T('b1.title', 'عنوان الصفحة'), T('b1.subtitle', 'العنوان الفرعي'),
        N('b1.totalFiles', 'عدد الأضابير التحقيقية الكلي'),
        N('b1.doneFiles', 'الأضابير المنجزة'), N('b1.pendingFiles', 'الأضابير قيد الإنجاز'), T('b1.pendingLabel', 'تسمية غير المنجزة في الدائرة'),
        N('b1.provenFiles', 'الأضابير المثبتة'), N('b1.negatedFiles', 'الأضابير المنفية'),
        N('b1.drugTotal', 'عدد كتب فحص المخدرات الكلي'), N('b1.drugPositive', 'كتب فحص المخدرات – إيجابية'), N('b1.drugNegative', 'كتب فحص المخدرات – سلبية'),
        N('b1.queries', 'عدد الاستعلامات الجنائية'),
        T('b1.chartTitle', 'عنوان المخطط'), pairs('b1.rows', 'المخالفات (بند «أخرى» يبقى في النهاية)', { sortKey: 'b1.sort', labelGroups: window.VIOLATION_GROUPS }),
        T('b1.noteTitle', 'عنوان التفصيل (مثل: مخالفات أخرى (38))'), { k: 'b1.noteGroups', label: 'تفصيل «المخالفات الأخرى» تحت المخطط (اختياري)', type: 'table', cols: [{ k: 'head', label: 'العنوان (مثل: مخالفة واحدة لكل من)' }, { k: 'text', label: 'الأسماء', type: 'textarea' }] }
      ] },
      { id: 'b2', no: '2', title: 'تتمة قسم التحقيق', fields: [
        T('b2.title', 'عنوان الصفحة'), T('b2.chartTitle', 'عنوان المخطط'),
        pairs('b2.rows', 'المناطق / الأقسام (بند «أخرى» يبقى في النهاية)', { sortKey: 'b2.sort' }),
        T('b2.noteTitle', 'عنوان التفصيل (مثل: مناطق أخرى (42))'), { k: 'b2.noteGroups', label: 'تفصيل «المناطق الأخرى» تحت المخطط (اختياري)', type: 'table', cols: [{ k: 'head', label: 'العنوان (مثل: مخالفة واحدة لكل من)' }, { k: 'text', label: 'الأسماء', type: 'textarea' }] },
        T('b2.ranksTitle', 'عنوان الدائرة'), pairs('b2.ranks', 'حسب الرتبة والصفة')
      ] },
      { id: 'b3', no: '3', title: 'أعمال قسم القضايا', fields: [
        T('b3.title', 'عنوان الصفحة'),
        N('b3.against', 'القضايا المقامة على الوزارة – العدد'),
        N('b3.againstDone', 'المقامة على الوزارة – المنجزة'), N('b3.againstPending', 'المقامة على الوزارة – قيد الإنجاز'),
        N('b3.byMinistry', 'القضايا المقامة من قبل الوزارة – العدد'),
        N('b3.byDone', 'المقامة من قبل الوزارة – المنجزة'), N('b3.byPending', 'المقامة من قبل الوزارة – قيد الإنجاز'),
        N('b3.judicialDecisions', 'عدد القرارات القضائية'), N('b3.ministerDecisions', 'قرارات السيد الوزير'),
        T('b3.donutTitle', 'عنوان الدائرة'),
        info((D) => { const p = D.b3; return `يُحسب تلقائياً:\nالعدد الكلي للقضايا = ${num(p.against)} + ${num(p.byMinistry)} = ${num(p.against) + num(p.byMinistry)}\nالمنجزة = ${num(p.againstDone)} + ${num(p.byDone)} = ${num(p.againstDone) + num(p.byDone)}\nقيد الإنجاز = ${num(p.againstPending)} + ${num(p.byPending)} = ${num(p.againstPending) + num(p.byPending)}`; })
      ] },
      { id: 'b4', no: '4', title: 'تتمة قسم القضايا والإحالات', fields: [
        T('b4.title', 'عنوان الصفحة'),
        T('b4.chart1Title', 'عنوان المخطط الأول'), pairs('b4.rows1', 'قضايا الدولة (احذف كل الصفوف لإخفاء المخطط)', { sortKey: 'b4.sort1', labelGroups: window.VIOLATION_GROUPS }),
        T('b4.referralsLabel', 'نص الإحالات'), N('b4.referrals', 'عدد الإحالات القضائية'), T('b4.referralsUnit', 'الوحدة'),
        T('b4.chart2Title', 'عنوان المخطط الثاني'), pairs('b4.rows2', 'الإحالات حسب النوع', { sortKey: 'b4.sort2', compare: 'b4.referrals', labelGroups: window.VIOLATION_GROUPS })
      ] },
      { id: 'bd', no: '◆', title: 'النظارة والسوقيات (اختيارية)', fields: [
        T('bd.title', 'العنوان'), T('bd.subtitle', 'العنوان الفرعي'),
        N('bd.patrols', 'الدوريات المسيّرة'), N('bd.month', 'الموقوفون خلال الشهر'), N('bd.released', 'إخلاء السبيل'),
        N('bd.transferred', 'الموقوفون المحوّلون'), N('bd.current', 'عدد المواقيف الكلي (الحالي)'),
        info(() => 'ملاحظة: مجموع المحوّلين والمُخلى سبيلهم لا يلزم أن يساوي موقوفي الشهر، فلا يُعدّ ذلك تعارضاً.\nإن لم تتوفر بيانات النظارة لهذه الجهة أزل إشارة «إظهار».')
      ] },
      { id: 'b5', no: '5', title: 'أبرز الأعمال المنجزة', fields: [
        T('b5.title', 'العنوان'), list('b5.items', 'الأعمال')
      ] }
    ]
  };
})();
