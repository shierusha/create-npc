const SPECIAL_NOTIFY_PLAYER_IDS = ['9eee80cf-baf2-4297-b163-59699bad4ed4'];
const LEAF_NOTIFY_PLAYER_IDS = ['8aea3076-294c-41f6-bb38-0a99da77c098'];
const NPC_MANAGE_PAGE_URL = 'https://shierusha.github.io/login/npc_manage';

const NPC_SUBMIT_COOLDOWN = 60 * 1000;
const NPC_CREATE_PAGE_URL = 'https://shierusha.github.io/create-npc/index';
const DEFAULT_NPC_NAMEBOX_COLOR_FOR_SUBMIT = '#3da2ad';
const DEFAULT_NPC_BACKGROUND_URL_FOR_SUBMIT = 'https://shierusha.github.io/school-battle/teachers/img/1.webp';
const NULL_SELECT_VALUE_FOR_SUBMIT = '__NPC_NULL__';

let npcLastSubmitTime = 0;

function getNpcSubmitClient() {
  return window.client || (typeof client !== 'undefined' ? client : null);
}

function getNpcSubmitFormData() {
  return window.formData || (typeof formData !== 'undefined' ? formData : null);
}

function normalizeNpcSubmitText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeNpcSubmitNullableText(value) {
  const text = normalizeNpcSubmitText(value);
  return text ? text : null;
}

function normalizeNpcSubmitInteger(value, fallbackValue) {
  if (value === null || value === undefined || value === '') {
    return fallbackValue;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return fallbackValue;
  }

  return number;
}

function normalizeNpcSubmitHexColor(value) {
  if (typeof value !== 'string') {
    return DEFAULT_NPC_NAMEBOX_COLOR_FOR_SUBMIT;
  }

  const color = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color.toLowerCase();
  }

  return DEFAULT_NPC_NAMEBOX_COLOR_FOR_SUBMIT;
}

function normalizeNpcSubmitArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(item => item !== null && item !== undefined && item !== '');
}

function normalizeNpcSubmitNullableSelect(value) {
  if (value === NULL_SELECT_VALUE_FOR_SUBMIT) return null;
  if (value === undefined || value === '') return null;
  return value;
}

function normalizeNpcSubmitSkillRange(skill) {
  if (!skill) return null;

  if (skill.target_select_type === 'global') {
    return null;
  }

  return normalizeNpcSubmitNullableSelect(skill.range);
}

function normalizeNpcSubmitMaxTargets(skill) {
  if (!skill) return null;

  if (skill.target_select_type === 'global') {
    return null;
  }

  if (skill.target_faction === 'self') {
    return 1;
  }

  if (skill.target_select_type === 'range' && skill.range === 'same_zone') {
    return 1;
  }

  const number = Number(skill.max_targets);

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
}

function normalizeNpcSubmitCd(skill) {
  if (!skill || skill.is_passive) return null;

  if (skill.cd === null || skill.cd === undefined || skill.cd === '') {
    return null;
  }

  const number = Number(skill.cd);

  if (!Number.isInteger(number) || number < 0) {
    return null;
  }

  return number;
}

function normalizeNpcSubmitNeedCc(skill) {
  if (!skill) return null;

  if (skill.need_cc === null || skill.need_cc === undefined || skill.need_cc === '') {
    return null;
  }

  const number = Number(skill.need_cc);

  if (!Number.isInteger(number) || number < 0) {
    return null;
  }

  return number;
}

function normalizeNpcSubmitLinkedMovementId(skill) {
  if (!skill || skill.is_passive) return null;

  const moveId = skill.move_ids || skill.linked_movement_id || '';

  if (!skill.use_movement || !moveId) {
    return null;
  }

  return moveId;
}

function getNpcCurrentLoginPlayerId() {
  return window.currentPlayerId || localStorage.getItem('player_id') || '';
}

function isNpcSpecialNotifyPlayer(playerId) {
  return SPECIAL_NOTIFY_PLAYER_IDS.includes(playerId);
}

function isNpcLeafNotifyPlayer(playerId) {
  return LEAF_NOTIFY_PLAYER_IDS.includes(playerId);
}

