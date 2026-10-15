// وضع التطبيق (للأفرع): إدخال الأرقام والبيانات فقط.
// العناوين ونصوص الصفحات والغلاف ثابتة ولا تظهر في الإدخال، والمجاميع تُحسب تلقائياً.
(function () {
  const R = window.REPORT;
  const { N, pairs, list, info, num } = window.EditorKit;
  const PERIODS = ['الأسبوع الأول', 'الأسبوع الثاني', 'الأسبوع الثالث', 'الأسبوع الرابع', 'الأسبوع الخامس'];

  R.noInlineEdit = true;
  R.storeKey = 'report-branch-app-v1';
  const base = R.data;
  base.period = PERIODS[0];
  base.b0.subtitle = 'خلال {الفترة} لعام {السنة}';
  base.b0.mode = 'تلقائي';
  base.footerText = 'تقرير {الفترة} لأفرع إدارة القضايا والملاحقات المسلكية';
  base.b5.title = 'أبرز الأعمال المنجزة لقسم التحقيق {الجهة} خلال {الفترة} لعام {السنة}';
  base.startPage = 1;

  // النصوص الثابتة: تُفرض في كل مرة حتى لو فُتح ملف بيانات قديم يحتوي نصوصاً مختلفة
  const FIXED = ['headerTitle', 'headerSub', 'footerText', 'startPage',
    'b0.kicker', 'b0.title', 'b0.subtitle', 'b0.mode', 'b0.image',
    'b1.title', 'b1.subtitle', 'b1.pendingLabel', 'b1.chartTitle',
    'b2.title', 'b2.chartTitle', 'b2.ranksTitle',
    'b3.title', 'b3.donutTitle',
    'b4.title', 'b4.chart1Title', 'b4.referralsLabel', 'b4.referralsUnit', 'b4.chart2Title',
    'bd.title', 'bd.subtitle', 'b5.title'];
  const getP = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
  const setP = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((x, k) => (x[k] = x[k] || {}), o); t[last] = v; };

  // عنوان تفصيل «أخرى» تحت المخطط: «مخالفات أخرى (38)» من البند نفسه
  function noteTitle(sec) {
    if (!(sec.noteGroups || []).some((g) => String(g.text || '').trim())) return '';
    const other = (sec.rows || []).find((r) => /أخرى|اخرى/.test(String(r.label || '')));
    return other ? `${String(other.label).trim()} (${num(other.value)})` : '';
  }

  function derive(D) {
    FIXED.forEach((p) => setP(D, p, getP(base, p)));
    const b1 = D.b1;
    b1.doneFiles = num(b1.provenFiles) + num(b1.negatedFiles);
    b1.totalFiles = b1.doneFiles + num(b1.pendingFiles);
    b1.drugTotal = num(b1.drugPositive) + num(b1.drugNegative);
    b1.noteTitle = noteTitle(b1);
    D.b2.noteTitle = noteTitle(D.b2);
    if (!PERIODS.includes(D.period)) D.period = PERIODS[0];
  }
  const render = window.renderReport;
  window.renderReport = function (D, ids) { derive(D); return render(D, ids); };

  const fileName = R.fileName;
  R.fileName = (D) => fileName(D).replace(`-${D.month}-`, `-${String(D.period || '').split(' ').join('-')}-${D.month}-`);

  const general = R.schema.find((s) => s.id === 'general');
  const entityName = general.fields.find((f) => f.k === 'entityName');
  const entityInfo = general.fields.find((f) => f.type === 'info');

  R.schema = [
    { id: 'general', title: 'الجهة والفترة', fields: [
      { k: 'entityType', label: 'نوع الجهة', type: 'select', options: ['فرع', 'إدارة', 'بدون'] },
      entityName, entityInfo,
      { k: 'month', label: 'الشهر', type: 'month' },
      { k: 'period', label: 'الأسبوع', type: 'select', options: PERIODS },
      { k: 'year', label: 'السنة', type: 'text' }
    ] },
    { id: 'b1', no: '1', title: 'أعمال قسم التحقيق', fields: [
      N('b1.provenFiles', 'الأضابير المثبتة'), N('b1.negatedFiles', 'الأضابير المنفية'), N('b1.pendingFiles', 'الأضابير قيد الإنجاز'),
      info((D) => { const done = num(D.b1.provenFiles) + num(D.b1.negatedFiles); return `يُحسب تلقائياً:\nالأضابير المنجزة = المثبتة + المنفية = ${done}\nعدد الأضابير التحقيقية الكلي = المنجزة + قيد الإنجاز = ${done + num(D.b1.pendingFiles)}`; }),
      N('b1.drugPositive', 'كتب فحص المخدرات – إيجابية'), N('b1.drugNegative', 'كتب فحص المخدرات – سلبية'),
      info((D) => `يُحسب تلقائياً: عدد كتب فحص المخدرات الكلي = ${num(D.b1.drugPositive) + num(D.b1.drugNegative)}`),
      N('b1.queries', 'عدد الاستعلامات الجنائية'),
      pairs('b1.rows', 'المخالفات الأكثر شيوعاً (بند «أخرى» يبقى في النهاية)', { sortKey: 'b1.sort', labelGroups: window.VIOLATION_GROUPS }),
      { k: 'b1.noteGroups', label: 'تفصيل «المخالفات الأخرى» (اختياري)', type: 'table', cols: [{ k: 'head', label: 'مثل: مخالفة واحدة لكل من' }, { k: 'text', label: 'الأسماء', type: 'textarea' }] }
    ] },
    { id: 'b2', no: '2', title: 'تتمة أعمال قسم التحقيق', fields: [
      pairs('b2.rows', 'تصنيف المخالفات تبعاً للمناطق / الأقسام (بند «أخرى» يبقى في النهاية)', { sortKey: 'b2.sort' }),
      { k: 'b2.noteGroups', label: 'تفصيل «المناطق الأخرى» (اختياري)', type: 'table', cols: [{ k: 'head', label: 'مثل: مخالفة واحدة لكل من' }, { k: 'text', label: 'الأسماء', type: 'textarea' }] },
      pairs('b2.ranks', 'تصنيف الشكاوى حسب رتبة وصفة المشكو منه')
    ] },
    { id: 'b3', no: '3', title: 'أعمال قسم القضايا', fields: [
      N('b3.against', 'القضايا المقامة على الوزارة – العدد'),
      N('b3.againstDone', 'المقامة على الوزارة – المنجزة'), N('b3.againstPending', 'المقامة على الوزارة – قيد الإنجاز'),
      N('b3.byMinistry', 'القضايا المقامة من قبل الوزارة – العدد'),
      N('b3.byDone', 'المقامة من قبل الوزارة – المنجزة'), N('b3.byPending', 'المقامة من قبل الوزارة – قيد الإنجاز'),
      N('b3.judicialDecisions', 'عدد القرارات القضائية'), N('b3.ministerDecisions', 'قرارات السيد الوزير'),
      info((D) => { const p = D.b3; return `يُحسب تلقائياً:\nالعدد الكلي للقضايا = ${num(p.against) + num(p.byMinistry)}\nالمنجزة = ${num(p.againstDone) + num(p.byDone)}\nقيد الإنجاز = ${num(p.againstPending) + num(p.byPending)}`; })
    ] },
    { id: 'b4', no: '4', title: 'تتمة أعمال قسم القضايا', fields: [
      pairs('b4.rows1', 'تصنيف قضايا الدولة حسب نوع القضية', { sortKey: 'b4.sort1', labelGroups: window.VIOLATION_GROUPS }),
      N('b4.referrals', 'عدد الإحالات القضائية'),
      pairs('b4.rows2', 'تصنيف الإحالات القضائية حسب النوع', { sortKey: 'b4.sort2', compare: 'b4.referrals', labelGroups: window.VIOLATION_GROUPS })
    ] },
    { id: 'bd', no: '◆', title: 'النظارة والسوقيات', fields: [
      N('bd.patrols', 'الدوريات المسيّرة'), N('bd.month', 'الموقوفون خلال الفترة'), N('bd.released', 'إخلاء السبيل'),
      N('bd.transferred', 'الموقوفون المحوّلون'), N('bd.current', 'عدد المواقيف الكلي (الحالي)'),
      info(() => 'إن لم تتوفر بيانات النظارة لهذه الجهة أزل إشارة «إظهار».')
    ] },
    { id: 'b5', no: '5', title: 'أبرز الأعمال المنجزة', fields: [list('b5.items', 'الأعمال')] }
  ];
})();
