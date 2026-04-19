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
    if (h < minHeight) minHeight = h;
  });

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
  const titleEl = document.getElementById('info-modal-title');
  const bodyEl = document.getElementById('info-modal-body');
  const modalEl = document.getElementById('info-modal');

  if (!titleEl || !bodyEl || !modalEl) return;

  titleEl.innerText = title;
  bodyEl.innerHTML = content;
  modalEl.style.display = 'flex';
}

function checkLongTextByCharCount() {
  document.querySelectorAll('.info-box').forEach(box => {
    const value = box.querySelector('.info-value');
    const btn = box.querySelector('.show-more-btn');

    if (!value || !btn) return;

    btn.style.display = 'block';

    btn.onclick = function () {
      const label = this.dataset.title || box.querySelector('.info-label')?.innerText || '內容';
      showInfoModal(label, value.innerHTML);
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

function setNpcBackgroundImage(url) {
  document.querySelectorAll('.bg-img').forEach(img => {
    img.src = url;
  });

  const hiddenInput = document.getElementById('background_image_url');
  if (hiddenInput) {
    hiddenInput.value = url;
  }

  if (window.formData) {
    window.formData.background_image_url = url;
  }
}

function changeBg() {
  npcBgIndex = (npcBgIndex + 1) % npcBgList.length;
  setNpcBackgroundImage(npcBgList[npcBgIndex]);
}

window.changeBg = changeBg;
window.fitAll = fitAll;
window.showInfoModal = showInfoModal;

window.addEventListener('DOMContentLoaded', function () {
  const hiddenInput = document.getElementById('background_image_url');
  const startUrl = hiddenInput && hiddenInput.value ? hiddenInput.value : npcBgList[0];

  const foundIndex = npcBgList.indexOf(startUrl);
  npcBgIndex = foundIndex >= 0 ? foundIndex : 0;

  setNpcBackgroundImage(startUrl);
  fitAll();
  checkLongTextByCharCount();

  const modalEl = document.getElementById('info-modal');
  if (modalEl) {
    modalEl.addEventListener('click', function (e) {
      if (e.target === this) {
        e.stopPropagation();
        this.style.display = 'none';
      }
    });
  }
});

window.addEventListener('resize', function () {
  fitAll();
  checkLongTextByCharCount();
});

window.addEventListener('load', function () {
  fitAll();
  checkLongTextByCharCount();
});