async function checkNpcNameDuplicate(name, othernpcId) {
  const db = getNpcSubmitClient();

  if (!db) {
    return {
      duplicate: false,
      error: new Error('Supabase 尚未初始化')
    };
  }

  let query = db
    .from('other_npcs')
    .select('othernpc_id')
    .eq('name', name);

  if (othernpcId) {
    query = query.neq('othernpc_id', othernpcId);
  }

  const { data, error } = await query;

  return {
    duplicate: Array.isArray(data) && data.length > 0,
    error
  };
}

function cleanNpcSubmitNotes(data) {
  const notes = Array.isArray(data.notes) ? data.notes : [];

  return notes
    .map((note, index) => ({
      content: normalizeNpcSubmitText(note && note.content),
      is_public: !!(note && note.is_public),
      sort_order: index + 1
    }))
    .filter(note => note.content);
}

function cleanNpcSubmitSkills(data) {
  const skills = Array.isArray(data.skills) ? data.skills : [];

  return skills
    .map((skill, index) => ({
      source: skill || {},
      slot: index + 1
    }))
    .filter(item => {
      const skill = item.source;
      return !!(
        normalizeNpcSubmitText(skill.skill_name) ||
        normalizeNpcSubmitText(skill.description) ||
        (Array.isArray(skill.effect_ids) && skill.effect_ids.length) ||
        (Array.isArray(skill.npc_effect_ids) && skill.npc_effect_ids.length) ||
        (Array.isArray(skill.debuffs) && skill.debuffs.length) ||
        skill.use_movement
      );
    });
}

function validateNpcSubmitData(data) {
  const errors = [];

  if (!data) {
    errors.push('表單資料遺失，請重新整理頁面');
    return errors;
  }

  if (!normalizeNpcSubmitText(data.name)) {
    errors.push('請填寫 NPC 名稱');
  }

  if (!Array.isArray(data.skills)) {
    errors.push('技能資料格式錯誤，請重新整理頁面');
    return errors;
  }

  const skills = cleanNpcSubmitSkills(data);

  if (skills.length === 0) {
    errors.push('至少需要填寫一個技能');
  }

  skills.forEach(item => {
    const skill = item.source;
    const skillNumber = item.slot;
    const skillName = normalizeNpcSubmitText(skill.skill_name);
    const description = normalizeNpcSubmitText(skill.description);
    const targetFaction = skill.target_faction;
    const targetSelectType = skill.target_select_type || 'people';
    const maxTargets = normalizeNpcSubmitMaxTargets(skill);
    const cd = normalizeNpcSubmitCd(skill);
    const hasNpcEffect = Array.isArray(skill.npc_effect_ids) && skill.npc_effect_ids.length > 0;
    const hasSharedEffect = Array.isArray(skill.effect_ids) && skill.effect_ids.length > 0;
    const hasDebuff = Array.isArray(skill.debuffs) && skill.debuffs.length > 0;
    const hasMovement = !!normalizeNpcSubmitLinkedMovementId(skill);

    if (!skillName) {
      errors.push(`請填寫技能${skillNumber}名稱`);
    }

    if (!description) {
      errors.push(`請填寫技能${skillNumber}敘述`);
    }

    if (!targetSelectType) {
      errors.push(`請選擇技能${skillNumber}施放方式`);
    }

    if (targetFaction === '' || targetFaction === undefined) {
      errors.push(`請選擇技能${skillNumber}施放對象`);
    }

    if (targetSelectType !== 'global' && maxTargets === null) {
      errors.push(`請填寫技能${skillNumber}施放範圍或對象人數`);
    }

    if (targetSelectType === 'range' && normalizeNpcSubmitSkillRange(skill) === null) {
      errors.push(`請選擇技能${skillNumber}有效距離`);
    }

    if (!skill.is_passive && cd === null) {
      errors.push(`請填寫技能${skillNumber} CD`);
    }

    if (skill.is_passive && normalizeNpcSubmitLinkedMovementId(skill)) {
      errors.push(`技能${skillNumber}不可同時為被動技能並啟用移動技能`);
    }

    if (!hasNpcEffect && !hasSharedEffect && !hasDebuff && !hasMovement) {
      errors.push(`技能${skillNumber}至少需要選擇一個效果、移動技能或負作用`);
    }
  });

  return errors;
}

