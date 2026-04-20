let formData = {
  othernpc_id: '',
  player_id: '',
  name: '',
  nickname: '',
  npc_category: '',
  background_image_url: 'https://shierusha.github.io/school-battle/teachers/img/1.webp',
  namebox_color: '#3da2ad',
  alignment: '',
  gender: '',
  age: '',
  height: '',
  weight: '',
  race: '',
  personality: '',
  likes: '',
  hate: '',
  background: '',
  attack_cc: 0,
dodge_cc: 0,
cover_cc: 0,
take_cc: 0,
  notes: [{ content: '', is_public: true }],
  element: [],
  weakness_id: '',
  preferred_role: '',
  starting_position: '',
  occupation_type: [],
  images: {
    front_url: '',
    back_url: ''
  },
  skills: [{}, {}]
};

let currentStep = 1;

window.formData = formData;
window.skillEffectsList = null;
window.npcSkillEffectsList = null;
window.movementSkillsList = null;
window.skillDebuffList = null;
window.weaknessDict = {};
window.userRole = '';
window.currentPlayerId = '';
window.currentPlayerUsername = '';

(async function startNpcCreatePage() {
  window.client = window.supabase
    ? window.supabase.createClient(
        'https://wfhwhvodgikpducrhgda.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaHdodm9kZ2lrcGR1Y3JoZ2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTAwNjEsImV4cCI6MjA2MzU4NjA2MX0.P6P-x4SxjiR4VdWH6VFgY_ktgMac_OzuI4Bl7HWskz8'
      )
    : null;

  if (!window.client) {
    alert('Supabase 初始化失敗');
    window.location.href = 'https://shierusha.github.io/login/login';
    return;
  }

  const adminReady = await syncNpcAdminRoleFromDB();

  if (!adminReady) {
    return;
  }

  await initNpcCreatePage();
})();

async function syncNpcAdminRoleFromDB() {
  let session = null;
  let sessionError = null;

  try {
    const sessionResult = await window.client.auth.getSession();
    session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
    sessionError = sessionResult ? sessionResult.error : null;
  } catch (error) {
    sessionError = error;
  }

  if (sessionError) {
    alert('讀取登入狀態失敗：' + sessionError.message);
    return false;
  }

  const sessionPlayerId = session && session.user ? session.user.id : '';
  const sessionEmail = session && session.user ? session.user.email : '';
  const localPlayerId = localStorage.getItem('player_id') || '';
  const candidateIds = [];

  if (localPlayerId) candidateIds.push(localPlayerId);
  if (sessionPlayerId && !candidateIds.includes(sessionPlayerId)) candidateIds.push(sessionPlayerId);

  if (candidateIds.length === 0 && !sessionEmail) {
    window.location.href = 'https://shierusha.github.io/login/login';
    return false;
  }

  let playerData = null;
  let queryError = null;

  for (const playerId of candidateIds) {
    const result = await window.client
      .from('players')
      .select('player_id,role,username,email')
      .eq('player_id', playerId)
      .maybeSingle();

    if (result.error) {
      queryError = result.error;
      continue;
    }

    if (result.data) {
      playerData = result.data;
      break;
    }
  }

  if (!playerData && sessionEmail) {
    const result = await window.client
      .from('players')
      .select('player_id,role,username,email')
      .eq('email', sessionEmail)
      .maybeSingle();

    if (result.error) {
      queryError = result.error;
    } else if (result.data) {
      playerData = result.data;
    }
  }

  if (!playerData && queryError) {
    alert('查詢玩家權限失敗：' + queryError.message);
    console.error('players 查詢失敗', queryError);
    return false;
  }

  if (!playerData) {
    alert('查無玩家資料，請重新登入。');
    return false;
  }

  if (playerData.role !== 'admin') {
    window.location.href = 'https://shierusha.github.io/login/login';
    return false;
  }

  window.userRole = playerData.role;
  window.currentPlayerId = playerData.player_id;
  window.currentPlayerUsername = playerData.username || '';

  localStorage.setItem('player_id', playerData.player_id);
  localStorage.setItem('player_role', playerData.role);
  localStorage.setItem('player_username', playerData.username || '');

  formData.player_id = playerData.player_id;

  return true;
}

