// ============================================
// 永不完结 · 交互逻辑
// ============================================

// --- 文章分类 ---
const filters = ["全部", "生活", "旅行", "技术", "随笔"];
let active = "全部";

// --- DOM 引用 ---
const grid = document.querySelector("#postGrid");
const search = document.querySelector("#searchInput");
const empty = document.querySelector("#emptyState");
const dlg = document.querySelector("#articleDialog");

// --- HTML 转义 ---
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c];
  });
}

// --- 渲染文章列表 ---
function render() {
  const q = search.value.trim().toLowerCase();
  const list = POSTS.filter(function (p) {
    var matchCategory = active === "全部" || p.category === active;
    var matchSearch = !q || (p.title + p.excerpt + p.category + p.body).toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  grid.innerHTML = list.map(function (p) {
    return (
      '<article class="post-card" data-id="' + p.id + '" tabindex="0">' +
        '<div class="cover"><img loading="lazy" src="' + esc(p.image) + '" alt="' + esc(p.title) + '"></div>' +
        '<div class="post-meta">' +
          '<span class="tag">' + esc(p.category) + '</span>' +
          '<span>' + esc(p.date) + '</span>' +
          '<span>' + esc(p.read) + '</span>' +
        '</div>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p>' + esc(p.excerpt) + '</p>' +
        '<span class="read-more">READ STORY ↗</span>' +
      '</article>'
    );
  }).join("");

  empty.classList.toggle("hidden", list.length > 0);
}

// --- 渲染筛选按钮 ---
function renderFilters() {
  document.querySelector("#filters").innerHTML = filters.map(function (f) {
    return '<button class="filter ' + (f === "全部" ? "active" : "") + '" data-filter="' + f + '">' + f + '</button>';
  }).join("");
}

// --- 设置当前筛选 ---
function setActiveFilter(name) {
  active = name;
  document.querySelectorAll(".filter").forEach(function (x) {
    x.classList.toggle("active", x.dataset.filter === active);
  });
  render();
}

// --- 打开文章弹窗 ---
function openPost(id) {
  var p = POSTS.find(function (x) { return x.id === Number(id); });
  if (!p) return;

  document.querySelector("#articleContent").innerHTML =
    '<p class="eyebrow">' + esc(p.category) + " · " + esc(p.date) + " · " + esc(p.read) + '</p>' +
    '<h1>' + esc(p.title) + '</h1>' +
    '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '">' +
    '<div class="article-body">' + esc(p.body) + '</div>';

  dlg.showModal();
}

// ============================================
// 事件绑定
// ============================================

// 筛选按钮点击
document.querySelector("#filters").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-filter]");
  if (!b) return;
  setActiveFilter(b.dataset.filter);
});

// 分类区域快捷链接
document.querySelectorAll("[data-category-link]").forEach(function (a) {
  a.addEventListener("click", function () {
    setActiveFilter(a.dataset.categoryLink);
  });
});

// 搜索
search.addEventListener("input", render);

// 文章卡片点击
grid.addEventListener("click", function (e) {
  var c = e.target.closest("[data-id]");
  if (c) openPost(c.dataset.id);
});

// 文章卡片键盘访问
grid.addEventListener("keydown", function (e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-id]")) {
    e.preventDefault();
    openPost(e.target.dataset.id);
  }
});

// 关闭弹窗
document.querySelector("#closeDialog").addEventListener("click", function () {
  dlg.close();
});

// 点击遮罩关闭弹窗
dlg.addEventListener("click", function (e) {
  if (e.target === dlg) dlg.close();
});

// ESC 关闭弹窗（dialog 原生支持，额外确保）
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && dlg.open) dlg.close();
});

// --- 主题切换 ---
// 默认深色，点击切换到浅色（light 类）
var themeBtn = document.querySelector("#themeToggle");
themeBtn.addEventListener("click", function () {
  var isLight = document.body.classList.toggle("light");
  themeBtn.setAttribute("aria-label", isLight ? "切换夜间模式" : "切换日间模式");
});

// ============================================
// 初始化
// ============================================
renderFilters();
render();
