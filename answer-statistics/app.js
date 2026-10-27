const tableConfigs = {
  question: {
    headers: ['序号','问卷编号','问卷名称','答题数量（n题）','平均答题时长（μ题）','答题标准差（σ题）','有效答题时长','完成答卷数量（n卷）','平均答卷时长（μ卷）','答卷标准差（σ卷）','有效答卷时长'],
    thresholdColumns: [5, 9],
    rows: [
      ['tcs-001','某某问卷','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['tcs-002','某某问卷','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51'],
      ['tcs-003','售后服务问卷','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['tcs-004','新车体验问卷','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51'],
      ['tcs-005','智能座舱问卷','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['tcs-006','门店接待问卷','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51']
    ]
  },
  vehicle: {
    headers: ['序号','车系代码','车系名称','问卷类型','关联问卷','答题数量（n题）','平均答题时长（μ题）','答题标准差（σ题）','有效答题时长','完成答卷数量（n卷）','平均答卷时长（μ卷）','答卷标准差（σ卷）','有效答卷时长'],
    linkColumn: 3,
    thresholdColumns: [7, 11],
    rows: [
      ['NX8','某某车系','NPS','18','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['N7','某某车系','CCS','15','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51'],
      ['N6','某某车系','ADAS','32','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['天籁','某某车系','其他','44','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51'],
      ['轩逸','某某车系','NPS','123','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['逍客','某某车系','CCS','22','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51']
    ]
  },
  type: {
    headers: ['序号','问卷类型','关联问卷','答题数量（n题）','平均答题时长（μ题）','答题标准差（σ题）','有效答题时长','完成答卷数量（n卷）','平均答卷时长（μ卷）','答卷标准差（σ卷）','有效答卷时长'],
    linkColumn: 1,
    thresholdColumns: [5, 9],
    rows: [
      ['NPS','12332','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['CCS','12332','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51'],
      ['ADAS','12332','3029000','10.01','5.52','≤ 8.51','30290','99.15','13.40','≥ 98.51'],
      ['其他','84','120','20.03','3.22','≤ 8.51','12','96.17','13.64','≥ 98.51']
    ]
  }
};

const rows = document.querySelector('#dataRows');
const head = document.querySelector('#dataHead');
const table = document.querySelector('#dimensionTable');
const search = document.querySelector('#tableSearch');
let currentTab = 'question';

function renderRows(filter = '') {
  const config = tableConfigs[currentTab];
  const list = config.rows.filter(item => item.join('').toLowerCase().includes(filter.toLowerCase()));
  head.innerHTML = `<tr>${config.headers.map(label => `<th>${label}</th>`).join('')}</tr>`;
  table.className = `${currentTab}-table`;
  rows.innerHTML = list.map((item, index) => `<tr>
    <td><span class="row-number">${index + 1}</span></td>
    ${item.map((value, cellIndex) => {
      const classes = [config.linkColumn === cellIndex ? 'linked-value' : '', config.thresholdColumns.includes(cellIndex) ? 'duration-rule' : ''].filter(Boolean).join(' ');
      return `<td class="${classes}">${value}</td>`;
    }).join('')}
  </tr>`).join('');
  document.querySelector('#resultCount').textContent = `共搜索到 922 条数据${filter ? ` · 当前 ${list.length} 条` : ''}`;
}

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelector('.tab.active').classList.remove('active');
  tab.classList.add('active'); currentTab = tab.dataset.tab; search.value = ''; renderRows();
}));
search.addEventListener('input', e => renderRows(e.target.value));
renderRows();

const drawer = document.querySelector('#docDrawer');
const backdrop = document.querySelector('#drawerBackdrop');
const docTabButtons = [...document.querySelectorAll('[data-doc-tab]')];
const docPanels = [...document.querySelectorAll('[data-doc-panel]')];

function activateDocTab(tab) {
  docTabButtons.forEach(button => {
    const active = button.dataset.docTab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  docPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.docPanel === tab));
}

function openDrawer(section = 'page-overview', tab = section.startsWith('page-') ? 'page' : 'rules') {
  activateDocTab(tab);
  const targetPanel = document.querySelector(`[data-doc-panel="${tab}"]`);
  targetPanel.querySelectorAll('.drawer-nav button').forEach(button => button.classList.toggle('active', button.dataset.section === section));
  drawer.classList.add('open'); backdrop.classList.add('open'); drawer.setAttribute('aria-hidden','false');
  setTimeout(() => document.querySelector(`#${section}`).scrollIntoView({behavior:'smooth', block:'start'}), 180);
  document.body.style.overflow = 'hidden';
}
function closeDrawer() { drawer.classList.remove('open'); backdrop.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }

document.querySelector('#docButton').addEventListener('click', () => openDrawer('page-overview', 'page'));
document.querySelector('#ruleButton').addEventListener('click', () => openDrawer('rule', 'rules'));
document.querySelector('#closeDrawer').addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeDrawer(); });

docTabButtons.forEach(button => button.addEventListener('click', () => activateDocTab(button.dataset.docTab)));
document.querySelectorAll('.drawer-nav button').forEach(button => button.addEventListener('click', () => {
  const nav = button.closest('.drawer-nav');
  nav.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
  document.querySelector(`#${button.dataset.section}`).scrollIntoView({behavior:'smooth', block:'start'});
}));

const toast = document.querySelector('#toast');
let toastTimer;
function showToast(title, detail) {
  toast.querySelector('strong').textContent = title; toast.querySelector('small').textContent = detail;
  toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

const settingBackdrop = document.querySelector('#settingBackdrop');
const settingModals = document.querySelectorAll('.setting-modal');
const questionPercentileInput = document.querySelector('#questionPercentileInput');
const answerPercentileInput = document.querySelector('#answerPercentileInput');
const questionPercentileSummary = document.querySelector('#questionPercentileSummary');
const answerPercentileSummary = document.querySelector('#answerPercentileSummary');

function normalizePercentile(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number.toFixed(2) : null;
}

function openSettingModal(id) {
  const modal = document.querySelector(`#${id}`);
  settingModals.forEach(item => { item.classList.remove('open'); item.setAttribute('aria-hidden', 'true'); });
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  settingBackdrop.classList.add('open'); document.body.style.overflow = 'hidden';
  setTimeout(() => modal.querySelector('input').focus(), 160);
}

function closeSettingModal() {
  settingModals.forEach(item => { item.classList.remove('open'); item.setAttribute('aria-hidden', 'true'); });
  settingBackdrop.classList.remove('open'); document.body.style.overflow = '';
}

function loadPercentileSettings() {
  const questionValue = normalizePercentile(localStorage.getItem('tcs-question-percentile') || '95');
  const answerValue = normalizePercentile(localStorage.getItem('tcs-answer-percentile') || '5');
  questionPercentileInput.value = questionValue; answerPercentileInput.value = answerValue;
  questionPercentileSummary.textContent = `当前 P ≤ ${questionValue}%`;
  answerPercentileSummary.textContent = `当前 P ≥ ${answerValue}%`;
}

function savePercentile(type) {
  const isQuestion = type === 'question';
  const input = isQuestion ? questionPercentileInput : answerPercentileInput;
  const value = normalizePercentile(input.value);
  if (value === null) {
    input.classList.add('invalid'); input.focus();
    showToast('无法保存', '请输入 0 到 100 之间的分位值');
    return;
  }
  input.classList.remove('invalid'); input.value = value;
  localStorage.setItem(isQuestion ? 'tcs-question-percentile' : 'tcs-answer-percentile', value);
  (isQuestion ? questionPercentileSummary : answerPercentileSummary).textContent = `当前 P ${isQuestion ? '≤' : '≥'} ${value}%`;
  closeSettingModal();
  showToast(`${isQuestion ? '答题' : '答卷'}有效分位已保存`, `规则已更新为 P ${isQuestion ? '≤' : '≥'} ${value}%`);
}

document.querySelector('#questionPercentileButton').addEventListener('click', () => openSettingModal('questionPercentileModal'));
document.querySelector('#answerPercentileButton').addEventListener('click', () => openSettingModal('answerPercentileModal'));
document.querySelector('#saveQuestionPercentile').addEventListener('click', () => savePercentile('question'));
document.querySelector('#saveAnswerPercentile').addEventListener('click', () => savePercentile('answer'));
document.querySelectorAll('[data-setting-close]').forEach(button => button.addEventListener('click', closeSettingModal));
settingBackdrop.addEventListener('click', closeSettingModal);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSettingModal(); });
loadPercentileSettings();

document.querySelector('#exportButton').addEventListener('click', () => showToast('报表已导出', '已生成「答题统计_20261021.xlsx」'));
document.querySelector('#queryButton').addEventListener('click', () => showToast('查询完成', '已加载最新统计数据'));
document.querySelector('#resetButton').addEventListener('click', () => { document.querySelectorAll('.filter-card select').forEach(s => s.selectedIndex = 0); showToast('筛选条件已重置','当前展示全部数据'); });