async function initNpcCreatePage() {
  bindNpcBasicEvents();
  bindNpcStepEvents();
  bindNpcElementEvents();
  bindNpcNoteEvents();

  await renderWeaknessDropdown();

  const npcId = getNpcIdFromUrl();

  if (npcId) {
    await loadNpcDataToForm(npcId);
  }

  showStep(1);
  updateNpcCard();
}

function getNpcIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('othernpc_id') || params.get('npc_id') || params.get('id') || '';
}

function bustCache(url) {
  if (!url) return '';
  return url + (url.includes('?') ? '&v=' : '?v=') + Date.now();
}

async function initSkillEffectsList(callback) {
  if (window.skillEffectsList && window.skillEffectsList.length) {
    if (callback) callback(window.skillEffectsList);
    return;
  }

  const { data, error } = await window.client
    .from('skill_effects')
    .select('*');

  if (error) {
    alert('載入共用技能效果資料失敗：' + error.message);
    window.skillEffectsList = [];
    if (callback) callback([]);
    return;
  }

  window.skillEffectsList = data || [];
  if (callback) callback(window.skillEffectsList);
}

async function initNpcSkillEffectsList(callback) {
  if (window.npcSkillEffectsList && window.npcSkillEffectsList.length) {
    if (callback) callback(window.npcSkillEffectsList);
    return;
  }

  const { data, error } = await window.client
    .from('npc_skill_effects')
    .select('*');

  if (error) {
    alert('載入 NPC 專用技能效果資料失敗：' + error.message);
    window.npcSkillEffectsList = [];
    if (callback) callback([]);
    return;
  }

  window.npcSkillEffectsList = data || [];
  if (callback) callback(window.npcSkillEffectsList);
}

async function initMovementSkillsList(callback) {
  if (window.movementSkillsList && window.movementSkillsList.length) {
    if (callback) callback(window.movementSkillsList);
    return;
  }

  const { data, error } = await window.client
    .from('movement_skills')
    .select('*');

  if (error) {
    alert('載入移動技能資料失敗：' + error.message);
    window.movementSkillsList = [];
    if (callback) callback([]);
    return;
  }

  window.movementSkillsList = data || [];
  if (callback) callback(window.movementSkillsList);
}

async function initSkillDebuffList(callback) {
  if (window.skillDebuffList && window.skillDebuffList.length) {
    if (callback) callback(window.skillDebuffList);
    return;
  }

  const { data, error } = await window.client
    .from('skill_debuff')
    .select('*');

  if (error) {
    alert('載入負作用資料失敗：' + error.message);
    window.skillDebuffList = [];
    if (callback) callback([]);
    return;
  }

  window.skillDebuffList = data || [];
  if (callback) callback(window.skillDebuffList);
}

async function initAllNpcSkillLists(callback) {
  await initSkillEffectsList();
  await initNpcSkillEffectsList();
  await initMovementSkillsList();
  await initSkillDebuffList();

  if (callback) {
    callback({
      skillEffectsList: window.skillEffectsList || [],
      npcSkillEffectsList: window.npcSkillEffectsList || [],
      movementSkillsList: window.movementSkillsList || [],
      skillDebuffList: window.skillDebuffList || []
    });
  }
}

async function renderWeaknessDropdown() {
  const weakSelect = document.getElementById('weakness_id');
  if (!weakSelect) return;

  const { data, error } = await window.client
    .from('element_weakness')
    .select('weakness_id,element,description');

  if (error) {
    alert('載入屬性弱點選單失敗：' + error.message);
    return;
  }

  weakSelect.innerHTML = '<option value="">無</option>';
  window.weaknessDict = {};

  (data || []).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.weakness_id;
    opt.text = translateElement(item.element) + (item.description ? ` - ${item.description}` : '');
    weakSelect.appendChild(opt);
    window.weaknessDict[item.weakness_id] = item;
  });
}

