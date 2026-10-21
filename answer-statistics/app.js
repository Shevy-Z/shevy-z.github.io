const dataSets = {
  question: [
    ['NPS 品牌推荐度','东风日产满意度调研','32,920','10.01 分钟','6.12 分钟','1.8m — 18.6m','128','0.39%','待审核'],
    ['售后服务体验','东风日产满意度调研','28,450','7.32 分钟','5.80 分钟','1.6m — 16.2m','96','0.34%','待审核'],
    ['新车购买体验','东风日产满意度调研','24,870','12.14 分钟','8.24 分钟','2.2m — 22.4m','312','1.25%','待审核'],
    ['智能座舱评价','新能源购车意向研究','19,640','8.47 分钟','6.91 分钟','1.9m — 17.8m','87','0.44%','待审核'],
    ['动力与操控感受','东风日产满意度调研','18,920','9.02 分钟','7.15 分钟','2.0m — 19.1m','74','0.39%','待审核'],
    ['门店接待评价','东风日产满意度调研','16,380','5.44 分钟','4.86 分钟','1.2m — 12.8m','52','0.32%','待审核']
  ],
  vehicle: [
    ['N7','新能源购车意向研究','29,420','9.31 分钟','7.02 分钟','2.0m — 19.8m','164','0.56%','待审核'],
    ['天籁','东风日产满意度调研','26,140','8.24 分钟','6.74 分钟','1.8m — 17.3m','82','0.31%','待审核'],
    ['轩逸','东风日产满意度调研','24,820','7.48 分钟','5.97 分钟','1.6m — 16.5m','71','0.29%','待审核'],
    ['逍客','东风日产满意度调研','21,360','8.92 分钟','7.22 分钟','1.9m — 18.7m','95','0.44%','待审核'],
    ['奇骏','东风日产满意度调研','18,580','10.08 分钟','7.96 分钟','2.1m — 21.5m','118','0.64%','待审核']
  ],
  type: [
    ['NPS','东风日产满意度调研','54,820','6.21 分钟','5.18 分钟','1.3m — 14.2m','152','0.28%','待审核'],
    ['CCS','东风日产满意度调研','42,360','9.47 分钟','7.31 分钟','1.9m — 19.9m','205','0.48%','待审核'],
    ['ADAS','新能源购车意向研究','38,940','12.62 分钟','8.82 分钟','2.4m — 24.6m','327','0.84%','待审核'],
    ['其他','多项目汇总','53,880','7.96 分钟','6.23 分钟','1.6m — 17.1m','106','0.20%','待审核']
  ]
};

const rows = document.querySelector('#dataRows');
const search = document.querySelector('#tableSearch');
let currentTab = 'question';

function renderRows(filter = '') {
  const list = dataSets[currentTab].filter(item => item.join('').toLowerCase().includes(filter.toLowerCase()));
  rows.innerHTML = list.map((item, index) => {
    const abnormal = parseFloat(item[7]) >= .8;
    return `<tr>
      <td><span class="name-cell"><i class="name-badge">${String(index + 1).padStart(2,'0')}</i>${item[0]}</span></td>
      <td>${item[1]}</td><td>${item[2]}</td><td>${item[3]}</td><td>${item[4]}</td>
      <td><span class="threshold-chip">${item[5]}</span></td><td>${item[6]}</td>
      <td class="${abnormal ? 'rate-high' : 'rate-normal'}">${item[7]}</td>
      <td><button class="review-button" data-name="${item[0]}">${item[8]}</button></td><td><button class="more-button">•••</button></td>
    </tr>`;
  }).join('');
  document.querySelector('#resultCount').textContent = `共 ${currentTab === 'question' ? 24 : currentTab === 'vehicle' ? 18 : 6} 条数据`;
  document.querySelectorAll('.review-button').forEach(button => button.addEventListener('click', () => showToast(`已打开「${button.dataset.name}」审核队列`, '异常时长已按 P05 / P95 标记')));
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