function buildOtherNpcUpsertRow(data, loginPlayerId) {
  const othernpcId = normalizeNpcSubmitText(data.othernpc_id);
  const preservedPlayerId = normalizeNpcSubmitText(data.player_id);

  const row = {
    player_id: preservedPlayerId || loginPlayerId,
    name: normalizeNpcSubmitText(data.name),
    nickname: normalizeNpcSubmitNullableText(data.nickname),
    npc_category: normalizeNpcSubmitNullableText(data.npc_category),
    background_image_url: normalizeNpcSubmitText(data.background_image_url) || DEFAULT_NPC_BACKGROUND_URL_FOR_SUBMIT,
    namebox_color: normalizeNpcSubmitHexColor(data.namebox_color),
    alignment: normalizeNpcSubmitNullableSelect(data.alignment),
    gender: normalizeNpcSubmitNullableText(data.gender),
    age: normalizeNpcSubmitNullableText(data.age),
    height: normalizeNpcSubmitNullableText(data.height),
    weight: normalizeNpcSubmitNullableText(data.weight),
    race: normalizeNpcSubmitNullableText(data.race),
    personality: normalizeNpcSubmitNullableText(data.personality),
    likes: normalizeNpcSubmitNullableText(data.likes),
    hate: normalizeNpcSubmitNullableText(data.hate),
    background: normalizeNpcSubmitNullableText(data.background),
    attack_cc: normalizeNpcSubmitInteger(data.attack_cc, 0),
    dodge_cc: normalizeNpcSubmitInteger(data.dodge_cc, 0),
    cover_cc: normalizeNpcSubmitInteger(data.cover_cc, 0),
    take_cc: normalizeNpcSubmitInteger(data.take_cc, 0),
    element: normalizeNpcSubmitArray(data.element),
    weakness_id: normalizeNpcSubmitNullableText(data.weakness_id),
    preferred_role: normalizeNpcSubmitNullableSelect(data.preferred_role),
    starting_position: normalizeNpcSubmitNullableSelect(data.starting_position),
    occupation_type: normalizeNpcSubmitArray(data.occupation_type)
  };

  if (othernpcId) {
    row.othernpc_id = othernpcId;
  }

  return row;
}

async function deleteOldNpcSkillRows(othernpcId) {
  const db = getNpcSubmitClient();

  const { data: oldSkills, error: oldSkillError } = await db
    .from('othernpc_skills')
    .select('id,othernpc_trigger_id')
    .eq('othernpc_id', othernpcId);

  if (oldSkillError) {
    throw new Error('讀取舊技能失敗：' + oldSkillError.message);
  }

  if (!oldSkills || oldSkills.length === 0) {
    return;
  }

  const oldSkillIds = oldSkills.map(skill => skill.id).filter(Boolean);
  const oldTriggerIds = oldSkills.map(skill => skill.othernpc_trigger_id).filter(Boolean);

  if (oldSkillIds.length > 0) {
    const sharedDelete = await db
      .from('othernpc_skill_effect_links')
      .delete()
      .in('skill_id', oldSkillIds);

    if (sharedDelete.error) {
      throw new Error('刪除舊共用技能效果連結失敗：' + sharedDelete.error.message);
    }

    const npcEffectDelete = await db
      .from('othernpc_skill_npc_effect_links')
      .delete()
      .in('skill_id', oldSkillIds);

    if (npcEffectDelete.error) {
      throw new Error('刪除舊 NPC 技能效果連結失敗：' + npcEffectDelete.error.message);
    }

    const debuffDelete = await db
      .from('othernpc_skill_debuff_links')
      .delete()
      .in('skill_id', oldSkillIds);

    if (debuffDelete.error) {
      throw new Error('刪除舊負作用連結失敗：' + debuffDelete.error.message);
    }
  }

  const skillDelete = await db
    .from('othernpc_skills')
    .delete()
    .eq('othernpc_id', othernpcId);

  if (skillDelete.error) {
    throw new Error('刪除舊技能失敗：' + skillDelete.error.message);
  }

  if (oldTriggerIds.length > 0) {
    const triggerDelete = await db
      .from('othernpc_passive_trigger')
      .delete()
      .in('othernpc_trigger_id', oldTriggerIds);

    if (triggerDelete.error) {
      throw new Error('刪除舊被動觸發條件失敗：' + triggerDelete.error.message);
    }
  }
}