function showStep(step) {
  document.querySelectorAll('.step').forEach((el, idx) => {
    if (idx === step - 1) el.classList.add('active');
    else el.classList.remove('active');
  });

  document.querySelectorAll('.form-page').forEach(form => {
    form.classList.remove('active');
  });

  const page = document.getElementById(`form-step-${step}`);
  if (page) page.classList.add('active');

  currentStep = step;

  if (step === 1) {
    setValue('name', formData.name);
    setValue('nickname', formData.nickname);
    setValue('npc_category', formData.npc_category);
  }

  if (step === 2) {
    setValue('alignment', formData.alignment || '');
    setValue('gender', formData.gender);
    setValue('age', formData.age);
    setValue('height', formData.height);
    setValue('weight', formData.weight);
    setValue('race', formData.race);
  }

  if (step === 3) {
    setValue('personality', formData.personality);
    setValue('likes', formData.likes);
    setValue('hate', formData.hate);
  }

  if (step === 4) {
    setValue('background', formData.background);
  }

if (step === 5) {
  setValue('attack_cc', formData.attack_cc ?? 0);
  setValue('dodge_cc', formData.dodge_cc ?? 0);
  setValue('cover_cc', formData.cover_cc ?? 0);
  setValue('take_cc', formData.take_cc ?? 0);
  initNotesForm();
}

  if (step === 6) {
    renderStep6Dropdowns();
    updateElementUI();
    syncElementValueToUI();
    setValue('weakness_id', formData.weakness_id || '');
    setValue('preferred_role', formData.preferred_role || '');
    setValue('starting_position', formData.starting_position || '');
  }

  if (step === 7) {
    renderJobGrid();
    updateJobButtons();
  }

  if (step === 8) {
    if (typeof initAllSkillListsThenRender === 'function') {
      initAllSkillListsThenRender();
    } else if (typeof initNpcSkillsPage === 'function') {
      initNpcSkillsPage();
    }
  }

  updateNpcCard();

  if (typeof fitAll === 'function') fitAll();
  if (typeof checkLongTextByCharCount === 'function') checkLongTextByCharCount();
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? '';
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function getTrimValue(id) {
  return getValue(id).trim();
}
function getNonNegativeIntegerValue(id) {
  const value = getValue(id);

  if (value === '') {
    return 0;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return 0;
  }

  return number;
}

function bindNpcStepEvents() {
  const btn1 = document.getElementById('btn-step-1');
  const btn2 = document.getElementById('btn-step-2');
  const btn3 = document.getElementById('btn-step-3');
  const btn4 = document.getElementById('btn-step-4');
  const btn5 = document.getElementById('btn-step-5');
  const btn6 = document.getElementById('btn-step-6');
  const btn7 = document.getElementById('btn-step-7');

  const back2 = document.getElementById('back-2');
  const back3 = document.getElementById('back-3');
  const back4 = document.getElementById('back-4');
  const back5 = document.getElementById('back-5');
  const back6 = document.getElementById('back-6');
  const back7 = document.getElementById('back-7');

  if (btn1) {
    btn1.onclick = function () {
      const nameVal = getTrimValue('name');
      const nickVal = getTrimValue('nickname');
      const categoryVal = getTrimValue('npc_category');

      if (!nameVal) {
        alert('請輸入名稱');
        return;
      }

      formData.name = nameVal;
      formData.nickname = nickVal;
      formData.npc_category = categoryVal;

      updateNpcCard();
      showStep(2);
    };
  }

  if (btn2) {
    btn2.onclick = function () {
      formData.alignment = getValue('alignment') || '';
      formData.gender = getTrimValue('gender');
      formData.age = getTrimValue('age');
      formData.height = getTrimValue('height');
      formData.weight = getTrimValue('weight');
      formData.race = getTrimValue('race');

      updateNpcCard();
      showStep(3);
    };
  }

  if (btn3) {
    btn3.onclick = function () {
      formData.personality = getTrimValue('personality');
      formData.likes = getTrimValue('likes');
      formData.hate = getTrimValue('hate');

      updateNpcCard();
      showStep(4);
    };
  }

  if (btn4) {
    btn4.onclick = function () {
      formData.background = getTrimValue('background');

      updateNpcCard();
      showStep(5);
    };
  }

 if (btn5) {
  btn5.onclick = function () {
    formData.attack_cc = getNonNegativeIntegerValue('attack_cc');
    formData.dodge_cc = getNonNegativeIntegerValue('dodge_cc');
    formData.cover_cc = getNonNegativeIntegerValue('cover_cc');
    formData.take_cc = getNonNegativeIntegerValue('take_cc');

    normalizeNpcNotes();
    updateNpcCard();
    showStep(6);
  };
}

  if (btn6) {
    btn6.onclick = function () {
      formData.weakness_id = getValue('weakness_id') || '';
      formData.preferred_role = getValue('preferred_role') || '';
      formData.starting_position = getValue('starting_position') || '';

      updateNpcCard();
      showStep(7);
    };
  }

  if (btn7) {
    btn7.onclick = function () {
      if (!Array.isArray(formData.occupation_type)) {
        formData.occupation_type = [];
      }

      updateNpcCard();
      showStep(8);
    };
  }

  if (back2) back2.onclick = function () { showStep(1); };
  if (back3) back3.onclick = function () { showStep(2); };
  if (back4) back4.onclick = function () { showStep(3); };
  if (back5) back5.onclick = function () { showStep(4); };
  if (back6) back6.onclick = function () { showStep(5); };
  if (back7) back7.onclick = function () { showStep(6); };
}

function bindNpcBasicEvents() {
  ['name', 'nickname', 'npc_category'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', function () {
      formData[id] = this.value;
      updateNpcCard();
    });
  });

  ['alignment', 'gender', 'age', 'height', 'weight', 'race'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', function () {
      formData[id] = this.value;
      updateNpcCard();
    });

    el.addEventListener('change', function () {
      formData[id] = this.value;
      updateNpcCard();
    });
  });

  ['personality', 'likes', 'hate', 'background'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
      formData[id] = this.value;
      updateNpcCard();
    });
  });

  ['attack_cc', 'dodge_cc', 'cover_cc', 'take_cc'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener('input', function () {
    const number = Number(this.value);

    if (this.value === '') {
      formData[id] = 0;
      return;
    }

    if (!Number.isInteger(number) || number < 0) {
      this.value = 0;
      formData[id] = 0;
      return;
    }

    formData[id] = number;
  });
});

  ['weakness_id', 'preferred_role', 'starting_position'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('change', function () {
      formData[id] = this.value;
      updateNpcCard();
    });
  });
}

