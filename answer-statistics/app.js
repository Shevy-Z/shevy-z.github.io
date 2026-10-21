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
function openDrawer(section = 'overview') {
  drawer.classList.add('open'); backdrop.classList.add('open'); drawer.setAttribute('aria-hidden','false');
  setTimeout(() => document.querySelector(`#${section}`).scrollIntoView({behavior:'smooth', block:'start'}), 180);
  document.body.style.overflow = 'hidden';
}
function closeDrawer() { drawer.classList.remove('open'); backdrop.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
document.querySelector('#docButton').addEventListener('click', () => openDrawer('overview'));
document.querySelector('#ruleButton').addEventListener('click', () => openDrawer('rule'));
document.querySelector('#detailRuleButton').addEventListener('click', () => openDrawer('rule'));
document.querySelector('#closeDrawer').addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeDrawer(); });
document.querySelectorAll('.drawer-nav button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.drawer-nav button.active').classList.remove('active'); button.classList.add('active');
  document.querySelector(`#${button.dataset.section}`).scrollIntoView({behavior:'smooth', block:'start'});
}));

const toast = document.querySelector('#toast');
let toastTimer;
function showToast(title, detail) {
  toast.querySelector('strong').textContent = title; toast.querySelector('small').textContent = detail;
  toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
document.querySelector('#exportButton').addEventListener('click', () => showToast('报表已导出', '已生成「答题统计_20261021.xlsx」'));
document.querySelector('#queryButton').addEventListener('click', () => showToast('查询完成', '已加载最新统计数据'));
document.querySelector('#resetButton').addEventListener('click', () => { document.querySelectorAll('.filter-card select').forEach(s => s.selectedIndex = 0); showToast('筛选条件已重置','当前展示全部数据'); });
