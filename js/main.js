(function () {
  'use strict';

  AOS.init({
    once: true,
    duration: 700,
    offset: 80,
    easing: 'ease-out-cubic',
  });

  var progressFill = document.getElementById('progress-fill');
  var progressSection = document.getElementById('progress');
  var toast = document.getElementById('toast');
  var toastMessage = document.getElementById('toast-message');
  var toastTimer = null;

  function animateProgressBar() {
    if (!progressFill || progressFill.classList.contains('is-animated')) return;

    var percent = progressFill.getAttribute('data-percent') || '83';
    progressFill.style.setProperty('--fill-percent', percent + '%');
    progressFill.classList.add('is-animated');
  }

  if (progressFill && progressSection) {
    progressSection.addEventListener('aos:in', function () {
      animateProgressBar();
    });

    if (progressSection.classList.contains('aos-animate')) {
      animateProgressBar();
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateProgressBar();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(progressSection);
  }

  function showToast(message) {
    if (!toast) return;

    toastMessage.textContent = message || 'Copied! Thank you for partnering.';
    toast.classList.add('is-visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 3000);
  }

  function copyToClipboard(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(label + ' copied! Thank you for partnering.');
      }).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast(label + ' copied! Thank you for partnering.');
      } catch (err) {
        showToast('Could not copy — please copy manually.');
      }
      document.body.removeChild(textarea);
    }
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      var label = btn.getAttribute('data-label') || 'Value';
      copyToClipboard(value, label);
    });
  });

  var nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        nav.style.boxShadow = '0 2px 20px rgba(26, 35, 50, 0.06)';
      } else {
        nav.style.boxShadow = 'none';
      }
    }, { passive: true });
  }
})();
