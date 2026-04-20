function setNameFontSize(selector, maxChars) {
  document.querySelectorAll(selector).forEach(box => {
    const nameDiv = box.querySelector('.name-box');
    if (!nameDiv) return;

    const fontSize = box.offsetHeight / maxChars * 0.98;
    nameDiv.style.fontSize = fontSize + 'px';
  });
}

function fitAllNameBoxes() {
  setNameFontSize('.bigname-box', 12);
  setNameFontSize('.littlename-box', 9);
}

function setInfoBoxFontSize() {
  const infoBoxes = document.querySelectorAll('.info-box');
  if (!infoBoxes.length) return;

  let minHeight = Infinity;

  infoBoxes.forEach(box => {
    const h = box.offsetHeight;
    if (h > 0 && h < minHeight) minHeight = h;
  });

  if (!Number.isFinite(minHeight)) return;

  const fontSize = minHeight * 0.62;

  infoBoxes.forEach(box => {
    box.style.fontSize = fontSize + 'px';
  });
}

function setFlipBtnFontSize() {
  document.querySelectorAll('.row-flip-btn').forEach(box => {
    const btn = box.querySelector('.flip-btn');
    if (!btn) return;

    const fontSize = Math.max(box.offsetHeight * 0.6);
    btn.style.fontSize = fontSize + 'px';
  });
}

function setStudentIdFontSize() {
  document.querySelectorAll('.student-id').forEach(box => {
    const fontSize = Math.max(box.offsetHeight * 0.7);
    box.style.fontSize = fontSize + 'px';
  });
}

function fitAll() {
  fitAllNameBoxes();
  setInfoBoxFontSize();
  setFlipBtnFontSize();
  setStudentIdFontSize();
}

function showInfoModal(title, content) {
  const modalTitle = document.getElementById('info-modal-title');
  const modalBody = document.getElementById('info-modal-body');
  const modal = document.getElementById('info-modal');

  if (!modalTitle || !modalBody || !modal) return;

  modalTitle.innerText = title || '內容';
  modalBody.innerHTML = content || '';
  modal.style.display = 'flex';
}

function checkLongTextByCharCount() {
  document.querySelectorAll('.info-box').forEach(box => {
    const value = box.querySelector('.info-value');
    const btn = box.querySelector('.show-more-btn');

    if (!value || !btn) return;

    btn.style.display = 'block';

    btn.onclick = function () {
      const title = this.dataset.title || box.querySelector('.info-label')?.innerText || '內容';
      showInfoModal(title, value.innerHTML);
    };
  });
}

const npcBgList = [
  'https://shierusha.github.io/school-battle/teachers/img/1.webp',
  'https://shierusha.github.io/school-battle/teachers/img/2.webp',
  'https://shierusha.github.io/school-battle/teachers/img/3.webp',
  'https://shierusha.github.io/school-battle/teachers/img/4.webp',
  'https://shierusha.github.io/school-battle/teachers/img/5.webp',
  'https://shierusha.github.io/school-battle/teachers/img/6.webp',
  'https://shierusha.github.io/school-battle/teachers/img/7.webp',
  'https://shierusha.github.io/school-battle/teachers/img/8.webp',
  'https://shierusha.github.io/school-battle/teachers/img/9.webp',
  'https://shierusha.github.io/school-battle/teachers/img/10.webp',
  'https://shierusha.github.io/school-battle/teachers/img/11.webp',
  'https://shierusha.github.io/school-battle/teachers/img/12.webp',
  'https://shierusha.github.io/school-battle/teachers/img/13.webp',
  'https://shierusha.github.io/school-battle/teachers/img/14.webp',
  'https://shierusha.github.io/school-battle/teachers/img/15.webp',
  'https://shierusha.github.io/school-battle/teachers/img/16.webp',
  'https://shierusha.github.io/school-battle/teachers/img/17.webp',
  'https://shierusha.github.io/school-battle/teachers/img/18.webp',
  'https://shierusha.github.io/school-battle/teachers/img/19.webp',
  'https://shierusha.github.io/school-battle/teachers/img/20.webp'
];

let npcBgIndex = 0;

const DEFAULT_NPC_NAMEBOX_COLOR = '#3da2ad';
const NPC_NAMEBOX_ALPHA = 0.8;

function normalizeNpcHexColor(value) {
  if (typeof value !== 'string') {
    return DEFAULT_NPC_NAMEBOX_COLOR;
  }

  const color = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color.toLowerCase();
  }

  return DEFAULT_NPC_NAMEBOX_COLOR;
}