async function saveNpcNotes(othernpcId, notes) {
  const db = getNpcSubmitClient();

  const deleteResult = await db
    .from('othernpc_notes')
    .delete()
    .eq('othernpc_id', othernpcId);

  if (deleteResult.error) {
    throw new Error('刪除舊 NPC 設定失敗：' + deleteResult.error.message);
  }

  if (!notes.length) {
    return;
  }

  const rows = notes.map(note => ({
    othernpc_id: othernpcId,
    content: note.content,
    is_public: !!note.is_public,
    sort_order: note.sort_order
  }));

  const { error } = await db
    .from('othernpc_notes')
    .insert(rows);

  if (error) {
    throw new Error('NPC 設定寫入失敗：' + error.message);
  }
}

async function createNpcPassiveTrigger(othernpcId, skill) {
  const db = getNpcSubmitClient();
  const condition = normalizeNpcSubmitText(skill.passive_trigger_condition);
  const triggerCode = normalizeNpcSubmitText(skill.passive_trigger_code);
  const remarks = normalizeNpcSubmitText(skill.passive_trigger_remarks);

  if (!skill.is_passive) {
    return null;
  }

  if (!condition && !triggerCode && !remarks) {
    return null;
  }

  const { data, error } = await db
    .from('othernpc_passive_trigger')
    .insert([{
      asso_npc: othernpcId,
      trigger_code: triggerCode || null,
      remarks: remarks || null,
      condition: condition || null
    }])
    .select('othernpc_trigger_id')
    .single();

  if (error || !data) {
    throw new Error('被動觸發條件寫入失敗：' + (error ? error.message : '無回傳資料'));
  }

  return data.othernpc_trigger_id;
}

async function saveNpcSkill(othernpcId, skill, skillSlot) {
  const db = getNpcSubmitClient();
  const targetSelectType = skill.target_select_type || 'people';
  const targetFaction = normalizeNpcSubmitNullableSelect(skill.target_faction);
  const maxTargets = normalizeNpcSubmitMaxTargets(skill);
  const range = normalizeNpcSubmitSkillRange(skill);
  const cd = normalizeNpcSubmitCd(skill);
  const needCc = normalizeNpcSubmitNeedCc(skill);
  const linkedMovementId = normalizeNpcSubmitLinkedMovementId(skill);
  const triggerId = await createNpcPassiveTrigger(othernpcId, skill);

  const skillRow = {
    othernpc_id: othernpcId,
    skill_slot: skillSlot,
    skill_name: normalizeNpcSubmitText(skill.skill_name),
    description: normalizeNpcSubmitText(skill.description),
    cd,
    is_passive: !!skill.is_passive,
    passive_trigger_limit: skill.is_passive ? (skill.passive_trigger_limit || null) : null,
    linked_movement_id: linkedMovementId,
    target_select_type: targetSelectType,
    max_targets: maxTargets,
    target_faction: targetFaction,
    range,
    need_cc: needCc,
    othernpc_trigger_id: triggerId
  };

  const { data, error } = await db
    .from('othernpc_skills')
    .insert([skillRow])
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`技能${skillSlot}寫入失敗：` + (error ? error.message : '無回傳資料'));
  }

  return data.id;
}

async function saveNpcSkillEffectLinks(skillId, skill) {
  const db = getNpcSubmitClient();

  const sharedEffectIds = Array.isArray(skill.effect_ids)
    ? skill.effect_ids.filter(Boolean)
    : [];

  if (sharedEffectIds.length > 0) {
    const rows = sharedEffectIds.map(effectId => ({
      skill_id: skillId,
      effect_id: effectId
    }));

    const { error } = await db
      .from('othernpc_skill_effect_links')
      .insert(rows);

    if (error) {
      throw new Error('共用技能效果連結寫入失敗：' + error.message);
    }
  }

  const npcEffectIds = Array.isArray(skill.npc_effect_ids)
    ? skill.npc_effect_ids.filter(Boolean)
    : [];

  if (npcEffectIds.length > 0) {
    const rows = npcEffectIds.map(npcEffectId => ({
      skill_id: skillId,
      npc_effect_id: npcEffectId
    }));

    const { error } = await db
      .from('othernpc_skill_npc_effect_links')
      .insert(rows);

    if (error) {
      throw new Error('NPC 技能效果連結寫入失敗：' + error.message);
    }
  }

  const debuffs = Array.isArray(skill.debuffs)
    ? skill.debuffs.filter(debuff => debuff && debuff.debuff_id)
    : [];

  if (debuffs.length > 0) {
    const rows = debuffs.map(debuff => ({
      skill_id: skillId,
      debuff_id: debuff.debuff_id,
      applied_to: debuff.applied_to || 'self'
    }));

    const { error } = await db
      .from('othernpc_skill_debuff_links')
      .insert(rows);

    if (error) {
      throw new Error('負作用連結寫入失敗：' + error.message);
    }
  }
}