function bindNpcElementEvents() {
  const enableMulti = document.getElementById('enable-multi-element');

  if (enableMulti) {
    enableMulti.addEventListener('change', function () {
      updateElementUI();
      syncElementValueToUI();
      updateNpcCard();
    });
  }
}

function renderStep6Dropdowns() {
  const baseElementList = [
    { value: 'fire', text: '火' },
    { value: 'water', text: '水' },
    { value: 'ice', text: '冰' },
    { value: 'wind', text: '風' },
    { value: 'earth', text: '土' },
    { value: 'thunder', text: '雷' },
    { value: 'dark', text: '暗' },
    { value: 'light', text: '光' }
  ];

  const elSelect = document.getElementById('element');

  if (elSelect) {
    elSelect.innerHTML = '<option value="">無</option>';

    baseElementList.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.text = item.text;
      elSelect.appendChild(opt);
    });
  }

  const multiBox = document.getElementById('element-multi-select');

  if (multiBox && !multiBox.querySelector('.element-multi-checkbox')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'element-options';

    baseElementList.forEach(item => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'element-multi-checkbox';
      checkbox.value = item.value;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + item.text));
      wrapper.appendChild(label);
    });

    multiBox.innerHTML = '';
    multiBox.appendChild(wrapper);
  }
}

function updateElementUI() {
  const enableMulti = document.getElementById('enable-multi-element');
  const singleBox = document.getElementById('element-single-select');
  const multiBox = document.getElementById('element-multi-select');

  if (!enableMulti || !singleBox || !multiBox) return;

  if (enableMulti.checked) {
    singleBox.style.display = 'none';
    multiBox.style.display = '';
  } else {
    singleBox.style.display = '';
    multiBox.style.display = 'none';
  }
}

