// تبويبا الهاتف: «الإدخال» و«المعاينة». على الشاشات الكبيرة لا يتغير شيء.
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector('.app');
    const main = document.querySelector('.main');
    const bar = document.createElement('div');
    bar.className = 'mtabs';
    bar.innerHTML = '<button type="button" data-t="form">✏️ الإدخال</button><button type="button" data-t="preview">👁 المعاينة</button>';
    app.insertBefore(bar, main);
    const show = (t) => {
      document.body.classList.toggle('m-form', t === 'form');
      document.body.classList.toggle('m-preview', t === 'preview');
      bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
      // المعاينة تحسب تكبيرها حسب عرضها، فنعيد الحساب بعد ظهورها
      if (t === 'preview') requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    };
    bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.t); });
    show('form');
  });
})();