async function saveNpcSkills(othernpcId, data) {
  const skills = cleanNpcSubmitSkills(data);

  for (const item of skills) {
    const skill = item.source;
    const skillId = await saveNpcSkill(othernpcId, skill, item.slot);
    skill._skill_id = skillId;
    skill.id = skillId;
    skill.skill_id = skillId;

    await saveNpcSkillEffectLinks(skillId, skill);
  }
}

async function submitAllNpcData() {
  const now = Date.now();

  if (now - npcLastSubmitTime < NPC_SUBMIT_COOLDOWN) {
    return;
  }

  npcLastSubmitTime = now;

  const db = getNpcSubmitClient();
  const data = getNpcSubmitFormData();
  const loginPlayerId = getNpcCurrentLoginPlayerId();
  const isSpecialNotify = isNpcSpecialNotifyPlayer(loginPlayerId);

  if (!db) {
    alert('Supabase 尚未初始化，請重新整理頁面');
    npcLastSubmitTime = 0;
    return;
  }

  if (!loginPlayerId) {
    alert('請先登入！');
    npcLastSubmitTime = 0;
    return;
  }

  if (window.userRole !== 'admin') {
    window.location.href = 'https://shierusha.github.io/login/login';
    npcLastSubmitTime = 0;
    return;
  }

  const validationErrors = validateNpcSubmitData(data);

  if (validationErrors.length > 0) {
    alert(validationErrors.join('\n'));
    npcLastSubmitTime = 0;
    return;
  }

  const othernpcIdBeforeSubmit = normalizeNpcSubmitText(data.othernpc_id);
  const duplicateResult = await checkNpcNameDuplicate(normalizeNpcSubmitText(data.name), othernpcIdBeforeSubmit);

  if (duplicateResult.error) {
    alert('檢查 NPC 名稱失敗：' + duplicateResult.error.message);
    npcLastSubmitTime = 0;
    return;
  }

  if (duplicateResult.duplicate) {
    alert('NPC 名稱已存在，請換一個名稱');
    npcLastSubmitTime = 0;
    return;
  }

  try {
    const npcRow = buildOtherNpcUpsertRow(data, loginPlayerId);

    const { data: npcData, error: npcError } = await db
      .from('other_npcs')
      .upsert([npcRow], { onConflict: 'othernpc_id' })
      .select('othernpc_id,player_id')
      .single();

    if (npcError || !npcData) {
      throw new Error('NPC 主資料寫入失敗：' + (npcError ? npcError.message : '無回傳資料'));
    }

    const othernpcId = npcData.othernpc_id;

    data.othernpc_id = othernpcId;
    data.player_id = npcData.player_id || data.player_id || loginPlayerId;
    data.background_image_url = npcRow.background_image_url;
    data.namebox_color = npcRow.namebox_color;

    const notes = cleanNpcSubmitNotes(data);

    await saveNpcNotes(othernpcId, notes);
    await deleteOldNpcSkillRows(othernpcId);
    await saveNpcSkills(othernpcId, data);


const isLeafNotify = isNpcLeafNotifyPlayer(loginPlayerId);

if (isLeafNotify) {
  alert('葉子葉子花');
  window.location.href = NPC_MANAGE_PAGE_URL;
  return;
}

alert(
  isSpecialNotify
        ? '班班長的工具寵尋著班班長的味道來了_ 喵嗚!'
        : '請自行將資料拿去審查團報備'
);

window.location.href = `${NPC_CREATE_PAGE_URL}?othernpc_id=${encodeURIComponent(othernpcId)}`;


    
  } catch (error) {
    console.error('NPC 送出失敗', error);
    alert('送出失敗：' + (error && error.message ? error.message : error));
    npcLastSubmitTime = 0;
  }
}

window.submitAllNpcData = submitAllNpcData;
window.checkNpcNameDuplicate = checkNpcNameDuplicate;