function syncElementValueToUI() {
  const enableMulti = document.getElementById('enable-multi-element');
  const elSelect = document.getElementById('element');

  if (enableMulti && enableMulti.checked) {
    document.querySelectorAll('.element-multi-checkbox').forEach(cb => {
      cb.checked = Array.isArray(formData.element) && formData.element.includes(cb.value);

      cb.onchange = function () {
        formData.element = Array.from(document.querySelectorAll('.element-multi-checkbox:checked'))
          .map(item => item.value);

        updateNpcCard();
      };
    });

    return;
  }

  if (elSelect) {
    elSelect.value = Array.isArray(formData.element) && formData.element.length > 0
      ? formData.element[0]
      : '';

    elSelect.onchange = function () {
      formData.element = this.value ? [this.value] : [];
      updateNpcCard();
    };
  }
}

function bindNpcNoteEvents() {
  const addBtn = document.getElementById('add-note-btn');

  if (addBtn) {
    addBtn.onclick = addNote;
  }
}

function initNotesForm() {
  if (!Array.isArray(formData.notes) || formData.notes.length === 0) {
    formData.notes = [{ content: '', is_public: true }];
  }

  renderNotesRows();
}

function renderNotesRows() {
  const notesContainer = document.getElementById('note-list');
  if (!notesContainer) return;

  notesContainer.innerHTML = '';

  formData.notes.forEach((note, idx) => {
    const row = document.createElement('div');
    row.className = 'note-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.marginBottom = '0.5em';

    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.margin = '5px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'note-public';
    checkbox.checked = !!note.is_public;
    checkbox.style.margin = '5px';
    checkbox.style.width = '20%';

    checkbox.addEventListener('change', function () {
      note.is_public = this.checked;
      syncNpcNoteCard();
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode('顯示'));
    row.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.className = 'note-content';
    textarea.value = note.content || '';
    textarea.rows = 2;
    textarea.placeholder = '請輸入 NPC 設定／裏設定';
    textarea.style.flex = '1';
    textarea.style.overflow = 'hidden';
    textarea.style.margin = '5px';
    textarea.style.width = '65%';

    textarea.addEventListener('input', function () {
      note.content = this.value;
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
      syncNpcNoteCard();
    });

    row.appendChild(textarea);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '刪除';
    delBtn.className = 'delete-note-btn';
    delBtn.style.background = '#e74c3c';
    delBtn.style.margin = '5px';
    delBtn.style.width = '15%';

    delBtn.onclick = function () {
      deleteNote(idx);
    };

    if (formData.notes.length === 1) {
      delBtn.disabled = true;
    }

    row.appendChild(delBtn);
    notesContainer.appendChild(row);

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  });

  syncNpcNoteCard();
}

function addNote() {
  formData.notes.push({ content: '', is_public: true });
  renderNotesRows();
}

function deleteNote(idx) {
  if (formData.notes.length <= 1) return;
  formData.notes.splice(idx, 1);
  renderNotesRows();
}

function normalizeNpcNotes() {
  if (!Array.isArray(formData.notes)) {
    formData.notes = [];
  }

  formData.notes = formData.notes
    .map(note => ({
      content: (note.content || '').trim(),
      is_public: !!note.is_public
    }))
    .filter(note => note.content);

  if (formData.notes.length === 0) {
    formData.notes = [{ content: '', is_public: true }];
  }
}

function renderJobGrid() {
  const jobGrid = document.getElementById('job-grid');
  if (!jobGrid) return;

  const jobList = [
    { key: 'attack', text: '攻擊手' },
    { key: 'tank', text: '坦克' },
    { key: 'healer', text: '補師' },
    { key: 'buffer', text: '增益手' },
    { key: 'jammer', text: '妨礙手' }
  ];

  jobGrid.innerHTML = '';

  jobList.forEach(item => {
    const btn = document.createElement('div');
    btn.className = 'job-btn';
    btn.dataset.job = item.key;
    btn.innerText = item.text;
    btn.onclick = handleJobSelect;
    jobGrid.appendChild(btn);
  });

  updateJobButtons();
}

function updateJobButtons() {
  const jobs = Array.isArray(formData.occupation_type) ? formData.occupation_type : [];

  document.querySelectorAll('.job-btn').forEach(btn => {
    const job = btn.dataset.job;
    btn.classList.remove('disabled', 'selected');

    if (jobs.includes(job)) {
      btn.classList.add('selected');
    }

    btn.onclick = handleJobSelect;
  });
}

function handleJobSelect(e) {
  const job = e.currentTarget.dataset.job;
  let jobs = Array.isArray(formData.occupation_type) ? [...formData.occupation_type] : [];

  if (jobs.includes(job)) {
    jobs = jobs.filter(item => item !== job);
  } else {
    jobs.push(job);
  }

  formData.occupation_type = jobs;
  updateJobButtons();
  updateNpcCard();
}

function updateNpcCard() {
  updateNpcCardBasic();
  updateNpcCardBattle();
  updateNpcImages();
  syncNpcNoteCard();

  if (typeof updateSkillPreview === 'function') {
    updateSkillPreview();
  }

  if (typeof fitAll === 'function') fitAll();
  if (typeof checkLongTextByCharCount === 'function') checkLongTextByCharCount();
}

function updateNpcCardBasic() {
  setCardText('other_npcs.name', formData.name || '');
  setCardText('other_npcs.nickname', formData.nickname || '');
  setCardText('other_npcs.npc_category', formData.npc_category || '');
  setCardText('other_npcs.alignment', translateAlignment(formData.alignment));
  setCardText('other_npcs.gender', formData.gender || '');
  setCardText('other_npcs.age', formData.age || '');
  setCardText('other_npcs.height', formData.height || '');
  setCardText('other_npcs.weight', formData.weight || '');
  setCardText('other_npcs.race', formData.race || '');
  setCardText('other_npcs.personality', formData.personality || '');
  setCardText('other_npcs.likes', formData.likes || '');
  setCardText('other_npcs.hate', formData.hate || '');
  setCardText('other_npcs.background', formData.background || '');

  document.querySelectorAll('.littlename-box').forEach(box => {
    const value = box.querySelector('[data-key="other_npcs.nickname"]');

    if (formData.nickname && formData.nickname.trim()) {
      box.style.display = '';
      if (value) value.textContent = formData.nickname;
    } else {
      box.style.display = 'none';
      if (value) value.textContent = '';
    }
  });
}

function updateNpcCardBattle() {
  setCardText('other_npcs.element', translateElementArray(formData.element));
  setCardText('element_weakness.element', translateWeakness(formData.weakness_id));
  setCardText('other_npcs.preferred_role', translateRole(formData.preferred_role));
  setCardText('other_npcs.starting_position', translatePosition(formData.starting_position));
  setCardText('other_npcs.occupation_type', translateOccupationArray(formData.occupation_type));
}

function updateNpcImages() {
  const frontUrl = formData.images && formData.images.front_url ? formData.images.front_url : '';
  const backUrl = formData.images && formData.images.back_url ? formData.images.back_url : '';

  document.querySelectorAll('.front-img').forEach(img => {
    if (frontUrl) img.src = frontUrl;
  });

  document.querySelectorAll('.back-img').forEach(img => {
    if (backUrl) img.src = backUrl;
  });
}

function setCardText(dataKey, text) {
  document.querySelectorAll(`[data-key="${dataKey}"]`).forEach(el => {
    el.textContent = text ?? '';
  });
}

function syncNpcNoteCard() {
  const notes = Array.isArray(formData.notes) ? formData.notes : [];

  const displayLines = notes
    .filter(note => (note.content || '').trim())
    .map(note => note.is_public ? `# ${note.content.trim()}` : '# ???')
    .join('\n\n');

  document.querySelectorAll('[data-key="othernpc_notes.content"]').forEach(el => {
    el.textContent = displayLines;
  });
}

function translateAlignment(value) {
  if (value === 'white') return '白';
  if (value === 'black') return '黑';
  return '？';
}

function translateElement(value) {
  const dict = {
    fire: '火',
    water: '水',
    ice: '冰',
    wind: '風',
    earth: '土',
    thunder: '雷',
    dark: '暗',
    light: '光'
  };

  return dict[value] || value || '無';
}

function translateElementArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '無';
  return arr.map(item => translateElement(item)).filter(Boolean).join(' / ') || '無';
}

