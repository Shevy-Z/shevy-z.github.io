const records = [
  ['2026-11-SYHD','ON8F2K91A6','QSC-40-110284','2026-10-21 14:32:18','2026-10-21 14:33:02','2026-10-21 15:08:46','已核销','used'],
  ['2026-11-SYHD','ON3M7P42B1','QSC-40-110283','2026-10-21 14:28:55','2026-10-21 14:30:11','—','已领取','claimed'],
  ['2026-11-SYHD','ON6D1X09C8','QSC-40-110282','2026-10-21 14:21:06','2026-10-21 14:22:40','2026-10-21 14:58:12','已核销','used'],
  ['2026-11-SYHD','ON4R8V73E2','QSC-40-110281','2026-10-21 14:16:44','2026-10-21 14:18:03','—','已领取','claimed'],
  ['2026-11-SYHD','ON9T5H21F7','QSC-40-110280','2026-10-21 14:09:27','—','—','待领取','pending'],
  ['2026-11-SYHD','ON2B6N84G3','QSC-40-110279','2026-10-21 13:57:10','2026-10-21 13:58:22','2026-10-21 14:42:35','已核销','used'],
  ['2026-11-SYHD','ON7C3J16H9','QSC-40-110278','2026-10-21 13:48:32','2026-10-21 13:49:17','—','已领取','claimed'],
  ['2026-11-SYHD','ON1L9W52K4','QSC-40-110277','2026-10-21 13:36:05','2026-10-21 13:38:49','—','已领取','claimed']
];

const els = id => document.getElementById(id);
const pages = {campaign: els('campaignPage'), records: els('recordsPage'), interaction: els('interactionPage')};
const titles = {campaign:['11/12 双月活动页','11/12 双月活动页'],records:['双月活动记录表','双月活动记录表'],interaction:['页面交互说明','页面交互说明']};
const sections = {campaign:'活动前端页面',records:'表单管理',interaction:'活动前端页面'};

function showPage(name){
  Object.values(pages).forEach(p => p.classList.remove('active-page'));
  pages[name].classList.add('active-page');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === name || (name === 'interaction' && n.dataset.page === 'campaign')));
  els('breadcrumbTitle').textContent = titles[name][0];
  els('breadcrumbSection').textContent = sections[name];
  els('pageTitle').textContent = titles[name][1];
  els('topActions').style.display = name === 'records' ? 'none' : 'flex';
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click',()=>showPage(item.dataset.page)));
document.querySelectorAll('.nav-subgroup-header').forEach(header => header.addEventListener('click',()=>{
  const group=header.closest('.nav-subgroup');
  if(!group.querySelector('.nav-grandchildren')) return;
  const open=group.classList.toggle('open');
  const chevron=header.querySelector('.chevron');
  if(chevron) chevron.textContent=open?'⌃':'⌄';
}));
els('interactionButton').addEventListener('click',()=>showPage('interaction'));
els('previewInteraction').addEventListener('click',()=>showPage('interaction'));
els('backToCampaign').addEventListener('click',()=>showPage('campaign'));

function renderRecords(filter=''){
  const q = filter.trim().toLowerCase();
  const list = records.filter(r => r.some(v => v.toLowerCase().includes(q)));
  els('recordTableBody').innerHTML = list.length ? list.map(r=>`<tr>${r.slice(0,6).map(v=>`<td>${v}</td>`).join('')}<td><span class="status-pill ${r[7]}">${r[6]}</span></td></tr>`).join('') : '<tr class="empty-row"><td colspan="7">未找到匹配记录</td></tr>';
}
renderRecords();
els('recordSearch').addEventListener('input',e=>renderRecords(e.target.value));

const drawer = els('documentDrawer');
function toggleDrawer(open){drawer.classList.toggle('open',open);els('drawerOverlay').classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));}
els('documentButton').addEventListener('click',()=>toggleDrawer(true));
els('closeDrawer').addEventListener('click',()=>toggleDrawer(false));
els('drawerOverlay').addEventListener('click',()=>toggleDrawer(false));

function toast(message='活动配置已同步至线上环境'){
  const t=els('toast');t.querySelector('small').textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);
}
els('publishDemo').addEventListener('click',()=>toast());
els('exportButton').addEventListener('click',()=>toast('导出任务已创建，文件即将下载'));