function hexToNpcRgba(hex, alpha) {
  const normalized = normalizeNpcHexColor(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function setNpcNameboxColor(color) {
  const normalizedColor = normalizeNpcHexColor(color);
  const rgbaColor = hexToNpcRgba(normalizedColor, NPC_NAMEBOX_ALPHA);

  document.querySelectorAll('.name-box').forEach(box => {
    box.style.background = rgbaColor;
  });

  const colorInput = document.getElementById('namebox_color');
  if (colorInput) {
    colorInput.value = normalizedColor;
  }

  const colorPicker = document.getElementById('namebox_color_picker');
  if (colorPicker) {
    colorPicker.value = normalizedColor;
  }

  window.currentNpcNameboxColor = normalizedColor;

  if (typeof formData !== 'undefined' && formData) {
    formData.namebox_color = normalizedColor;
  }
}

function getCurrentNpcNameboxColor() {
  const colorInput = document.getElementById('namebox_color');

  if (colorInput && colorInput.value) {
    return normalizeNpcHexColor(colorInput.value);
  }

  if (typeof formData !== 'undefined' && formData && formData.namebox_color) {
    return normalizeNpcHexColor(formData.namebox_color);
  }

  return DEFAULT_NPC_NAMEBOX_COLOR;
}

function openNpcNameboxColorPicker() {
  const colorPicker = document.getElementById('namebox_color_picker');

  if (!colorPicker) {
    return;
  }

  colorPicker.value = getCurrentNpcNameboxColor();

  if (typeof colorPicker.showPicker === 'function') {
    colorPicker.showPicker();
    return;
  }

  colorPicker.click();
}

function bindNpcNameboxColorPicker() {
  const colorPicker = document.getElementById('namebox_color_picker');

  if (!colorPicker) {
    return;
  }

  colorPicker.addEventListener('input', function () {
    setNpcNameboxColor(this.value);
  });

  colorPicker.addEventListener('change', function () {
    setNpcNameboxColor(this.value);
  });
}

function initNpcNameboxColor() {
  setNpcNameboxColor(getCurrentNpcNameboxColor());
}

function setNpcBackgroundUrl(url) {
  const finalUrl = url || npcBgList[0];

  document.querySelectorAll('.bg-img').forEach(img => {
    img.src = finalUrl;
  });

  const bgInput = document.getElementById('background_image_url');
  if (bgInput) {
    bgInput.value = finalUrl;
  }

  window.currentNpcBackgroundUrl = finalUrl;

  if (typeof formData !== 'undefined' && formData) {
    formData.background_image_url = finalUrl;
  }
}

function getCurrentNpcBackgroundUrl() {
  const bgInput = document.getElementById('background_image_url');
  if (bgInput && bgInput.value) {
    return bgInput.value;
  }

  const bgImg = document.querySelector('.bg-img');
  if (bgImg && bgImg.src) {
    return bgImg.src;
  }

  return npcBgList[0];
}

function syncNpcBackgroundIndex(url) {
  const foundIndex = npcBgList.findIndex(item => item === url);
  npcBgIndex = foundIndex >= 0 ? foundIndex : 0;
}

function changeBg() {
  const currentUrl = getCurrentNpcBackgroundUrl();
  syncNpcBackgroundIndex(currentUrl);
  npcBgIndex = (npcBgIndex + 1) % npcBgList.length;
  setNpcBackgroundUrl(npcBgList[npcBgIndex]);
}

function initNpcCardBackground() {
  const bgInput = document.getElementById('background_image_url');
  const initialUrl = bgInput && bgInput.value ? bgInput.value : npcBgList[0];

  syncNpcBackgroundIndex(initialUrl);
  setNpcBackgroundUrl(initialUrl);
}

function bindNpcModalClose() {
  const modal = document.getElementById('info-modal');
  if (!modal) return;

  modal.addEventListener('click', function (e) {
    if (e.target === this) {
      e.stopPropagation();
      this.style.display = 'none';
    }
  });
}

window.setNpcNameboxColor = setNpcNameboxColor;
window.getCurrentNpcNameboxColor = getCurrentNpcNameboxColor;
window.openNpcNameboxColorPicker = openNpcNameboxColorPicker;
window.setNpcBackgroundUrl = setNpcBackgroundUrl;
window.getCurrentNpcBackgroundUrl = getCurrentNpcBackgroundUrl;
window.changeBg = changeBg;
window.fitAll = fitAll;
window.checkLongTextByCharCount = checkLongTextByCharCount;
window.showInfoModal = showInfoModal;

window.addEventListener('DOMContentLoaded', function () {
  initNpcCardBackground();
  initNpcNameboxColor();
  bindNpcNameboxColorPicker();
  bindNpcModalClose();
  fitAll();
  checkLongTextByCharCount();
});

window.addEventListener('resize', function () {
  fitAll();
  checkLongTextByCharCount();
});

window.addEventListener('load', function () {
  fitAll();
  checkLongTextByCharCount();
});