function translateWeakness(weaknessId) {
  if (!weaknessId) return '無';

  const item = window.weaknessDict ? window.weaknessDict[weaknessId] : null;
  if (!item) return '';

  return translateElement(item.element);
}

function translateRole(value) {
  const dict = {
    melee: '近戰攻擊手',
    ranger: '遠攻攻擊手',
    balance: '普通攻擊手'
  };

  return dict[value] || '';
}

function translatePosition(value) {
  const dict = {
    close: '近戰區',
    far: '遠攻區'
  };

  return dict[value] || '開戰時決定';
}

function translateOccupationArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';

  const dict = {
    attack: '攻擊手',
    tank: '坦克',
    healer: '補師',
    buffer: '增益手',
    jammer: '妨礙手'
  };

  return arr.map(item => dict[item] || item).join(' / ');
}

async function loadNpcDataToForm(othernpcId) {
  const { data: npc, error } = await window.client
    .from('other_npcs')
    .select('*')
    .eq('othernpc_id', othernpcId)
    .single();

  if (error || !npc) {
    alert('查無此 NPC');
    return;
  }

  Object.assign(formData, {
    othernpc_id: npc.othernpc_id || othernpcId,
    player_id: npc.player_id || '',
    name: npc.name || '',
    nickname: npc.nickname || '',
    npc_category: npc.npc_category || '',
    background_image_url: npc.background_image_url || 'https://shierusha.github.io/school-battle/teachers/img/1.webp',
    namebox_color: npc.namebox_color || '#3da2ad',
    attack_cc: npc.attack_cc ?? 0,
dodge_cc: npc.dodge_cc ?? 0,
cover_cc: npc.cover_cc ?? 0,
take_cc: npc.take_cc ?? 0,
    alignment: npc.alignment || '',
    gender: npc.gender || '',
    age: npc.age || '',
    height: npc.height || '',
    weight: npc.weight || '',
    race: npc.race || '',
    personality: npc.personality || '',
    likes: npc.likes || '',
    hate: npc.hate || '',
    background: npc.background || '',
    element: Array.isArray(npc.element) ? npc.element : (npc.element ? [npc.element] : []),
    weakness_id: npc.weakness_id || '',
    preferred_role: npc.preferred_role || '',
    starting_position: npc.starting_position || '',
    occupation_type: Array.isArray(npc.occupation_type) ? npc.occupation_type : (npc.occupation_type ? [npc.occupation_type] : [])
  });

  if (typeof setNpcBackgroundUrl === 'function') {
    setNpcBackgroundUrl(formData.background_image_url);
  } else {
    const bgInput = document.getElementById('background_image_url');
    if (bgInput) bgInput.value = formData.background_image_url;

    document.querySelectorAll('.bg-img').forEach(img => {
      img.src = formData.background_image_url;
    });
  }

  const notesResult = await window.client
    .from('othernpc_notes')
    .select('*')
    .eq('othernpc_id', othernpcId)
    .order('sort_order');

  if (!notesResult.error && notesResult.data && notesResult.data.length) {
    formData.notes = notesResult.data.map(note => ({
      content: note.content || '',
      is_public: !!note.is_public
    }));
  } else {
    formData.notes = [{ content: '', is_public: true }];
  }

  const imagesResult = await window.client
    .from('othernpc_images')
    .select('image_type,image_url')
    .eq('othernpc_id', othernpcId);

  formData.images = {
    front_url: '',
    back_url: ''
  };

  if (!imagesResult.error && imagesResult.data) {
    imagesResult.data.forEach(img => {
      if (img.image_type === 'front') formData.images.front_url = bustCache(img.image_url);
      if (img.image_type === 'back') formData.images.back_url = bustCache(img.image_url);
    });
  }
if (typeof setNpcNameboxColor === 'function') {
  setNpcNameboxColor(formData.namebox_color || '#3da2ad');
}
  await loadNpcSkillsToForm(othernpcId);
  updateNpcCard();
}

