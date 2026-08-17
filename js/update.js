(function () {
  'use strict';

  AOS.init({
    once: true,
    duration: 700,
    offset: 80,
    easing: 'ease-out-cubic',
  });

  var DEBUG_MODE = window.GALLERY_DEBUG_MODE === true;
  var STORAGE_KEY = 'sendtate-gallery-descriptions';

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

  var photos = (window.GALLERY_PHOTOS || []).map(function (photo) {
    if (photo.id) return photo;
    var match = (photo.large || photo.thumb || '').match(/\/([^/]+)\.webp$/i);
    return Object.assign({}, photo, { id: match ? match[1] : 'photo-' + Math.random().toString(36).slice(2) });
  });

  var descriptions = loadDescriptions();

  function loadDescriptions() {
    var merged = Object.assign({}, window.GALLERY_DESCRIPTIONS || {});
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (stored && typeof stored === 'object') {
        Object.assign(merged, stored);
      }
    } catch (err) {
      /* ignore bad localStorage */
    }
    return merged;
  }

  function saveDescriptions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptions));
    } catch (err) {
      /* ignore quota errors */
    }
  }

  function getDescription(id) {
    var text = descriptions[id];
    return typeof text === 'string' ? text.trim() : '';
  }

  function setDescription(id, text) {
    var value = (text || '').trim();
    if (value) {
      descriptions[id] = value;
    } else {
      delete descriptions[id];
    }
    saveDescriptions();
  }

  var grid = document.getElementById('gallery-grid');
  var emptyState = document.getElementById('gallery-empty');

  if (!grid) return;

  if (!photos.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaptionWrap = document.getElementById('lightbox-caption-wrap');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var lightboxCounter = document.getElementById('lightbox-counter');
  var lightboxHint = document.getElementById('lightbox-hint');
  var prevBtn = document.getElementById('lightbox-prev');
  var nextBtn = document.getElementById('lightbox-next');
  var currentIndex = 0;

  var debugPanel = document.getElementById('gallery-debug');
  var debugBody = document.getElementById('gallery-debug-body');
  var debugToggle = document.getElementById('gallery-debug-toggle');
  var debugPhotoId = document.getElementById('gallery-debug-photo-id');
  var debugInput = document.getElementById('gallery-debug-input');
  var debugSave = document.getElementById('gallery-debug-save');
  var debugClear = document.getElementById('gallery-debug-clear');
  var debugSchema = document.getElementById('gallery-debug-schema');
  var debugExport = document.getElementById('gallery-debug-export');
  var debugImport = document.getElementById('gallery-debug-import');
  var debugStatus = document.getElementById('gallery-debug-status');

  function dismissHint() {
    lightboxHint.classList.add('is-hidden');
  }

  function updateLightboxCaption() {
    var photo = photos[currentIndex];
    if (!photo) return;

    var text = getDescription(photo.id);
    if (text) {
      lightboxCaption.textContent = text;
      lightboxCaptionWrap.hidden = false;
      lightboxImg.alt = text;
    } else {
      lightboxCaption.textContent = '';
      lightboxCaptionWrap.hidden = true;
      lightboxImg.alt = photo.id || '';
    }
  }

  function syncDebugEditor() {
    if (!DEBUG_MODE || !debugInput) return;

    var photo = photos[currentIndex];
    if (!photo) {
      debugPhotoId.textContent = 'Open a photo to edit its caption.';
      debugInput.value = '';
      debugInput.disabled = true;
      return;
    }

    debugPhotoId.textContent = photo.id;
    debugInput.disabled = false;
    debugInput.value = getDescription(photo.id);
  }

  function updateLightboxImage() {
    var photo = photos[currentIndex];
    if (!photo) return;

    lightboxImg.src = photo.large;
    lightboxCounter.textContent = (currentIndex + 1) + ' / ' + photos.length;
    prevBtn.hidden = currentIndex === 0;
    nextBtn.hidden = currentIndex === photos.length - 1;
    updateLightboxCaption();
    syncDebugEditor();
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightboxHint.classList.remove('is-hidden');
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function showNext() {
    if (currentIndex >= photos.length - 1) return;
    currentIndex++;
    updateLightboxImage();
    dismissHint();
  }

  function showPrev() {
    if (currentIndex <= 0) return;
    currentIndex--;
    updateLightboxImage();
    dismissHint();
  }

  function setDebugStatus(message) {
    if (!debugStatus) return;
    debugStatus.textContent = message || '';
  }

  function exportDescriptions() {
    var payload = {};
    photos.forEach(function (photo) {
      var text = getDescription(photo.id);
      if (text) payload[photo.id] = text;
    });
    var json = JSON.stringify(payload, null, 2);

    if (debugSchema) debugSchema.value = json;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function () {
        setDebugStatus('Exported ' + Object.keys(payload).length + ' caption(s) — copied to clipboard.');
      }).catch(function () {
        setDebugStatus('Exported ' + Object.keys(payload).length + ' caption(s) — copy from the box below.');
      });
    } else {
      setDebugStatus('Exported ' + Object.keys(payload).length + ' caption(s) — copy from the box below.');
    }
  }

  function importDescriptions(raw) {
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      setDebugStatus('Invalid JSON — check the format and try again.');
      return false;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setDebugStatus('JSON must be an object like {"IMG_3552": "caption"}.');
      return false;
    }

    var count = 0;
    Object.keys(parsed).forEach(function (key) {
      var value = parsed[key];
      if (typeof value !== 'string') return;
      var trimmed = value.trim();
      if (trimmed) {
        descriptions[key] = trimmed;
        count++;
      } else {
        delete descriptions[key];
      }
    });

    saveDescriptions();
    updateLightboxCaption();
    syncDebugEditor();
    setDebugStatus('Imported ' + count + ' caption(s).');
    return true;
  }

  if (DEBUG_MODE && debugPanel) {
    debugPanel.hidden = false;
    document.body.classList.add('has-gallery-debug');

    if (debugToggle && debugBody) {
      debugToggle.addEventListener('click', function () {
        var collapsed = debugPanel.classList.toggle('is-collapsed');
        debugToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      });
    }

    if (debugSave) {
      debugSave.addEventListener('click', function () {
        var photo = photos[currentIndex];
        if (!photo) return;
        setDescription(photo.id, debugInput.value);
        updateLightboxCaption();
        setDebugStatus('Saved caption for ' + photo.id + '.');
      });
    }

    if (debugClear) {
      debugClear.addEventListener('click', function () {
        var photo = photos[currentIndex];
        if (!photo) return;
        debugInput.value = '';
        setDescription(photo.id, '');
        updateLightboxCaption();
        setDebugStatus('Cleared caption for ' + photo.id + '.');
      });
    }

    if (debugExport) {
      debugExport.addEventListener('click', exportDescriptions);
    }

    if (debugImport) {
      debugImport.addEventListener('click', function () {
        if (!debugSchema) return;
        importDescriptions(debugSchema.value);
      });
    }
  }

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  photos.forEach(function (photo, index) {
    var item = document.createElement('button');
    item.type = 'button';
    item.className = 'gallery-item';
    item.style.transitionDelay = (index % 12) * 40 + 'ms';

    var caption = getDescription(photo.id);
    item.setAttribute('aria-label', caption || ('Open photo ' + (index + 1) + ' of ' + photos.length));

    var img = document.createElement('img');
    img.src = photo.thumb;
    img.alt = caption || '';
    img.loading = 'lazy';
    img.decoding = 'async';

    item.appendChild(img);
    item.addEventListener('click', function () {
      openLightbox(index);
    });

    grid.appendChild(item);
    revealObserver.observe(item);
  });

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });

  var touchStartX = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', function (e) {
    var delta = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 40) {
      if (delta < 0) showNext(); else showPrev();
    }
  }, { passive: true });
})();
