(function () {
  "use strict";

  const STORAGE_KEY = "infiniti-voucher-prototype-v1";
  const SESSION_KEY = "infiniti-dealer-session";
  const sampleDealers = [
    { id: 1, name: "上海永达英菲尼迪浦东店", region: "华东大区", area: "上海小区", code: "SH-IF-001", password: "A7K9M2Q4", quota: 40, issued: 12, enabled: true },
    { id: 2, name: "北京运通英菲尼迪亦庄店", region: "华北大区", area: "北京小区", code: "BJ-IF-006", password: "R4T8P2X6", quota: 60, issued: 36, enabled: true },
    { id: 3, name: "广州长悦英菲尼迪番禺店", region: "华南大区", area: "广佛小区", code: "GZ-IF-003", password: "N6C3W9K5", quota: 50, issued: 18, enabled: true },
    { id: 4, name: "成都三和英菲尼迪高新店", region: "西区大区", area: "成渝小区", code: "CD-IF-008", password: "H2V7D5M8", quota: 36, issued: 22, enabled: true },
    { id: 5, name: "杭州东昌英菲尼迪滨江店", region: "华东大区", area: "浙江小区", code: "HZ-IF-012", password: "Q9F4B7L2", quota: 48, issued: 30, enabled: true },
    { id: 6, name: "深圳东风南方英菲尼迪宝安店", region: "华南大区", area: "深莞小区", code: "SZ-IF-015", password: "U5E8J3S7", quota: 44, issued: 28, enabled: true },
    { id: 7, name: "南京文华英菲尼迪江宁店", region: "华东大区", area: "苏皖小区", code: "NJ-IF-009", password: "Z3M6A8R4", quota: 32, issued: 8, enabled: true },
    { id: 8, name: "武汉三环英菲尼迪光谷店", region: "华北大区", area: "华中小区", code: "WH-IF-011", password: "B8K2Y6G5", quota: 38, issued: 16, enabled: true }
  ];

  const sampleVouchers = [
    { id: "VC20261108001", dealerCode: "SH-IF-001", vin: "LGBM4AE49MD012345", status: "unused", issuedAt: "2026-11-08 10:24", validUntil: "2027-05-07" },
    { id: "VC20261108002", dealerCode: "SH-IF-001", vin: "LGBM4AE49MD012345", status: "redeemed", issuedAt: "2026-11-08 10:24", validUntil: "2027-05-07", redeemedAt: "2026-11-18 14:10" }
  ];

  function initialData() {
    return { dealers: JSON.parse(JSON.stringify(sampleDealers)), vouchers: JSON.parse(JSON.stringify(sampleVouchers)), updatedAt: Date.now() };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        let migrated = false;
        stored.dealers.forEach((dealer) => {
          if (typeof dealer.enabled !== "boolean") {
            dealer.enabled = true;
            migrated = true;
          }
        });
        if (migrated) saveData(stored);
        return stored;
      }
    } catch (error) { /* fallback below */ }
    const data = initialData();
    saveData(data);
    return data;
  }

  function saveData(data) {
    data.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function resetData() {
    const data = initialData();
    saveData(data);
    return data;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char]);
  }

  function normalizeVin(value) { return String(value || "").trim().toUpperCase(); }
  function isValidVin(value) { return /^[A-HJ-NPR-Z0-9]{17}$/.test(value); }
  function formatNumber(value) { return new Intl.NumberFormat("zh-CN").format(value); }

  function randomPassword() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numbers = "23456789";
    const pool = letters + numbers;
    let value = letters[Math.floor(Math.random() * letters.length)] + numbers[Math.floor(Math.random() * numbers.length)];
    while (value.length < 8) value += pool[Math.floor(Math.random() * pool.length)];
    return value.split("").sort(() => Math.random() - .5).join("");
  }

  function csvCell(value) {
    const text = String(value == null ? "" : value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadCsv(filename, rows) {
    const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
        else quoted = !quoted;
      } else if (character === "," && !quoted) {
        row.push(field); field = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += character;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function showToast(message, type) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.className = `toast is-visible ${type ? `toast--${type}` : ""}`;
    toast.innerHTML = `<span>${type === "error" ? "!" : "✓"}</span>${escapeHtml(message)}`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.classList.remove("is-visible"); }, 2800);
  }

  function closeModal() {
    const root = document.getElementById("modalRoot");
    if (root) root.innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  function openModal(content, size) {
    const root = document.getElementById("modalRoot");
    if (!root) return;
    const sizeClass = size === "wide" ? "modal--wide" : size === "document" ? "modal--document" : "";
    root.innerHTML = `<div class="modal-backdrop"><section class="modal ${sizeClass}" role="dialog" aria-modal="true">${content}</section></div>`;
    document.body.classList.add("modal-open");
    root.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
    root.querySelector(".modal-backdrop").addEventListener("click", (event) => { if (event.target.classList.contains("modal-backdrop")) closeModal(); });
  }

  function modalHeader(eyebrow, title) {
    return `<header class="modal__header"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2></div><button class="modal__close" data-close-modal aria-label="关闭">×</button></header>`;
  }

  function dealerProductDocument() {
    return `
      <section class="product-drawer__intro">
        <span>经销商发券端</span>
        <strong>取送车券查询与发放说明</strong>
        <p>供经销商用户登录后查询 VIN 发券记录、发放取送车券及维护本人登录密码。</p>
      </section>
      <nav class="product-drawer__quick" aria-label="文档章节"><a href="#dealerLogic">页面逻辑</a><a href="#dealerFields">字段来源</a><a href="#dealerRules">业务规则</a></nav>
      <section id="dealerLogic" class="product-drawer__section">
        <h3>页面逻辑</h3>
        <ol class="product-drawer__flow">
          <li><b>账号登录</b><p>按经销商编码匹配账号，依次校验密码与启用状态；禁用账号不可登录。</p></li>
          <li><b>查券</b><p>校验 17 位 VIN 后，仅查询当前经销商向该 VIN 发放的卡券记录。</p></li>
          <li><b>发券</b><p>先校验 VIN、单车发放上限和剩余配额，通过后一次生成 2 张券并扣减 2 张配额。</p></li>
          <li><b>密码修改</b><p>校验当前密码和新密码格式，保存后与后台经销商密码保持一致。</p></li>
        </ol>
      </section>
      <section id="dealerFields" class="product-drawer__section">
        <h3>页面字段与来源</h3>
        <div class="product-drawer__table-wrap"><table class="product-drawer__table"><thead><tr><th>页面字段</th><th>来源出处</th><th>处理逻辑</th></tr></thead><tbody>
          <tr><td>经销商账号</td><td>后台经销商编码</td><td>新增或导入经销商时生成账号</td></tr>
          <tr><td>登录密码</td><td>后台初始密码／编辑密码</td><td>前端修改后同步回后台</td></tr>
          <tr><td>账号状态</td><td>后台启用／禁用设置</td><td>禁用时拦截登录及已有会话</td></tr>
          <tr><td>当前用户、经销商编码</td><td>当前登录经销商档案</td><td>登录成功后读取并展示</td></tr>
          <tr><td>VIN 码</td><td>经销商手工输入</td><td>转大写并校验 17 位规则</td></tr>
          <tr><td>卡券列表、券编号</td><td>当前经销商的发券记录</td><td>按经销商编码和 VIN 联合筛选</td></tr>
          <tr><td>卡券状态</td><td>卡券／核销系统</td><td>展示未核销或已核销</td></tr>
          <tr><td>发券时间</td><td>发券成功时的系统时间</td><td>生成卡券记录时写入</td></tr>
          <tr><td>有效期</td><td>活动卡券有效期规则</td><td>原型按发券日顺延 6 个月</td></tr>
          <tr><td>剩余券数</td><td>后台配额、累计已发券数</td><td>可发券数量－已发券数量</td></tr>
          <tr><td>可发券次数</td><td>剩余券数</td><td>剩余券数 ÷ 2，向下取整</td></tr>
        </tbody></table></div>
      </section>
      <section id="dealerRules" class="product-drawer__section">
        <h3>核心业务规则</h3>
        <ul class="product-drawer__rules">
          <li>每次固定向同一 VIN 发放 2 张取送车券。</li>
          <li>同一 VIN 每期最多发放 2 张，不允许重复发放。</li>
          <li>剩余配额不足 2 张时，“发券”按钮不可用。</li>
          <li>VIN 为 17 位字母与数字组合，不包含 I、O、Q。</li>
          <li>发券时间不限制；卡券有效期以查询结果为准。</li>
        </ul>
      </section>
      <aside class="product-drawer__notice"><b>原型数据说明</b><p>当前账号、配额和发券记录取自同域浏览器本地存储；正式系统需对接经销商主数据、卡券服务与核销系统。</p></aside>`;
  }

  function adminProductDocument() {
    return `
      <section class="product-drawer__intro">
        <span>经销商管理后台</span>
        <strong>账号、名单与发券配额管理说明</strong>
        <p>供活动管理员维护经销商档案、登录账号状态和每期活动配额，并查看发放汇总数据。</p>
      </section>
      <nav class="product-drawer__quick" aria-label="文档章节"><a href="#adminLogic">页面逻辑</a><a href="#adminFields">字段来源</a><a href="#adminSync">跨端同步</a></nav>
      <section id="adminLogic" class="product-drawer__section">
        <h3>页面逻辑</h3>
        <ol class="product-drawer__flow">
          <li><b>数据概览</b><p>根据当前全部经销商档案及发券记录实时汇总总数、总配额、已发券数和剩余数。</p></li>
          <li><b>名单维护</b><p>支持单个新增、CSV 批量导入、名单导出及按名称或编码筛选。</p></li>
          <li><b>账号管理</b><p>可编辑密码、复制账号密码，并启用或禁用经销商登录权限。</p></li>
          <li><b>配额管理</b><p>按经销商配置活动可发券总数，保存时校验偶数且不得小于已发券数。</p></li>
        </ol>
      </section>
      <section id="adminFields" class="product-drawer__section">
        <h3>页面字段与来源</h3>
        <div class="product-drawer__table-wrap"><table class="product-drawer__table"><thead><tr><th>页面字段</th><th>来源出处</th><th>处理逻辑</th></tr></thead><tbody>
          <tr><td>经销商名称</td><td>经销商主数据／新增／CSV 导入</td><td>作为名单展示及名称筛选条件</td></tr>
          <tr><td>大区、小区</td><td>经销商组织归属</td><td>新增或导入时录入</td></tr>
          <tr><td>经销商编码</td><td>经销商主数据</td><td>唯一值，同时作为前端登录账号</td></tr>
          <tr><td>登录密码</td><td>新增随机密码／导入值</td><td>后台编辑或前端修改后同步更新</td></tr>
          <tr><td>账号状态</td><td>后台启用／禁用操作</td><td>直接控制前端登录权限</td></tr>
          <tr><td>可发券数量</td><td>本期活动配额配置</td><td>须为非负偶数且不小于已发数</td></tr>
          <tr><td>已发券数量</td><td>该经销商发券记录</td><td>按经销商编码统计记录数量</td></tr>
          <tr><td>剩余可发</td><td>可发券数量、已发券数量</td><td>配额－已发券数量</td></tr>
          <tr><td>经销商总数</td><td>当前经销商名单</td><td>统计名单记录数</td></tr>
          <tr><td>总发券配额</td><td>各经销商可发券数量</td><td>汇总全部经销商配额</td></tr>
          <tr><td>整体发放率</td><td>总配额、已发券总数</td><td>已发券总数 ÷ 总配额</td></tr>
        </tbody></table></div>
      </section>
      <section id="adminSync" class="product-drawer__section">
        <h3>名单导入与跨端同步</h3>
        <ul class="product-drawer__rules">
          <li>CSV 必填列：经销商名称、大区、小区、经销商编码、可发券数量。</li>
          <li>初始密码为空时自动生成 8 位字母数字密码；状态为空时默认启用。</li>
          <li>导入前统一校验编码重复、配额、密码和状态；全部通过后一次性写入。</li>
          <li>密码、启用状态和发券配额更新后，前端读取同一经销商最新数据。</li>
          <li>前端发券成功后，后台已发券数、剩余数和发放率同步刷新。</li>
        </ul>
      </section>
      <aside class="product-drawer__notice"><b>原型数据说明</b><p>当前经销商档案及发券记录取自同域浏览器本地存储；正式系统需对接经销商主数据、统一账号服务和活动数据库。</p></aside>`;
  }

  function closeProductDocument() {
    const root = document.getElementById("modalRoot");
    if (root) root.innerHTML = "";
    document.body.classList.remove("product-doc-open");
  }

  function openProductDocument() {
    const root = document.getElementById("modalRoot");
    if (!root) return;
    const isAdmin = document.body.dataset.page === "admin";
    root.innerHTML = `<aside class="product-drawer" role="complementary" aria-label="${isAdmin ? "管理后台" : "发券前端"}产品说明文档">
      <header class="product-drawer__header"><div><p>PRODUCT GUIDE</p><h2>${isAdmin ? "管理后台产品说明" : "发券前端产品说明"}</h2></div><button type="button" data-close-product-doc aria-label="关闭产品说明文档">×</button></header>
      <div class="product-drawer__body">${isAdmin ? adminProductDocument() : dealerProductDocument()}</div>
    </aside>`;
    document.body.classList.add("product-doc-open");
    root.querySelector("[data-close-product-doc]").addEventListener("click", closeProductDocument);
  }

  function initProductDocument() {
    document.querySelectorAll("[data-product-doc]").forEach((button) => button.addEventListener("click", openProductDocument));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && document.body.classList.contains("product-doc-open")) closeProductDocument(); });
  }

  function initDealer() {
    let data = loadData();
    let currentDealer = null;
    const loginView = document.getElementById("loginView");
    const app = document.getElementById("dealerApp");

    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.togglePassword);
        input.type = input.type === "password" ? "text" : "password";
        button.textContent = input.type === "password" ? "显示" : "隐藏";
      });
    });

    function refreshCurrentDealer() {
      data = loadData();
      if (currentDealer) currentDealer = data.dealers.find((d) => d.code === currentDealer.code) || null;
    }

    function updateDashboard() {
      refreshCurrentDealer();
      if (!currentDealer) return;
      if (!currentDealer.enabled) {
        sessionStorage.removeItem(SESSION_KEY);
        currentDealer = null;
        app.classList.add("is-hidden");
        loginView.classList.remove("is-hidden");
        document.getElementById("loginPassword").value = "";
        document.getElementById("loginError").textContent = "该经销商账号已被禁用，请联系活动管理员";
        return;
      }
      const remaining = Math.max(0, currentDealer.quota - currentDealer.issued);
      const times = Math.floor(remaining / 2);
      document.getElementById("dealerName").textContent = currentDealer.name.replace("英菲尼迪", "");
      document.getElementById("welcomeDealer").textContent = currentDealer.name;
      document.getElementById("dealerInitial").textContent = currentDealer.name.charAt(0);
      document.getElementById("remainingTimes").textContent = times;
      document.getElementById("remainingCards").textContent = remaining;
      document.getElementById("cardTimes").textContent = times;
      document.getElementById("footerCode").textContent = currentDealer.code;
      const button = document.getElementById("issueBtn");
      button.disabled = times < 1;
      document.getElementById("availabilityBadge").textContent = times < 1 ? "配额已用完" : "可发放";
      document.getElementById("availabilityBadge").classList.toggle("is-disabled", times < 1);
    }

    function enterApp(dealer) {
      currentDealer = dealer;
      sessionStorage.setItem(SESSION_KEY, dealer.code);
      loginView.classList.add("is-hidden");
      app.classList.remove("is-hidden");
      updateDashboard();
    }

    const storedSession = sessionStorage.getItem(SESSION_KEY);
    if (storedSession) {
      const dealer = data.dealers.find((item) => item.code === storedSession);
      if (dealer && dealer.enabled) enterApp(dealer);
      if (dealer && !dealer.enabled) {
        sessionStorage.removeItem(SESSION_KEY);
        document.getElementById("loginError").textContent = "该经销商账号已被禁用，请联系活动管理员";
      }
    }

    document.getElementById("fillDemo").addEventListener("click", () => {
      document.getElementById("loginCode").value = "SH-IF-001";
      const demo = loadData().dealers.find((d) => d.code === "SH-IF-001");
      document.getElementById("loginPassword").value = demo ? demo.password : "A7K9M2Q4";
    });

    document.getElementById("loginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      data = loadData();
      const code = document.getElementById("loginCode").value.trim().toUpperCase();
      const password = document.getElementById("loginPassword").value;
      const dealer = data.dealers.find((item) => item.code.toUpperCase() === code);
      if (!dealer || dealer.password !== password) {
        document.getElementById("loginError").textContent = "账号或密码不正确，请重新输入";
        return;
      }
      if (!dealer.enabled) {
        document.getElementById("loginError").textContent = "该经销商账号已被禁用，请联系活动管理员";
        return;
      }
      document.getElementById("loginError").textContent = "";
      enterApp(dealer);
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      sessionStorage.removeItem(SESSION_KEY);
      currentDealer = null;
      app.classList.add("is-hidden");
      loginView.classList.remove("is-hidden");
      document.getElementById("loginPassword").value = "";
    });

    document.getElementById("changePasswordBtn").addEventListener("click", () => {
      openModal(`${modalHeader("账号安全", "修改登录密码")}
        <form id="passwordForm" class="modal__body">
          <p class="modal-copy">修改后的密码将同步至经销商管理后台。</p>
          <label class="field"><span>当前密码</span><input id="oldPassword" type="password" required placeholder="请输入当前密码" /></label>
          <label class="field"><span>新密码</span><input id="newPassword" type="password" minlength="8" maxlength="20" required placeholder="8–20 位字母与数字" /></label>
          <label class="field"><span>确认新密码</span><input id="confirmPassword" type="password" minlength="8" maxlength="20" required placeholder="请再次输入新密码" /></label>
          <p id="passwordError" class="form-error"></p>
          <div class="modal__actions"><button type="button" class="button button--ghost" data-close-modal>取消</button><button class="button button--dark" type="submit">确认修改</button></div>
        </form>`);
      document.getElementById("passwordForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const oldValue = document.getElementById("oldPassword").value;
        const nextValue = document.getElementById("newPassword").value;
        const confirmValue = document.getElementById("confirmPassword").value;
        const error = document.getElementById("passwordError");
        if (oldValue !== currentDealer.password) return void (error.textContent = "当前密码不正确");
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(nextValue)) return void (error.textContent = "新密码需为 8–20 位字母与数字组合");
        if (nextValue !== confirmValue) return void (error.textContent = "两次输入的新密码不一致");
        data = loadData();
        const dealer = data.dealers.find((d) => d.code === currentDealer.code);
        dealer.password = nextValue;
        saveData(data);
        currentDealer = dealer;
        closeModal();
        showToast("密码已修改，并同步至管理后台", "success");
      });
    });

    function showVoucherResult(vin) {
      data = loadData();
      const records = data.vouchers.filter((item) => item.dealerCode === currentDealer.code && item.vin === vin);
      const body = records.length ? `<div class="voucher-list">${records.map((record, index) => `
        <article class="voucher-record">
          <div class="voucher-record__head"><span>取送车券 ${index + 1}</span><span class="status status--${record.status}">${record.status === "unused" ? "未核销" : "已核销"}</span></div>
          <strong>${escapeHtml(record.id)}</strong>
          <dl><div><dt>发券时间</dt><dd>${escapeHtml(record.issuedAt)}</dd></div><div><dt>有效期至</dt><dd>${escapeHtml(record.validUntil)}</dd></div>${record.redeemedAt ? `<div><dt>核销时间</dt><dd>${escapeHtml(record.redeemedAt)}</dd></div>` : ""}</dl>
        </article>`).join("")}</div>` : `<div class="empty-state"><div class="empty-state__icon"><svg viewBox="0 0 48 48"><path d="M10 14h28v23H10zM15 9h18v5M17 22h14M17 28h10"></path></svg></div><strong>暂无发券记录</strong><p>该 VIN 码尚未发放过取送车券</p></div>`;
      openModal(`${modalHeader("发放记录", "VIN 查询结果")}<div class="modal__body"><div class="vin-summary"><span>VIN 码</span><strong>${escapeHtml(vin)}</strong><small>${records.length ? `共找到 ${records.length} 张券` : "未查询到券"}</small></div>${body}<div class="modal__actions"><button class="button button--dark" type="button" data-close-modal>完成</button></div></div>`, "wide");
    }

    document.getElementById("searchForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const vin = normalizeVin(document.getElementById("searchVin").value);
      if (!isValidVin(vin)) return showToast("请输入正确的 17 位 VIN 码", "error");
      document.getElementById("searchVin").value = vin;
      showVoucherResult(vin);
    });

    function openIssueModal() {
      openModal(`${modalHeader("发放权益", "发放取送车券")}
        <form id="issueForm" class="modal__body">
          <div class="issue-notice"><strong>本次将发放 2 张券</strong><span>同一 VIN 每期限发 2 张，发放后不可撤回。</span></div>
          <label class="field"><span>车辆 VIN 码</span><input id="issueVin" maxlength="17" autocomplete="off" required placeholder="请输入 17 位 VIN 码" /></label>
          <p class="input-hint">VIN 码不含字母 I、O、Q</p>
          <p id="issueError" class="form-error"></p>
          <div class="modal__actions"><button type="button" class="button button--ghost" data-close-modal>取消</button><button class="button button--dark" type="submit">确认发放 2 张</button></div>
        </form>`);
      document.getElementById("issueForm").addEventListener("submit", handleIssue);
      setTimeout(() => {
        const input = document.getElementById("issueVin");
        if (input) input.focus();
      }, 30);
    }

    function resultModal(success, title, message, vin) {
      const icon = success ? "✓" : "!";
      openModal(`<div class="result-modal"><div class="result-icon ${success ? "result-icon--success" : "result-icon--error"}">${icon}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${vin ? `<span class="result-vin">VIN　${escapeHtml(vin)}</span>` : ""}<div class="modal__actions"><button class="button ${success ? "button--dark" : "button--ghost"}" type="button" data-close-modal>我知道了</button>${success ? `<button class="button button--outline" type="button" id="viewIssued">查看记录</button>` : ""}</div></div>`);
      const view = document.getElementById("viewIssued");
      if (view) view.addEventListener("click", () => showVoucherResult(vin));
    }

    function handleIssue(event) {
      event.preventDefault();
      const vin = normalizeVin(document.getElementById("issueVin").value);
      if (!isValidVin(vin)) return void (document.getElementById("issueError").textContent = "请输入正确的 17 位 VIN 码");
      data = loadData();
      currentDealer = data.dealers.find((d) => d.code === currentDealer.code);
      const existing = data.vouchers.filter((v) => v.dealerCode === currentDealer.code && v.vin === vin).length;
      const remaining = currentDealer.quota - currentDealer.issued;
      const scenario = document.getElementById("demoScenario").value;
      if (scenario === "duplicate" || (scenario === "auto" && existing >= 2)) return resultModal(false, "发放失败", "该 VIN 本期已发放过 2 张取送车券，不可重复发放。", vin);
      if (scenario === "quota" || (scenario === "auto" && remaining < 2)) return resultModal(false, "发放失败", "当前经销商可发券次数不足，请联系活动管理员调整配额。", vin);
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const issuedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const expiry = new Date(now); expiry.setMonth(expiry.getMonth() + 6);
      const validUntil = `${expiry.getFullYear()}-${pad(expiry.getMonth() + 1)}-${pad(expiry.getDate())}`;
      const seed = String(Date.now()).slice(-8);
      data.vouchers.push(
        { id: `VC${seed}01`, dealerCode: currentDealer.code, vin, status: "unused", issuedAt, validUntil },
        { id: `VC${seed}02`, dealerCode: currentDealer.code, vin, status: "unused", issuedAt, validUntil }
      );
      currentDealer.issued += 2;
      saveData(data);
      updateDashboard();
      resultModal(true, "发放成功", "2 张取送车券已发放至该车辆账户。", vin);
    }

    document.getElementById("issueBtn").addEventListener("click", openIssueModal);
    document.getElementById("resetDemo").addEventListener("click", () => {
      data = resetData();
      currentDealer = data.dealers.find((d) => d.code === currentDealer.code) || data.dealers[0];
      document.getElementById("demoScenario").value = "auto";
      updateDashboard();
      showToast("演示数据已重置", "success");
    });
    window.addEventListener("storage", updateDashboard);
  }

  function initAdmin() {
    let data = loadData();
    let visibleDealers = data.dealers.slice();
    const importHeaders = ["经销商名称", "大区", "小区", "经销商编码", "可发券数量", "初始密码", "状态"];

    function renderMetrics() {
      data = loadData();
      const totalQuota = data.dealers.reduce((sum, item) => sum + item.quota, 0);
      const issued = data.dealers.reduce((sum, item) => sum + item.issued, 0);
      document.getElementById("metricDealers").textContent = data.dealers.length;
      document.getElementById("metricQuota").textContent = formatNumber(totalQuota);
      document.getElementById("metricIssued").textContent = formatNumber(issued);
      document.getElementById("metricRemaining").textContent = formatNumber(totalQuota - issued);
      document.getElementById("metricRate").textContent = `整体发放率 ${totalQuota ? Math.round(issued / totalQuota * 100) : 0}%`;
    }

    function renderTable() {
      const body = document.getElementById("dealerTableBody");
      body.innerHTML = visibleDealers.map((dealer, index) => `
        <tr>
          <td><span class="table-index">${String(index + 1).padStart(2, "0")}</span></td>
          <td><div class="dealer-cell"><span>${escapeHtml(dealer.name.charAt(0))}</span><div><strong>${escapeHtml(dealer.name)}</strong><small>密码····${escapeHtml(dealer.password.slice(-2))}<em class="account-status ${dealer.enabled ? "is-enabled" : "is-disabled"}">${dealer.enabled ? "已启用" : "已禁用"}</em></small></div></div></td>
          <td>${escapeHtml(dealer.region)}</td><td>${escapeHtml(dealer.area)}</td>
          <td><code>${escapeHtml(dealer.code)}</code></td>
          <td><strong>${dealer.quota}</strong> 张 <button class="mini-edit" data-edit="${dealer.id}" title="调整配额">编辑</button></td>
          <td><div class="issued-cell"><strong>${dealer.issued}</strong> 张<span><i style="width:${Math.min(100, dealer.quota ? dealer.issued / dealer.quota * 100 : 0)}%"></i></span></div></td>
          <td><div class="operation-actions">
            <button class="action-button" data-account-edit="${dealer.id}">编辑</button>
            <button class="action-button ${dealer.enabled ? "action-button--danger" : "action-button--success"}" data-toggle-status="${dealer.id}">${dealer.enabled ? "禁用" : "启用"}</button>
            <button class="copy-action" data-copy="${dealer.id}"><svg viewBox="0 0 24 24"><path d="M8 8h11v11H8zM5 15V5h10"></path></svg>复制账号密码</button>
          </div></td>
        </tr>`).join("");
      const empty = visibleDealers.length === 0;
      document.getElementById("tableEmpty").classList.toggle("is-hidden", !empty);
      document.getElementById("resultCount").textContent = visibleDealers.length;
      document.getElementById("pageCount").textContent = visibleDealers.length;
      document.getElementById("totalCount").textContent = visibleDealers.length;
      body.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", () => copyCredentials(Number(button.dataset.copy))));
      body.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editQuota(Number(button.dataset.edit))));
      body.querySelectorAll("[data-account-edit]").forEach((button) => button.addEventListener("click", () => editDealerAccount(Number(button.dataset.accountEdit))));
      body.querySelectorAll("[data-toggle-status]").forEach((button) => button.addEventListener("click", () => toggleDealerStatus(Number(button.dataset.toggleStatus))));
    }

    function applyFilters() {
      data = loadData();
      const name = document.getElementById("dealerFilter").value.trim().toLowerCase();
      const code = document.getElementById("codeFilter").value.trim().toLowerCase();
      visibleDealers = data.dealers.filter((d) => d.name.toLowerCase().includes(name) && d.code.toLowerCase().includes(code));
      renderTable();
    }

    async function copyCredentials(id) {
      data = loadData();
      const dealer = data.dealers.find((d) => d.id === id);
      const text = `经销商：${dealer.name}\n登录账号：${dealer.code}\n登录密码：${dealer.password}`;
      try { await navigator.clipboard.writeText(text); showToast("账号密码已复制", "success"); }
      catch (error) {
        openModal(`${modalHeader("账号信息", "复制经销商账号密码")}<div class="modal__body"><pre class="credential-block">${escapeHtml(text)}</pre><div class="modal__actions"><button class="button button--dark" data-close-modal>完成</button></div></div>`);
      }
    }

    function editDealerAccount(id) {
      data = loadData();
      const dealer = data.dealers.find((d) => d.id === id);
      openModal(`${modalHeader("经销商账号", "编辑经销商")}
        <form id="dealerEditForm" class="modal__body">
          <p class="modal-copy">经销商基础信息仅供查看，当前仅支持修改登录密码。</p>
          <div class="dealer-info-grid">
            <div><span>经销商名称</span><strong>${escapeHtml(dealer.name)}</strong></div>
            <div><span>经销商编码</span><strong>${escapeHtml(dealer.code)}</strong></div>
            <div><span>大区</span><strong>${escapeHtml(dealer.region)}</strong></div>
            <div><span>小区</span><strong>${escapeHtml(dealer.area)}</strong></div>
            <div><span>账号状态</span><strong class="info-status ${dealer.enabled ? "is-enabled" : "is-disabled"}">${dealer.enabled ? "已启用" : "已禁用"}</strong></div>
          </div>
          <label class="field"><span>登录密码</span><div class="password-field"><input id="dealerPasswordInput" type="password" minlength="8" maxlength="20" value="${escapeHtml(dealer.password)}" required /><button id="toggleDealerPassword" type="button" class="text-button">显示</button></div></label>
          <p class="input-hint">密码需为 8–20 位字母与数字组合，保存后立即同步至发券端。</p>
          <p id="dealerEditError" class="form-error"></p>
          <div class="modal__actions"><button type="button" class="button button--ghost" data-close-modal>取消</button><button type="submit" class="button button--dark">保存密码</button></div>
        </form>`);
      document.getElementById("toggleDealerPassword").addEventListener("click", () => {
        const input = document.getElementById("dealerPasswordInput");
        input.type = input.type === "password" ? "text" : "password";
        document.getElementById("toggleDealerPassword").textContent = input.type === "password" ? "显示" : "隐藏";
      });
      document.getElementById("dealerEditForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const nextPassword = document.getElementById("dealerPasswordInput").value.trim();
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(nextPassword)) {
          document.getElementById("dealerEditError").textContent = "请输入 8–20 位字母与数字组合";
          return;
        }
        dealer.password = nextPassword;
        saveData(data);
        closeModal();
        applyFilters();
        showToast("经销商密码已更新", "success");
      });
    }

    function toggleDealerStatus(id) {
      data = loadData();
      const dealer = data.dealers.find((d) => d.id === id);
      dealer.enabled = !dealer.enabled;
      saveData(data);
      applyFilters();
      showToast(`${dealer.name}已${dealer.enabled ? "启用" : "禁用"}`, dealer.enabled ? "success" : "error");
    }

    function editQuota(id) {
      data = loadData();
      const dealer = data.dealers.find((d) => d.id === id);
      openModal(`${modalHeader("活动配额", "调整可发券数量")}
        <form id="quotaForm" class="modal__body">
          <div class="selected-dealer"><span>${escapeHtml(dealer.name.charAt(0))}</span><div><strong>${escapeHtml(dealer.name)}</strong><small>${escapeHtml(dealer.code)} · 已发 ${dealer.issued} 张</small></div></div>
          <label class="field"><span>可发券总数</span><input id="quotaInput" type="number" min="${dealer.issued}" step="2" value="${dealer.quota}" required /></label>
          <p class="input-hint">数量应为偶数，且不得小于已发券数 ${dealer.issued}。</p><p id="quotaError" class="form-error"></p>
          <div class="modal__actions"><button type="button" class="button button--ghost" data-close-modal>取消</button><button type="submit" class="button button--dark">保存配额</button></div>
        </form>`);
      document.getElementById("quotaForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const value = Number(document.getElementById("quotaInput").value);
        if (!Number.isInteger(value) || value < dealer.issued || value % 2 !== 0) return void (document.getElementById("quotaError").textContent = `请输入不小于 ${dealer.issued} 的偶数`);
        dealer.quota = value;
        saveData(data);
        closeModal();
        renderMetrics();
        applyFilters();
        showToast("发券配额已更新", "success");
      });
    }

    function openAddDealerModal() {
      const initialPassword = randomPassword();
      openModal(`${modalHeader("经销商管理", "新增经销商")}
        <form id="addDealerForm" class="modal__body">
          <p class="modal-copy">新增后，经销商可立即使用编码和初始密码登录发券端。</p>
          <div class="form-grid">
            <label class="field field--full"><span>经销商名称</span><input id="newDealerName" maxlength="60" required placeholder="请输入经销商名称" /></label>
            <label class="field"><span>大区</span><input id="newDealerRegion" maxlength="30" required placeholder="例如：华东大区" /></label>
            <label class="field"><span>小区</span><input id="newDealerArea" maxlength="30" required placeholder="例如：上海小区" /></label>
            <label class="field"><span>经销商编码</span><input id="newDealerCode" maxlength="24" required placeholder="例如：SH-IF-021" /></label>
            <label class="field"><span>可发券数量</span><input id="newDealerQuota" type="number" min="0" step="2" value="20" required /></label>
            <label class="field"><span>初始密码</span><div class="password-field"><input id="newDealerPassword" type="password" minlength="8" maxlength="20" value="${initialPassword}" required /><button id="toggleNewDealerPassword" type="button" class="text-button">显示</button></div></label>
            <label class="field"><span>账号状态</span><select id="newDealerStatus"><option value="enabled">启用</option><option value="disabled">禁用</option></select></label>
          </div>
          <p id="addDealerError" class="form-error"></p>
          <div class="modal__actions"><button type="button" class="button button--ghost" data-close-modal>取消</button><button type="submit" class="button button--dark">确认新增</button></div>
        </form>`, "wide");
      document.getElementById("newDealerCode").addEventListener("input", (event) => { event.target.value = event.target.value.toUpperCase(); });
      document.getElementById("toggleNewDealerPassword").addEventListener("click", () => {
        const input = document.getElementById("newDealerPassword");
        input.type = input.type === "password" ? "text" : "password";
        document.getElementById("toggleNewDealerPassword").textContent = input.type === "password" ? "显示" : "隐藏";
      });
      document.getElementById("addDealerForm").addEventListener("submit", (event) => {
        event.preventDefault();
        data = loadData();
        const error = document.getElementById("addDealerError");
        const name = document.getElementById("newDealerName").value.trim();
        const region = document.getElementById("newDealerRegion").value.trim();
        const area = document.getElementById("newDealerArea").value.trim();
        const code = document.getElementById("newDealerCode").value.trim().toUpperCase();
        const quota = Number(document.getElementById("newDealerQuota").value);
        const password = document.getElementById("newDealerPassword").value.trim();
        if (!name || !region || !area) return void (error.textContent = "请完整填写经销商名称、大区和小区");
        if (!/^[A-Z0-9-]{3,24}$/.test(code)) return void (error.textContent = "经销商编码仅支持 3–24 位大写字母、数字和连字符");
        if (data.dealers.some((dealer) => dealer.code.toUpperCase() === code)) return void (error.textContent = "该经销商编码已存在，请更换编码");
        if (!Number.isInteger(quota) || quota < 0 || quota % 2 !== 0) return void (error.textContent = "可发券数量请输入不小于 0 的偶数");
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(password)) return void (error.textContent = "初始密码需为 8–20 位字母与数字组合");
        data.dealers.push({
          id: Math.max(0, ...data.dealers.map((dealer) => Number(dealer.id) || 0)) + 1,
          name, region, area, code, password, quota, issued: 0,
          enabled: document.getElementById("newDealerStatus").value === "enabled",
        });
        saveData(data);
        closeModal();
        renderMetrics();
        applyFilters();
        showToast("经销商新增成功", "success");
      });
    }

    function openImportModal() {
      openModal(`${modalHeader("经销商管理", "导入经销商名单")}
        <form id="dealerImportForm" class="modal__body">
          <p class="modal-copy">请先下载 CSV 模板，按模板填写后导入。全部数据校验通过后才会写入名单。</p>
          <label class="file-drop"><strong>选择 CSV 名单文件</strong><input id="dealerImportFile" type="file" accept=".csv,text/csv" required /><small>必填列：经销商名称、大区、小区、经销商编码、可发券数量。初始密码为空时自动生成，状态为空时默认启用。</small></label>
          <p id="dealerImportError" class="form-error"></p>
          <div class="modal__actions"><button type="button" class="button button--ghost" data-close-modal>取消</button><button type="submit" class="button button--dark">确认导入</button></div>
        </form>`);
      document.getElementById("dealerImportForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const error = document.getElementById("dealerImportError");
        const file = document.getElementById("dealerImportFile").files[0];
        if (!file) return void (error.textContent = "请选择需要导入的 CSV 文件");
        try {
          const rows = parseCsv(await file.text()).filter((row) => row.some((cell) => String(cell).trim()));
          if (rows.length < 2) throw new Error("文件中没有可导入的经销商数据");
          const headers = rows[0].map((value) => String(value).replace(/^\uFEFF/, "").trim());
          const indexes = Object.fromEntries(importHeaders.map((header) => [header, headers.indexOf(header)]));
          const missing = importHeaders.slice(0, 5).filter((header) => indexes[header] < 0);
          if (missing.length) throw new Error(`缺少列：${missing.join("、")}`);
          data = loadData();
          const codes = new Set(data.dealers.map((dealer) => dealer.code.toUpperCase()));
          let nextId = Math.max(0, ...data.dealers.map((dealer) => Number(dealer.id) || 0)) + 1;
          const additions = [];
          const problems = [];
          rows.slice(1).forEach((row, offset) => {
            const line = offset + 2;
            const get = (header) => indexes[header] < 0 ? "" : String(row[indexes[header]] || "").trim();
            const name = get("经销商名称"), region = get("大区"), area = get("小区"), code = get("经销商编码").toUpperCase();
            const quota = Number(get("可发券数量"));
            const password = get("初始密码") || randomPassword();
            const status = get("状态");
            let message = "";
            if (!name || !region || !area || !code) message = "必填信息不完整";
            else if (!/^[A-Z0-9-]{3,24}$/.test(code)) message = "经销商编码格式不正确";
            else if (codes.has(code)) message = "经销商编码重复";
            else if (!Number.isInteger(quota) || quota < 0 || quota % 2 !== 0) message = "可发券数量须为不小于 0 的偶数";
            else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(password)) message = "初始密码须为 8–20 位字母与数字组合";
            else if (status && !["启用", "已启用", "禁用", "已禁用"].includes(status)) message = "状态仅支持启用或禁用";
            if (message) problems.push(`第 ${line} 行：${message}`);
            else {
              codes.add(code);
              additions.push({ id: nextId++, name, region, area, code, password, quota, issued: 0, enabled: !["禁用", "已禁用"].includes(status) });
            }
          });
          if (problems.length) throw new Error(problems.slice(0, 3).join("；") + (problems.length > 3 ? `；另有 ${problems.length - 3} 项错误` : ""));
          if (!additions.length) throw new Error("文件中没有可导入的经销商数据");
          data.dealers.push(...additions);
          saveData(data);
          closeModal();
          renderMetrics();
          applyFilters();
          showToast(`成功导入 ${additions.length} 家经销商`, "success");
        } catch (importError) { error.textContent = importError.message || "导入失败，请检查文件格式"; }
      });
    }

    function downloadTemplate() {
      downloadCsv("英菲尼迪经销商名单导入模板.csv", [importHeaders]);
      showToast("经销商名单模板已下载", "success");
    }

    function exportDealers() {
      data = loadData();
      const rows = [importHeaders, ...data.dealers.map((dealer) => [dealer.name, dealer.region, dealer.area, dealer.code, dealer.quota, dealer.password, dealer.enabled ? "启用" : "禁用"])];
      downloadCsv("英菲尼迪经销商名单.csv", rows);
      showToast("经销商名单已导出", "success");
    }

    document.getElementById("filterBtn").addEventListener("click", applyFilters);
    ["dealerFilter", "codeFilter"].forEach((id) => document.getElementById(id).addEventListener("keydown", (event) => { if (event.key === "Enter") applyFilters(); }));
    document.getElementById("clearFilter").addEventListener("click", () => {
      ["dealerFilter", "codeFilter"].forEach((id) => { document.getElementById(id).value = ""; });
      applyFilters();
    });
    document.getElementById("templateBtn").addEventListener("click", downloadTemplate);
    document.getElementById("importBtn").addEventListener("click", openImportModal);
    document.getElementById("exportBtn").addEventListener("click", exportDealers);
    document.getElementById("addDealerBtn").addEventListener("click", openAddDealerModal);
    document.getElementById("mobileMenu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("is-open"));
    window.addEventListener("storage", () => { renderMetrics(); applyFilters(); });
    renderMetrics();
    renderTable();
  }

  const page = document.body.dataset.page;
  initProductDocument();
  if (page === "dealer") initDealer();
  if (page === "admin") initAdmin();
})();