async function loadNpcSkillsToForm(othernpcId) {
  await initAllNpcSkillLists();

  const { data: skillsArr, error } = await window.client
    .from('othernpc_skills')
    .select('*')
    .eq('othernpc_id', othernpcId)
    .order('skill_slot');

  if (error) {
    alert('載入 NPC 技能資料失敗：' + error.message);
    formData.skills = [{}, {}];
    return;
  }

  if (!skillsArr || !skillsArr.length) {
    formData.skills = [{}, {}];
    return;
  }

  const newSkillsArr = [];

  for (const skillRow of skillsArr) {
    const skill = {
      id: skillRow.id,
      skill_id: skillRow.id,
      skill_slot: skillRow.skill_slot,
      skill_name: skillRow.skill_name || '',
      description: skillRow.description || '',
      cd: skillRow.cd,
      need_cc: skillRow.need_cc,
      is_passive: !!skillRow.is_passive,
      passive_trigger_limit: skillRow.passive_trigger_limit || null,
      linked_movement_id: skillRow.linked_movement_id || null,
      target_select_type: skillRow.target_select_type || 'people',
      max_targets: skillRow.max_targets,
      target_faction: skillRow.target_faction === null || skillRow.target_faction === undefined ? null : skillRow.target_faction,
      range: skillRow.range === null || skillRow.range === undefined ? null : skillRow.range,
      othernpc_trigger_id: skillRow.othernpc_trigger_id || null,
      effect_ids: [],
      npc_effect_ids: [],
      debuffs: [],
      use_movement: !!skillRow.linked_movement_id,
      move_ids: skillRow.linked_movement_id || ''
    };

    const effResult = await window.client
      .from('othernpc_skill_effect_links')
      .select('effect_id')
      .eq('skill_id', skillRow.id);

    skill.effect_ids = !effResult.error && effResult.data
      ? effResult.data.map(item => item.effect_id)
      : [];

    const npcEffResult = await window.client
      .from('othernpc_skill_npc_effect_links')
      .select('npc_effect_id')
      .eq('skill_id', skillRow.id);

    skill.npc_effect_ids = !npcEffResult.error && npcEffResult.data
      ? npcEffResult.data.map(item => item.npc_effect_id)
      : [];

    const debResult = await window.client
      .from('othernpc_skill_debuff_links')
      .select('debuff_id,applied_to')
      .eq('skill_id', skillRow.id);

    skill.debuffs = !debResult.error && debResult.data
      ? debResult.data.map(link => {
          const detail = (window.skillDebuffList || []).find(item => item.debuff_id === link.debuff_id);

          if (detail) {
            return {
              ...detail,
              debuff_id: link.debuff_id,
              applied_to: link.applied_to || 'self'
            };
          }

          return {
            debuff_id: link.debuff_id,
            applied_to: link.applied_to || 'self'
          };
        })
      : [];

    if (skill.othernpc_trigger_id) {
      const triggerResult = await window.client
        .from('othernpc_passive_trigger')
        .select('condition,trigger_code,remarks')
        .eq('othernpc_trigger_id', skill.othernpc_trigger_id)
        .maybeSingle();

      if (!triggerResult.error && triggerResult.data) {
        skill.passive_trigger_condition = triggerResult.data.condition || '';
        skill.passive_trigger_code = triggerResult.data.trigger_code || '';
        skill.passive_trigger_remarks = triggerResult.data.remarks || '';
      } else {
        skill.passive_trigger_condition = '';
        skill.passive_trigger_code = '';
        skill.passive_trigger_remarks = '';
      }
    } else {
      skill.passive_trigger_condition = '';
      skill.passive_trigger_code = '';
      skill.passive_trigger_remarks = '';
    }

    newSkillsArr.push(skill);
  }

  while (newSkillsArr.length < 2) {
    newSkillsArr.push({});
  }

  formData.skills = newSkillsArr;
}

window.showStep = showStep;
window.updateNpcCard = updateNpcCard;
window.initSkillEffectsList = initSkillEffectsList;
window.initNpcSkillEffectsList = initNpcSkillEffectsList;
window.initMovementSkillsList = initMovementSkillsList;
window.initSkillDebuffList = initSkillDebuffList;
window.initAllNpcSkillLists = initAllNpcSkillLists;
window.loadNpcDataToForm = loadNpcDataToForm;
window.loadNpcSkillsToForm = loadNpcSkillsToForm;
window.translateElement = translateElement;
window.translateAlignment = translateAlignment;
window.translateRole = translateRole;
window.translatePosition = translatePosition;
window.translateOccupationArray = translateOccupationArray;