const modal=els('modalOverlay');
function openModal(title,text,image){els('modalBody').innerHTML=`<div class="modal-preview"><h3>${title}</h3><p>${text}</p>${image?`<img src="${image}" alt="${title}示意图">`:''}</div>`;modal.classList.add('open')}
els('modalClose').addEventListener('click',()=>modal.classList.remove('open'));
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
els('couponEntry').addEventListener('click',()=>{showPage('interaction');selectFlow('coupon')});
els('pickupEntry').addEventListener('click',()=>openModal('预约上门取送车','APP 环境将跳转至上门取送车预约页面；非 APP 环境将提示用户前往东风日产 APP。','./assets/pickup-app.png'));
els('maintenanceEntry').addEventListener('click',()=>openModal('预约维保','根据当前环境跳转至 APP 或小程序中的预约维保页面。','./assets/maintenance-app.jpg'));

let environment='app';
let currentFlow='coupon';
const result=els('resultContent');
function couponMarkup(){return `<div class="coupon-result"><div class="mini-brand">NISSAN SERVICE</div><h3>上门取送车<br><b>限时 4 折</b></h3><p>轻松养车 · 服务到家</p><div class="big-coupon"><strong>4<small>折券</small></strong><span>上门取送车服务专享</span></div><button>立即领取</button><div class="terms">每位用户限领一张 · 具体规则以卡券详情为准</div></div>`}
function imageMarkup(src,alt){return `<img class="screen-image" src="${src}" alt="${alt}">`}
function webDialogMarkup(){return `<div class="web-dialog-screen"><div class="web-dialog"><p>请前往东风日产 APP 使用上门取送车服务</p><div><button>取消</button><button>我知道了</button></div></div></div>`}
function selectFlow(flow){
  currentFlow=flow;
  document.querySelectorAll('.flow-card').forEach(c=>c.classList.toggle('active',c.dataset.flow===flow));
  const envLabel={app:'东风日产 APP',mini:'微信小程序',web:'其他环境'}[environment];
  els('resultEnv').textContent=envLabel;
  if(flow==='coupon'){
    els('resultTitle').textContent='4 折券独立领券页';result.innerHTML=couponMarkup();
    els('resultCaption').innerHTML='<span>跳转方式</span><strong>H5 路由 · /coupon/pickup-40off</strong>';
  }else if(flow==='pickup'){
    if(environment==='app'){
      els('resultTitle').textContent='上门取送车预约页';result.innerHTML=imageMarkup('./assets/pickup-app.png','APP 上门取送车预约页');
      els('resultCaption').innerHTML='<span>跳转方式</span><strong>APP 原生路由 · pickup/order</strong>';
    }else{
      els('resultTitle').textContent='非 APP 环境引导弹窗';result.innerHTML=webDialogMarkup();
      els('resultCaption').innerHTML='<span>交互方式</span><strong>当前页弹窗 · 不离开活动页</strong>';
    }
  }else{
    const mini=environment!=='app';
    els('resultTitle').textContent=mini?'小程序预约维保页':'APP 预约维保页';
    result.innerHTML=imageMarkup(mini?'./assets/maintenance-mini.jpg':'./assets/maintenance-app.jpg',mini?'小程序预约维保页':'APP 预约维保页');
    els('resultCaption').innerHTML=`<span>跳转方式</span><strong>${mini?'小程序路由 · pages/maintenance':'APP 原生路由 · maintenance/order'}</strong>`;
  }
}
document.querySelectorAll('.flow-card').forEach(c=>c.addEventListener('click',()=>selectFlow(c.dataset.flow)));
document.querySelectorAll('[data-env]').forEach(b=>b.addEventListener('click',()=>{
  environment=b.dataset.env;
  document.querySelectorAll('[data-env]').forEach(x=>x.classList.toggle('active',x===b));
  els('pickupFlowDesc').textContent=environment==='app'?'APP 内跳转上门取送车预约页面':'非 APP 环境展示引导弹窗';
  els('maintenanceFlowDesc').textContent=environment==='app'?'APP 内跳转预约维保页面':environment==='mini'?'小程序内跳转预约维保页面':'唤起微信小程序预约维保页面';
  selectFlow(currentFlow);
}));
selectFlow('coupon');

document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggleDrawer(false);modal.classList.remove('open')}});
