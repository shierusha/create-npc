(function () {
  if (typeof window.formData === 'undefined') {
    alert('請先載入 npc-main.js');
    return;
  }

  const NULL_SELECT_VALUE = '__NPC_NULL__';

  const TARGET_LABELS = {
    self: '自身',
    enemy: '敵方',
    ally: '隊友',
    team: '我方'
  };

  const TARGET_SELECT_TYPE_LABELS = {
    people: '人頭',
    range: '區域',
    global: '全場'
  };

  const RANGE_LABELS = {
    same_zone: '近距離',
    cross_zone: '遠距離',
    all_zone: '遠近皆可'
  };

  const RANGE_OPTIONS = [
    { value: 'same_zone', label: '近距離（同區）' },
    { value: 'cross_zone', label: '遠距離（跨區）' },
    { value: 'all_zone', label: '遠近皆可（無限制距離）' },
    { value: NULL_SELECT_VALUE, label: '全域攻擊' }
  ];

  const OCC_TO_EFFECT_TYPES = {
    attack: ['attack', 'attack_only'],
    tank: ['tank', 'tank_only'],
    healer: ['heal', 'heal_only'],
    buffer: ['buff', 'buff_only'],
    jammer: ['debuff', 'debuff_only']
  };

  const EFFECT_TYPE_LABELS = {
    attack: '攻擊',
    attack_only: '攻擊',
    heal: '恢復',
    heal_only: '恢復',
    tank: '坦克',
    tank_only: '坦克',
    buff: '增益',
    buff_only: '增益',
    debuff: '妨礙',
    debuff_only: '妨礙',
    move: '移動',
    special: '特殊',
    other: '其他'
  };

  const DEBUFF_TYPE_LABELS = {
    cc: 'CC',
    cd: 'CD',
    pass: '行動機會-1',
    debuff: '一般負面',
    bleed: '損血',
    def: '防禦力提升',
    atk: '攻擊力提升',
    special: '特殊',
    empty: '空白',
    other: '其他'
  };

  const EFFECT_CONFLICT_GROUPS = [
    ['27004404-af5a-43b0-bcd4-b8396616e4d8', '1511fbab-3767-4616-b45a-548a45251435'],
    ['d29f8d8a-adcc-4042-8152-083348a1d9b9', '288abba4-f5ee-40fa-aeed-e09a40f2d431', 'e9e7e646-ebed-486b-acb9-e1743a276924'],
    ['5de8e7ba-1365-4f42-89e8-53d66ab965ea', 'e5131613-2c90-4b29-abcc-070264bc7943'],
    ['d646fbeb-e4e3-425c-99a5-59578a9d07a7', '69818ec2-50f6-490b-9a44-a7f8e622d721'],
    ['a7a479bd-75e4-4633-90cd-e50374e01ed4', '27004404-af5a-43b0-bcd4-b8396616e4d8'],
    ['417c9b84-5152-4070-9203-59d1e71238b2', 'ec1b764a-be7d-4aa5-ba91-e1e2da393fa9'],
    ['b60ffd20-c804-4b7d-b040-91a4464acdd8', '46da302a-34a7-4729-ab30-1c8f35a28db6', 'd2b1d34a-30a6-4e0b-bb7b-3feb35ad8795', '6b2f058b-5726-4f71-8a91-e3cb19155a6d', '2f143df3-eee0-4458-a941-88fd329aead7'],
    ['c5c1fe8a-23d8-4678-8206-87673fc5f584', 'c9c2660b-f5c2-4b69-af47-143093af01b9'],
    ['a774cb0a-385a-43ed-91ef-e810c31cc06b', '846d3cac-45b0-4737-9e2f-5970bb159b3b'],
    ['24a11705-e6e0-4df9-a7a9-1d418f62c3af', '79f5bbd5-a67d-4d1b-bb1c-e7a5347b3c6a', '38b89849-588f-447d-86d0-d8306c38a6d9'],
    ['6efb26b5-424a-41d7-bd53-79143fd4670d', '2427e58b-542b-47a7-a2c2-ae2eb232ee20'],
    ['89aa0bcb-827f-4d1b-adae-0842c5380b74', '0cac3649-8020-4573-bfbe-facff2be4a57', '80687236-6444-4559-852f-c6082b56ade8'],
    ['deccc6b9-345a-4150-9548-f3ecbf749559', '4aa87d4a-9743-461a-86dd-ed902d1a03ca'],
    ['d68e2730-d0c2-4db6-b69d-4eeef7be8336', 'ae5049cd-0dc6-434c-9f1b-fb993c0c0600'],
    ['547a42fc-2e19-45fa-b832-95cb3e561b85', '2ad6ff82-65ce-4326-a141-d9a257fa5c8f'],
    ['03eab683-09e2-4914-b2a1-42e84613fef1', '9fbd94ba-3ba6-4c48-bef9-749a085fa747'],
    ['fdeb1522-d01c-44b6-ac59-a31d5dfecb02', '76ce35b8-39cf-4e69-a6b9-6f81119a2608'],
    ['94d3738a-7a21-4660-b21d-a354c99ddc57', '564c74d5-8458-4a94-8a02-0832d77e1c58'],
    ['4abbc2f2-9263-4480-92bc-def9de161497', '6cdc252b-92cb-4b35-a160-a0932bea534a'],
    ['24f12a39-20ba-4720-8909-d04c46388b98', '5c402704-1edb-4980-b600-81f2bd22b2e8'],
    ['ef9de935-9f1e-4896-b285-1ebb32c7f38f', '4fd41ef1-0e8a-4720-aec7-d76ac498d360'],
    ['ae8d0eb6-e9d3-4f98-a8f3-38298dd3f14d', 'c411cb6d-e9aa-4c6a-9e4e-463b3b3d36c2'],
    ['08197b19-1585-4186-b0ae-893c1a2fef04', 'd0a9ae30-e7b3-40d1-8b71-e699c47911d7'],
    ['4bb43c90-b0c6-4d92-8dfe-b02f7913013c', '9eb3cd58-f516-4512-944d-d5b1a6b60e6f'],
    ['80810c2d-7443-459e-a08f-2be070d14bec', '6008abaf-bd51-45a6-90b4-e0536d40415c'],
    ['4745cd68-aa15-47f3-9d4d-8d3a19da8a77', '2b060db8-e49e-4bd8-bc29-c4ef9bce3ee7'],
    ['9308d0d5-b341-412f-96bf-2a216ad100c3', '81dd47b8-22be-44b4-8e06-c1cf8ff15ff1'],
    ['9308d0d5-b341-412f-96bf-2a216ad100c3', '53c83c44-9d2f-44f9-804a-c3c6a642c69a'],
    ['3d93b6e2-efcb-4c9d-bc1c-d0c3b6557aa5', 'f41d22f5-5c8f-4ae1-92e7-268739adccac'],
    ['5148fdd5-b62c-47b9-9c83-a579f8696005', 'dfa810db-d56d-4908-be12-4204240b8b43'],
    ['7e66d6be-962b-404d-9d45-261706489fc1', 'd93898e5-e9cd-46e3-a13d-f227c72ca83c']
  ];

  const MUST_SELF_DEBUFF_IDS = [
    'dccd3ff9-5ff5-4229-b3a1-9f6428f53caa',
    '85633080-0b45-44ea-90b9-73fe94a212bf',
    '41941ea2-70ee-4781-9dd1-f7b1a8992341',
    'fae6a1c4-9ff6-48b8-a496-524c9f51c001'
  ];

  const npcCollapsedSections = {};

  injectNpcSkillLayoutStyle();

  function injectNpcSkillLayoutStyle() {
    if (document.getElementById('npc-set-8-layout-style')) return;

    const style = document.createElement('style');
    style.id = 'npc-set-8-layout-style';
    style.textContent = `
      @media (min-width: 901px) {
        body {
          overflow-x: auto;
        }

        #form-step-8 .skills-container {
          display: flex;
          flex-wrap: nowrap;
          justify-content: flex-start;
          align-items: flex-start;
          gap: 2rem;
          overflow-x: visible;
          overflow-y: visible;
          width: max-content;
          min-width: 100%;
        }

        #form-step-8 .skills-container .skill-block {
          flex: 0 0 calc((75vw - 6rem) / 2);
          width: calc((75vw - 6rem) / 2);
          max-width: calc((75vw - 6rem) / 2);
          min-width: 360px;
          box-sizing: border-box;
        }
      }

      @media (max-width: 900px) {
        #form-step-8 .skills-container {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        #form-step-8 .skills-container .skill-block {
          width: 100%;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getNpcSectionCollapsed(sectionKey) {
    if (npcCollapsedSections[sectionKey] === undefined) {
      npcCollapsedSections[sectionKey] = true;
    }

    return npcCollapsedSections[sectionKey];
  }

  function nullableToSelectValue(value) {
    if (value === null || value === undefined) return NULL_SELECT_VALUE;
    return value;
  }

  function selectValueToNullable(value) {
    return value === NULL_SELECT_VALUE ? null : value;
  }

  function isBlankValue(value) {
    return value === null || value === undefined || value === '';
  }

  function toNumberOrBlank(value) {
    if (value === null || value === undefined || value === '') return '';
    const number = Number(value);
    return Number.isFinite(number) ? number : '';
  }

  function getSafeSkillArray() {
    if (!Array.isArray(formData.skills)) {
      formData.skills = [{}, {}];
    }

    while (formData.skills.length < 2) {
      formData.skills.push({});
    }

    return formData.skills;
  }

  function normalizeNpcSkill(idx) {
    const skills = getSafeSkillArray();

    if (!skills[idx]) {
      skills[idx] = {};
    }

    const skill = skills[idx];

    if (!Array.isArray(skill.effect_ids)) skill.effect_ids = [];
    if (!Array.isArray(skill.npc_effect_ids)) skill.npc_effect_ids = [];
    if (!Array.isArray(skill.debuffs)) skill.debuffs = [];

    if (skill.skill_name === undefined || skill.skill_name === null) skill.skill_name = '';
    if (skill.description === undefined || skill.description === null) skill.description = '';

    if (skill.target_select_type === undefined || skill.target_select_type === null || skill.target_select_type === '') {
      skill.target_select_type = 'people';
    }

    if (skill.target_faction === undefined) {
      skill.target_faction = '';
    }

    if (skill.max_targets === undefined) {
      skill.max_targets = 1;
    }

    if (skill.range === undefined) {
      skill.range = '';
    }

    if (skill.cd === undefined) {
      skill.cd = '';
    }

    if (skill.need_cc === undefined) {
      skill.need_cc = '';
    }

    if (skill.passive_trigger_limit === undefined) {
      skill.passive_trigger_limit = null;
    }

    if (skill.passive_trigger_condition === undefined || skill.passive_trigger_condition === null) {
      skill.passive_trigger_condition = '';
    }

    if (skill.passive_trigger_code === undefined || skill.passive_trigger_code === null) {
      skill.passive_trigger_code = '';
    }

    if (skill.passive_trigger_remarks === undefined || skill.passive_trigger_remarks === null) {
      skill.passive_trigger_remarks = '';
    }

    if (skill.linked_movement_id && !skill.move_ids) {
      skill.move_ids = skill.linked_movement_id;
    }

    if (skill.move_ids && !skill.linked_movement_id) {
      skill.linked_movement_id = skill.move_ids;
    }

    if (skill.use_movement === undefined) {
      skill.use_movement = !!skill.linked_movement_id;
    }

    applyNpcSkillForcedRules(skill);

    return skill;
  }

  function applyNpcSkillForcedRules(skill) {
    if (!skill) return;

    if (skill.target_faction === 'self') {
      skill.target_select_type = 'people';
      skill.max_targets = 1;
      skill.range = 'same_zone';
    }

    if (skill.target_select_type === 'global') {
      skill.max_targets = null;
      skill.range = null;
      skill.use_movement = false;
      skill.move_ids = '';
      skill.linked_movement_id = null;
    }

    if (skill.target_select_type === 'range') {
      if (isBlankValue(skill.max_targets)) {
        skill.max_targets = 1;
      }

      skill.range = null;
      skill.use_movement = false;
      skill.move_ids = '';
      skill.linked_movement_id = null;
    }

    if (skill.target_select_type === 'people') {
      if (isBlankValue(skill.max_targets)) {
        skill.max_targets = 1;
      }

      if (skill.range === null || skill.range === undefined || skill.range === '') {
        const preferredRole = formData.preferred_role || 'balance';

        if (preferredRole === 'ranger') {
          skill.range = 'cross_zone';
        } else {
          skill.range = 'same_zone';
        }
      }
    }

    if (skill.is_passive) {
      skill.cd = null;
      skill.use_movement = false;
      skill.move_ids = '';
      skill.linked_movement_id = null;
    }
  }

  function resetNpcSkillSelections(skill) {
    if (!skill) return;

    skill.effect_ids = [];
    skill.npc_effect_ids = [];
    skill.debuffs = [];
    skill.use_movement = false;
    skill.move_ids = '';
    skill.linked_movement_id = null;
  }

  function getAllowedNpcTargetOptions() {
    const targetMap = {
      tank: ['self', 'enemy', 'ally'],
      attack: ['enemy', 'ally'],
      jammer: ['enemy', 'ally'],
      healer: ['self', 'ally', 'team'],
      buffer: ['self', 'ally', 'team']
    };

    const labelMap = {
      self: '自身',
      enemy: '敵方',
      ally: '隊友',
      team: '我方'
    };

    const occ = Array.isArray(formData.occupation_type) ? formData.occupation_type : [];
    const allowedSet = new Set();

    if (occ.length === 0) {
      ['self', 'enemy', 'ally', 'team'].forEach(function (item) {
        allowedSet.add(item);
      });
    } else {
      occ.forEach(function (job) {
        if (targetMap[job]) {
          targetMap[job].forEach(function (target) {
            allowedSet.add(target);
          });
        }
      });
    }

    const options = [];

    ['self', 'enemy', 'ally', 'team'].forEach(function (key) {
      if (allowedSet.has(key)) {
        options.push({
          value: key,
          label: labelMap[key]
        });
      }
    });

    const canUseNeutralTarget =
      allowedSet.has('enemy') ||
      allowedSet.has('ally') ||
      allowedSet.has('team');

    if (canUseNeutralTarget) {
      options.push({
        value: NULL_SELECT_VALUE,
        label: '敵我不分'
      });
    }

    return options;
  }

  async function initAllSkillListsThenRender() {
    if (typeof window.initAllNpcSkillLists === 'function') {
      await window.initAllNpcSkillLists();
    } else {
      if (typeof window.initSkillEffectsList === 'function') await window.initSkillEffectsList();
      if (typeof window.initNpcSkillEffectsList === 'function') await window.initNpcSkillEffectsList();
      if (typeof window.initMovementSkillsList === 'function') await window.initMovementSkillsList();
      if (typeof window.initSkillDebuffList === 'function') await window.initSkillDebuffList();
    }

    renderSkillsPage(formData.skills);
    updateSkillPreview();
  }

  function createElement(tag, className, text) {
    const el = document.createElement(tag);

    if (className) {
      el.className = className;
    }

    if (text !== undefined && text !== null) {
      el.textContent = text;
    }

    return el;
  }

  function createRow(labelText, inputElement) {
    const row = createElement('div', 'npc-skill-row');
    const label = document.createElement('label');
    label.textContent = labelText;
    row.appendChild(label);
    row.appendChild(inputElement);
    return row;
  }

  function createSmallButton(text) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'npc-small-btn';
    button.textContent = text;
    return button;
  }

  function showModal(title, body) {
    if (typeof window.showInfoModal === 'function') {
      window.showInfoModal(title || '內容', body || '');
      return;
    }

    const modalTitle = document.getElementById('info-modal-title');
    const modalBody = document.getElementById('info-modal-body');
    const modal = document.getElementById('info-modal');

    if (!modalTitle || !modalBody || !modal) return;

    modalTitle.innerText = title || '內容';
    modalBody.innerText = body || '';
    modal.style.display = 'flex';
  }

  function renderSkillsPage(skillsArr) {
    const container = document.querySelector('.skills-container');
    if (!container) return;

    const skills = Array.isArray(skillsArr) ? skillsArr : getSafeSkillArray();
    formData.skills = skills;

    while (formData.skills.length < 2) {
      formData.skills.push({});
    }

    container.innerHTML = '';

    formData.skills.forEach(function (_, idx) {
      const skill = normalizeNpcSkill(idx);
      const block = createElement('div', 'skill-block npc-skill-block');
      block.dataset.skillIndex = String(idx);

      const title = createElement('div', 'npc-skill-title', `技能${idx + 1}`);
      block.appendChild(title);

      renderSkillNameBlock(idx, block, skill);
      renderSkillPassiveBlock(idx, block, skill);
      renderSkillCdAndNeedCcBlock(idx, block, skill);
      renderSkillDescriptionBlock(idx, block, skill);
      renderSkillTargetBlock(idx, block, skill);
      renderNpcEffectBlock(idx, block, skill);
      renderSharedSkillEffectBlock(idx, block, skill);
      renderMovementSkillsBlock(idx, block, skill);
      renderSkillDebuffBlock(idx, block, skill);

      if (idx >= 2) {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'npc-extra-skill-delete npc-danger-btn';
        deleteButton.textContent = '刪除此技能';

        deleteButton.onclick = function () {
          if (!confirm(`確定要刪除技能${idx + 1}嗎？`)) return;

          formData.skills.splice(idx, 1);
          initAllSkillListsThenRender();
        };

        block.appendChild(deleteButton);
      }

      container.appendChild(block);
    });

    updateSkillPreview();

    if (typeof window.fitAll === 'function') {
      window.fitAll();
    }

    if (typeof window.checkLongTextByCharCount === 'function') {
      window.checkLongTextByCharCount();
    }
  }

  function renderSkillNameBlock(idx, block, skill) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `npc-skill-${idx + 1}-name`;
    input.placeholder = '請輸入技能名稱';
    input.value = skill.skill_name || '';

    input.addEventListener('input', function () {
      formData.skills[idx].skill_name = this.value;
      updateSkillPreview();
    });

    block.appendChild(createRow(`技能${idx + 1} 名稱`, input));
  }

  function renderSkillPassiveBlock(idx, block, skill) {
    if (idx < 1) return;

    const passiveBlock = createElement('div', 'npc-passive-block');

    const passiveLabel = document.createElement('label');
    passiveLabel.style.display = 'inline-flex';
    passiveLabel.style.alignItems = 'center';
    passiveLabel.style.gap = '0.35rem';

    const passiveCheckbox = document.createElement('input');
    passiveCheckbox.type = 'checkbox';
    passiveCheckbox.checked = !!skill.is_passive;

    passiveLabel.appendChild(passiveCheckbox);
    passiveLabel.appendChild(document.createTextNode('被動技能'));
    passiveBlock.appendChild(passiveLabel);

    const optionsBlock = createElement('div', 'npc-passive-options');
    optionsBlock.style.display = passiveCheckbox.checked ? '' : 'none';

    const limitOptions = [
      { value: 'once', label: '整場戰鬥只能觸發一次' },
      { value: 'per_turn', label: '每回合至多可以觸發一次' },
      { value: 'unlimited', label: '達成條件即可觸發' }
    ];

    limitOptions.forEach(function (item) {
      const optionLabel = createElement('label', 'npc-passive-option');

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `npc-passive-limit-${idx}`;
      radio.value = item.value;
      radio.checked = skill.passive_trigger_limit === item.value;

      radio.addEventListener('change', function () {
        formData.skills[idx].passive_trigger_limit = this.value;
        updateSkillPreview();
      });

      optionLabel.appendChild(radio);
      optionLabel.appendChild(document.createTextNode(item.label));
      optionsBlock.appendChild(optionLabel);
    });

    const conditionBlock = createElement('div', 'npc-passive-condition');

    const conditionLabel = document.createElement('label');
    conditionLabel.textContent = '觸發條件';
    conditionBlock.appendChild(conditionLabel);

    const conditionTextarea = document.createElement('textarea');
    conditionTextarea.rows = 3;
    conditionTextarea.placeholder = '例：自身血量小於4時觸發';
    conditionTextarea.value = skill.passive_trigger_condition || '';

    conditionTextarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
      formData.skills[idx].passive_trigger_condition = this.value;
      updateSkillPreview();
    });

    conditionBlock.appendChild(conditionTextarea);

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.placeholder = '觸發條件代碼，可空白';
    codeInput.value = skill.passive_trigger_code || '';

    codeInput.addEventListener('input', function () {
      formData.skills[idx].passive_trigger_code = this.value;
    });

    conditionBlock.appendChild(createRow('觸發代碼', codeInput));

    const remarksTextarea = document.createElement('textarea');
    remarksTextarea.rows = 2;
    remarksTextarea.placeholder = '觸發條件備註，可空白';
    remarksTextarea.value = skill.passive_trigger_remarks || '';

    remarksTextarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
      formData.skills[idx].passive_trigger_remarks = this.value;
    });

    conditionBlock.appendChild(createRow('觸發備註', remarksTextarea));
    optionsBlock.appendChild(conditionBlock);
    passiveBlock.appendChild(optionsBlock);

    passiveCheckbox.addEventListener('change', function () {
      const checked = this.checked;

      formData.skills[idx].is_passive = checked;

      if (checked) {
        formData.skills[idx].cd = null;
        formData.skills[idx].use_movement = false;
        formData.skills[idx].move_ids = '';
        formData.skills[idx].linked_movement_id = null;

        if (!formData.skills[idx].passive_trigger_limit) {
          formData.skills[idx].passive_trigger_limit = 'once';
        }
      } else {
        formData.skills[idx].passive_trigger_limit = null;
        formData.skills[idx].passive_trigger_condition = '';
        formData.skills[idx].passive_trigger_code = '';
        formData.skills[idx].passive_trigger_remarks = '';
        formData.skills[idx].cd = '';
      }

      renderSkillsPage(formData.skills);
    });

    block.appendChild(passiveBlock);
  }

  function renderSkillCdAndNeedCcBlock(idx, block, skill) {
    const cdInput = document.createElement('input');
    cdInput.type = 'number';
    cdInput.min = '0';
    cdInput.step = '1';
    cdInput.placeholder = '請輸入技能 CD';
    cdInput.value = skill.is_passive ? '' : toNumberOrBlank(skill.cd);
    cdInput.disabled = !!skill.is_passive;

    if (skill.is_passive) {
      cdInput.classList.add('npc-readonly-input');
    }

    cdInput.addEventListener('input', function () {
      formData.skills[idx].cd = this.value === '' ? '' : Number(this.value);
      updateSkillPreview();
    });

    block.appendChild(createRow('技能 CD', cdInput));

    const cdDisplay = createElement('div', 'npc-cd-display');
    cdDisplay.textContent = skill.is_passive ? '技能CD：被動' : `技能CD：${isBlankValue(skill.cd) ? '' : skill.cd}`;
    block.appendChild(cdDisplay);

    const needCcInput = document.createElement('input');
    needCcInput.type = 'number';
    needCcInput.min = '0';
    needCcInput.step = '1';
    needCcInput.placeholder = '空值代表開啟技能無須 CC';
    needCcInput.value = toNumberOrBlank(skill.need_cc);

    needCcInput.addEventListener('input', function () {
      formData.skills[idx].need_cc = this.value === '' ? null : Number(this.value);
      updateSkillPreview();
    });

    block.appendChild(createRow('開啟技能 CC', needCcInput));
  }

  function renderSkillDescriptionBlock(idx, block, skill) {
    const textarea = document.createElement('textarea');
    textarea.rows = 3;
    textarea.placeholder = '請輸入技能敘述';
    textarea.value = skill.description || '';

    textarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
      formData.skills[idx].description = this.value;
      updateSkillPreview();
    });

    block.appendChild(createRow('技能敘述', textarea));
  }

  function renderSkillTargetBlock(idx, block, skill) {
    const targetSelect = document.createElement('select');

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '請選擇';
    placeholder.disabled = true;
    targetSelect.appendChild(placeholder);

    const targetOptions = getAllowedNpcTargetOptions();

    targetOptions.forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      targetSelect.appendChild(option);
    });

    const currentTargetValue = nullableToSelectValue(skill.target_faction);
    const currentTargetAllowed = targetOptions.some(function (item) {
      return item.value === currentTargetValue;
    });

    if (skill.target_faction === '' || !currentTargetAllowed) {
      targetSelect.value = '';
      formData.skills[idx].target_faction = '';
    } else {
      targetSelect.value = currentTargetValue;
    }

    targetSelect.addEventListener('change', function () {
      formData.skills[idx].target_faction = selectValueToNullable(this.value);

      applyNpcSkillForcedRules(formData.skills[idx]);
      resetNpcSkillSelections(formData.skills[idx]);

      renderSkillsPage(formData.skills);
    });

    block.appendChild(createRow('技能施放對象', targetSelect));

    const targetTypeSelect = document.createElement('select');

    [
      { value: 'people', label: '人頭' },
      { value: 'range', label: '區域' },
      { value: 'global', label: '全場' }
    ].forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      targetTypeSelect.appendChild(option);
    });

    targetTypeSelect.value = skill.target_select_type || 'people';

    if (skill.target_faction === 'self') {
      targetTypeSelect.disabled = true;
      targetTypeSelect.classList.add('npc-readonly-input');
    }

    targetTypeSelect.addEventListener('change', function () {
      formData.skills[idx].target_select_type = this.value;

      applyNpcSkillForcedRules(formData.skills[idx]);
      resetNpcSkillSelections(formData.skills[idx]);

      renderSkillsPage(formData.skills);
    });

    block.appendChild(createRow('技能施放方式', targetTypeSelect));

    const maxTargetsInput = document.createElement('input');

    if (skill.target_select_type === 'global') {
      maxTargetsInput.type = 'text';
      maxTargetsInput.value = 'NULL';
      maxTargetsInput.disabled = true;
      maxTargetsInput.classList.add('npc-readonly-input');
    } else {
      maxTargetsInput.type = 'number';
      maxTargetsInput.min = '1';
      maxTargetsInput.step = '1';
      maxTargetsInput.value = isBlankValue(skill.max_targets) ? '' : skill.max_targets;
      maxTargetsInput.placeholder = skill.target_select_type === 'range' ? '請輸入區域數量' : '請輸入人數';
    }

    if (skill.target_faction === 'self') {
      maxTargetsInput.type = 'number';
      maxTargetsInput.value = '1';
      maxTargetsInput.disabled = true;
      maxTargetsInput.classList.add('npc-readonly-input');
    }

    maxTargetsInput.addEventListener('input', function () {
      formData.skills[idx].max_targets = this.value === '' ? '' : Number(this.value);

      resetNpcSkillSelections(formData.skills[idx]);
      renderSkillsPage(formData.skills);
    });

    const maxTargetLabel = skill.target_select_type === 'range'
      ? '技能施放範圍'
      : '技能施放對象人數';

    block.appendChild(createRow(maxTargetLabel, maxTargetsInput));

    const rangeSelect = document.createElement('select');

    RANGE_OPTIONS.forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      rangeSelect.appendChild(option);
    });

    rangeSelect.value = nullableToSelectValue(skill.range);

    if (skill.target_faction === 'self') {
      rangeSelect.value = 'same_zone';
      rangeSelect.disabled = true;
      rangeSelect.classList.add('npc-readonly-input');
    }

    if (skill.target_select_type === 'range' || skill.target_select_type === 'global') {
      rangeSelect.value = NULL_SELECT_VALUE;
      rangeSelect.disabled = true;
      rangeSelect.classList.add('npc-readonly-input');
    }

    rangeSelect.addEventListener('change', function () {
      formData.skills[idx].range = selectValueToNullable(this.value);

      resetNpcSkillSelections(formData.skills[idx]);
      renderSkillsPage(formData.skills);
    });

    block.appendChild(createRow('技能有效距離', rangeSelect));
  }

  function renderNpcEffectBlock(idx, block, skill) {
    const list = Array.isArray(window.npcSkillEffectsList) ? window.npcSkillEffectsList : [];

    if (!Array.isArray(formData.skills[idx].npc_effect_ids)) {
      formData.skills[idx].npc_effect_ids = [];
    }

    const section = createCollapsibleSection(
      `npc-effect-${idx}`,
      'NPC 技能效果',
      `${formData.skills[idx].npc_effect_ids.length} 已選`
    );

    if (!list.length) {
      section.body.appendChild(createElement('div', 'npc-effect-empty', '沒有可用的 NPC 技能效果'));
      block.appendChild(section.wrapper);
      return;
    }

    list.forEach(function (effect) {
      const effectId = effect.effect_id || effect.npc_effect_id;
      if (!effectId) return;

      const row = createElement('label', 'npc-effect-item');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = effectId;
      checkbox.checked = formData.skills[idx].npc_effect_ids.includes(effectId);

      checkbox.addEventListener('change', function () {
        const arr = formData.skills[idx].npc_effect_ids;

        if (this.checked) {
          if (!arr.includes(effectId)) arr.push(effectId);
        } else {
          const pos = arr.indexOf(effectId);
          if (pos >= 0) arr.splice(pos, 1);
        }

        updateSkillPreview();
      });

      const name = createElement('span', 'npc-effect-name', effect.effect_name || '[未命名效果]');

      const detail = createElement('a', 'npc-effect-detail', '詳細');
      detail.href = '#';
      detail.addEventListener('click', function (event) {
        event.preventDefault();
        showModal(effect.effect_name || 'NPC 技能效果', effect.description || '');
      });

      row.appendChild(checkbox);
      row.appendChild(name);
      row.appendChild(detail);
      section.body.appendChild(row);
    });

    block.appendChild(section.wrapper);
  }

  function renderSharedSkillEffectBlock(idx, block, skill) {
    const list = Array.isArray(window.skillEffectsList) ? window.skillEffectsList : [];

    if (!Array.isArray(formData.skills[idx].effect_ids)) {
      formData.skills[idx].effect_ids = [];
    }

    const section = createElement('div', 'npc-effect-section');
    const mainTitle = createElement('div', 'npc-effect-toggle');

    const titleText = createElement('span', 'npc-effect-toggle-text');
    titleText.innerHTML = '<span class="npc-effect-arrow">▼</span><span>共用技能效果</span>';

    const countText = createElement('span', null, `${formData.skills[idx].effect_ids.length} 已選`);

    mainTitle.appendChild(titleText);
    mainTitle.appendChild(countText);

    const body = createElement('div', 'npc-effect-body');
    section.appendChild(mainTitle);
    section.appendChild(body);

    const sectionKey = `shared-root-${idx}`;

    if (getNpcSectionCollapsed(sectionKey)) {
      section.classList.add('collapsed');
    }

    mainTitle.onclick = function () {
      npcCollapsedSections[sectionKey] = !getNpcSectionCollapsed(sectionKey);
      section.classList.toggle('collapsed', !!npcCollapsedSections[sectionKey]);
    };

    if (!list.length) {
      body.appendChild(createElement('div', 'npc-effect-empty', '沒有可用的共用技能效果'));
      block.appendChild(section);
      return;
    }

    const groupMap = getSharedSkillEffectGroupMap(skill);
    const groupTypes = Object.keys(groupMap);

    if (!groupTypes.length) {
      body.appendChild(createElement('div', 'npc-effect-empty', '沒有符合條件的共用技能效果'));
      block.appendChild(section);
      return;
    }

    groupTypes.forEach(function (type) {
      const groupSection = createCollapsibleSection(
        `shared-effect-${idx}-${type}`,
        EFFECT_TYPE_LABELS[type] || type,
        ''
      );

      groupMap[type].forEach(function (effect) {
        groupSection.body.appendChild(createSharedEffectRow(idx, effect));
      });

      body.appendChild(groupSection.wrapper);
    });

    block.appendChild(section);
  }

  function getSharedSkillEffectGroupMap(skill) {
    const groupMap = {};
    const selectedTarget = skill.target_faction;
    const maxTargets = Number(skill.max_targets || 1);
    const allowedEffectTypes = getAllowedEffectTypeSet();
    const list = Array.isArray(window.skillEffectsList) ? window.skillEffectsList : [];
    const onlySelfEffect = skill.target_select_type !== 'people';

    list.forEach(function (effect) {
      if (!effect || !effect.effect_id) return;

      const effectTarget = effect.target_faction === undefined ? null : effect.target_faction;
      const effectMaxTargets = Number(effect.max_targets || 0);
      const effectType = effect.effect_type || 'other';
      const baseType = String(effectType).replace('_only', '') || 'other';

      if (onlySelfEffect && effectTarget !== 'self') return;

      const targetMatched = isSharedEffectTargetMatched(effectTarget, selectedTarget);
      const maxMatched = effectTarget === 'self'
        ? true
        : effectMaxTargets === maxTargets;

      const typeMatched = effectTarget === 'self'
        ? true
        : allowedEffectTypes.has(effectType);

      if (!targetMatched || !maxMatched || !typeMatched) return;

      if (!groupMap[baseType]) {
        groupMap[baseType] = [];
      }

      groupMap[baseType].push(effect);
    });

    return groupMap;
  }

  function getAllowedEffectTypeSet() {
    const occArr = Array.isArray(formData.occupation_type) ? formData.occupation_type : [];
    const set = new Set();

    if (occArr.length === 0) {
      Object.keys(OCC_TO_EFFECT_TYPES).forEach(function (key) {
        OCC_TO_EFFECT_TYPES[key].forEach(function (type) {
          set.add(type);
        });
      });

      return set;
    }

    occArr.forEach(function (job) {
      const list = OCC_TO_EFFECT_TYPES[job] || [];
      list.forEach(function (type) {
        set.add(type);
      });
    });

    return set;
  }

  function isSharedEffectTargetMatched(effectTarget, selectedTarget) {
    if (effectTarget === 'self') {
      return true;
    }

    if (selectedTarget === null) {
      return effectTarget !== 'self';
    }

    if (selectedTarget === '') {
      return false;
    }

    return effectTarget === selectedTarget;
  }

  function createSharedEffectRow(idx, effect) {
    const selectedIds = formData.skills[idx].effect_ids || [];
    const disabledMap = getSharedEffectDisabledMap(selectedIds);

    const row = createElement('label', 'npc-effect-item');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = effect.effect_id;
    checkbox.checked = selectedIds.includes(effect.effect_id);
    checkbox.disabled = !!disabledMap[effect.effect_id];

    checkbox.addEventListener('change', function () {
      const arr = formData.skills[idx].effect_ids;

      if (this.checked) {
        if (!arr.includes(effect.effect_id)) arr.push(effect.effect_id);
      } else {
        const pos = arr.indexOf(effect.effect_id);
        if (pos >= 0) arr.splice(pos, 1);
      }

      renderSkillsPage(formData.skills);
    });

    const name = createElement('span', 'npc-effect-name', effect.effect_name || '[未命名效果]');

    const detail = createElement('a', 'npc-effect-detail', '詳細');
    detail.href = '#';
    detail.addEventListener('click', function (event) {
      event.preventDefault();
      showModal(effect.effect_name || '技能效果', effect.description || '');
    });

    row.appendChild(checkbox);
    row.appendChild(name);
    row.appendChild(detail);

    return row;
  }

  function getSharedEffectDisabledMap(selectedIds) {
    const disabledMap = {};

    EFFECT_CONFLICT_GROUPS.forEach(function (group) {
      const checked = group.find(function (id) {
        return selectedIds.includes(id);
      });

      if (!checked) return;

      group.forEach(function (id) {
        if (id !== checked) {
          disabledMap[id] = true;
        }
      });
    });

    return disabledMap;
  }

  function renderMovementSkillsBlock(idx, block, skill) {
    if (skill.is_passive) {
      formData.skills[idx].use_movement = false;
      formData.skills[idx].move_ids = '';
      formData.skills[idx].linked_movement_id = null;
      return;
    }

    if (skill.target_select_type !== 'people') {
      formData.skills[idx].use_movement = false;
      formData.skills[idx].move_ids = '';
      formData.skills[idx].linked_movement_id = null;
      return;
    }

    if (Number(skill.max_targets || 0) !== 1) {
      formData.skills[idx].use_movement = false;
      formData.skills[idx].move_ids = '';
      formData.skills[idx].linked_movement_id = null;
      return;
    }

    const list = Array.isArray(window.movementSkillsList) ? window.movementSkillsList : [];

    if (!list.length) {
      return;
    }

    const matchedList = list.filter(function (move) {
      return isMovementMatched(move, skill);
    });

    if (!matchedList.length) {
      formData.skills[idx].use_movement = false;
      formData.skills[idx].move_ids = '';
      formData.skills[idx].linked_movement_id = null;
      return;
    }

    const currentMoveId = skill.move_ids || skill.linked_movement_id || '';
    const currentMoveStillMatched = matchedList.some(function (move) {
      return move.move_id === currentMoveId;
    });

    if (skill.use_movement && !currentMoveStillMatched) {
      formData.skills[idx].use_movement = false;
      formData.skills[idx].move_ids = '';
      formData.skills[idx].linked_movement_id = null;
    }

    const section = createCollapsibleSection(
      `movement-${idx}`,
      '移動技能',
      formData.skills[idx].use_movement ? '已啟用' : ''
    );

    const enableLabel = createElement('label', 'npc-effect-item');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!formData.skills[idx].use_movement;

    checkbox.addEventListener('change', function () {
      formData.skills[idx].use_movement = this.checked;

      if (this.checked) {
        const firstMove = matchedList[0];

        formData.skills[idx].move_ids = firstMove.move_id;
        formData.skills[idx].linked_movement_id = firstMove.move_id;
      } else {
        formData.skills[idx].move_ids = '';
        formData.skills[idx].linked_movement_id = null;
      }

      renderSkillsPage(formData.skills);
    });

    enableLabel.appendChild(checkbox);
    enableLabel.appendChild(document.createTextNode('啟用移動技能'));
    section.body.appendChild(enableLabel);

    if (formData.skills[idx].use_movement) {
      matchedList.forEach(function (move) {
        const row = createElement('label', 'npc-effect-item');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `npc-move-radio-${idx}`;
        radio.value = move.move_id;
        radio.checked =
          formData.skills[idx].move_ids === move.move_id ||
          formData.skills[idx].linked_movement_id === move.move_id;

        radio.addEventListener('change', function () {
          formData.skills[idx].move_ids = this.value;
          formData.skills[idx].linked_movement_id = this.value;
          updateSkillPreview();
        });

        const name = createElement('span', 'npc-effect-name', move.move_name || '[未命名移動]');

        const detail = createElement('a', 'npc-effect-detail', '詳細');
        detail.href = '#';
        detail.addEventListener('click', function (event) {
          event.preventDefault();
          showModal(move.move_name || '移動技能', move.description || '');
        });

        row.appendChild(radio);
        row.appendChild(name);
        row.appendChild(detail);

        section.body.appendChild(row);
      });
    }

    block.appendChild(section.wrapper);
  }

 function isMovementMatched(move, skill) {
  if (!move || !skill) return false;

  const selectedTarget = skill.target_faction;
  const moveTarget = move.target_faction === undefined ? null : move.target_faction;

  if (selectedTarget === null) {
    if (moveTarget !== 'self') return false;
  } else if (selectedTarget === '') {
    return false;
  } else if (moveTarget !== selectedTarget) {
    return false;
  }

  if (Number(move.max_targets || 0) !== Number(skill.max_targets || 0)) {
    return false;
  }

  const selectedRange = skill.range === undefined || skill.range === null ? '' : skill.range;
  const moveRange = move.range === undefined || move.range === null ? '' : move.range;

  if (selectedRange && moveRange !== selectedRange) {
    return false;
  }

  return true;
}

  function renderSkillDebuffBlock(idx, block, skill) {
    const section = createElement('div', 'npc-debuff-section');

    const title = createElement('div', 'npc-skill-title', '負作用');
    section.appendChild(title);

    const chosenBox = createElement('div', 'npc-debuff-chosen');

    if (Array.isArray(skill.debuffs) && skill.debuffs.length) {
      skill.debuffs.forEach(function (debuff, debuffIdx) {
        chosenBox.appendChild(createChosenDebuffRow(idx, debuff, debuffIdx));
      });
    } else {
      chosenBox.appendChild(createElement('div', 'npc-effect-empty', '尚未新增負作用'));
    }

    section.appendChild(chosenBox);

    const list = Array.isArray(window.skillDebuffList) ? window.skillDebuffList : [];

    if (!list.length) {
      section.appendChild(createElement('div', 'npc-effect-empty', '沒有可用的負作用資料'));
      block.appendChild(section);
      return;
    }

    const groupMap = {};

    list.forEach(function (debuff) {
      if (!debuff || !debuff.debuff_id) return;

      const type = debuff.debuff_type || 'other';

      if (!groupMap[type]) {
        groupMap[type] = [];
      }

      groupMap[type].push(debuff);
    });

    Object.keys(groupMap).forEach(function (type) {
      const groupSection = createCollapsibleSection(
        `debuff-${idx}-${type}`,
        DEBUFF_TYPE_LABELS[type] || type,
        ''
      );

      groupMap[type].forEach(function (debuff) {
        groupSection.body.appendChild(createDebuffAddRow(idx, skill, debuff));
      });

      section.appendChild(groupSection.wrapper);
    });

    block.appendChild(section);
  }

  function createChosenDebuffRow(idx, debuff, debuffIdx) {
    const row = createElement('div', 'npc-debuff-row');
    const left = createElement('div', 'npc-debuff-left');
    const right = createElement('div', 'npc-debuff-right');

    const appliedLabel = debuff.applied_to === 'toally' ? '目標' : '自身';

    left.appendChild(createElement('span', null, `# ${appliedLabel} ${debuff.debuff_name || '[未命名負作用]'}`));

    const detail = createElement('a', 'npc-effect-detail', '詳細');
    detail.href = '#';
    detail.addEventListener('click', function (event) {
      event.preventDefault();
      showModal(debuff.debuff_name || '負作用', debuff.description || '');
    });

    left.appendChild(detail);

    const deleteButton = createSmallButton('刪除');
    deleteButton.classList.add('npc-debuff-delete-btn', 'npc-danger-btn');

    deleteButton.onclick = function () {
      formData.skills[idx].debuffs.splice(debuffIdx, 1);
      renderSkillsPage(formData.skills);
    };

    right.appendChild(deleteButton);

    row.appendChild(left);
    row.appendChild(right);

    return row;
  }

  function createDebuffAddRow(idx, skill, debuff) {
    const row = createElement('div', 'npc-debuff-row');

    const left = createElement('div', 'npc-debuff-left');
    const right = createElement('div', 'npc-debuff-right');

    const alreadyAdded = Array.isArray(skill.debuffs)
      && skill.debuffs.some(function (item) {
        return item.debuff_id === debuff.debuff_id;
      });

    left.appendChild(createElement('span', null, debuff.debuff_name || '[未命名負作用]'));

    const detail = createElement('a', 'npc-effect-detail', '詳細');
    detail.href = '#';
    detail.addEventListener('click', function (event) {
      event.preventDefault();
      showModal(debuff.debuff_name || '負作用', debuff.description || '');
    });

    left.appendChild(detail);

    let appliedSelect = null;

    if (canApplyDebuffToTarget(skill, debuff)) {
      appliedSelect = document.createElement('select');
      appliedSelect.style.width = '5.5rem';
      appliedSelect.style.margin = '0';

      [
        { value: 'self', label: '自身' },
        { value: 'toally', label: '目標' }
      ].forEach(function (item) {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        appliedSelect.appendChild(option);
      });

      right.appendChild(appliedSelect);
    }

    const addButton = createSmallButton(alreadyAdded ? '已新增' : '新增');
    addButton.classList.add('npc-debuff-add-btn');
    addButton.disabled = alreadyAdded;

    addButton.onclick = function () {
      const chosen = {
        debuff_id: debuff.debuff_id,
        debuff_name: debuff.debuff_name || '',
        debuff_type: debuff.debuff_type || '',
        effect_code: debuff.effect_code || '',
        description: debuff.description || '',
        offset_score: debuff.offset_score || null,
        applied_to: appliedSelect ? appliedSelect.value : 'self'
      };

      if (MUST_SELF_DEBUFF_IDS.includes(debuff.debuff_id)) {
        chosen.applied_to = 'self';
      }

      if (!Array.isArray(formData.skills[idx].debuffs)) {
        formData.skills[idx].debuffs = [];
      }

      formData.skills[idx].debuffs.push(chosen);
      renderSkillsPage(formData.skills);
    };

    right.appendChild(addButton);

    row.appendChild(left);
    row.appendChild(right);

    return row;
  }

  function canApplyDebuffToTarget(skill, debuff) {
    if (!skill) return false;
    if (MUST_SELF_DEBUFF_IDS.includes(debuff.debuff_id)) return false;
    if (skill.target_select_type !== 'people') return false;
    if (Number(skill.max_targets || 0) !== 1) return false;

    const occ = Array.isArray(formData.occupation_type) ? formData.occupation_type.slice().sort() : [];
    const occKey = occ.join(',');

    return occKey === 'buffer'
      || occKey === 'healer'
      || occKey === 'buffer,healer';
  }

  function createCollapsibleSection(sectionKey, title, rightText) {
    const wrapper = createElement('div', 'npc-effect-section');
    const toggle = createElement('div', 'npc-effect-toggle');
    const titleSpan = createElement('span', 'npc-effect-toggle-text');
    const arrow = createElement('span', 'npc-effect-arrow', '▼');
    const text = createElement('span', null, title);
    const right = createElement('span', null, rightText || '');
    const body = createElement('div', 'npc-effect-body');

    titleSpan.appendChild(arrow);
    titleSpan.appendChild(text);
    toggle.appendChild(titleSpan);
    toggle.appendChild(right);

    wrapper.appendChild(toggle);
    wrapper.appendChild(body);

    if (getNpcSectionCollapsed(sectionKey)) {
      wrapper.classList.add('collapsed');
    }

    toggle.onclick = function () {
      npcCollapsedSections[sectionKey] = !getNpcSectionCollapsed(sectionKey);
      wrapper.classList.toggle('collapsed', !!npcCollapsedSections[sectionKey]);
    };

    return {
      wrapper,
      toggle,
      body
    };
  }

  function getSkillFinalCD(skill) {
    if (!skill) return '';
    if (skill.is_passive) return '被動';
    if (skill.cd === null || skill.cd === undefined || skill.cd === '') return '';
    return skill.cd;
  }

  function formatTargetFaction(value) {
    if (value === null) return '敵我不分';
    if (value === '') return '';
    return TARGET_LABELS[value] || value || '';
  }

  function formatTargetSelectType(value) {
    return TARGET_SELECT_TYPE_LABELS[value] || '';
  }

  function formatMaxTargets(skill) {
    if (!skill) return '';

    if (skill.target_select_type === 'global') {
      return '全場';
    }

    if (skill.max_targets === null || skill.max_targets === undefined || skill.max_targets === '') {
      return 'NULL';
    }

    if (skill.target_select_type === 'range') {
      return `${skill.max_targets}區域`;
    }

    return Number(skill.max_targets) === 1 ? '單體' : `${skill.max_targets}人`;
  }

  function formatRange(value) {
    if (value === null || value === undefined || value === '') {
      return '全域攻擊';
    }

    return RANGE_LABELS[value] || value || '';
  }

  function updateSkillPreview() {
    const skills = getSafeSkillArray();
    const s1 = skills[0] || {};
    const s2 = skills[1] || {};

    setCardText('othernpc_skills.1.skill_name', s1.skill_name || '');
    setCardText('othernpc_skills.1.cd', getSkillFinalCD(s1));
    setCardText('othernpc_skills.1.max_targets', formatMaxTargets(s1));
    setCardText('othernpc_skills.1.range', formatRange(s1.range));
    setCardText('othernpc_skills.1.description', buildSkillDescriptionPreview(s1));
    setCardText('othernpc_skills.1.effectsAndDebuffs', buildSkillEffectsPreview(s1));

    setCardText('othernpc_skills.2.skill_name', s2.skill_name || '');
    setCardText('othernpc_skills.2.cd', getSkillFinalCD(s2));
    setCardText('othernpc_skills.2.max_targets', formatMaxTargets(s2));
    setCardText('othernpc_skills.2.range', formatRange(s2.range));
    setCardText('othernpc_skills.2.description', buildSkillDescriptionPreview(s2));
    setCardText('othernpc_skills.2.effectsAndDebuffs', buildSkillEffectsPreview(s2));

    updateExtraSkillDiamond();

    if (typeof window.fitAll === 'function') {
      window.fitAll();
    }

    if (typeof window.checkLongTextByCharCount === 'function') {
      window.checkLongTextByCharCount();
    }
  }

  function setCardText(dataKey, text) {
    document.querySelectorAll(`[data-key="${dataKey}"]`).forEach(function (el) {
      el.textContent = text || '';
    });
  }

  function buildSkillDescriptionPreview(skill) {
    const parts = [];

    if (skill.is_passive && skill.passive_trigger_condition) {
      parts.push(`被動：${skill.passive_trigger_condition}`);
    }

    if (skill.description) {
      parts.push(skill.description);
    }

    return parts.join('\n');
  }

  function buildSkillEffectsPreview(skill) {
    const arr = [];

    if (!skill) return '';

    const targetText = formatTargetFaction(skill.target_faction);
    const typeText = formatTargetSelectType(skill.target_select_type);

    if (targetText || typeText) {
      arr.push(`# ${[targetText, typeText].filter(Boolean).join(' / ')}`);
    }

    if (Array.isArray(skill.npc_effect_ids) && Array.isArray(window.npcSkillEffectsList)) {
      skill.npc_effect_ids.forEach(function (effectId) {
        const effect = window.npcSkillEffectsList.find(function (item) {
          return item.effect_id === effectId || item.npc_effect_id === effectId;
        });

        if (effect) {
          arr.push(`# ${effect.effect_name || 'NPC技能效果'}`);
        }
      });
    }

    if (Array.isArray(skill.effect_ids) && Array.isArray(window.skillEffectsList)) {
      skill.effect_ids.forEach(function (effectId) {
        const effect = window.skillEffectsList.find(function (item) {
          return item.effect_id === effectId;
        });

        if (effect) {
          arr.push(`# ${effect.effect_name || '技能效果'}`);
        }
      });
    }

    if (skill.use_movement && Array.isArray(window.movementSkillsList)) {
      const move = window.movementSkillsList.find(function (item) {
        return item.move_id === skill.move_ids || item.move_id === skill.linked_movement_id;
      });

      if (move) {
        arr.push(`# ${move.move_name || '移動技能'}`);
      }
    }

    if (Array.isArray(skill.debuffs)) {
      skill.debuffs.forEach(function (debuff) {
        const appliedLabel = debuff.applied_to === 'toally' ? '目標' : '自身';
        arr.push(`# ${appliedLabel} ${debuff.debuff_name || '負作用'}`);
      });
    }

    return arr.join('\n');
  }

  function updateExtraSkillDiamond() {
    const diamond = document.querySelector('.skill-diamond');
    if (!diamond) return;

    const extraSkills = getSafeSkillArray().slice(2);

    if (!extraSkills.length) {
      diamond.setAttribute('value', '');
      diamond.style.display = 'none';
      return;
    }

    const popupText = extraSkills.map(function (skill, idx) {
      const title = skill.skill_name || `額外技能${idx + 3}`;
      const cdText = getSkillFinalCD(skill);
      const desc = buildSkillDescriptionPreview(skill);
      const effects = buildSkillEffectsPreview(skill);

      return [
        title,
        cdText ? `CD：${cdText}` : '',
        desc,
        effects
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    diamond.setAttribute('value', popupText);
    diamond.style.display = '';

    diamond.onclick = function () {
      const text = this.getAttribute('value');

      if (text) {
        showModal('額外技能', text);
      }
    };
  }

  function validateNpcSkillsBeforeSubmit() {
    const errors = [];
    const skills = getSafeSkillArray();

    skills.forEach(function (skill, idx) {
      normalizeNpcSkill(idx);

      const skillNumber = idx + 1;
      const name = (skill.skill_name || '').trim();
      const description = (skill.description || '').trim();

      if (!name) {
        errors.push(`請填寫技能${skillNumber}名稱`);
      }

      if (!description) {
        errors.push(`請填寫技能${skillNumber}敘述`);
      }

      if (skill.target_faction === '') {
        errors.push(`請選擇技能${skillNumber}的施放對象`);
      }

      if (!skill.target_select_type) {
        errors.push(`請選擇技能${skillNumber}的施放方式`);
      }

      if (skill.target_select_type !== 'global') {
        const targetAmount = Number(skill.max_targets);

        if (!Number.isFinite(targetAmount) || targetAmount < 1) {
          errors.push(`請填寫技能${skillNumber}的施放範圍或人數`);
        }
      }

      if (!skill.is_passive) {
        if (skill.cd === '' || skill.cd === null || skill.cd === undefined) {
          errors.push(`請填寫技能${skillNumber}的 CD`);
        }
      }

      if (skill.is_passive && skill.use_movement) {
        errors.push(`技能${skillNumber}不可同時為被動技能並啟用移動技能`);
      }

      const hasNpcEffect = Array.isArray(skill.npc_effect_ids) && skill.npc_effect_ids.length > 0;
      const hasSharedEffect = Array.isArray(skill.effect_ids) && skill.effect_ids.length > 0;
      const hasMovement = !!skill.use_movement && !!skill.move_ids;
      const hasDebuff = Array.isArray(skill.debuffs) && skill.debuffs.length > 0;

      if (!hasNpcEffect && !hasSharedEffect && !hasMovement && !hasDebuff) {
        errors.push(`技能${skillNumber}至少需要選擇一個效果、移動技能或負作用`);
      }

      if (skill.target_faction === 'self') {
        skill.target_select_type = 'people';
        skill.max_targets = 1;
        skill.range = 'same_zone';
      }

      if (skill.target_select_type === 'range') {
        skill.range = null;
      }

      if (skill.target_select_type === 'global') {
        skill.max_targets = null;
        skill.range = null;
      }

      if (skill.need_cc === '') {
        skill.need_cc = null;
      }
    });

    return errors;
  }

  function bindSkillPageStaticEvents() {
    const addBtn = document.getElementById('admin-add-skill-btn');

    if (addBtn) {
      addBtn.onclick = function () {
        getSafeSkillArray().push({});
        initAllSkillListsThenRender();
      };
    }

    const backBtn = document.getElementById('back-8');

    if (backBtn) {
      backBtn.onclick = function () {
        if (typeof window.showStep === 'function') {
          window.showStep(7);
        }
      };
    }

    const formStep8 = document.getElementById('form-step-8');

    if (formStep8) {
      formStep8.onsubmit = async function (event) {
        event.preventDefault();

        const errors = validateNpcSkillsBeforeSubmit();

        if (errors.length) {
          alert(errors.join('\n'));
          return;
        }

        updateSkillPreview();

        if (typeof window.submitAllNpcData === 'function') {
          try {
            await window.submitAllNpcData();
          } catch (error) {
            alert('送出失敗：' + (error.message || error));
          }

          return;
        }

        alert('NPC 送出程式尚未載入');
      };
    }
  }

  window.initAllSkillListsThenRender = initAllSkillListsThenRender;
  window.initNpcSkillsPage = initAllSkillListsThenRender;
  window.renderSkillsPage = renderSkillsPage;
  window.updateSkillPreview = updateSkillPreview;
  window.getSkillFinalCD = getSkillFinalCD;
  window.buildSkillEffectsPreview = buildSkillEffectsPreview;

  bindSkillPageStaticEvents();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindSkillPageStaticEvents();

      if (Array.isArray(formData.skills)) {
        initAllSkillListsThenRender();
      }
    });
  } else {
    if (Array.isArray(formData.skills)) {
      initAllSkillListsThenRender();
    }
  }
})();
